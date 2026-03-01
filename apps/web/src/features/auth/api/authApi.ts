/**
 * Auth API
 * Thin wrappers around Supabase auth — used by forms and auth store.
 */

import { supabaseBrowser } from '@/shared/api/supabaseClient';
import type { User } from '@supabase/supabase-js';

/** Redirect to Google consent screen. Browser redirects away — no return value. */
export async function signInWithGoogle() {
  const { data, error } = await supabaseBrowser.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

/** Sign in with email + password. Returns session data. */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabaseBrowser.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/** Register with email + password. Supabase sends a confirmation email. */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
) {
  const { data, error } = await supabaseBrowser.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });
  if (error) throw error;
  return data;
}

/** Sign out the current user. */
export async function signOut() {
  const { error } = await supabaseBrowser.auth.signOut();
  if (error) throw error;
}

/** Get the currently authenticated user (verifies with server). */
export async function getUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabaseBrowser.auth.getUser();
  return user;
}
