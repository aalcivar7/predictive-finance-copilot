from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.security import get_current_user
from models.models import User, IncomeStream
from schemas.schemas import (
    IncomeStreamCreate, IncomeStreamUpdate,
    IncomeStreamOut, IncomeStreamsSummary,
)

router = APIRouter()


@router.get("", response_model=IncomeStreamsSummary)
def list_income_streams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    streams = (
        db.query(IncomeStream)
        .filter(IncomeStream.user_id == current_user.id)
        .order_by(IncomeStream.created_at.desc())
        .all()
    )

    active     = sum(s.amount for s in streams if s.is_active and s.stream_type == "active")
    passive    = sum(s.amount for s in streams if s.is_active and s.stream_type == "passive")
    investment = sum(s.amount for s in streams if s.is_active and s.stream_type == "investment")

    return IncomeStreamsSummary(
        streams           = streams,
        total_monthly     = active + passive + investment,
        total_active      = active,
        total_passive     = passive,
        total_investment  = investment,
    )


@router.post("", response_model=IncomeStreamOut, status_code=201)
def create_income_stream(
    body: IncomeStreamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stream = IncomeStream(
        user_id     = current_user.id,
        name        = body.name,
        amount      = body.amount,
        stream_type = body.stream_type,
    )
    db.add(stream)
    db.commit()
    db.refresh(stream)
    return stream


@router.put("/{stream_id}", response_model=IncomeStreamOut)
def update_income_stream(
    stream_id: int,
    body: IncomeStreamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stream = db.query(IncomeStream).filter(
        IncomeStream.id == stream_id,
        IncomeStream.user_id == current_user.id,
    ).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")

    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(stream, field, val)

    db.commit()
    db.refresh(stream)
    return stream


@router.delete("/{stream_id}", status_code=204)
def delete_income_stream(
    stream_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stream = db.query(IncomeStream).filter(
        IncomeStream.id == stream_id,
        IncomeStream.user_id == current_user.id,
    ).first()
    if stream:
        db.delete(stream)
        db.commit()
