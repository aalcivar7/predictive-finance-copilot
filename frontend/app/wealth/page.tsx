'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  getHealthScore, getRetirement, getTaxEstimate,
  getNetWorthHistory, addNetWorthSnapshot, deleteNetWorthSnapshot,
} from '@/lib/api';
import type { HealthScore, RetirementProjection, TaxEstimate, NetWorthHistoryOut, NetWorthSnapshotCreate } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

// ── Health Score Ring ──────────────────────────────────────────────────────────
function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const colorMap: Record<string, string> = { green: '#22c55e', yellow: '#eab308', orange: '#f97316', red: '#ef4444' };
  const stroke = colorMap[color] ?? '#6366f1';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={170} height={170} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={85} cy={85} r={r} fill="none" stroke="#1e1e2e" strokeWidth={14} />
        <circle
          cx={85} cy={85} r={r} fill="none"
          stroke={stroke} strokeWidth={14}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div style={{ marginTop: -140, textAlign: 'center', zIndex: 1, position: 'relative' }}>
        <div style={{ fontSize: 38, fontWeight: 800, color: stroke }}>{score}</div>
        <div style={{ fontSize: 12, color: '#9999bb', marginTop: 2 }}>out of 100</div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: stroke, marginTop: 60 }}>{label}</div>
    </div>
  );
}

