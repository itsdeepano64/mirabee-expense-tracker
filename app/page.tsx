'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/* Auto-redirect to dashboard — no manual "Enter app" needed */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mirabee-entry', 'jenni');
    }
    router.replace('/dashboard');
  }, [router]);

  /* Blank screen while redirecting — same bg as app */
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--mb-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--mb-blue-light)',
        borderTopColor: 'var(--mb-blue)',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
