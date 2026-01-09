'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/app/lib/supabase';
import LandingPage from '@/app/components/LandingPage';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          router.push('/dashboard');
        }
      } catch (error) {
        // If auth check fails, still show landing page
        console.error('Auth check error:', error);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // Always show landing page by default (redirect happens in background if authenticated)
  return <LandingPage />;
}
