'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface EntryGateProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: EntryGateProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const entry = localStorage.getItem('mirabee-entry');
      if (!entry) {
        router.replace('/');
      }
    }
  }, [router]);

  return <>{children}</>;
}
