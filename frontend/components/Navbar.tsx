'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { removeToken } from '@/lib/auth';
import { useTheme, THEMES } from '@/lib/theme-context';
import { useLang } from '@/lib/lang-context';
import type { Lang } from '@/lib/translations';

const NAV_KEYS: { href: string; key: string; emoji: string }[] = [
  { href: '/dashboard', key: 'nav.dashboard', emoji: '📊' },
  { href: '/money',     key: 'nav.money',     emoji: '💰' },
  { href: '/plan',      key: 'nav.plan',      emoji: '📋' },
  { href: '/wealth',    key: 'nav.wealth',    emoji: '📈' },
  { href: '/goals',     key: 'nav.goals',     emoji: '🎯' },
  { href: '/simulator', key: 'nav.simulator', emoji: '🔬' },
  { href: '/insights',  key: 'nav.insights',  emoji: '💡' },
];

const LANGS: { id: Lang; emoji: string; labelKey: string }[] = [
  { id: 'en', emoji: '🇺🇸', labelKey: 'nav.langEn' },
  { id: 'es', emoji: '🇲🇽', labelKey: 'nav.langEs' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { colors, theme, setTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showLangPicker,  setShowLangPicker]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    removeToken();
    router.push('/login');
  }

  function handleMobileNav(href: string) {
    setMobileOpen(false);
    router.push(href);
  }

  const pickerStyle = {
    position: 'absolute' as const, bottom: '100%', left: 0, right: 0,
    backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
    borderRadius: '12px', padding: '8px', marginBottom: '4px',
    display: 'flex', flexDirection: 'column' as const, gap: '2px',
  };

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────── */}
      <aside style={{
        width: '220px', height: '100vh', position: 'sticky', top: 0,
        backgroundColor: colors.bgSidebar, borderRight: `1px solid ${colors.borderSubtle}`,
        display: 'flex', flexDirection: 'column', padding: '24px 12px',
        flexShrink: 0, overflow: 'hidden',
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
          {NAV_KEYS.map(({ href, key, emoji }) => {
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
                {t(key)}
              </Link>
            );
          })}
        </nav>

        {/* Theme picker */}
        <div style={{ position: 'relative', borderTop: `1px solid ${colors.borderSubtle}`, paddingTop: '12px', marginTop: '8px' }}>
          <button onClick={() => { setShowThemePicker(v => !v); setShowLangPicker(false); }} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500,
            background: showThemePicker ? colors.bgHover : 'none',
            border: 'none', cursor: 'pointer', color: colors.textMuted, width: '100%',
          }}>
            <span style={{ fontSize: '16px' }}>🎨</span>{t('nav.theme')}
          </button>
          {showThemePicker && (
            <div style={pickerStyle}>
              {THEMES.map(t2 => (
                <button key={t2.id} onClick={() => { setTheme(t2.id); setShowThemePicker(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: theme === t2.id ? 700 : 500,
                  background: theme === t2.id ? '#2a1f4a' : 'transparent',
                  color: theme === t2.id ? '#c4b5fd' : colors.textSecondary,
                  width: '100%', textAlign: 'left',
                }}>
                  <span>{t2.emoji}</span> {t2.label}
                  {theme === t2.id && <span style={{ marginLeft: 'auto', fontSize: '11px' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language picker */}
        <div style={{ position: 'relative', paddingTop: '4px' }}>
          <button onClick={() => { setShowLangPicker(v => !v); setShowThemePicker(false); }} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500,
            background: showLangPicker ? colors.bgHover : 'none',
            border: 'none', cursor: 'pointer', color: colors.textMuted, width: '100%',
          }}>
            <span style={{ fontSize: '16px' }}>🌐</span>{t('nav.language')}
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: colors.textDim }}>
              {lang.toUpperCase()}
            </span>
          </button>
          {showLangPicker && (
            <div style={pickerStyle}>
              {LANGS.map(l => (
                <button key={l.id} onClick={() => { setLang(l.id); setShowLangPicker(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: lang === l.id ? 700 : 500,
                  background: lang === l.id ? '#2a1f4a' : 'transparent',
                  color: lang === l.id ? '#c4b5fd' : colors.textSecondary,
                  width: '100%', textAlign: 'left',
                }}>
                  <span>{l.emoji}</span> {t(l.labelKey)}
                  {lang === l.id && <span style={{ marginLeft: 'auto', fontSize: '11px' }}>✓</span>}
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
            {t('nav.signOut')}
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: colors.bgSidebar, borderBottom: `1px solid ${colors.borderSubtle}`,
        paddingTop: 'env(safe-area-inset-top, 0px)', boxShadow: '0 1px 12px rgba(0,0,0,0.2)',
      }} className="show-mobile">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '56px' }}>
          <button onClick={() => setMobileOpen(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', gap: '5px', padding: '8px', borderRadius: '8px',
          }}>
            <span style={{ display: 'block', width: '20px', height: '2px', backgroundColor: colors.text, borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '16px', height: '2px', backgroundColor: colors.text, borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '20px', height: '2px', backgroundColor: colors.text, borderRadius: '2px' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '7px',
              background: 'linear-gradient(135deg,#7c3aed,#9333ea)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '13px',
            }}>F</div>
            <span style={{ color: colors.text, fontWeight: 700, fontSize: '16px', letterSpacing: '-0.3px' }}>FinCopilot</span>
          </div>
          <div style={{ width: '36px' }} />
        </div>
      </div>

      {/* ── Mobile drawer ────────────────────────── */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 150, backgroundColor: 'rgba(0,0,0,0.55)',
          }} className="show-mobile" />

          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
            width: '270px', backgroundColor: colors.bgSidebar,
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingLeft: '12px', paddingRight: '12px', paddingBottom: '24px',
            boxShadow: '4px 0 32px rgba(0,0,0,0.5)',
          }} className="show-mobile">

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', padding: '0 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'linear-gradient(135deg,#7c3aed,#9333ea)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: '14px',
                }}>F</div>
                <div>
                  <div style={{ color: colors.text, fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>FinCopilot</div>
                  <div style={{ color: colors.textDim, fontSize: '11px', marginTop: '2px' }}>Finance AI</div>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: colors.textMuted, fontSize: '20px', lineHeight: 1, padding: '4px',
              }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              {NAV_KEYS.map(({ href, key, emoji }) => {
                const active = pathname === href;
                return (
                  <button key={href} onClick={() => handleMobileNav(href)} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '10px',
                    fontSize: '15px', fontWeight: active ? 600 : 500,
                    backgroundColor: active ? '#2a1f4a' : 'transparent',
                    color: active ? '#c4b5fd' : colors.textMuted,
                    border: active ? '1px solid #4c3a8a' : '1px solid transparent',
                    cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: '20px' }}>{emoji}</span>
                    {t(key)}
                  </button>
                );
              })}
            </div>

            {/* Theme picker */}
            <div style={{ borderTop: `1px solid ${colors.borderSubtle}`, paddingTop: '12px', marginTop: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.textDim, padding: '0 14px', marginBottom: '8px' }}>{t('nav.theme')}</p>
              {THEMES.map(t2 => (
                <button key={t2.id} onClick={() => setTheme(t2.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontSize: '15px', fontWeight: theme === t2.id ? 700 : 500,
                  background: theme === t2.id ? '#2a1f4a' : 'transparent',
                  color: theme === t2.id ? '#c4b5fd' : colors.textMuted,
                  width: '100%', textAlign: 'left',
                }}>
                  <span style={{ fontSize: '18px' }}>{t2.emoji}</span> {t2.label}
                  {theme === t2.id && <span style={{ marginLeft: 'auto', color: '#a78bfa' }}>✓</span>}
                </button>
              ))}
            </div>

            {/* Language picker */}
            <div style={{ borderTop: `1px solid ${colors.borderSubtle}`, paddingTop: '12px', marginTop: '4px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.textDim, padding: '0 14px', marginBottom: '8px' }}>{t('nav.language')}</p>
              {LANGS.map(l => (
                <button key={l.id} onClick={() => setLang(l.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontSize: '15px', fontWeight: lang === l.id ? 700 : 500,
                  background: lang === l.id ? '#2a1f4a' : 'transparent',
                  color: lang === l.id ? '#c4b5fd' : colors.textMuted,
                  width: '100%', textAlign: 'left',
                }}>
                  <span style={{ fontSize: '18px' }}>{l.emoji}</span> {t(l.labelKey)}
                  {lang === l.id && <span style={{ marginLeft: 'auto', color: '#a78bfa' }}>✓</span>}
                </button>
              ))}
            </div>

            {/* Logout */}
            <div style={{ borderTop: `1px solid ${colors.borderSubtle}`, paddingTop: '12px', marginTop: '8px' }}>
              <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '10px',
                fontSize: '15px', fontWeight: 500,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#f87171', width: '100%', textAlign: 'left',
              }}>
                <span style={{ fontSize: '20px' }}>🚪</span>
                {t('nav.signOut')}
              </button>
            </div>

          </div>
        </>
      )}

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
