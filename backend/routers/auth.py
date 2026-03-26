from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import verify_password, get_password_hash, create_access_token, get_current_user
from models.models import User, FinancialProfile
from schemas.schemas import UserCreate, UserUpdate, Token, UserOut

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    username = (user_in.username or "").strip()
    email    = (user_in.email or "").strip() or None

    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    first_name = (user_in.full_name or "").strip()
    if not first_name:
        raise HTTPException(status_code=400, detail="First name is required")

    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    if email and db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username        = username,
        email           = email,
        hashed_password = get_password_hash(user_in.password),
        full_name       = first_name,
    )
    db.add(user)
    db.flush()

    profile = FinancialProfile(user_id=user.id)
    db.add(profile)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    identifier = form_data.username.strip()

    # Try username first, then email
    user = db.query(User).filter(User.username == identifier).first()
    if not user:
        user = db.query(User).filter(User.email == identifier).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Use username if available, else email as token subject
    subject = user.username or user.email
    token = create_access_token(data={"sub": subject})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.full_name is not None:
        current_user.full_name = data.full_name.strip() or current_user.full_name
    db.commit()
    db.refresh(current_user)
    return current_user
