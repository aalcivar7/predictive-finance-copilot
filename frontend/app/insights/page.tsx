'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getInsights } from '@/lib/api';
import type { Insight } from '@/types';
import { useLang } from '@/lib/lang-context';

const cfg = {
  warning: { emoji: '⚠️', bg: '#241414', border: '#4a2020', labelColor: '#f87171', labelBg: 'rgba(244,63,94,0.1)' },
  success: { emoji: '✅', bg: '#0f2420', border: '#1a4035', labelColor: '#34d399', labelBg: 'rgba(16,185,129,0.1)' },
  tip:     { emoji: '💡', bg: '#1e1430', border: '#2d1f55', labelColor: '#a78bfa', labelBg: 'rgba(124,58,237,0.12)' },
};

function InsightCard({ insight, label }: { insight: Insight; label: string }) {
  const c = cfg[insight.type as keyof typeof cfg] ?? cfg.tip;
  return (
    <div style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '16px 18px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '20px', lineHeight: 1, marginTop: '2px' }}>{c.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: c.labelColor, background: c.labelBg, padding: '2px 8px', borderRadius: '20px' }}>
            {label}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#e0e0f0' }}>{insight.title}</span>
        </div>
        <p style={{ fontSize: '13px', color: '#808098', lineHeight: 1.55 }}>{insight.message}</p>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { t, lang, langReady } = useLang();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!langReady) return;
    let cancelled = false;
    setLoading(true);
    getInsights(lang)
      .then((d) => { if (!cancelled) setInsights(d.insights); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lang, langReady]);

  const sections = [
    { key: 'warning', label: t('insights.alertsSection'),         badgeLabel: t('insights.alertLabel') },
    { key: 'success', label: t('insights.strengthsSection'),      badgeLabel: t('insights.strengthLabel') },
    { key: 'tip',     label: t('insights.recommendationsSection'), badgeLabel: t('insights.tipLabel') },
  ];

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f0f5' }}>{t('insights.title')}</h1>
          <p style={{ fontSize: '13px', color: '#60607a', marginTop: '2px' }}>{t('insights.subtitle')}</p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#60607a', fontSize: '14px' }}>
            {t('insights.loading')}
          </div>
        )}

        {!loading && insights.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>💡</div>
            <p style={{ color: '#c0c0d0', fontWeight: 600, marginBottom: '6px' }}>{t('insights.noInsights')}</p>
            <p style={{ color: '#50505e', fontSize: '13px' }}>{t('insights.noInsightsHint')}</p>
          </div>
        )}

        {sections.map(({ key, label, badgeLabel }) => {
          const items = insights.filter((i) => i.type === key);
          if (!items.length) return null;
          return (
            <div key={key} style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#50505e', marginBottom: '10px' }}>
                {label} · {items.length}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((i, idx) => <InsightCard key={idx} insight={i} label={badgeLabel} />)}
              </div>
            </div>
          );
        })}
      </div>
    </ProtectedRoute>
  );
}
