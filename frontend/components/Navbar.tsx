'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { removeToken } from '@/lib/auth';
import { useTheme, THEMES } from '@/lib/theme-context';

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
  const { colors, theme, setTheme } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);

  function handleLogout() {
    removeToken();
    router.push('/login');
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────── */}
      <aside style={{
        width: '220px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: colors.bgSidebar,
        borderRight: `1px solid ${colors.borderSubtle}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 12px',
        flexShrink: 0,
        overflow: 'hidden',
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
            <div style={{ color: colors.text, fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>FinCopilot</div>
            <div style={{ color: colors.textDim, fontSize: '11px', marginTop: '2px' }}>Finance AI</div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', minHeight: 0 }}>
          {navItems.map(({ href, label, emoji }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px',
                fontSize: '14px', fontWeight: active ? 600 : 500,
                textDecoration: 'none',
                backgroundColor: active ? '#2a1f4a' : 'transparent',
                color: active ? '#c4b5fd' : colors.textMuted,
                border: active ? '1px solid #4c3a8a' : `1px solid transparent`,
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '16px' }}>{emoji}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Theme picker */}
        <div style={{ position: 'relative', borderTop: `1px solid ${colors.borderSubtle}`, paddingTop: '12px', marginTop: '8px' }}>
          <button onClick={() => setShowThemePicker(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            fontSize: '14px', fontWeight: 500,
            background: showThemePicker ? colors.bgHover : 'none',
            border: 'none', cursor: 'pointer',
            color: colors.textMuted, width: '100%',
          }}>
            <span style={{ fontSize: '16px' }}>🎨</span>
            Theme
          </button>
          {showThemePicker && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, right: 0,
              backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
              borderRadius: '12px', padding: '8px', marginBottom: '4px',
              display: 'flex', flexDirection: 'column', gap: '2px',
            }}>
              {THEMES.map(t => (
                <button key={t.id} onClick={() => { setTheme(t.id); setShowThemePicker(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: theme === t.id ? 700 : 500,
                  background: theme === t.id ? '#2a1f4a' : 'transparent',
                  color: theme === t.id ? '#c4b5fd' : colors.textSecondary,
                  width: '100%', textAlign: 'left',
                }}>
                  <span>{t.emoji}</span> {t.label}
                  {theme === t.id && <span style={{ marginLeft: 'auto', fontSize: '11px' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <div style={{ borderTop: `1px solid ${colors.borderSubtle}`, paddingTop: '12px', marginTop: '4px' }}>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            fontSize: '14px', fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer',
            color: colors.textMuted, width: '100%', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2a1a1a'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = colors.textMuted; (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
          >
            <span style={{ fontSize: '16px' }}>🚪</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ───────────────────── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: colors.bgSidebar,
        borderTop: `1px solid ${colors.borderSubtle}`,
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }} className="show-mobile">
        <div style={{
          display: 'flex', flexDirection: 'row',
          overflowX: 'scroll',
          WebkitOverflowScrolling: 'touch' as any,
          msOverflowStyle: 'none' as any,
          scrollbarWidth: 'none' as any,
          padding: '6px 4px 8px',
        }}>

          {navItems.map(({ href, label, emoji }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                minWidth: '72px', flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: '4px 4px', textDecoration: 'none',
                color: active ? '#a78bfa' : colors.textDim,
              }}>
                <div style={{
                  fontSize: '26px', lineHeight: 1,
                  padding: '5px 12px', borderRadius: '10px',
                  backgroundColor: active ? '#2a1f4a' : 'transparent',
                  transition: 'background-color 0.15s',
                }}>{emoji}</div>
                <span style={{ fontSize: '11px', fontWeight: active ? 600 : 400 }}>{label}</span>
              </Link>
            );
          })}

          {/* Theme picker */}
          <div style={{ minWidth: '72px', flexShrink: 0, position: 'relative' }}>
            <button onClick={() => setShowThemePicker(v => !v)} style={{
              width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              padding: '4px 4px', background: 'none', border: 'none', cursor: 'pointer',
              color: showThemePicker ? '#a78bfa' : colors.textDim,
            }}>
              <div style={{
                fontSize: '26px', lineHeight: 1, padding: '5px 12px', borderRadius: '10px',
                backgroundColor: showThemePicker ? '#2a1f4a' : 'transparent',
                transition: 'background-color 0.15s',
              }}>🎨</div>
              <span style={{ fontSize: '11px' }}>Theme</span>
            </button>
            {showThemePicker && (
              <div style={{
                position: 'fixed', bottom: '90px', right: '8px',
                backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
                borderRadius: '12px', padding: '8px',
                display: 'flex', flexDirection: 'column', gap: '2px',
                zIndex: 200, minWidth: '150px',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
              }}>
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => { setTheme(t.id); setShowThemePicker(false); }} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: theme === t.id ? 700 : 500,
                    background: theme === t.id ? '#2a1f4a' : 'transparent',
                    color: theme === t.id ? '#c4b5fd' : colors.textSecondary,
                    width: '100%', textAlign: 'left',
                  }}>
                    <span>{t.emoji}</span> {t.label}
                    {theme === t.id && <span style={{ marginLeft: 'auto', fontSize: '11px' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Logout */}
          <button onClick={handleLogout} style={{
            minWidth: '72px', flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            padding: '4px 4px', background: 'none', border: 'none', cursor: 'pointer',
            color: colors.textDim,
          }}>
            <div style={{ fontSize: '26px', lineHeight: 1, padding: '5px 12px', borderRadius: '10px' }}>🚪</div>
            <span style={{ fontSize: '11px' }}>Sign out</span>
          </button>

        </div>
      </nav>

      <style>{`
        .hidden-mobile { display: flex !important; }
        .show-mobile   { display: none !important; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: block !important; }
        }
        .show-mobile > div::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}
