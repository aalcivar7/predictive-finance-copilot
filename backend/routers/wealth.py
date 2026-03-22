"""
Wealth router — health score, retirement projection, tax estimate, net worth history.
"""
import math
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract

from core.database import get_db
from core.security import get_current_user
from models.models import User, Budget, Debt, NetWorthSnapshot, Transaction, IncomeStream
from schemas.schemas import (
    HealthScoreOut, RetirementProjectionOut,
    TaxEstimateOut, BracketLine,
    NetWorthHistoryOut, NetWorthSnapshotCreate, NetWorthSnapshotOut,
)

router = APIRouter()


# ── Health Score ───────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthScoreOut)
def health_score(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = current_user.financial_profile

    income   = p.monthly_income   if p else 0
    expenses = p.monthly_expenses if p else 0
    savings  = p.monthly_savings  if p else 0
    net_worth= p.current_net_worth if p else 0

    # 1. Savings rate (0-25)
    rate = (savings / income * 100) if income > 0 else 0
    if rate >= 30:   sr = 25
    elif rate >= 20: sr = 20
    elif rate >= 15: sr = 15
    elif rate >= 10: sr = 10
    elif rate >= 5:  sr = 5
    else:            sr = 0

    # 2. Debt-to-income (0-25)
    debts = db.query(Debt).filter(Debt.user_id == current_user.id).all()
    total_min_payment = sum(d.minimum_payment for d in debts)
    dti = (total_min_payment / income * 100) if income > 0 else (0 if not debts else 100)
    if not debts:    ds = 25
    elif dti < 10:   ds = 25
    elif dti < 20:   ds = 20
    elif dti < 30:   ds = 15
    elif dti < 40:   ds = 8
    elif dti < 50:   ds = 3
    else:            ds = 0

    # 3. Emergency fund (0-25)
    months_covered = (net_worth / expenses) if expenses > 0 else 0
    if months_covered >= 12: es = 25
    elif months_covered >= 6: es = 20
    elif months_covered >= 3: es = 12
    elif months_covered >= 1: es = 5
    else:                     es = 0

    # 4. Budget adherence (0-25)
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    if not budgets:
        bs = 12
    else:
        now = datetime.now(timezone.utc)
        within = 0
        for b in budgets:
            txs = db.query(Transaction).filter(
                Transaction.user_id == current_user.id,
                Transaction.transaction_type == "expense",
                Transaction.category == b.category,
                extract("year",  Transaction.date) == now.year,
                extract("month", Transaction.date) == now.month,
            ).all()
            spent = sum(t.amount for t in txs)
            if spent <= b.limit_amount:
                within += 1
        pct_within = within / len(budgets)
        if pct_within == 1.0:   bs = 25
        elif pct_within >= 0.8: bs = 20
        elif pct_within >= 0.6: bs = 15
        elif pct_within >= 0.4: bs = 8
        else:                   bs = 0

    score = min(100, sr + ds + es + bs)

    if score >= 85:   label, color = "Excellent", "#34d399"
    elif score >= 70: label, color = "Good",      "#2dd4bf"
    elif score >= 50: label, color = "Fair",      "#fbbf24"
    else:             label, color = "Poor",      "#f87171"

    return HealthScoreOut(
        score=round(score, 1), label=label, color=color,
        savings_score=sr, debt_score=ds, emergency_score=es, budget_score=bs,
    )


# ── Retirement Projection ──────────────────────────────────────────────────────

@router.get("/retirement", response_model=RetirementProjectionOut)
def retirement_projection(
    current_age: int = Query(default=30, ge=18, le=64),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = current_user.financial_profile
    pv          = p.current_net_worth      if p else 0
    monthly_sav = p.monthly_savings        if p else 0
    ann_return  = p.investment_return_rate if p else 0.07
    sal_growth  = p.salary_growth_rate     if p else 0.03
    expenses    = p.monthly_expenses       if p else 0

    years = 65 - current_age
    target = (expenses * 12 / 0.04) if expenses > 0 else 1_000_000

    portfolio = float(pv)
    sav = float(monthly_sav)
    for _ in range(years):
        portfolio = portfolio * (1 + ann_return) + sav * 12
        sav = sav * (1 + sal_growth)

    projected = portfolio
    on_track  = projected >= target
    shortfall = max(0.0, target - projected)

    # Solve for required monthly savings if not on track
    r = ann_return / 12
    n = years * 12
    if on_track:
        needed = monthly_sav
    else:
        fv_pv = pv * (1 + r) ** n
        annuity_factor = ((1 + r) ** n - 1) / r if r > 0 else n
        needed = (target - fv_pv) / annuity_factor if annuity_factor > 0 else target / n

    return RetirementProjectionOut(
        target_nest_egg=round(target, 2),
        projected_at_65=round(projected, 2),
        on_track=on_track,
        monthly_needed=round(max(needed, 0), 2),
        shortfall=round(shortfall, 2),
        years_to_retirement=years,
        annual_return_used=ann_return,
    )


# ── Tax Estimate ───────────────────────────────────────────────────────────────

BRACKETS = {
    "single": [
        (11_600,  0.10),
        (47_150,  0.12),
        (100_525, 0.22),
        (191_950, 0.24),
        (243_725, 0.32),
        (609_350, 0.35),
        (float("inf"), 0.37),
    ],
    "married_jointly": [
        (23_200,  0.10),
        (94_300,  0.12),
        (201_050, 0.22),
        (383_900, 0.24),
        (487_450, 0.32),
        (731_200, 0.35),
        (float("inf"), 0.37),
    ],
}
STANDARD_DEDUCTIONS = {"single": 14_600, "married_jointly": 29_200}


@router.get("/tax", response_model=TaxEstimateOut)
def tax_estimate(
    filing_status: str = Query(default="single", pattern="^(single|married_jointly)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = current_user.financial_profile
    streams = db.query(IncomeStream).filter(IncomeStream.user_id == current_user.id, IncomeStream.is_active == True).all()
    gross_monthly = sum(s.amount for s in streams) if streams else (p.monthly_income if p else 0)
    gross_annual  = gross_monthly * 12

    deduction     = STANDARD_DEDUCTIONS[filing_status]
    taxable       = max(0.0, gross_annual - deduction)
    brackets      = BRACKETS[filing_status]

    breakdown: List[BracketLine] = []
    federal_tax   = 0.0
    marginal_rate = 0.0
    prev_limit    = 0.0

    for limit, rate in brackets:
        if taxable <= 0:
            break
        in_bracket = min(taxable, limit - prev_limit)
        if in_bracket <= 0:
            prev_limit = limit
            continue
        owed = in_bracket * rate
        federal_tax += owed
        marginal_rate = rate
        label = f"{int(rate*100)}%"
        breakdown.append(BracketLine(
            bracket_label=label, rate=rate,
            income_in_bracket=round(in_bracket, 2),
            tax_owed=round(owed, 2),
        ))
        taxable   -= in_bracket
        prev_limit = limit

    eff_rate    = (federal_tax / gross_annual) if gross_annual > 0 else 0
    takehome_mo = (gross_annual - federal_tax) / 12

    return TaxEstimateOut(
        filing_status=filing_status,
        gross_annual=round(gross_annual, 2),
        standard_deduction=deduction,
        taxable_income=round(max(0, gross_annual - deduction), 2),
        federal_tax=round(federal_tax, 2),
        effective_rate=round(eff_rate, 4),
        marginal_rate=marginal_rate,
        estimated_monthly_takehome=round(takehome_mo, 2),
        bracket_breakdown=breakdown,
        note="Estimate only. Excludes FICA (7.65%), state taxes, and pre-tax deductions (401k, HSA).",
    )


# ── Net Worth History ──────────────────────────────────────────────────────────

@router.get("/net-worth-history", response_model=NetWorthHistoryOut)
def net_worth_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    snapshots = (
        db.query(NetWorthSnapshot)
        .filter(NetWorthSnapshot.user_id == current_user.id)
        .order_by(NetWorthSnapshot.snapshot_date.asc())
        .all()
    )
    out = [
        NetWorthSnapshotOut(
            id=s.id, net_worth=s.net_worth, assets=s.assets,
            liabilities=s.liabilities, snapshot_date=s.snapshot_date,
            created_at=s.created_at,
        )
        for s in snapshots
    ]

    now = datetime.now(timezone.utc)
    ago_30 = now - timedelta(days=30)
    ago_ytd = now.replace(month=1, day=1)

    def _nw_at(dt):
        past = [s for s in snapshots if s.snapshot_date <= dt]
        return past[-1].net_worth if past else 0

    current_nw = snapshots[-1].net_worth if snapshots else 0
    change_30d  = current_nw - _nw_at(ago_30)
    change_ytd  = current_nw - _nw_at(ago_ytd)

    return NetWorthHistoryOut(snapshots=out, change_30d=round(change_30d, 2), change_ytd=round(change_ytd, 2))


@router.post("/net-worth-history", response_model=NetWorthSnapshotOut, status_code=201)
def add_snapshot(body: NetWorthSnapshotCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = NetWorthSnapshot(
        user_id=current_user.id,
        net_worth=round(body.assets - body.liabilities, 2),
        assets=body.assets,
        liabilities=body.liabilities,
        snapshot_date=body.snapshot_date,
    )
    db.add(s); db.commit(); db.refresh(s)
    return NetWorthSnapshotOut(
        id=s.id, net_worth=s.net_worth, assets=s.assets,
        liabilities=s.liabilities, snapshot_date=s.snapshot_date,
        created_at=s.created_at,
    )


@router.delete("/net-worth-history/{snapshot_id}", status_code=204)
def delete_snapshot(snapshot_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = db.query(NetWorthSnapshot).filter(NetWorthSnapshot.id == snapshot_id, NetWorthSnapshot.user_id == current_user.id).first()
    if s:
        db.delete(s); db.commit()
