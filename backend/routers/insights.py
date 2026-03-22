from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.security import get_current_user
from models.models import User, FinancialProfile, Goal
from schemas.schemas import InsightsOut, Insight

router = APIRouter()


def generate_insights(profile: FinancialProfile, goals: List[Goal]) -> List[Insight]:
    insights = []

    if not profile:
        insights.append(Insight(
            type="tip",
            title="Set up your profile",
            message="Add your income and expenses to get personalized insights.",
        ))
        return insights

    income = profile.monthly_income
    expenses = profile.monthly_expenses
    savings = profile.monthly_savings
    cashflow = income - expenses

    # Cashflow checks
    if cashflow < 0:
        insights.append(Insight(
            type="warning",
            title="Negative Cashflow",
            message=f"You're spending ${abs(cashflow):,.0f} more than you earn each month. Review your expenses immediately.",
        ))
    elif cashflow < income * 0.1:
        insights.append(Insight(
            type="warning",
            title="Low Cashflow Buffer",
            message="Your cashflow margin is below 10%. Consider reducing discretionary spending.",
        ))
    else:
        insights.append(Insight(
            type="success",
            title="Healthy Cashflow",
            message=f"You have a positive cashflow of ${cashflow:,.0f}/month. Keep it up!",
        ))

    # Savings rate checks
    if income > 0:
        savings_rate = savings / income * 100
        if savings_rate < 10:
            insights.append(Insight(
                type="warning",
                title="Low Savings Rate",
                message=f"You're saving {savings_rate:.1f}% of your income. Aim for at least 20% to build wealth faster.",
            ))
        elif savings_rate >= 20:
            insights.append(Insight(
                type="success",
                title="Strong Savings Rate",
                message=f"Your {savings_rate:.1f}% savings rate puts you ahead of most people. Great discipline!",
            ))
        else:
            insights.append(Insight(
                type="tip",
                title="Improve Your Savings Rate",
                message=f"You're saving {savings_rate:.1f}%. Try to reach 20% by trimming non-essential expenses.",
            ))

    # Investment return check
    if profile.investment_return_rate < 0.04:
        insights.append(Insight(
            type="tip",
            title="Review Your Investments",
            message="Your expected return is below 4%. Consider diversifying into index funds for better long-term growth.",
        ))

    # Emergency fund check
    if profile.current_net_worth < expenses * 6:
        insights.append(Insight(
            type="warning",
            title="Build an Emergency Fund",
            message=f"Aim for at least 6 months of expenses (${expenses * 6:,.0f}) before investing aggressively.",
        ))

    # Goals check
    incomplete_goals = [g for g in goals if not g.is_completed]
    if incomplete_goals and savings > 0:
        urgent = sorted(incomplete_goals, key=lambda g: (g.target_amount - g.current_amount))
        closest = urgent[0]
        remaining = closest.target_amount - closest.current_amount
        months = int(remaining / savings) if savings > 0 else None
        if months:
            insights.append(Insight(
                type="tip",
                title=f"Goal: {closest.name}",
                message=f"At your current savings rate, you'll reach this goal in ~{months} months. Increase savings to get there faster.",
            ))

    return insights


@router.get("", response_model=InsightsOut)
def get_insights(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    return InsightsOut(insights=generate_insights(profile, goals))
