'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/core/auth/AuthProvider';
import { Loading } from '@/shared/components/feedback/Loading';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Check if token is in URL parameter (from redirect after login)
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      // Store token in localStorage
      localStorage.setItem('token', tokenFromUrl);
      // Remove token from URL and reload to trigger auth check
      window.location.href = '/';
      return;
    }

    if (!loading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard');
      } else {
        // User is not authenticated, redirect to login
        router.push('/login');
      }
    }
  }, [user, loading, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loading text="Loading..." />
    </div>
  );
}
