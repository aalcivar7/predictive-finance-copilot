"""
Combined router for Budget, Debt, and Bill management.
Routes:
  /plan/budgets  — CRUD for category budgets
  /plan/debts    — CRUD for debts / loans
  /plan/bills    — CRUD for recurring bills
"""
import math
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract

from core.database import get_db
from core.security import get_current_user
from models.models import User, Budget, Debt, Bill, Transaction
from schemas.schemas import (
    BudgetCreate, BudgetUpdate, BudgetOut,
    DebtCreate, DebtUpdate, DebtOut,
    BillCreate, BillUpdate, BillOut,
)

router = APIRouter()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _spent_this_month(user_id: int, category: str, db: Session) -> float:
    now = datetime.now(timezone.utc)
    rows = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "expense",
            Transaction.category == category,
            extract("year",  Transaction.date) == now.year,
            extract("month", Transaction.date) == now.month,
        )
        .all()
    )
    return sum(r.amount for r in rows)


def _budget_out(b: Budget, spent: float) -> BudgetOut:
    remaining = b.limit_amount - spent
    pct = (spent / b.limit_amount * 100) if b.limit_amount > 0 else 0
    return BudgetOut(
        id=b.id, category=b.category, limit_amount=b.limit_amount,
        spent_this_month=spent, remaining=remaining,
        pct_used=round(pct, 1), created_at=b.created_at,
    )


def _payoff(balance: float, annual_rate: float, monthly_payment: float):
    """Returns (months_to_payoff, total_interest). Returns (None, None) if unpayable."""
    r = annual_rate / 12
    if r <= 0:
        if monthly_payment <= 0:
            return None, None
        months = math.ceil(balance / monthly_payment)
        return months, 0.0
    if monthly_payment <= balance * r:
        return None, None
    months = math.ceil(-math.log(1 - (balance * r) / monthly_payment) / math.log(1 + r))
    total_interest = months * monthly_payment - balance
    return months, round(max(total_interest, 0), 2)


def _days_until_due(due_day: int) -> int:
    today = datetime.now(timezone.utc)
    this_month_due = today.replace(day=min(due_day, 28))
    if this_month_due.day < today.day:
        # Already passed — next month
        if today.month == 12:
            next_due = today.replace(year=today.year + 1, month=1, day=min(due_day, 28))
        else:
            next_due = today.replace(month=today.month + 1, day=min(due_day, 28))
    else:
        next_due = this_month_due
    return (next_due.date() - today.date()).days


# ── Budgets ────────────────────────────────────────────────────────────────────

@router.get("/budgets", response_model=List[BudgetOut])
def list_budgets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    return [_budget_out(b, _spent_this_month(current_user.id, b.category, db)) for b in budgets]


@router.post("/budgets", response_model=BudgetOut, status_code=201)
def create_budget(body: BudgetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Budget).filter(Budget.user_id == current_user.id, Budget.category == body.category).first()
    if existing:
        raise HTTPException(400, detail=f"Budget for '{body.category}' already exists")
    b = Budget(user_id=current_user.id, category=body.category, limit_amount=body.limit_amount)
    db.add(b); db.commit(); db.refresh(b)
    spent = _spent_this_month(current_user.id, b.category, db)
    return _budget_out(b, spent)


@router.put("/budgets/{budget_id}", response_model=BudgetOut)
def update_budget(budget_id: int, body: BudgetUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(404)
    if body.limit_amount is not None:
        b.limit_amount = body.limit_amount
    db.commit(); db.refresh(b)
    spent = _spent_this_month(current_user.id, b.category, db)
    return _budget_out(b, spent)


@router.delete("/budgets/{budget_id}", status_code=204)
def delete_budget(budget_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if b:
        db.delete(b); db.commit()


# ── Debts ──────────────────────────────────────────────────────────────────────

def _debt_out(d: Debt) -> DebtOut:
    months, interest = _payoff(d.current_balance, d.interest_rate, d.minimum_payment)
    return DebtOut(
        id=d.id, name=d.name, debt_type=d.debt_type,
        current_balance=d.current_balance,
        interest_rate=d.interest_rate,
        minimum_payment=d.minimum_payment,
        months_to_payoff=months,
        total_interest=interest,
        created_at=d.created_at,
    )


@router.get("/debts", response_model=List[DebtOut])
def list_debts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    debts = db.query(Debt).filter(Debt.user_id == current_user.id).order_by(Debt.created_at.desc()).all()
    return [_debt_out(d) for d in debts]


@router.post("/debts", response_model=DebtOut, status_code=201)
def create_debt(body: DebtCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    d = Debt(
        user_id=current_user.id, name=body.name, debt_type=body.debt_type,
        current_balance=body.current_balance,
        interest_rate=body.interest_rate / 100,   # entered as %, stored as decimal
        minimum_payment=body.minimum_payment,
    )
    db.add(d); db.commit(); db.refresh(d)
    return _debt_out(d)


@router.put("/debts/{debt_id}", response_model=DebtOut)
def update_debt(debt_id: int, body: DebtUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    d = db.query(Debt).filter(Debt.id == debt_id, Debt.user_id == current_user.id).first()
    if not d:
        raise HTTPException(404)
    for field, val in body.model_dump(exclude_unset=True).items():
        if field == "interest_rate" and val is not None:
            val = val / 100
        setattr(d, field, val)
    db.commit(); db.refresh(d)
    return _debt_out(d)


@router.delete("/debts/{debt_id}", status_code=204)
def delete_debt(debt_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    d = db.query(Debt).filter(Debt.id == debt_id, Debt.user_id == current_user.id).first()
    if d:
        db.delete(d); db.commit()


# ── Bills ──────────────────────────────────────────────────────────────────────

def _bill_out(b: Bill) -> BillOut:
    return BillOut(
        id=b.id, name=b.name, amount=b.amount, due_day=b.due_day,
        category=b.category, is_active=b.is_active,
        days_until_due=_days_until_due(b.due_day),
        created_at=b.created_at,
    )


@router.get("/bills", response_model=List[BillOut])
def list_bills(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bills = db.query(Bill).filter(Bill.user_id == current_user.id).order_by(Bill.due_day).all()
    return [_bill_out(b) for b in bills]


@router.post("/bills", response_model=BillOut, status_code=201)
def create_bill(body: BillCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = Bill(
        user_id=current_user.id, name=body.name, amount=body.amount,
        due_day=body.due_day, category=body.category, is_active=body.is_active,
    )
    db.add(b); db.commit(); db.refresh(b)
    return _bill_out(b)


@router.put("/bills/{bill_id}", response_model=BillOut)
def update_bill(bill_id: int, body: BillUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = db.query(Bill).filter(Bill.id == bill_id, Bill.user_id == current_user.id).first()
    if not b:
        raise HTTPException(404)
    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(b, field, val)
    db.commit(); db.refresh(b)
    return _bill_out(b)


@router.delete("/bills/{bill_id}", status_code=204)
def delete_bill(bill_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = db.query(Bill).filter(Bill.id == bill_id, Bill.user_id == current_user.id).first()
    if b:
        db.delete(b); db.commit()
