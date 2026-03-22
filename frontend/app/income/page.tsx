'use client';
import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getIncomeStreams, createIncomeStream, deleteIncomeStream, updateIncomeStream, getSpendingTrends } from '@/lib/api';
import type { IncomeStreamsSummary, TrendPoint } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

function fmt(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }); }

const TYPE_CONFIG = {
  active:     { label: 'Active Income',     emoji: '💼', color: '#a78bfa', bg: '#1e1430', border: '#2d1f55' },
  passive:    { label: 'Passive Income',    emoji: '🏠', color: '#34d399', bg: '#0f2420', border: '#1a4035' },
  investment: { label: 'Investment Income', emoji: '📈', color: '#fbbf24', bg: '#241e10', border: '#4a3a18' },
};

const tooltipStyle = { backgroundColor: '#1a1a24', border: '1px solid #2a2a38', borderRadius: 10, fontSize: 12 };

export default function IncomePage() {
  const [summary, setSummary] = useState<IncomeStreamsSummary | null>(null);
  const [trends, setTrends]   = useState<TrendPoint[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', stream_type: 'active' as 'active' | 'passive' | 'investment' });

  const load = useCallback(async () => {
    const [s, tr] = await Promise.all([getIncomeStreams(), getSpendingTrends(6)]);
    setSummary(s);
    setTrends(tr);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createIncomeStream({ name: form.name, amount: parseFloat(form.amount), stream_type: form.stream_type });
      setForm({ name: '', amount: '', stream_type: 'active' });
      setShowForm(false);
      await load();
    } finally { setLoading(false); }
  }

  async function handleToggle(id: number, is_active: boolean) {
    await updateIncomeStream(id, { is_active: !is_active });
    await load();
  }

  async function handleDelete(id: number) {
    await deleteIncomeStream(id);
    await load();
  }

  const grouped = summary ? {
    active:     summary.streams.filter((s) => s.stream_type === 'active'),
    passive:    summary.streams.filter((s) => s.stream_type === 'passive'),
    investment: summary.streams.filter((s) => s.stream_type === 'investment'),
  } : null;

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f0f5' }}>Income Streams</h1>
            <p style={{ fontSize: '13px', color: '#60607a', marginTop: '2px' }}>Track all your sources of income</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn-secondary' : 'btn-primary'}>
            {showForm ? '✕ Cancel' : '+ Add Stream'}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>New Income Stream</h2>
            <form onSubmit={handleAdd}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <label className="label">Name</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Salary, Freelance" />
                </div>
                <div>
                  <label className="label">Monthly Amount ($)</label>
                  <input type="number" step="0.01" min="0" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="3000" />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.stream_type} onChange={(e) => setForm({ ...form, stream_type: e.target.value as typeof form.stream_type })} style={{ cursor: 'pointer' }}>
                    <option value="active">💼 Active (Salary, Freelance)</option>
                    <option value="passive">🏠 Passive (Rental, Royalties)</option>
                    <option value="investment">📈 Investment (Dividends, ETFs)</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Adding…' : '+ Add Stream'}
              </button>
            </form>
          </div>
        )}

        {/* Total cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Total Monthly', value: fmt(summary.total_monthly),    color: '#a78bfa', bg: '#1e1430', border: '#2d1f55' },
              { label: 'Active Income', value: fmt(summary.total_active),     color: '#a78bfa', bg: '#1e1430', border: '#2d1f55' },
              { label: 'Passive Income',value: fmt(summary.total_passive),    color: '#34d399', bg: '#0f2420', border: '#1a4035' },
              { label: 'Investments',   value: fmt(summary.total_investment), color: '#fbbf24', bg: '#241e10', border: '#4a3a18' },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '14px', padding: '16px 18px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#60607a', marginBottom: '6px' }}>{label}</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* 6-month trend chart */}
        {trends.length > 0 && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#d0d0e0', marginBottom: '4px' }}>6-Month Income vs Expenses</h3>
            <p style={{ fontSize: '12px', color: '#50505e', marginBottom: '16px' }}>Month-to-month comparison</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22223a" />
                <XAxis dataKey="month" stroke="#30304a" tick={{ fill: '#50505e', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#30304a" tick={{ fill: '#50505e', fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), '']} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#60607a' }} />
                <Line type="monotone" dataKey="income"   name="Income"   stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2.5} dot={{ fill: '#f43f5e', r: 4 }} />
                <Line type="monotone" dataKey="net"      name="Net"      stroke="#a78bfa" strokeWidth={2}   dot={{ fill: '#a78bfa', r: 3 }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Income streams by type */}
        {summary && summary.streams.length === 0 && !showForm && (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>💼</div>
            <p style={{ color: '#c0c0d0', fontWeight: 600, marginBottom: '6px' }}>No income streams yet</p>
            <p style={{ color: '#50505e', fontSize: '13px', marginBottom: '20px' }}>Add your salary, freelance work, rental income, and more.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">+ Add Income Stream</button>
          </div>
        )}

        {grouped && Object.entries(grouped).map(([type, streams]) => {
          if (streams.length === 0) return null;
          const cfg = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
          const typeTotal = streams.filter(s => s.is_active).reduce((sum, s) => sum + s.amount, 0);
          return (
            <div key={type} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#50505e' }}>
                  {cfg.emoji} {cfg.label} · {streams.length}
                </p>
                <span style={{ fontSize: '13px', fontWeight: 600, color: cfg.color }}>{fmt(typeTotal)}/mo</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {streams.map((s) => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: '12px', border: `1px solid ${s.is_active ? cfg.border : '#22223a'}`,
                    backgroundColor: s.is_active ? cfg.bg : '#12121a',
                    opacity: s.is_active ? 1 : 0.55, transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{cfg.emoji}</span>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: s.is_active ? '#e0e0f0' : '#80809a' }}>{s.name}</p>
                        <p style={{ fontSize: '11px', color: '#50505e', marginTop: '1px', textTransform: 'capitalize' }}>{s.stream_type} income</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <p style={{ fontSize: '16px', fontWeight: 700, color: s.is_active ? cfg.color : '#50505e' }}>{fmt(s.amount)}<span style={{ fontSize: '11px', fontWeight: 400, color: '#50505e' }}>/mo</span></p>
                      <button
                        onClick={() => handleToggle(s.id, s.is_active)}
                        style={{ background: s.is_active ? 'rgba(16,185,129,0.1)' : '#22223a', border: `1px solid ${s.is_active ? 'rgba(16,185,129,0.25)' : '#3a3a50'}`, color: s.is_active ? '#34d399' : '#60607a', borderRadius: '7px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      >
                        {s.is_active ? 'Active' : 'Paused'}
                      </button>
                      <button onClick={() => handleDelete(s.id)} style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f87171', borderRadius: '7px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </ProtectedRoute>
  );
}
