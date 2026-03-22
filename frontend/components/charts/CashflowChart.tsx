'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#10b981', '#f43f5e', '#7c3aed'];

export default function CashflowChart({ income, expenses, savings }: { income: number; expenses: number; savings: number }) {
  const data = [
    { name: 'Income',   value: income },
    { name: 'Expenses', value: expenses },
    { name: 'Savings',  value: savings },
  ];

  return (
    <div className="card">
      <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#d0d0e0', marginBottom: '4px' }}>Monthly Cashflow</h2>
      <p style={{ fontSize: '12px', color: '#50505e', marginBottom: '16px' }}>Income vs expenses breakdown</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#22223a" vertical={false} />
          <XAxis dataKey="name" stroke="#30304a" tick={{ fill: '#50505e', fontSize: 12 }} />
          <YAxis stroke="#30304a" tick={{ fill: '#50505e', fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a38', borderRadius: 10, fontSize: 12 }}
            formatter={(v: number) => [`$${v.toLocaleString()}`, '']}
            cursor={{ fill: 'rgba(124,58,237,0.06)' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
