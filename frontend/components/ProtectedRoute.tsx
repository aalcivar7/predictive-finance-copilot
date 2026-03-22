'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Navbar from './Navbar';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f0f14' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '28px 24px', overflowY: 'auto', paddingBottom: '80px' }}>
        {ready ? children : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#60607a', fontSize: '14px' }}>
            Loading…
          </div>
        )}
      </main>
    </div>
  );
}
