from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from typing import List, Optional
from datetime import datetime, timezone

from core.database import get_db
from core.security import get_current_user
from models.models import User, Transaction, IncomeStream
from schemas.schemas import (
    TransactionCreate, TransactionOut,
    MonthSummary, CategoryTotal, TrendPoint,
)

router = APIRouter()


@router.get("", response_model=List[TransactionOut])
def list_transactions(
    transaction_type: Optional[str] = None,
    month: Optional[str] = None,     # "2025-03"
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if transaction_type:
        q = q.filter(Transaction.transaction_type == transaction_type)
    if month:
        try:
            year, m = map(int, month.split("-"))
            q = q.filter(
                extract("year",  Transaction.date) == year,
                extract("month", Transaction.date) == m,
            )
        except ValueError:
            pass
    return q.order_by(Transaction.date.desc()).limit(limit).all()


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    body: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = Transaction(
        user_id          = current_user.id,
        amount           = body.amount,
        category         = body.category,
        description      = body.description,
        transaction_type = body.transaction_type,
        date             = body.date or datetime.now(timezone.utc),
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{tx_id}", status_code=204)
def delete_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.user_id == current_user.id,
    ).first()
    if tx:
        db.delete(tx)
        db.commit()


@router.get("/summary", response_model=MonthSummary)
def month_summary(
    month: Optional[str] = None,   # defaults to current month
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    if month:
        try:
            year, m = map(int, month.split("-"))
        except ValueError:
            year, m = now.year, now.month
    else:
        year, m = now.year, now.month

    txs = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            extract("year",  Transaction.date) == year,
            extract("month", Transaction.date) == m,
        )
        .all()
    )

    total_income   = sum(t.amount for t in txs if t.transaction_type == "income")
    total_expenses = sum(t.amount for t in txs if t.transaction_type == "expense")

    cat_map: dict = {}
    for t in txs:
        if t.transaction_type == "expense":
            entry = cat_map.setdefault(t.category, {"total": 0.0, "count": 0})
            entry["total"] += t.amount
            entry["count"] += 1

    by_category = [
        CategoryTotal(category=k, total=v["total"], count=v["count"])
        for k, v in sorted(cat_map.items(), key=lambda x: -x[1]["total"])
    ]

    return MonthSummary(
        month          = f"{year}-{m:02d}",
        total_income   = total_income,
        total_expenses = total_expenses,
        net            = total_income - total_expenses,
        by_category    = by_category,
    )


@router.get("/trends", response_model=List[TrendPoint])
def spending_trends(
    months: int = 6,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return last N months of income vs expense totals."""
    from dateutil.relativedelta import relativedelta

    now = datetime.now(timezone.utc)
    result = []

    for i in range(months - 1, -1, -1):
        dt   = now - relativedelta(months=i)
        year = dt.year
        m    = dt.month

        txs = (
            db.query(Transaction)
            .filter(
                Transaction.user_id == current_user.id,
                extract("year",  Transaction.date) == year,
                extract("month", Transaction.date) == m,
            )
            .all()
        )

        income_streams_total = (
            db.query(func.sum(IncomeStream.amount))
            .filter(
                IncomeStream.user_id == current_user.id,
                IncomeStream.is_active == True,
            )
            .scalar() or 0.0
        )
        income   = income_streams_total + sum(t.amount for t in txs if t.transaction_type == "income")
        expenses = sum(t.amount for t in txs if t.transaction_type == "expense")

        result.append(TrendPoint(
            month    = f"{year}-{m:02d}",
            income   = income,
            expenses = expenses,
            net      = income - expenses,
        ))

    return result
