'use client';

/**
 * AuthProvider
 * Initializes the auth state on app mount and subscribes to session changes.
 * Must be placed near the root of the app (inside providers.tsx).
 */

import { useEffect } from 'react';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { useAuthStore } from '../model/useAuthStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // 1. Load the initial session
    supabaseBrowser.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // 2. Keep the store in sync whenever the session changes
    //    (login, logout, token refresh, OAuth callback)
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
