'use client';
import type { Goal } from '@/types';
import { useLang } from '@/lib/lang-context';

export default function GoalCard({ goal, onDelete, onComplete }: { goal: Goal; onDelete: (id: number) => void; onComplete: (id: number) => void }) {
  const { t } = useLang();
  const progress = Math.min(goal.progress_pct, 100);

  return (
    <div className="card" style={{ opacity: goal.is_completed ? 0.65 : 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e0e0f0', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {goal.name}
          </h3>
          {goal.target_date && (
            <p style={{ fontSize: '12px', color: '#50505e' }}>
              {t('goals.dueDateLabel')} {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginLeft: '10px' }}>
          {!goal.is_completed && (
            <button
              onClick={() => onComplete(goal.id)}
              title="Mark complete"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', borderRadius: '7px', padding: '5px 8px', cursor: 'pointer', fontSize: '13px' }}
            >✓</button>
          )}
          <button
            onClick={() => onDelete(goal.id)}
            title="Delete"
            style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#f87171', borderRadius: '7px', padding: '5px 8px', cursor: 'pointer', fontSize: '13px' }}
          >✕</button>
        </div>
      </div>

      {/* Amounts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
        <span style={{ color: '#d0d0e0', fontWeight: 600 }}>${goal.current_amount.toLocaleString()}</span>
        <span style={{ color: '#50505e' }}>of ${goal.target_amount.toLocaleString()}</span>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', height: '6px', backgroundColor: '#22223a', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
        <div
          className={goal.is_completed ? 'progress-bar-green' : 'progress-bar'}
          style={{ width: `${progress}%`, height: '100%', borderRadius: '4px', transition: 'width 0.6s ease' }}
        />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: goal.is_completed ? '#34d399' : '#a78bfa' }}>
          {progress.toFixed(1)}%{goal.is_completed && ` · ${t('goals.doneLabel')}`}
        </span>
        {goal.months_to_goal && !goal.is_completed && (
          <span style={{ fontSize: '12px', color: '#50505e' }}>~{goal.months_to_goal} {t('goals.monthsLeft')}</span>
        )}
      </div>
    </div>
  );
}
