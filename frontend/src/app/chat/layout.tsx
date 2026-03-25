'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { isAuthenticated, getStoredUser } from '@/lib/auth';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Check auth
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    const storedUser = getStoredUser();
    if (storedUser) {
      if (storedUser.role !== 'patient') {
        router.push('/admin');
        return;
      }
      setUser(storedUser);
    } else {
      router.push('/');
      return;
    }
    setLoading(false);
  }, [router, setUser, setLoading]);

  if (isLoading || !user) {
    return <FullPageSpinner message="Loading chat..." />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {children}
    </div>
  );
}
