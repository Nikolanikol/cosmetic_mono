'use client';

/**
 * AuthProvider
 * Initializes the auth state on app mount and subscribes to session changes.
 * Must be placed near the root of the app (inside providers.tsx).
 */

import { useEffect } from 'react';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { useAuthStore } from '../model/useAuthStore';
import { useWishlistStore } from '@/features/wishlist/model/useWishlistStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  const { initWishlist, clearWishlist } = useWishlistStore();

  useEffect(() => {
    // 1. Load the initial session
    supabaseBrowser.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (user) {
        initWishlist(user.id);
      }
    });

    // 2. Keep the store in sync whenever the session changes
    //    (login, logout, token refresh, OAuth callback)
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        initWishlist(session.user.id);
      }

      if (event === 'SIGNED_OUT') {
        clearWishlist();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, initWishlist, clearWishlist]);

  return <>{children}</>;
}
