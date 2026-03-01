import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  /** Currently authenticated user, null if not logged in */
  user: User | null;
  /** True while the initial session is being loaded */
  isLoading: boolean;
  /** Last auth error message */
  error: string | null;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // starts true — AuthProvider will set it to false after getUser()
  error: null,

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
