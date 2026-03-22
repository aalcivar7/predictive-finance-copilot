import axios from 'axios';
import { getToken, removeToken } from './auth';
import type {
  DashboardData, FinancialProfile, SimulateRequest, SimulateResult,
  Goal, Insight, User,
  Transaction, TransactionCreate, MonthSummary, TrendPoint,
  IncomeStream, IncomeStreamCreate, IncomeStreamsSummary,
  Budget, BudgetCreate, Debt, DebtCreate, Bill, BillCreate,
  NetWorthSnapshot, NetWorthSnapshotCreate, NetWorthHistoryOut,
  HealthScore, RetirementProjection, TaxEstimate,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) { removeToken(); if (typeof window !== 'undefined') window.location.href = '/login'; }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const register = async (email: string, password: string, full_name?: string) =>
  (await api.post('/auth/register', { email, password, full_name })).data as User;
export const login = async (email: string, password: string) => {
  const p = new URLSearchParams(); p.append('username', email); p.append('password', password);
  return (await api.post('/auth/login', p, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })).data as { access_token: string; token_type: string };
};
export const getMe = async () => (await api.get('/auth/me')).data as User;

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboard = async () => (await api.get('/dashboard')).data as DashboardData;
export const updateProfile = async (profile: Partial<FinancialProfile>) => (await api.put('/dashboard/profile', profile)).data as FinancialProfile;

// ── Simulate ──────────────────────────────────────────────────────────────────
export const simulate = async (req: SimulateRequest) => (await api.post('/simulate', req)).data as SimulateResult;

// ── Goals ─────────────────────────────────────────────────────────────────────
export const getGoals = async () => (await api.get('/goals')).data as Goal[];
export const createGoal = async (goal: { name: string; target_amount: number; current_amount?: number; target_date?: string }) => (await api.post('/goals', goal)).data as Goal;
export const updateGoal = async (id: number, updates: Partial<Goal>) => (await api.put(`/goals/${id}`, updates)).data as Goal;
export const deleteGoal = async (id: number) => { await api.delete(`/goals/${id}`); };

// ── Insights ──────────────────────────────────────────────────────────────────
export const getInsights = async () => (await api.get('/insights')).data as { insights: Insight[] };

// ── Transactions ──────────────────────────────────────────────────────────────
export const getTransactions = async (params?: { transaction_type?: string; month?: string }) =>
  (await api.get('/transactions', { params })).data as Transaction[];
export const createTransaction = async (body: TransactionCreate) => (await api.post('/transactions', body)).data as Transaction;
export const updateTransaction = async (id: number, body: Partial<TransactionCreate>) => (await api.put(`/transactions/${id}`, body)).data as Transaction;
export const deleteTransaction = async (id: number) => { await api.delete(`/transactions/${id}`); };
export const getMonthSummary  = async (month?: string) => (await api.get('/transactions/summary', { params: month ? { month } : {} })).data as MonthSummary;
export const getSpendingTrends = async (months = 6) => (await api.get('/transactions/trends', { params: { months } })).data as TrendPoint[];

// ── Income Streams ────────────────────────────────────────────────────────────
export const getIncomeStreams = async () => (await api.get('/income-streams')).data as IncomeStreamsSummary;
export const createIncomeStream = async (body: IncomeStreamCreate) => (await api.post('/income-streams', body)).data as IncomeStream;
export const updateIncomeStream = async (id: number, body: Partial<IncomeStreamCreate & { is_active: boolean }>) => (await api.put(`/income-streams/${id}`, body)).data as IncomeStream;
export const deleteIncomeStream = async (id: number) => { await api.delete(`/income-streams/${id}`); };

// ── Plan — Budgets ────────────────────────────────────────────────────────────
export const getBudgets = async () => (await api.get('/plan/budgets')).data as Budget[];
export const createBudget = async (body: BudgetCreate) => (await api.post('/plan/budgets', body)).data as Budget;
export const updateBudget = async (id: number, limit_amount: number) => (await api.put(`/plan/budgets/${id}`, { limit_amount })).data as Budget;
export const deleteBudget = async (id: number) => { await api.delete(`/plan/budgets/${id}`); };

// ── Plan — Debts ──────────────────────────────────────────────────────────────
export const getDebts = async () => (await api.get('/plan/debts')).data as Debt[];
export const createDebt = async (body: DebtCreate) => (await api.post('/plan/debts', body)).data as Debt;
export const updateDebt = async (id: number, body: Partial<DebtCreate>) => (await api.put(`/plan/debts/${id}`, body)).data as Debt;
export const deleteDebt = async (id: number) => { await api.delete(`/plan/debts/${id}`); };

// ── Plan — Bills ──────────────────────────────────────────────────────────────
export const getBills = async () => (await api.get('/plan/bills')).data as Bill[];
export const createBill = async (body: BillCreate) => (await api.post('/plan/bills', body)).data as Bill;
export const updateBill = async (id: number, body: Partial<BillCreate & { is_active: boolean }>) => (await api.put(`/plan/bills/${id}`, body)).data as Bill;
export const deleteBill = async (id: number) => { await api.delete(`/plan/bills/${id}`); };

// ── Wealth ────────────────────────────────────────────────────────────────────
export const getHealthScore = async () => (await api.get('/wealth/health')).data as HealthScore;
export const getRetirement  = async (current_age = 30) => (await api.get('/wealth/retirement', { params: { current_age } })).data as RetirementProjection;
export const getTaxEstimate = async (filing_status = 'single') => (await api.get('/wealth/tax', { params: { filing_status } })).data as TaxEstimate;
export const getNetWorthHistory = async () => (await api.get('/wealth/net-worth-history')).data as NetWorthHistoryOut;
export const addNetWorthSnapshot = async (body: NetWorthSnapshotCreate) => (await api.post('/wealth/net-worth-history', body)).data as NetWorthSnapshot;
export const deleteNetWorthSnapshot = async (id: number) => { await api.delete(`/wealth/net-worth-history/${id}`); };
