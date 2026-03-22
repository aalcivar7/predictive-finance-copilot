'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { setToken } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';

export default function LoginPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { access_token } = await login(identifier, password);
      setToken(access_token);
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: colors.bg }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg,#7c3aed,#9333ea)',
            color: '#fff', fontWeight: 800, fontSize: '18px', marginBottom: '16px',
          }}>F</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: colors.text, marginBottom: '6px' }}>Welcome back</h1>
          <p style={{ fontSize: '14px', color: colors.textMuted }}>Sign in to your FinCopilot account</p>
        </div>

        {/* Card */}
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
              <label className="label">Username or Email</label>
              <input
                type="text"
                className="input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="username or you@example.com"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '14px', color: colors.textMuted, marginTop: '20px' }}>
          No account?{' '}
          <Link href="/register" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