// ── Sub-score bar ──────────────────────────────────────────────────────────────
function SubBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pctVal = (value / max) * 100;
  const col = pctVal >= 80 ? '#22c55e' : pctVal >= 50 ? '#eab308' : '#ef4444';
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#ccccdd' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: col }}>{value}/{max}</span>
      </div>
      <div style={{ background: '#1e1e2e', borderRadius: 6, height: 8 }}>
        <div style={{ width: `${pctVal}%`, height: '100%', borderRadius: 6, background: col, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

const TABS = ['Health', 'Net Worth', 'Retirement', 'Taxes'] as const;
type Tab = typeof TABS[number];

export default function WealthPage() {
  const [tab, setTab] = useState<Tab>('Health');
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [nwHistory, setNwHistory] = useState<NetWorthHistoryOut | null>(null);
  const [retirement, setRetirement] = useState<RetirementProjection | null>(null);
  const [tax, setTax] = useState<TaxEstimate | null>(null);
  const [currentAge, setCurrentAge] = useState(30);
  const [filingStatus, setFilingStatus] = useState<'single' | 'married_jointly'>('single');
  const [loading, setLoading] = useState(true);
  const [retLoading, setRetLoading] = useState(false);
  const [taxLoading, setTaxLoading] = useState(false);

  // Net worth snapshot form
  const [showNwForm, setShowNwForm] = useState(false);
  const [nwAssets, setNwAssets] = useState('');
  const [nwLiab, setNwLiab] = useState('');
  const [nwDate, setNwDate] = useState(new Date().toISOString().slice(0, 10));
  const [nwSaving, setNwSaving] = useState(false);

  const loadBase = useCallback(async () => {
    setLoading(true);
    try {
      const [h, nw] = await Promise.all([getHealthScore(), getNetWorthHistory()]);
      setHealth(h);
      setNwHistory(nw);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const loadRetirement = useCallback(async () => {
    setRetLoading(true);
    try { setRetirement(await getRetirement(currentAge)); } catch { /* ignore */ }
    setRetLoading(false);
  }, [currentAge]);

  const loadTax = useCallback(async () => {
    setTaxLoading(true);
    try { setTax(await getTaxEstimate(filingStatus)); } catch { /* ignore */ }
    setTaxLoading(false);
  }, [filingStatus]);

  useEffect(() => { loadBase(); }, [loadBase]);
  useEffect(() => { if (tab === 'Retirement') loadRetirement(); }, [tab, loadRetirement]);
  useEffect(() => { if (tab === 'Taxes') loadTax(); }, [tab, loadTax]);

  const handleAddSnapshot = async () => {
    if (!nwAssets || !nwLiab) return;
    setNwSaving(true);
    try {
      await addNetWorthSnapshot({ assets: +nwAssets, liabilities: +nwLiab, snapshot_date: nwDate });
      setNwAssets(''); setNwLiab('');
      setShowNwForm(false);
      const fresh = await getNetWorthHistory();
      setNwHistory(fresh);
    } catch { /* ignore */ }
    setNwSaving(false);
  };

  const handleDeleteSnapshot = async (id: number) => {
    await deleteNetWorthSnapshot(id);
    const fresh = await getNetWorthHistory();
    setNwHistory(fresh);
  };

  const card: React.CSSProperties = {
    background: '#1a1a24', borderRadius: 16, padding: '24px',
    border: '1px solid #2a2a3a',
  };

  const snapshots = nwHistory?.snapshots ?? [];
  const chartData = [...snapshots].reverse().map(s => ({
    date: s.snapshot_date.slice(0, 7),
    'Net Worth': s.net_worth,
    Assets: s.assets,
    Liabilities: s.liabilities,
  }));

  return (
    <ProtectedRoute>
    <div style={{ padding: '0 0 40px' }}>
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ fontSize: 16, color: '#9999bb' }}>Loading wealth data…</div>
        </div>
      )}
      {!loading && <>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f0f0f5', margin: 0 }}>Wealth & Wellness</h1>
        <p style={{ color: '#9999bb', marginTop: 6, fontSize: 14 }}>Your complete financial health picture</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '9px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            background: tab === t ? '#6366f1' : '#1a1a24',
            color: tab === t ? '#fff' : '#9999bb',
            transition: 'all 0.2s',
          }}>{t}</button>
        ))}
      </div>

      {/* ── HEALTH TAB ── */}
      {tab === 'Health' && health && (
        <div>
          {/* Score hero */}
          <div style={{ ...card, display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            <ScoreRing score={health.score} label={health.label} color={health.color} />
            <div style={{ flex: 1, minWidth: 260 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0f0f5', marginBottom: 6 }}>Financial Health Score</h2>
              <p style={{ color: '#9999bb', fontSize: 13, marginBottom: 20 }}>
                Scored across 4 key pillars, each worth up to 25 points.
              </p>
              <SubBar label="Savings Rate" value={health.savings_score} />
              <SubBar label="Debt-to-Income Ratio" value={health.debt_score} />
              <SubBar label="Emergency Fund Coverage" value={health.emergency_score} />
              <SubBar label="Budget Adherence" value={health.budget_score} />
            </div>
          </div>

          {/* Score breakdown cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { label: 'Savings Score', val: health.savings_score, tip: 'Based on your monthly savings rate vs income.' },
              { label: 'Debt Score', val: health.debt_score, tip: 'Lower debt-to-income earns higher points.' },
              { label: 'Emergency Fund', val: health.emergency_score, tip: '3–6 months expenses = full score.' },
              { label: 'Budget Score', val: health.budget_score, tip: 'Staying within budgets earns full points.' },
            ].map(({ label, val, tip }) => {
              const col = val >= 20 ? '#22c55e' : val >= 12 ? '#eab308' : '#ef4444';
              return (
                <div key={label} style={{ ...card, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: col }}>{val}<span style={{ fontSize: 16, color: '#666' }}>/25</span></div>
                  <div style={{ fontWeight: 600, color: '#f0f0f5', marginTop: 4, marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#9999bb' }}>{tip}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── NET WORTH TAB ── */}
      {tab === 'Net Worth' && (
        <div>
          {/* Summary cards */}
          {nwHistory && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: '30-Day Change', val: nwHistory.change_30d, signed: true },
                { label: 'YTD Change', val: nwHistory.change_ytd, signed: true },
                { label: 'Latest Snapshot', val: snapshots[0]?.net_worth ?? 0, signed: false },
                { label: 'Total Snapshots', val: snapshots.length, signed: false, isMoney: false },
              ].map(({ label, val, signed, isMoney = true }) => {
                const col = signed ? (val >= 0 ? '#22c55e' : '#ef4444') : '#6366f1';
                return (
                  <div key={label} style={{ ...card }}>
                    <div style={{ fontSize: 11, color: '#9999bb', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: col }}>
                      {isMoney ? (signed && val > 0 ? '+' : '') + fmt(val) : val}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chart */}
          {chartData.length > 1 && (
            <div style={{ ...card, marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5', marginBottom: 20 }}>Net Worth Over Time</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                  <XAxis dataKey="date" stroke="#555577" tick={{ fill: '#9999bb', fontSize: 11 }} />
                  <YAxis stroke="#555577" tick={{ fill: '#9999bb', fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8 }} formatter={(v: number) => fmt(v)} />
                  <Area type="monotone" dataKey="Net Worth" stroke="#6366f1" fill="url(#nwGrad)" strokeWidth={2} />
                  <Line type="monotone" dataKey="Assets" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="Liabilities" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Add snapshot */}
          <div style={{ ...card, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showNwForm ? 20 : 0 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5', margin: 0 }}>Snapshots</h3>
              <button onClick={() => setShowNwForm(v => !v)} style={{
                background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8,
                padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>{showNwForm ? 'Cancel' : '+ Add Snapshot'}</button>
            </div>
            {showNwForm && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#9999bb', display: 'block', marginBottom: 4 }}>Total Assets ($)</label>
                  <input className="input" type="number" value={nwAssets} onChange={e => setNwAssets(e.target.value)} placeholder="250000" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#9999bb', display: 'block', marginBottom: 4 }}>Total Liabilities ($)</label>
                  <input className="input" type="number" value={nwLiab} onChange={e => setNwLiab(e.target.value)} placeholder="80000" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#9999bb', display: 'block', marginBottom: 4 }}>Date</label>
                  <input className="input" type="date" value={nwDate} onChange={e => setNwDate(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={handleAddSnapshot} disabled={nwSaving} style={{
                    width: '100%', background: '#22c55e', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>{nwSaving ? 'Saving…' : 'Save'}</button>
                </div>
              </div>
            )}
          </div>

          {/* Snapshot table */}
          {snapshots.length > 0 && (
            <div style={{ ...card }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                    {['Date', 'Assets', 'Liabilities', 'Net Worth', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#9999bb', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #16161e' }}>
                      <td style={{ padding: '10px 12px', color: '#ccccdd' }}>{s.snapshot_date}</td>
                      <td style={{ padding: '10px 12px', color: '#22c55e' }}>{fmt(s.assets)}</td>
                      <td style={{ padding: '10px 12px', color: '#ef4444' }}>{fmt(s.liabilities)}</td>
                      <td style={{ padding: '10px 12px', color: '#6366f1', fontWeight: 700 }}>{fmt(s.net_worth)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => handleDeleteSnapshot(s.id)} style={{
                          background: 'transparent', border: '1px solid #3a2a2a', color: '#ef4444',
                          borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                        }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {snapshots.length === 0 && !showNwForm && (
            <div style={{ textAlign: 'center', color: '#9999bb', padding: 40 }}>No snapshots yet. Add your first one above.</div>
          )}
        </div>
      )}

      {/* ── RETIREMENT TAB ── */}
      {tab === 'Retirement' && (
        <div>
          {/* Controls */}
          <div style={{ ...card, marginBottom: 24, display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, color: '#9999bb', display: 'block', marginBottom: 6 }}>Your Current Age</label>
              <input
                className="input" type="number" min={18} max={64} value={currentAge}
                onChange={e => setCurrentAge(+e.target.value)}
                style={{ width: 120 }}
              />
            </div>
            <button onClick={loadRetirement} disabled={retLoading} style={{
              background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>{retLoading ? 'Calculating…' : 'Recalculate'}</button>
          </div>

          {retirement && !retLoading && (
            <>
              {/* On-track banner */}
              <div style={{
                ...card, marginBottom: 24,
                background: retirement.on_track ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${retirement.on_track ? '#22c55e' : '#ef4444'}33`,
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{ fontSize: 40 }}>{retirement.on_track ? '✅' : '⚠️'}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: retirement.on_track ? '#22c55e' : '#ef4444' }}>
                    {retirement.on_track ? 'You\'re on track for retirement!' : 'Retirement gap detected'}
                  </div>
                  <div style={{ color: '#9999bb', fontSize: 13, marginTop: 4 }}>
                    {retirement.on_track
                      ? `At current savings you'll exceed your target nest egg by ${fmt(retirement.projected_at_65 - retirement.target_nest_egg)}.`
                      : `You need ${fmt(retirement.monthly_needed - 0)}/mo more to close a ${fmt(retirement.shortfall)} shortfall.`}
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Target Nest Egg', val: fmt(retirement.target_nest_egg), color: '#6366f1' },
                  { label: 'Projected at 65', val: fmt(retirement.projected_at_65), color: retirement.on_track ? '#22c55e' : '#f97316' },
                  { label: 'Years to Retirement', val: `${retirement.years_to_retirement} yrs`, color: '#eab308' },
                  { label: 'Assumed Return', val: pct(retirement.annual_return_used * 100), color: '#06b6d4' },
                  { label: 'Monthly Needed', val: fmt(retirement.monthly_needed), color: '#a78bfa' },
                  { label: 'Shortfall', val: retirement.shortfall > 0 ? fmt(retirement.shortfall) : 'None', color: retirement.shortfall > 0 ? '#ef4444' : '#22c55e' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ ...card }}>
                    <div style={{ fontSize: 11, color: '#9999bb', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar: projected vs target */}
              <div style={{ ...card }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f5', marginBottom: 16 }}>Retirement Progress</h3>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#9999bb' }}>Projected vs Target</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>
                    {Math.min((retirement.projected_at_65 / retirement.target_nest_egg) * 100, 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{ background: '#1e1e2e', borderRadius: 8, height: 12 }}>
                  <div style={{
                    width: `${Math.min((retirement.projected_at_65 / retirement.target_nest_egg) * 100, 100)}%`,
                    height: '100%', borderRadius: 8,
                    background: 'linear-gradient(90deg, #6366f1, #22c55e)',
                    transition: 'width 1s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: '#555577' }}>$0</span>
                  <span style={{ fontSize: 11, color: '#555577' }}>{fmt(retirement.target_nest_egg)}</span>
                </div>
                <p style={{ fontSize: 12, color: '#666688', marginTop: 16, lineHeight: 1.6 }}>
                  * Based on 4% safe withdrawal rule targeting 80% income replacement. Return rate: {pct(retirement.annual_return_used * 100)} annually.
                </p>
              </div>
            </>
          )}
          {retLoading && (
            <div style={{ textAlign: 'center', padding: 60, color: '#9999bb' }}>Calculating your retirement projection…</div>
          )}
        </div>
      )}

      {/* ── TAXES TAB ── */}
      {tab === 'Taxes' && (
        <div>
          {/* Controls */}
          <div style={{ ...card, marginBottom: 24, display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, color: '#9999bb', display: 'block', marginBottom: 6 }}>Filing Status</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['single', 'married_jointly'] as const).map(s => (
                  <button key={s} onClick={() => setFilingStatus(s)} style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: filingStatus === s ? '#6366f1' : '#2a2a3a',
                    color: filingStatus === s ? '#fff' : '#9999bb',
                  }}>{s === 'single' ? 'Single' : 'Married (Joint)'}</button>
                ))}
              </div>
            </div>
            <button onClick={loadTax} disabled={taxLoading} style={{
              background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>{taxLoading ? 'Calculating…' : 'Recalculate'}</button>
          </div>

          {tax && !taxLoading && (
            <>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Gross Annual Income', val: fmt(tax.gross_annual), color: '#22c55e' },
                  { label: 'Standard Deduction', val: fmt(tax.standard_deduction), color: '#6366f1' },
                  { label: 'Taxable Income', val: fmt(tax.taxable_income), color: '#f0f0f5' },
                  { label: 'Federal Tax Owed', val: fmt(tax.federal_tax), color: '#ef4444' },
                  { label: 'Effective Rate', val: pct(tax.effective_rate * 100), color: '#eab308' },
                  { label: 'Marginal Rate', val: pct(tax.marginal_rate * 100), color: '#f97316' },
                  { label: 'Monthly Take-Home', val: fmt(tax.estimated_monthly_takehome), color: '#22c55e' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ ...card }}>
                    <div style={{ fontSize: 11, color: '#9999bb', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Bracket breakdown */}
              <div style={{ ...card, marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5', marginBottom: 20 }}>Tax Bracket Breakdown</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                  <div>
                    {tax.bracket_breakdown.map((b, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: '#ccccdd' }}>{b.bracket_label} ({pct(b.rate * 100)})</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>{fmt(b.tax_owed)}</span>
                        </div>
                        <div style={{ background: '#1e1e2e', borderRadius: 4, height: 6 }}>
                          <div style={{
                            width: `${Math.min((b.income_in_bracket / tax.gross_annual) * 100, 100)}%`,
                            height: '100%', borderRadius: 4,
                            background: `hsl(${240 + i * 30}, 70%, 60%)`,
                          }} />
                        </div>
                        <div style={{ fontSize: 11, color: '#555577', marginTop: 2 }}>Income in bracket: {fmt(b.income_in_bracket)}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={tax.bracket_breakdown.filter(b => b.tax_owed > 0)}
                          dataKey="tax_owed" nameKey="bracket_label"
                          cx="50%" cy="50%" outerRadius={90}
                          label={({ bracket_label, rate }) => `${pct(rate * 100)}`}
                        >
                          {tax.bracket_breakdown.filter(b => b.tax_owed > 0).map((_, i) => (
                            <Cell key={i} fill={`hsl(${240 + i * 30}, 70%, 60%)`} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8 }} formatter={(v: number) => fmt(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {tax.note && (
                <div style={{ ...card, background: 'rgba(99,102,241,0.05)', border: '1px solid #6366f133' }}>
                  <p style={{ fontSize: 13, color: '#9999bb', margin: 0, lineHeight: 1.7 }}>ℹ️ {tax.note}</p>
                </div>
              )}
            </>
          )}
          {taxLoading && (
            <div style={{ textAlign: 'center', padding: 60, color: '#9999bb' }}>Calculating your tax estimate…</div>
          )}
        </div>
      )}
      </>}
    </div>
    </ProtectedRoute>
  );
}
