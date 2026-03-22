'use client';
import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getTransactions, createTransaction, deleteTransaction, getMonthSummary, getSpendingTrends } from '@/lib/api';
import type { Transaction, MonthSummary, TrendPoint } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const CATEGORIES = [
  '🏠 Housing', '🍔 Food & Dining', '🚗 Transport', '🎮 Entertainment',
  '💊 Healthcare', '📚 Education', '🛍️ Shopping', '💡 Utilities',
  '📱 Subscriptions', '✈️ Travel', '💅 Personal Care', '💰 Other',
];

const CHART_COLORS = ['#7c3aed','#10b981','#f59e0b','#f43f5e','#3b82f6','#a855f7','#ec4899','#14b8a6','#f97316','#84cc16','#06b6d4','#6366f1'];

function fmt(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }); }

function nowMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const tooltipStyle = { backgroundColor: '#1a1a24', border: '1px solid #2a2a38', borderRadius: 10, fontSize: 12 };

export default function ExpensesPage() {
  const [month, setMonth]           = useState(nowMonth());
  const [summary, setSummary]       = useState<MonthSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trends, setTrends]         = useState<TrendPoint[]>([]);
  const [showForm, setShowForm]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [form, setForm] = useState({
    amount: '', category: CATEGORIES[1], description: '', date: new Date().toISOString().split('T')[0],
  });

  const load = useCallback(async () => {
    const [s, txs, tr] = await Promise.all([
      getMonthSummary(month),
      getTransactions({ transaction_type: 'expense', month }),
      getSpendingTrends(6),
    ]);
    setSummary(s);
    setTransactions(txs);
    setTrends(tr);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createTransaction({
        amount: parseFloat(form.amount),
        category: form.category.replace(/^[^\s]+ /, ''),  // strip emoji prefix
        description: form.description || undefined,
        transaction_type: 'expense',
        date: form.date ? new Date(form.date).toISOString() : undefined,
      });
      setForm({ amount: '', category: CATEGORIES[1], description: '', date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      await load();
    } finally { setLoading(false); }
  }

  async function handleDelete(id: number) {
    await deleteTransaction(id);
    await load();
  }

  const pieData = summary?.by_category.map((c, i) => ({ name: c.category, value: c.total, color: CHART_COLORS[i % CHART_COLORS.length] })) ?? [];

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f0f5' }}>Expense Tracker</h1>
            <p style={{ fontSize: '13px', color: '#60607a', marginTop: '2px' }}>Log and categorize your spending</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="month"
              className="input"
              style={{ width: 'auto', padding: '8px 12px' }}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn-secondary' : 'btn-primary'}>
              {showForm ? '✕ Cancel' : '+ Add Expense'}
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>New Expense</h2>
            <form onSubmit={handleAdd}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <label className="label">Amount ($)</label>
                  <input type="number" step="0.01" min="0.01" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ cursor: 'pointer' }}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="label">Description (opt.)</label>
                  <input type="text" className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Grocery run" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Adding…' : '+ Add Expense'}
              </button>
            </form>
          </div>
        )}

        {/* Summary cards */}
        {summary && (
          <div className="grid-3" style={{ marginBottom: '20px' }}>
            {[
              { label: 'Total Spent',  value: fmt(summary.total_expenses), color: '#f87171', bg: '#241414', border: '#4a2020' },
              { label: 'Total Income', value: fmt(summary.total_income),   color: '#34d399', bg: '#0f2420', border: '#1a4035' },
              { label: 'Net',          value: fmt(summary.net),            color: summary.net >= 0 ? '#34d399' : '#f87171', bg: summary.net >= 0 ? '#0f2420' : '#241414', border: summary.net >= 0 ? '#1a4035' : '#4a2020' },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '14px', padding: '16px 18px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#60607a', marginBottom: '6px' }}>{label}</p>
                <p style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '20px' }}>

          {/* Pie: spending by category */}
          {pieData.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#d0d0e0', marginBottom: '4px' }}>Spending by Category</h3>
              <p style={{ fontSize: '12px', color: '#50505e', marginBottom: '12px' }}>{month}</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), '']} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#60607a' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bar: 6-month trend */}
          {trends.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#d0d0e0', marginBottom: '4px' }}>6-Month Trend</h3>
              <p style={{ fontSize: '12px', color: '#50505e', marginBottom: '12px' }}>Income vs expenses</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={trends} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22223a" vertical={false} />
                  <XAxis dataKey="month" stroke="#30304a" tick={{ fill: '#50505e', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis stroke="#30304a" tick={{ fill: '#50505e', fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), '']} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#60607a' }} />
                  <Bar dataKey="income"   name="Income"   fill="#10b981" radius={[4,4,0,0]} maxBarSize={30} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4,4,0,0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category breakdown table */}
        {summary && summary.by_category.length > 0 && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#d0d0e0', marginBottom: '16px' }}>Category Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {summary.by_category.map((cat, i) => {
                const pct = summary.total_expenses > 0 ? (cat.total / summary.total_expenses) * 100 : 0;
                return (
                  <div key={cat.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '13px', color: '#c0c0d0', fontWeight: 500 }}>{cat.category}</span>
                      <span style={{ fontSize: '13px', color: '#a0a0b8' }}>{fmt(cat.total)} <span style={{ color: '#50505e' }}>· {cat.count} items · {pct.toFixed(0)}%</span></span>
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: '#22223a', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: CHART_COLORS[i % CHART_COLORS.length], borderRadius: '4px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transaction list */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#d0d0e0', marginBottom: '16px' }}>
            Transactions · {transactions.length}
          </h3>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#50505e', fontSize: '13px' }}>
              No expenses logged for {month}. Add your first one above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transactions.map((tx) => (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#12121a', borderRadius: '10px', border: '1px solid #22223a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#1e1430', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                      {CATEGORIES.find(c => c.includes(tx.category))?.split(' ')[0] ?? '💰'}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#d0d0e0' }}>{tx.category}</p>
                      {tx.description && <p style={{ fontSize: '11px', color: '#50505e', marginTop: '1px' }}>{tx.description}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#f87171' }}>-{fmt(tx.amount)}</p>
                      <p style={{ fontSize: '11px', color: '#50505e' }}>{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <button onClick={() => handleDelete(tx.id)} style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f87171', borderRadius: '7px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
