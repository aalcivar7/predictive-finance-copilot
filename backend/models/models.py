from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String, unique=True, index=True, nullable=True)
    email           = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    full_name       = Column(String, nullable=True)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    financial_profile   = relationship("FinancialProfile",   back_populates="user", uselist=False, cascade="all, delete-orphan")
    goals               = relationship("Goal",               back_populates="user", cascade="all, delete-orphan")
    transactions        = relationship("Transaction",        back_populates="user", cascade="all, delete-orphan")
    income_streams      = relationship("IncomeStream",       back_populates="user", cascade="all, delete-orphan")
    budgets             = relationship("Budget",             back_populates="user", cascade="all, delete-orphan")
    debts               = relationship("Debt",               back_populates="user", cascade="all, delete-orphan")
    bills               = relationship("Bill",               back_populates="user", cascade="all, delete-orphan")
    net_worth_snapshots = relationship("NetWorthSnapshot",   back_populates="user", cascade="all, delete-orphan")


class FinancialProfile(Base):
    __tablename__ = "financial_profiles"

    id                     = Column(Integer, primary_key=True, index=True)
    user_id                = Column(Integer, ForeignKey("users.id"), unique=True)
    monthly_income         = Column(Float, default=0.0)
    monthly_expenses       = Column(Float, default=0.0)
    monthly_savings        = Column(Float, default=0.0)
    current_net_worth      = Column(Float, default=0.0)
    investment_return_rate = Column(Float, default=0.07)
    salary_growth_rate     = Column(Float, default=0.03)
    updated_at             = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User", back_populates="financial_profile")


class Goal(Base):
    __tablename__ = "goals"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"))
    name           = Column(String, nullable=False)
    target_amount  = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date    = Column(DateTime(timezone=True), nullable=True)
    is_completed   = Column(Boolean, default=False)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="goals")


class Transaction(Base):
    __tablename__ = "transactions"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"))
    amount           = Column(Float, nullable=False)
    category         = Column(String, nullable=False)
    description      = Column(Text, nullable=True)
    transaction_type = Column(String, nullable=False)   # "income" | "expense"
    date             = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="transactions")


class IncomeStream(Base):
    __tablename__ = "income_streams"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    name        = Column(String, nullable=False)
    amount      = Column(Float, nullable=False)
    stream_type = Column(String, default="active")   # "active" | "passive" | "investment"
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="income_streams")


class Budget(Base):
    __tablename__ = "budgets"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"))
    category     = Column(String, nullable=False)
    limit_amount = Column(Float, nullable=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="budgets")


class Debt(Base):
    __tablename__ = "debts"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"))
    name            = Column(String, nullable=False)
    debt_type       = Column(String, nullable=False, default="personal")
    current_balance = Column(Float, nullable=False)
    interest_rate   = Column(Float, nullable=False)   # annual, as decimal (0.20 = 20%)
    minimum_payment = Column(Float, nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User", back_populates="debts")


class Bill(Base):
    __tablename__ = "bills"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"))
    name       = Column(String, nullable=False)
    amount     = Column(Float, nullable=False)
    due_day    = Column(Integer, nullable=False)   # 1–31
    category   = Column(String, nullable=False, default="Subscriptions")
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="bills")


class NetWorthSnapshot(Base):
    __tablename__ = "net_worth_snapshots"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"))
    net_worth     = Column(Float, nullable=False)
    assets        = Column(Float, nullable=False, default=0.0)
    liabilities   = Column(Float, nullable=False, default=0.0)
    snapshot_date = Column(DateTime(timezone=True), nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="net_worth_snapshots")
