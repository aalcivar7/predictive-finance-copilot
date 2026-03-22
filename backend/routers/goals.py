from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.security import get_current_user
from models.models import User, Goal, FinancialProfile
from schemas.schemas import GoalCreate, GoalUpdate, GoalOut

router = APIRouter()


def enrich_goal(goal: Goal, monthly_savings: float) -> GoalOut:
    remaining = goal.target_amount - goal.current_amount
    progress_pct = round((goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0, 2)
    months_to_goal = int(remaining / monthly_savings) if monthly_savings > 0 and remaining > 0 else None

    return GoalOut(
        id=goal.id,
        name=goal.name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date,
        is_completed=goal.is_completed,
        progress_pct=progress_pct,
        months_to_goal=months_to_goal,
        created_at=goal.created_at,
    )


@router.get("", response_model=List[GoalOut])
def list_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    monthly_savings = profile.monthly_savings if profile else 0
    return [enrich_goal(g, monthly_savings) for g in goals]


@router.post("", response_model=GoalOut, status_code=201)
def create_goal(data: GoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = Goal(user_id=current_user.id, **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    monthly_savings = profile.monthly_savings if profile else 0
    return enrich_goal(goal, monthly_savings)


@router.put("/{goal_id}", response_model=GoalOut)
def update_goal(goal_id: int, data: GoalUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(goal, field, value)

    db.commit()
    db.refresh(goal)
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == current_user.id).first()
    monthly_savings = profile.monthly_savings if profile else 0
    return enrich_goal(goal, monthly_savings)


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
