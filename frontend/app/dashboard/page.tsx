'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProjectionChart from '@/components/charts/ProjectionChart';
import {
  getDashboard, updateProfile,
  getHealthScore, getGoals, getBudgets,
  getTransactions, getMonthSummary, getSpendingTrends,
  getNetWorthHistory,
} from '@/lib/api';
import type {
  DashboardData, HealthScore, Goal, Budget,
  Transaction, MonthSummary, TrendPoint, NetWorthHistoryOut,
} from '@/types';
import { useLang } from '@/lib/lang-context';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const CATEGORY_COLORS = ['#6366f1','#22c55e','#f97316','#eab308','#06b6d4','#a78bfa','#f43f5e','#10b981'];

// ── Mini Health Ring ───────────────────────────────────────────────────────────
function MiniRing({ score, color }: { score: number; color: string }) {
  const r = 36; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const colorMap: Record<string, string> = { green: '#22c55e', yellow: '#eab308', orange: '#f97316', red: '#ef4444' };
  const stroke = colorMap[color] ?? '#6366f1';
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={45} cy={45} r={r} fill="none" stroke="#1e1e2e" strokeWidth={9} />
        <circle cx={45} cy={45} r={r} fill="none" stroke={stroke} strokeWidth={9}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: stroke }}>{score}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useLang();

  const profileFields = [
    { key: 'monthly_income',         label: t('dashboard.profileMonthlyIncome') },
    { key: 'monthly_expenses',       label: t('dashboard.profileMonthlyExpenses') },
    { key: 'monthly_savings',        label: t('dashboard.profileMonthlySavings') },
    { key: 'current_net_worth',      label: t('dashboard.profileNetWorth') },
    { key: 'investment_return_rate', label: t('dashboard.profileReturn') },
    { key: 'salary_growth_rate',     label: t('dashboard.profileGrowth') },
  ];
  const [data, setData]           = useState<DashboardData | null>(null);
  const [health, setHealth]       = useState<HealthScore | null>(null);
  const [goals, setGoals]         = useState<Goal[]>([]);
  const [budgets, setBudgets]     = useState<Budget[]>([]);
  const [recent, setRecent]       = useState<Transaction[]>([]);
  const [summary, setSummary]     = useState<MonthSummary | null>(null);
  const [trends, setTrends]       = useState<TrendPoint[]>([]);
  const [nwHistory, setNwHistory] = useState<NetWorthHistoryOut | null>(null);
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({
    monthly_income: '', monthly_expenses: '', monthly_savings: '',
    current_net_worth: '', investment_return_rate: '7', salary_growth_rate: '3',
  });

  const load = useCallback(async () => {
    try {
      const [d, h, g, b, tx, sum, tr, nw] = await Promise.all([
        getDashboard(), getHealthScore(), getGoals(), getBudgets(),
        getTransactions(), getMonthSummary(), getSpendingTrends(6), getNetWorthHistory(),
      ]);
      setData(d); setHealth(h); setGoals(g); setBudgets(b);
      setRecent(tx.slice(0, 6)); setSummary(sum); setTrends(tr); setNwHistory(nw);
      setForm({
        monthly_income:         String(d.monthly_income),
        monthly_expenses:       String(d.monthly_expenses),
        monthly_savings:        String(d.monthly_savings),
        current_net_worth:      String(d.net_worth),
        investment_return_rate: '7',
        salary_growth_rate:     '3',
      });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        monthly_income:         parseFloat(form.monthly_income)         || 0,
        monthly_expenses:       parseFloat(form.monthly_expenses)       || 0,
        monthly_savings:        parseFloat(form.monthly_savings)        || 0,
        current_net_worth:      parseFloat(form.current_net_worth)      || 0,
        investment_return_rate: parseFloat(form.investment_return_rate) / 100 || 0.07,
        salary_growth_rate:     parseFloat(form.salary_growth_rate)     / 100 || 0.03,
      });
      await load();
      setEditing(false);
    } finally { setSaving(false); }
  }

  if (!data) return (
    <ProtectedRoute>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#60607a' }}>
        Loading your dashboard…
      </div>
    </ProtectedRoute>
  );

  const card: React.CSSProperties = {
    background: '#1a1a24', borderRadius: 16, padding: '20px',
    border: '1px solid #2a2a3a',
  };

  const overBudget = budgets.filter(b => b.pct_used > 100);
  const nearBudget = budgets.filter(b => b.pct_used >= 80 && b.pct_used <= 100);
  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);
  const nwSnapshots = [...(nwHistory?.snapshots ?? [])].reverse();
  const nwChartData = nwSnapshots.map(s => ({ date: s.snapshot_date.slice(0, 7), value: s.net_worth }));

  const pieData = (summary?.by_category ?? []).slice(0, 8).map((c, i) => ({
    name: c.category, value: c.total, fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f0f0f5', margin: 0 }}>{t('dashboard.title')}</h1>
            <p style={{ color: '#9999bb', marginTop: 4, fontSize: 14 }}>{t('dashboard.subtitle')}</p>
          </div>
          <button onClick={() => setEditing(v => !v)} style={{
            background: editing ? '#2a2a3a' : '#6366f1', color: editing ? '#9999bb' : '#fff',
            border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>{editing ? t('dashboard.cancelEdit') : t('dashboard.updateProfile')}</button>
        </div>

        {/* ── Edit Profile Form ── */}
        {editing && (
          <div style={{ ...card, marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5', marginBottom: 16 }}>{t('dashboard.updateProfileTitle')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16, marginBottom: 20 }}>
              {profileFields.map(({ key, label }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: '#9999bb', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input type="number" step="any" className="input"
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
            </div>
            <button onClick={handleSave} disabled={saving} style={{
              background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>{saving ? t('dashboard.savingProfile') : t('dashboard.saveChanges')}</button>
          </div>
        )}

        {/* ── Row 1: KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
          {[
            { label: t('dashboard.netWorth'), val: fmt(data.net_worth), color: '#6366f1', icon: '💎' },
            { label: t('dashboard.monthlyIncome'), val: fmt(data.monthly_income), color: '#22c55e', icon: '💰' },
            { label: t('dashboard.monthlyExpenses'), val: fmt(data.monthly_expenses), color: '#ef4444', icon: '💸' },
            { label: t('dashboard.monthlySavings'), val: fmt(data.monthly_savings), color: '#06b6d4', icon: '🏦' },
            { label: t('dashboard.savingsRate'), val: `${data.savings_rate}%`, color: data.savings_rate >= 20 ? '#22c55e' : data.savings_rate >= 10 ? '#eab308' : '#ef4444', icon: '📊' },
            { label: t('dashboard.cashflow'), val: fmt(data.cashflow), color: data.cashflow >= 0 ? '#22c55e' : '#ef4444', icon: data.cashflow >= 0 ? '📈' : '📉' },
          ].map(({ label, val, color, icon }) => (
            <div key={label} style={{ ...card }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 11, color: '#9999bb', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
            </div>
          ))}
        </div>

        {/* ── Row 2: Health Score + Alerts ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, marginBottom: 20 }}>
          {/* Health Score widget */}
          {health && (
            <Link href="/wealth" style={{ textDecoration: 'none' }}>
              <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 150, cursor: 'pointer', transition: 'border-color 0.2s', borderColor: '#3a3a5a' }}>
                <MiniRing score={health.score} color={health.color} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f5' }}>{t('dashboard.healthScore')}</div>
                <div style={{ fontSize: 11, color: '#9999bb' }}>{health.label}</div>
                <div style={{ fontSize: 11, color: '#6366f1', marginTop: 4 }}>{t('dashboard.viewDetails')}</div>
              </div>
            </Link>
          )}

          {/* Alerts panel */}
          <div style={{ ...card }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f5', marginBottom: 14 }}>{t('dashboard.alertsTitle')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {overBudget.length > 0 && overBudget.map(b => (
                <div key={b.id} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444433', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                  🚨 <strong style={{ color: '#ef4444' }}>{b.category}</strong>
                  <span style={{ color: '#ccccdd' }}> {t('dashboard.overBudget').replace('{pct}', (b.pct_used - 100).toFixed(0)).replace('{spent}', fmt(b.spent_this_month)).replace('{limit}', fmt(b.limit_amount))}</span>
                </div>
              ))}
              {nearBudget.length > 0 && nearBudget.map(b => (
                <div key={b.id} style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid #eab30833', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                  ⚠️ <strong style={{ color: '#eab308' }}>{b.category}</strong>
                  <span style={{ color: '#ccccdd' }}> {t('dashboard.nearBudget').replace('{pct}', b.pct_used.toFixed(0)).replace('{remaining}', fmt(b.remaining))}</span>
                </div>
              ))}
              {data.savings_rate < 10 && (
                <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid #f9731633', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                  💡 <span style={{ color: '#ccccdd' }}>{t('dashboard.lowSavings').replace('{rate}', String(data.savings_rate))}</span>
                </div>
              )}
              {data.cashflow < 0 && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #ef444433', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                  🚨 <span style={{ color: '#ccccdd' }}>{t('dashboard.negativeCashflow').replace('{amount}', fmt(data.cashflow))}</span>
                </div>
              )}
              {overBudget.length === 0 && nearBudget.length === 0 && data.savings_rate >= 10 && data.cashflow >= 0 && (
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid #22c55e33', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                  ✅ <span style={{ color: '#22c55e' }}>{t('dashboard.allGood')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 3: Spending Trends + Spending Breakdown ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
          {/* 6-month trend */}
          <div style={{ ...card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f5', margin: 0 }}>{t('dashboard.cashflowTrend')}</h3>
              <Link href="/money" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>{t('common.viewAll')}</Link>
            </div>
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                  <XAxis dataKey="month" stroke="#555577" tick={{ fill: '#9999bb', fontSize: 10 }} />
                  <YAxis stroke="#555577" tick={{ fill: '#9999bb', fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8 }} formatter={(v: number) => fmt(v)} />
                  <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#incGrad)" strokeWidth={2} name="Income" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: '#555577', padding: 40, fontSize: 13 }}>
                {t('dashboard.noTxHistory')}<br />
                <Link href="/money" style={{ color: '#6366f1' }}>{t('dashboard.addTransactions')}</Link>
              </div>
            )}
          </div>

          {/* Spending donut */}
          <div style={{ ...card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f5', margin: 0 }}>{t('dashboard.thisMonthSpending')}</h3>
              {summary && <span style={{ fontSize: 12, color: '#9999bb' }}>{t('dashboard.totalLabel')} {fmt(summary.total_expenses)}</span>}
            </div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8 }} formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: '#555577', padding: 40, fontSize: 13 }}>
                {t('dashboard.noExpensesMonth')}<br />
                <Link href="/money" style={{ color: '#6366f1' }}>{t('dashboard.logExpenses')}</Link>
              </div>
            )}
            {pieData.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 8 }}>
                {pieData.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.fill, flexShrink: 0 }} />
                    <span style={{ color: '#9999bb' }}>{d.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 4: Budget Overview + Goals snapshot ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
          {/* Budget bars */}
          <div style={{ ...card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f5', margin: 0 }}>{t('dashboard.budgetOverview')}</h3>
              <Link href="/plan" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>{t('common.manage')}</Link>
            </div>
            {budgets.length > 0 ? budgets.slice(0, 5).map(b => {
              const col = b.pct_used > 100 ? '#ef4444' : b.pct_used >= 80 ? '#eab308' : '#22c55e';
              return (
                <div key={b.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#ccccdd' }}>{b.category}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: col }}>{b.pct_used.toFixed(0)}%</span>
                  </div>
                  <div style={{ background: '#1e1e2e', borderRadius: 6, height: 7 }}>
                    <div style={{ width: `${Math.min(b.pct_used, 100)}%`, height: '100%', borderRadius: 6, background: col }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: '#555577' }}>{fmt(b.spent_this_month)} {t('dashboard.spentLabel')}</span>
                    <span style={{ fontSize: 10, color: '#555577' }}>{fmt(b.limit_amount)} {t('dashboard.limitLabel')}</span>
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', color: '#555577', padding: 30, fontSize: 13 }}>
                {t('dashboard.noBudgets')}<br />
                <Link href="/plan" style={{ color: '#6366f1' }}>{t('dashboard.createBudgets')}</Link>
              </div>
            )}
          </div>

          {/* Goals */}
          <div style={{ ...card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f5', margin: 0 }}>{t('dashboard.goals')}</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {completedGoals.length > 0 && (
                  <span style={{ fontSize: 12, color: '#22c55e' }}>✓ {completedGoals.length} {t('dashboard.completedLabel')}</span>
                )}
                <Link href="/goals" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>{t('common.manage')}</Link>
              </div>
            </div>
            {activeGoals.length > 0 ? activeGoals.slice(0, 4).map(g => (
              <div key={g.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#f0f0f5', fontWeight: 600 }}>{g.name}</span>
                  <span style={{ fontSize: 12, color: '#6366f1' }}>{g.progress_pct.toFixed(0)}%</span>
                </div>
                <div style={{ background: '#1e1e2e', borderRadius: 6, height: 7 }}>
                  <div style={{
                    width: `${Math.min(g.progress_pct, 100)}%`, height: '100%', borderRadius: 6,
                    background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span style={{ fontSize: 10, color: '#555577' }}>{fmt(g.current_amount)}</span>
                  <span style={{ fontSize: 10, color: '#555577' }}>
                    {fmt(g.target_amount)}{g.months_to_goal ? ` · ${g.months_to_goal}mo` : ''}
                  </span>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', color: '#555577', padding: 30, fontSize: 13 }}>
                {t('dashboard.noActiveGoals')}<br />
                <Link href="/goals" style={{ color: '#6366f1' }}>{t('dashboard.createGoal')}</Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Row 5: Net Worth History + Recent Transactions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
          {/* Net Worth mini chart */}
          <div style={{ ...card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f5', margin: 0 }}>{t('dashboard.nwHistory')}</h3>
              <div style={{ textAlign: 'right' }}>
                {nwHistory && nwHistory.change_30d !== 0 && (
                  <span style={{ fontSize: 12, color: nwHistory.change_30d >= 0 ? '#22c55e' : '#ef4444', display: 'block' }}>
                    {nwHistory.change_30d >= 0 ? '+' : ''}{fmt(nwHistory.change_30d)} (30d)
                  </span>
                )}
                <Link href="/wealth" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>View →</Link>
              </div>
            </div>
            {nwChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={170}>
                <AreaChart data={nwChartData}>
                  <defs>
                    <linearGradient id="nwMiniGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                  <XAxis dataKey="date" stroke="#555577" tick={{ fill: '#9999bb', fontSize: 10 }} />
                  <YAxis stroke="#555577" tick={{ fill: '#9999bb', fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8 }} formatter={(v: number) => fmt(v)} />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#nwMiniGrad)" strokeWidth={2} name="Net Worth" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: '#555577', padding: 30, fontSize: 13 }}>
                {t('dashboard.logSnapshots')}<br />
                <Link href="/wealth" style={{ color: '#6366f1' }}>{t('dashboard.addSnapshot')}</Link>
              </div>
            )}
          </div>

          {/* Recent transactions */}
          <div style={{ ...card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f5', margin: 0 }}>{t('dashboard.recentTx')}</h3>
              <Link href="/money" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>{t('common.viewAll')}</Link>
            </div>
            {recent.length > 0 ? recent.map(t => (
              <div key={t.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 0', borderBottom: '1px solid #1e1e2e',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: '#f0f0f5', fontWeight: 500 }}>{t.description || t.category}</div>
                  <div style={{ fontSize: 11, color: '#555577', marginTop: 2 }}>{t.category} · {t.date}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: t.transaction_type === 'income' ? '#22c55e' : '#ef4444' }}>
                  {t.transaction_type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', color: '#555577', padding: 30, fontSize: 13 }}>
                {t('dashboard.noTxYet')}<br />
                <Link href="/money" style={{ color: '#6366f1' }}>{t('dashboard.logFirst')}</Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Row 6: Projection Chart ── */}
        <div style={{ ...card }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f5', margin: 0 }}>{t('dashboard.projection')}</h3>
            <Link href="/simulator" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>{t('dashboard.runScenarios')}</Link>
          </div>
          <ProjectionChart data={data.projections} />
        </div>

      </div>
    </ProtectedRoute>
  );
}
