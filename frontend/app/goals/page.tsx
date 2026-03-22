'use client';
import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import GoalCard from '@/components/goals/GoalCard';
import { getGoals, createGoal, updateGoal, deleteGoal } from '@/lib/api';
import type { Goal } from '@/types';

export default function GoalsPage() {
  const [goals, setGoals]       = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [form, setForm]         = useState({ name: '', target_amount: '', current_amount: '', target_date: '' });

  const load = useCallback(async () => { setGoals(await getGoals()); }, []);
  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createGoal({ name: form.name, target_amount: parseFloat(form.target_amount), current_amount: parseFloat(form.current_amount) || 0, target_date: form.target_date || undefined });
      setForm({ name: '', target_amount: '', current_amount: '', target_date: '' });
      setShowForm(false);
      await load();
    } finally { setLoading(false); }
  }

  const active    = goals.filter((g) => !g.is_completed);
  const completed = goals.filter((g) =>  g.is_completed);

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f0f5' }}>Goals</h1>
            <p style={{ fontSize: '13px', color: '#60607a', marginTop: '2px' }}>Track your financial milestones</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn-secondary' : 'btn-primary'}>
            {showForm ? '✕ Cancel' : '+ Add Goal'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f0f0f5', marginBottom: '16px' }}>New Goal</h2>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <label className="label">Goal Name</label>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Emergency Fund" />
                </div>
                <div>
                  <label className="label">Target ($)</label>
                  <input type="number" className="input" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} required min={1} placeholder="10000" />
                </div>
                <div>
                  <label className="label">Saved so far ($)</label>
                  <input type="number" className="input" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} min={0} placeholder="0" />
                </div>
                <div>
                  <label className="label">Target Date (opt.)</label>
                  <input type="date" className="input" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creating…' : '+ Create Goal'}
              </button>
            </form>
          </div>
        )}

        {/* Empty state */}
        {active.length === 0 && !showForm && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎯</div>
            <p style={{ color: '#c0c0d0', fontWeight: 600, marginBottom: '6px' }}>No active goals yet</p>
            <p style={{ color: '#50505e', fontSize: '13px', marginBottom: '20px' }}>Start tracking what you&apos;re saving toward.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">+ Add your first goal</button>
          </div>
        )}

        {/* Active */}
        {active.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#50505e', marginBottom: '12px' }}>Active · {active.length}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {active.map((g) => <GoalCard key={g.id} goal={g} onDelete={async (id) => { await deleteGoal(id); load(); }} onComplete={async (id) => { await updateGoal(id, { is_completed: true }); load(); }} />)}
            </div>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#50505e', marginBottom: '12px' }}>Completed · {completed.length}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {completed.map((g) => <GoalCard key={g.id} goal={g} onDelete={async (id) => { await deleteGoal(id); load(); }} onComplete={async (id) => { await updateGoal(id, { is_completed: true }); load(); }} />)}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
