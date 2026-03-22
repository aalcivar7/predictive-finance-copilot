'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { removeToken } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', emoji: '📊' },
  { href: '/money',     label: 'Money',     emoji: '💰' },
  { href: '/plan',      label: 'Plan',      emoji: '📋' },
  { href: '/wealth',    label: 'Wealth',    emoji: '📈' },
  { href: '/goals',     label: 'Goals',     emoji: '🎯' },
  { href: '/simulator', label: 'Simulator', emoji: '🔬' },
  { href: '/insights',  label: 'Insights',  emoji: '💡' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();

  function handleLogout() {
    removeToken();
    router.push('/login');
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────── */}
      <aside style={{
        width: '220px',
        minHeight: '100vh',
        backgroundColor: '#13131c',
        borderRight: '1px solid #22223a',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 12px',
        flexShrink: 0,
      }} className="hidden-mobile">

        {/* Brand */}
        <div style={{ padding: '0 8px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg,#7c3aed,#9333ea)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '14px', flexShrink: 0,
          }}>F</div>
          <div>
            <div style={{ color: '#f0f0f5', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>FinCopilot</div>
            <div style={{ color: '#40405a', fontSize: '11px', marginTop: '2px' }}>Finance AI</div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(({ href, label, emoji }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px',
                fontSize: '14px', fontWeight: active ? 600 : 500,
                textDecoration: 'none',
                backgroundColor: active ? '#2a1f4a' : 'transparent',
                color: active ? '#c4b5fd' : '#80809a',
                border: active ? '1px solid #4c3a8a' : '1px solid transparent',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '16px' }}>{emoji}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ borderTop: '1px solid #22223a', paddingTop: '12px', marginTop: '12px' }}>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            fontSize: '14px', fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#60607a', width: '100%', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2a1a1a'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#60607a'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
          >
            <span style={{ fontSize: '16px' }}>🚪</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ───────────────────── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: '#13131c',
        borderTop: '1px solid #22223a',
        display: 'flex',
        padding: '6px 0 8px',
      }} className="show-mobile">
        {navItems.map(({ href, label, emoji }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '4px 0', textDecoration: 'none',
              color: active ? '#a78bfa' : '#50505e',
            }}>
              <div style={{
                fontSize: '20px', lineHeight: 1,
                padding: '4px 12px', borderRadius: '8px',
                backgroundColor: active ? '#2a1f4a' : 'transparent',
                transition: 'background-color 0.15s',
              }}>{emoji}</div>
              <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400 }}>{label}</span>
            </Link>
          );
        })}
        <button onClick={handleLogout} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
          padding: '4px 0', background: 'none', border: 'none', cursor: 'pointer',
          color: '#50505e',
        }}>
          <div style={{ fontSize: '20px', lineHeight: 1, padding: '4px 12px', borderRadius: '8px' }}>🚪</div>
          <span style={{ fontSize: '10px' }}>Out</span>
        </button>
      </nav>

      <style>{`
        .hidden-mobile { display: flex !important; }
        .show-mobile   { display: none !important; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
      `}</style>
    </>
  );
}
