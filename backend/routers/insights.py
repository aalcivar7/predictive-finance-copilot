from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.security import get_current_user
from models.models import User, FinancialProfile, Goal
from schemas.schemas import InsightsOut, Insight

router = APIRouter()


def generate_insights(profile: FinancialProfile, goals: List[Goal], lang: str = 'en') -> List[Insight]:
    insights = []
    es = lang == 'es'

    if not profile:
        insights.append(Insight(
            type="tip",
            title="Configura tu perfil" if es else "Set up your profile",
            message="Agrega tus ingresos y gastos para obtener análisis personalizados." if es else "Add your income and expenses to get personalized insights.",
        ))
        return insights

    income   = profile.monthly_income
    expenses = profile.monthly_expenses
    savings  = profile.monthly_savings
    cashflow = income - expenses

    # Cashflow
    if cashflow < 0:
        insights.append(Insight(
            type="warning",
            title="Flujo de caja negativo" if es else "Negative Cashflow",
            message=f"Estás gastando ${abs(cashflow):,.0f} más de lo que ganas cada mes. Revisa tus gastos de inmediato." if es else f"You're spending ${abs(cashflow):,.0f} more than you earn each month. Review your expenses immediately.",
        ))
    elif cashflow < income * 0.1:
        insights.append(Insight(
            type="warning",
            title="Margen de flujo bajo" if es else "Low Cashflow Buffer",
            message="Tu margen de flujo de caja está por debajo del 10%. Considera reducir gastos discrecionales." if es else "Your cashflow margin is below 10%. Consider reducing discretionary spending.",
        ))
    else:
        insights.append(Insight(
            type="success",
            title="Flujo de caja saludable" if es else "Healthy Cashflow",
            message=f"Tienes un flujo positivo de ${cashflow:,.0f}/mes. ¡Sigue así!" if es else f"You have a positive cashflow of ${cashflow:,.0f}/month. Keep it up!",
        ))

    # Savings rate
    if income > 0:
        savings_rate = savings / income * 100
        if savings_rate < 10:
            insights.append(Insight(
                type="warning",
                title="Tasa de ahorro baja" if es else "Low Savings Rate",
                message=f"Estás ahorrando el {savings_rate:.1f}% de tus ingresos. Apunta a al menos el 20% para acumular riqueza más rápido." if es else f"You're saving {savings_rate:.1f}% of your income. Aim for at least 20% to build wealth faster.",
            ))
        elif savings_rate >= 20:
            insights.append(Insight(
                type="success",
                title="Tasa de ahorro excelente" if es else "Strong Savings Rate",
                message=f"Tu tasa de ahorro del {savings_rate:.1f}% te pone por delante de la mayoría. ¡Gran disciplina!" if es else f"Your {savings_rate:.1f}% savings rate puts you ahead of most people. Great discipline!",
            ))
        else:
            insights.append(Insight(
                type="tip",
                title="Mejora tu tasa de ahorro" if es else "Improve Your Savings Rate",
                message=f"Estás ahorrando {savings_rate:.1f}%. Intenta llegar al 20% reduciendo gastos no esenciales." if es else f"You're saving {savings_rate:.1f}%. Try to reach 20% by trimming non-essential expenses.",
            ))

    # Investment return
    if profile.investment_return_rate < 0.04:
        insights.append(Insight(
            type="tip",
            title="Revisa tus inversiones" if es else "Review Your Investments",
            message="Tu rendimiento esperado está por debajo del 4%. Considera diversificar en fondos indexados para mejor crecimiento a largo plazo." if es else "Your expected return is below 4%. Consider diversifying into index funds for better long-term growth.",
        ))

    # Emergency fund
    if profile.current_net_worth < expenses * 6:
        insights.append(Insight(
            type="warning",
            title="Construye un fondo de emergencia" if es else "Build an Emergency Fund",
            message=f"Apunta a al menos 6 meses de gastos (${expenses * 6:,.0f}) antes de invertir agresivamente." if es else f"Aim for at least 6 months of expenses (${expenses * 6:,.0f}) before investing aggressively.",
        ))

    # Goals
    incomplete_goals = [g for g in goals if not g.is_completed]
    if incomplete_goals and savings > 0:
        urgent  = sorted(incomplete_goals, key=lambda g: (g.target_amount - g.current_amount))
        closest = urgent[0]
        remaining = closest.target_amount - closest.current_amount
        months = int(remaining / savings) if savings > 0 else None
        if months:
            insights.append(Insight(
                type="tip",
                title=f"Meta: {closest.name}" if es else f"Goal: {closest.name}",
                message=f"A tu tasa de ahorro actual, alcanzarás esta meta en ~{months} meses. Aumenta el ahorro para lograrlo antes." if es else f"At your current savings rate, you'll reach this goal in ~{months} months. Increase savings to get there faster.",
            ))

    return insights


@router.get("", response_model=InsightsOut)
def get_insights(
    lang: str = Query(default='en'),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    goals   = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    return InsightsOut(insights=generate_insights(profile, goals, lang))
