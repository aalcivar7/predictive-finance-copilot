from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime


# ── Auth ───────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email:     Optional[str] = None   # kept for legacy, username takes precedence
    username:  Optional[str] = None
    password:  str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email:    EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type:   str

class UserOut(BaseModel):
    id:         int
    username:   Optional[str]
    email:      Optional[str]
    full_name:  Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Financial Profile ──────────────────────────────────────────────────────────

class FinancialProfileUpdate(BaseModel):
    monthly_income:         Optional[float] = None
    monthly_expenses:       Optional[float] = None
    monthly_savings:        Optional[float] = None
    current_net_worth:      Optional[float] = None
    investment_return_rate: Optional[float] = None
    salary_growth_rate:     Optional[float] = None

class FinancialProfileOut(BaseModel):
    monthly_income:         float
    monthly_expenses:       float
    monthly_savings:        float
    current_net_worth:      float
    investment_return_rate: float
    salary_growth_rate:     float
    updated_at:             Optional[datetime]

    class Config:
        from_attributes = True


# ── Dashboard ──────────────────────────────────────────────────────────────────

class ProjectionPoint(BaseModel):
    year:      int
    net_worth: float
    low:       float
    high:      float

class DashboardOut(BaseModel):
    net_worth:        float
    monthly_income:   float
    monthly_expenses: float
    monthly_savings:  float
    savings_rate:     float
    cashflow:         float
    projections:      List[ProjectionPoint]


# ── Simulate ───────────────────────────────────────────────────────────────────

class SimulateRequest(BaseModel):
    monthly_savings:        float
    investment_return_rate: float
    salary_growth_rate:     float
    current_net_worth:      float
    years:                  int = 10

class SimulateOut(BaseModel):
    projections:       List[ProjectionPoint]
    final_net_worth:   float
    total_contributed: float


# ── Goals ──────────────────────────────────────────────────────────────────────

class GoalCreate(BaseModel):
    name:           str
    target_amount:  float
    current_amount: Optional[float] = 0.0
    target_date:    Optional[datetime] = None

class GoalUpdate(BaseModel):
    name:           Optional[str]      = None
    target_amount:  Optional[float]    = None
    current_amount: Optional[float]    = None
    target_date:    Optional[datetime] = None
    is_completed:   Optional[bool]     = None

class GoalOut(BaseModel):
    id:             int
    name:           str
    target_amount:  float
    current_amount: float
    target_date:    Optional[datetime]
    is_completed:   bool
    progress_pct:   float
    months_to_goal: Optional[int]
    created_at:     datetime

    class Config:
        from_attributes = True


# ── Insights ───────────────────────────────────────────────────────────────────

class Insight(BaseModel):
    type:    str
    title:   str
    message: str

class InsightsOut(BaseModel):
    insights: List[Insight]


# ── Transactions ───────────────────────────────────────────────────────────────

EXPENSE_CATEGORIES = [
    "Housing", "Food & Dining", "Transport", "Entertainment",
    "Healthcare", "Education", "Shopping", "Utilities",
    "Subscriptions", "Travel", "Personal Care", "Other",
]

class TransactionCreate(BaseModel):
    amount:           float
    category:         str
    description:      Optional[str]      = None
    transaction_type: str
    date:             Optional[datetime] = None

class TransactionUpdate(BaseModel):
    amount:      Optional[float]    = None
    category:    Optional[str]      = None
    description: Optional[str]      = None
    date:        Optional[datetime] = None

class TransactionOut(BaseModel):
    id:               int
    amount:           float
    category:         str
    description:      Optional[str]
    transaction_type: str
    date:             datetime

    class Config:
        from_attributes = True

class CategoryTotal(BaseModel):
    category: str
    total:    float
    count:    int

class MonthSummary(BaseModel):
    month:          str
    total_income:   float
    total_expenses: float
    net:            float
    by_category:    List[CategoryTotal]

class TrendPoint(BaseModel):
    month:    str
    income:   float
    expenses: float
    net:      float


# ── Income Streams ─────────────────────────────────────────────────────────────

class IncomeStreamCreate(BaseModel):
    name:        str
    amount:      float
    stream_type: str = "active"

