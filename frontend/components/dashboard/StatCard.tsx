interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'brand' | 'green' | 'red' | 'yellow';
}

const colors = {
  brand:  { value: '#a78bfa', bg: '#1e1430', border: '#2d1f55' },
  green:  { value: '#34d399', bg: '#0f2420', border: '#1a4035' },
  red:    { value: '#f87171', bg: '#241414', border: '#4a2020' },
  yellow: { value: '#fbbf24', bg: '#241e10', border: '#4a3a18' },
};

export default function StatCard({ title, value, subtitle, trend, color = 'brand' }: StatCardProps) {
  const c = colors[color];
  return (
    <div style={{
      backgroundColor: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: '14px',
      padding: '18px 20px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#60607a', marginBottom: '8px' }}>{title}</p>
      <p style={{ fontSize: '24px', fontWeight: 700, color: c.value, lineHeight: 1.2 }}>{value}</p>
      {subtitle && (
        <p style={{ fontSize: '12px', marginTop: '6px', color: trend === 'up' ? '#34d399' : trend === 'down' ? '#f87171' : '#60607a' }}>
          {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}{subtitle}
        </p>
      )}
    </div>
  );
}
