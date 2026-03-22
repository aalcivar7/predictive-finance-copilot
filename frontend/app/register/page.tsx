'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';

export default function RegisterPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [form, setForm] = useState({ username: '', full_name: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.username, form.password, form.full_name || undefined);
      router.push('/login?registered=1');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: colors.bg }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg,#7c3aed,#9333ea)',
            color: '#fff', fontWeight: 800, fontSize: '18px', marginBottom: '16px',
          }}>F</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: colors.text, marginBottom: '6px' }}>Get started free</h1>
          <p style={{ fontSize: '14px', color: colors.textMuted }}>Build your financial future today</p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', fontSize: '13px', borderRadius: '8px',
              padding: '10px 14px', marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Username</label>
              <input type="text" name="username" className="input" value={form.username} onChange={handleChange} required placeholder="e.g. john_doe" autoComplete="username" />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="label">Full Name <span style={{ color: colors.textDim, textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
              <input type="text" name="full_name" className="input" value={form.full_name} onChange={handleChange} placeholder="Jane Doe" />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="label">Password</label>
              <input type="password" name="password" className="input" value={form.password} onChange={handleChange} required minLength={8} placeholder="Min 8 characters" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '14px', color: colors.textMuted, marginTop: '20px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
