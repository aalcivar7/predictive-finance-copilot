'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import Navbar from './Navbar';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { colors } = useTheme();
  const [auth] = useState(() => isAuthenticated());
  const [ready, setReady] = useState(auth);

  useEffect(() => {
    if (!auth) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [auth, router]);

  if (!auth) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.bg }}>
      <Navbar />
      <main style={{ flex: 1, padding: '28px 24px', overflowY: 'auto', overflowX: 'hidden', maxWidth: '100%' }} className="main-content">
        {ready ? children : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: colors.textMuted, fontSize: '14px' }}>
            Loading…
          </div>
        )}
      </main>
    </div>
  );
}
