'use client';
import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProjectionChart from '@/components/charts/ProjectionChart';
import { simulate } from '@/lib/api';
import type { SimulateResult } from '@/types';

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

const sliders = [
  { name: 'monthly_savings',        label: 'Monthly Savings',   min: 0, max: 50000,   step: 100,  prefix: '$', suffix: ''    },
  { name: 'investment_return_rate', label: 'Annual Return',      min: 0, max: 20,      step: 0.5,  prefix: '',  suffix: '%'   },
  { name: 'salary_growth_rate',     label: 'Salary Growth',      min: 0, max: 15,      step: 0.5,  prefix: '',  suffix: '%'   },
  { name: 'current_net_worth',      label: 'Starting Net Worth', min: 0, max: 5000000, step: 1000, prefix: '$', suffix: ''    },
  { name: 'years',                  label: 'Years to Project',   min: 1, max: 40,      step: 1,    prefix: '',  suffix: ' yrs'},
] as const;

export default function SimulatorPage() {
  const [form, setForm] = useState({ monthly_savings: 1000, investment_return_rate: 7, salary_growth_rate: 3, current_net_worth: 50000, years: 10 });
  const [result, setResult]   = useState<SimulateResult | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: parseFloat(e.target.value) || 0 });
  }

  async function handleSimulate() {
    setLoading(true);
    try {
      setResult(await simulate({ ...form, investment_return_rate: form.investment_return_rate / 100, salary_growth_rate: form.salary_growth_rate / 100 }));
    } finally { setLoading(false); }
  }

  function display(name: string, val: number, prefix: string, suffix: string) {
    if (prefix === '$') return `$${val.toLocaleString()}`;
    return `${val}${suffix}`;
  }

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f0f5' }}>Scenario Simulator</h1>
          <p style={{ fontSize: '13px', color: '#60607a', marginTop: '2px' }}>Adjust the sliders and model different financial futures</p>
        </div>

        {/* Controls */}
        <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {sliders.map(({ name, label, min, max, step, prefix, suffix }) => {
              const val = form[name as keyof typeof form];
              return (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="label" style={{ margin: 0 }}>{label}</label>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#a78bfa', background: '#1e1430', border: '1px solid #2d1f55', borderRadius: '6px', padding: '2px 8px' }}>
                      {display(name, val, prefix, suffix)}
                    </span>
                  </div>
                  <input type="range" name={name} min={min} max={max} step={step} value={val} onChange={handleChange} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#40405a' }}>{display(name, min, prefix, suffix)}</span>
                    <span style={{ fontSize: '10px', color: '#40405a' }}>{display(name, max, prefix, suffix)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={handleSimulate} disabled={loading} className="btn-primary">
            {loading ? '⏳ Running…' : '▶ Run Simulation'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div>
            <div className="grid-3" style={{ marginBottom: '16px' }}>
              {[
                { label: 'Projected Net Worth', value: fmt(result.final_net_worth),                                                              color: '#a78bfa', bg: '#1e1430', border: '#2d1f55' },
                { label: 'Total Contributed',   value: fmt(result.total_contributed),                                                            color: '#34d399', bg: '#0f2420', border: '#1a4035' },
                { label: 'Investment Growth',   value: fmt(result.final_net_worth - result.total_contributed - form.current_net_worth),           color: '#fbbf24', bg: '#241e10', border: '#4a3a18' },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#60607a', marginBottom: '8px' }}>{label}</p>
                  <p style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</p>
                </div>
              ))}
            </div>
            <ProjectionChart data={result.projections} title="Monte Carlo Projection (P10 / P50 / P90)" />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
