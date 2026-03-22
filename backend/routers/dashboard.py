import numpy as np
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
from models.models import User, FinancialProfile
from schemas.schemas import DashboardOut, FinancialProfileUpdate, FinancialProfileOut, ProjectionPoint

router = APIRouter()


def compute_projections(net_worth: float, monthly_savings: float, annual_return: float, years: int = 10):
    projections = []
    nw = net_worth
    volatility = 0.10  # 10% annual volatility for confidence bands

    for y in range(1, years + 1):
        nw = nw * (1 + annual_return) + monthly_savings * 12
        std = nw * volatility * (y ** 0.5)
        projections.append(ProjectionPoint(
            year=y,
            net_worth=round(nw, 2),
            low=round(max(0, nw - 1.5 * std), 2),
            high=round(nw + 1.5 * std, 2),
        ))
    return projections


@router.get("", response_model=DashboardOut)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    if not profile:
        profile = FinancialProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    cashflow = profile.monthly_income - profile.monthly_expenses
    savings_rate = (profile.monthly_savings / profile.monthly_income * 100) if profile.monthly_income > 0 else 0.0
    projections = compute_projections(profile.current_net_worth, profile.monthly_savings, profile.investment_return_rate)

    return DashboardOut(
        net_worth=profile.current_net_worth,
        monthly_income=profile.monthly_income,
        monthly_expenses=profile.monthly_expenses,
        monthly_savings=profile.monthly_savings,
        savings_rate=round(savings_rate, 2),
        cashflow=round(cashflow, 2),
        projections=projections,
    )


@router.put("/profile", response_model=FinancialProfileOut)
def update_profile(data: FinancialProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    if not profile:
        profile = FinancialProfile(user_id=current_user.id)
        db.add(profile)

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile
