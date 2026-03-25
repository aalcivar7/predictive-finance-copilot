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
import { useLang } from '@/lib/lang-context';

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
  const { t } = useLang();
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
          <div style={{ fontSize: 16, color: '#9999bb' }}>{t('wealth.loading')}</div>
        </div>
      )}
      {!loading && <>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f0f0f5', margin: 0 }}>{t('wealth.title')}</h1>
        <p style={{ color: '#9999bb', marginTop: 6, fontSize: 14 }}>{t('wealth.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map(tabKey => {
          const tabLabels: Record<Tab, string> = {
            Health: t('wealth.tabHealth'),
            'Net Worth': t('wealth.tabNetWorth'),
            Retirement: t('wealth.tabRetirement'),
            Taxes: t('wealth.tabTaxes'),
          };
          return (
            <button key={tabKey} onClick={() => setTab(tabKey)} style={{
              padding: '9px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              background: tab === tabKey ? '#6366f1' : '#1a1a24',
              color: tab === tabKey ? '#fff' : '#9999bb',
              transition: 'all 0.2s',
            }}>{tabLabels[tabKey]}</button>
          );
        })}
      </div>

      {/* ── HEALTH TAB ── */}
      {tab === 'Health' && health && (
        <div>
          {/* Score hero */}
          <div style={{ ...card, display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            <ScoreRing score={health.score} label={health.label} color={health.color} />
            <div style={{ flex: 1, minWidth: 260 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0f0f5', marginBottom: 6 }}>{t('wealth.healthScoreTitle')}</h2>
              <p style={{ color: '#9999bb', fontSize: 13, marginBottom: 20 }}>
                {t('wealth.healthScoreSubtitle')}
              </p>
              <SubBar label={t('wealth.savingsRate')} value={health.savings_score} />
              <SubBar label={t('wealth.debtRatio')} value={health.debt_score} />
              <SubBar label={t('wealth.emergencyFund')} value={health.emergency_score} />
              <SubBar label={t('wealth.budgetAdherence')} value={health.budget_score} />
            </div>
          </div>

          {/* Score breakdown cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { label: t('wealth.savingsScore'), val: health.savings_score, tip: t('wealth.savingsScoreTip') },
              { label: t('wealth.debtScore'), val: health.debt_score, tip: t('wealth.debtScoreTip') },
              { label: t('wealth.emergencyScore'), val: health.emergency_score, tip: t('wealth.emergencyScoreTip') },
              { label: t('wealth.budgetScore'), val: health.budget_score, tip: t('wealth.budgetScoreTip') },
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
                { label: t('wealth.change30d'), val: nwHistory.change_30d, signed: true },
                { label: t('wealth.changeYTD'), val: nwHistory.change_ytd, signed: true },
                { label: t('wealth.latestSnapshot'), val: snapshots[0]?.net_worth ?? 0, signed: false },
                { label: t('wealth.totalSnapshots'), val: snapshots.length, signed: false, isMoney: false },
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
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5', marginBottom: 20 }}>{t('wealth.nwOverTime')}</h3>
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
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5', margin: 0 }}>{t('wealth.snapshots')}</h3>
              <button onClick={() => setShowNwForm(v => !v)} style={{
                background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8,
                padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>{showNwForm ? t('wealth.cancelSnapshot') : t('wealth.addSnapshot')}</button>
            </div>
            {showNwForm && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#9999bb', display: 'block', marginBottom: 4 }}>{t('wealth.totalAssets')}</label>
                  <input className="input" type="number" value={nwAssets} onChange={e => setNwAssets(e.target.value)} placeholder="250000" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#9999bb', display: 'block', marginBottom: 4 }}>{t('wealth.totalLiabilities')}</label>
                  <input className="input" type="number" value={nwLiab} onChange={e => setNwLiab(e.target.value)} placeholder="80000" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#9999bb', display: 'block', marginBottom: 4 }}>{t('wealth.date')}</label>
                  <input className="input" type="date" value={nwDate} onChange={e => setNwDate(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={handleAddSnapshot} disabled={nwSaving} style={{
                    width: '100%', background: '#22c55e', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}>{nwSaving ? t('wealth.saving') : t('wealth.save')}</button>
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
                    {[t('wealth.tableDate'), t('wealth.tableAssets'), t('wealth.tableLiabilities'), t('wealth.tableNetWorth'), ''].map(h => (
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
                        }}>{t('wealth.deleteSnapshot')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {snapshots.length === 0 && !showNwForm && (
            <div style={{ textAlign: 'center', color: '#9999bb', padding: 40 }}>{t('wealth.noSnapshots')}</div>
          )}
        </div>
      )}

      {/* ── RETIREMENT TAB ── */}
      {tab === 'Retirement' && (
        <div>
          {/* Controls */}
          <div style={{ ...card, marginBottom: 24, display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, color: '#9999bb', display: 'block', marginBottom: 6 }}>{t('wealth.currentAge')}</label>
              <input
                className="input" type="number" min={18} max={64} value={currentAge}
                onChange={e => setCurrentAge(+e.target.value)}
                style={{ width: 120 }}
              />
            </div>
            <button onClick={loadRetirement} disabled={retLoading} style={{
              background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>{retLoading ? t('wealth.calculating') : t('wealth.recalculate')}</button>
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
                    {retirement.on_track ? t('wealth.onTrackBanner') : t('wealth.gapBanner')}
                  </div>
                  <div style={{ color: '#9999bb', fontSize: 13, marginTop: 4 }}>
                    {retirement.on_track
                      ? t('wealth.onTrackMsg').replace('{amount}', fmt(retirement.projected_at_65 - retirement.target_nest_egg))
                      : t('wealth.gapMsg').replace('{monthly}', fmt(retirement.monthly_needed)).replace('{shortfall}', fmt(retirement.shortfall))}
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                  { label: t('wealth.targetNestEgg'), val: fmt(retirement.target_nest_egg), color: '#6366f1' },
                  { label: t('wealth.projectedAt65'), val: fmt(retirement.projected_at_65), color: retirement.on_track ? '#22c55e' : '#f97316' },
                  { label: t('wealth.yearsToRetirement'), val: `${retirement.years_to_retirement} yrs`, color: '#eab308' },
                  { label: t('wealth.assumedReturn'), val: pct(retirement.annual_return_used * 100), color: '#06b6d4' },
                  { label: t('wealth.monthlyNeeded'), val: fmt(retirement.monthly_needed), color: '#a78bfa' },
                  { label: t('wealth.shortfall'), val: retirement.shortfall > 0 ? fmt(retirement.shortfall) : t('wealth.noShortfall'), color: retirement.shortfall > 0 ? '#ef4444' : '#22c55e' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ ...card }}>
                    <div style={{ fontSize: 11, color: '#9999bb', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar: projected vs target */}
              <div style={{ ...card }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f5', marginBottom: 16 }}>{t('wealth.retirementProgress')}</h3>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#9999bb' }}>{t('wealth.projectedVsTarget')}</span>
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
                  {t('wealth.retirementNote').replace('{rate}', pct(retirement.annual_return_used * 100))}
                </p>
              </div>
            </>
          )}
          {retLoading && (
            <div style={{ textAlign: 'center', padding: 60, color: '#9999bb' }}>{t('wealth.calculatingRetirement')}</div>
          )}
        </div>
      )}

      {/* ── TAXES TAB ── */}
      {tab === 'Taxes' && (
        <div>
          {/* Controls */}
          <div style={{ ...card, marginBottom: 24, display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, color: '#9999bb', display: 'block', marginBottom: 6 }}>{t('wealth.filingStatus')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['single', 'married_jointly'] as const).map(s => (
                  <button key={s} onClick={() => setFilingStatus(s)} style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: filingStatus === s ? '#6366f1' : '#2a2a3a',
                    color: filingStatus === s ? '#fff' : '#9999bb',
                  }}>{s === 'single' ? t('wealth.single') : t('wealth.marriedJoint')}</button>
                ))}
              </div>
            </div>
            <button onClick={loadTax} disabled={taxLoading} style={{
              background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>{taxLoading ? t('wealth.calculating') : t('wealth.recalculate')}</button>
          </div>

          {tax && !taxLoading && (
            <>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                  { label: t('wealth.grossAnnual'), val: fmt(tax.gross_annual), color: '#22c55e' },
                  { label: t('wealth.standardDeduction'), val: fmt(tax.standard_deduction), color: '#6366f1' },
                  { label: t('wealth.taxableIncome'), val: fmt(tax.taxable_income), color: '#f0f0f5' },
                  { label: t('wealth.federalTax'), val: fmt(tax.federal_tax), color: '#ef4444' },
                  { label: t('wealth.effectiveRate'), val: pct(tax.effective_rate * 100), color: '#eab308' },
                  { label: t('wealth.marginalRate'), val: pct(tax.marginal_rate * 100), color: '#f97316' },
                  { label: t('wealth.monthlyTakeHome'), val: fmt(tax.estimated_monthly_takehome), color: '#22c55e' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ ...card }}>
                    <div style={{ fontSize: 11, color: '#9999bb', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Bracket breakdown */}
              <div style={{ ...card, marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5', marginBottom: 20 }}>{t('wealth.bracketBreakdown')}</h3>
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
                        <div style={{ fontSize: 11, color: '#555577', marginTop: 2 }}>{t('wealth.incomeInBracket')} {fmt(b.income_in_bracket)}</div>
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
            <div style={{ textAlign: 'center', padding: 60, color: '#9999bb' }}>{t('wealth.calculatingTax')}</div>
          )}
        </div>
      )}
      </>}
    </div>
    </ProtectedRoute>
  );
}
