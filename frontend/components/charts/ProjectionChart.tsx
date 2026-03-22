'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ProjectionPoint } from '@/types';

function fmtDollar(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function ProjectionChart({ data, title = 'Net Worth Projection' }: { data: ProjectionPoint[]; title?: string }) {
  return (
    <div className="card">
      <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#d0d0e0', marginBottom: '4px' }}>{title}</h2>
      <p style={{ fontSize: '12px', color: '#50505e', marginBottom: '16px' }}>Projected growth over time</p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gNW" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#22223a" />
          <XAxis dataKey="year" stroke="#30304a" tick={{ fill: '#50505e', fontSize: 11 }} tickFormatter={(v) => `Yr ${v}`} />
          <YAxis stroke="#30304a" tick={{ fill: '#50505e', fontSize: 11 }} tickFormatter={fmtDollar} width={60} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a38', borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: '#80809a' }}
            formatter={(v: number) => [fmtDollar(v), '']}
            labelFormatter={(v) => `Year ${v}`}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#60607a' }} />
          <Area type="monotone" dataKey="high"      name="Optimistic"   stroke="#10b981" fill="none"         strokeWidth={1.5} strokeDasharray="5 3" />
          <Area type="monotone" dataKey="net_worth" name="Expected"      stroke="#7c3aed" fill="url(#gNW)"   strokeWidth={2.5} />
          <Area type="monotone" dataKey="low"       name="Conservative" stroke="#f59e0b" fill="none"         strokeWidth={1.5} strokeDasharray="5 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
