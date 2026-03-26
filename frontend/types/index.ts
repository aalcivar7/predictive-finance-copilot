export interface User { id: number; username: string | null; email: string | null; full_name: string | null; created_at: string; }
export interface ProjectionPoint { year: number; net_worth: number; low: number; high: number; }
export interface DashboardData { net_worth: number; monthly_income: number; monthly_expenses: number; monthly_savings: number; savings_rate: number; cashflow: number; projections: ProjectionPoint[]; }
export interface FinancialProfile { monthly_income: number; monthly_expenses: number; monthly_savings: number; current_net_worth: number; investment_return_rate: number; salary_growth_rate: number; updated_at: string | null; }
export interface SimulateRequest { monthly_savings: number; investment_return_rate: number; salary_growth_rate: number; current_net_worth: number; years: number; }
export interface SimulateResult { projections: ProjectionPoint[]; final_net_worth: number; total_contributed: number; }
export interface Goal { id: number; name: string; target_amount: number; current_amount: number; target_date: string | null; is_completed: boolean; progress_pct: number; months_to_goal: number | null; created_at: string; }
export interface Insight { type: 'warning' | 'success' | 'tip'; title: string; message: string; }
export interface Transaction { id: number; amount: number; category: string; description: string | null; transaction_type: 'income' | 'expense'; date: string; }
export interface TransactionCreate { amount: number; category: string; description?: string; transaction_type: 'income' | 'expense'; date?: string; }
export interface CategoryTotal { category: string; total: number; count: number; }
export interface MonthSummary { month: string; total_income: number; total_expenses: number; net: number; by_category: CategoryTotal[]; }
export interface TrendPoint { month: string; income: number; expenses: number; net: number; }
export interface IncomeStream { id: number; name: string; amount: number; stream_type: 'active' | 'passive' | 'investment'; is_active: boolean; created_at: string; }
export interface IncomeStreamCreate { name: string; amount: number; stream_type: 'active' | 'passive' | 'investment'; }
export interface IncomeStreamsSummary { streams: IncomeStream[]; total_monthly: number; total_active: number; total_passive: number; total_investment: number; }
export interface Budget { id: number; category: string; limit_amount: number; spent_this_month: number; remaining: number; pct_used: number; created_at: string; }
export interface BudgetCreate { category: string; limit_amount: number; }
export interface Debt { id: number; name: string; debt_type: string; current_balance: number; interest_rate: number; minimum_payment: number; months_to_payoff: number | null; total_interest: number | null; created_at: string; }
export interface DebtCreate { name: string; debt_type: string; current_balance: number; interest_rate: number; minimum_payment: number; }
export interface Bill { id: number; name: string; amount: number; due_day: number; category: string; is_active: boolean; days_until_due: number; created_at: string; }
export interface BillCreate { name: string; amount: number; due_day: number; category: string; is_active?: boolean; }
export interface NetWorthSnapshot { id: number; net_worth: number; assets: number; liabilities: number; snapshot_date: string; created_at: string; }
export interface NetWorthSnapshotCreate { assets: number; liabilities: number; snapshot_date: string; }
export interface NetWorthHistoryOut { snapshots: NetWorthSnapshot[]; change_30d: number; change_ytd: number; }
export interface HealthScore { score: number; label: string; color: string; savings_score: number; debt_score: number; emergency_score: number; budget_score: number; }
export interface RetirementProjection { target_nest_egg: number; projected_at_65: number; on_track: boolean; monthly_needed: number; shortfall: number; years_to_retirement: number; annual_return_used: number; }
export interface BracketLine { bracket_label: string; rate: number; income_in_bracket: number; tax_owed: number; }
export interface TaxEstimate { filing_status: string; gross_annual: number; standard_deduction: number; taxable_income: number; federal_tax: number; effective_rate: number; marginal_rate: number; estimated_monthly_takehome: number; bracket_breakdown: BracketLine[]; note: string; }