class IncomeStreamUpdate(BaseModel):
    name:        Optional[str]   = None
    amount:      Optional[float] = None
    stream_type: Optional[str]   = None
    is_active:   Optional[bool]  = None

class IncomeStreamOut(BaseModel):
    id:          int
    name:        str
    amount:      float
    stream_type: str
    is_active:   bool
    created_at:  datetime

    class Config:
        from_attributes = True

class IncomeStreamsSummary(BaseModel):
    streams:          List[IncomeStreamOut]
    total_monthly:    float
    total_active:     float
    total_passive:    float
    total_investment: float


# ── Budget ─────────────────────────────────────────────────────────────────────

class BudgetCreate(BaseModel):
    category:     str
    limit_amount: float

class BudgetUpdate(BaseModel):
    limit_amount: Optional[float] = None

class BudgetOut(BaseModel):
    id:               int
    category:         str
    limit_amount:     float
    spent_this_month: float
    remaining:        float
    pct_used:         float
    created_at:       datetime

    class Config:
        from_attributes = True


# ── Debt ───────────────────────────────────────────────────────────────────────

class DebtCreate(BaseModel):
    name:            str
    debt_type:       str   = "personal"
    current_balance: float
    interest_rate:   float   # entered as % (21.99), stored as decimal (0.2199)
    minimum_payment: float

class DebtUpdate(BaseModel):
    name:            Optional[str]   = None
    debt_type:       Optional[str]   = None
    current_balance: Optional[float] = None
    interest_rate:   Optional[float] = None
    minimum_payment: Optional[float] = None

class DebtOut(BaseModel):
    id:               int
    name:             str
    debt_type:        str
    current_balance:  float
    interest_rate:    float
    minimum_payment:  float
    months_to_payoff: Optional[int]
    total_interest:   Optional[float]
    created_at:       datetime

    class Config:
        from_attributes = True


# ── Bill ───────────────────────────────────────────────────────────────────────

class BillCreate(BaseModel):
    name:      str
    amount:    float
    due_day:   int
    category:  str  = "Subscriptions"
    is_active: bool = True

class BillUpdate(BaseModel):
    name:      Optional[str]   = None
    amount:    Optional[float] = None
    due_day:   Optional[int]   = None
    category:  Optional[str]   = None
    is_active: Optional[bool]  = None

class BillOut(BaseModel):
    id:            int
    name:          str
    amount:        float
    due_day:       int
    category:      str
    is_active:     bool
    days_until_due: int
    created_at:    datetime

    class Config:
        from_attributes = True


# ── Net Worth Snapshot ─────────────────────────────────────────────────────────

class NetWorthSnapshotCreate(BaseModel):
    assets:        float
    liabilities:   float
    snapshot_date: datetime

class NetWorthSnapshotOut(BaseModel):
    id:            int
    net_worth:     float
    assets:        float
    liabilities:   float
    snapshot_date: datetime
    created_at:    datetime

    class Config:
        from_attributes = True


# ── Wealth ─────────────────────────────────────────────────────────────────────

class HealthScoreOut(BaseModel):
    score:           float
    label:           str
    color:           str
    savings_score:   float
    debt_score:      float
    emergency_score: float
    budget_score:    float

class RetirementProjectionOut(BaseModel):
    target_nest_egg:     float
    projected_at_65:     float
    on_track:            bool
    monthly_needed:      float
    shortfall:           float
    years_to_retirement: int
    annual_return_used:  float

class BracketLine(BaseModel):
    bracket_label:    str
    rate:             float
    income_in_bracket: float
    tax_owed:         float

class TaxEstimateOut(BaseModel):
    filing_status:              str
    gross_annual:               float
    standard_deduction:         float
    taxable_income:             float
    federal_tax:                float
    effective_rate:             float
    marginal_rate:              float
    estimated_monthly_takehome: float
    bracket_breakdown:          List[BracketLine]
    note:                       str

class NetWorthHistoryOut(BaseModel):
    snapshots:    List[NetWorthSnapshotOut]
    change_30d:   float
    change_ytd:   float
