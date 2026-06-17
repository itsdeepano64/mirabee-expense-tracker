'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasEntrySession } from '@/lib/client/session';
import { ThemeSync } from '@/components/providers/theme-sync';

interface EntryGateProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: EntryGateProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasEntrySession()) {
      router.replace('/');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: 'var(--mb-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '3px solid var(--mb-blue-light)',
            borderTopColor: 'var(--mb-blue)',
            animation: 'spin 0.7s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <ThemeSync />
      {children}
    </>
  );
}