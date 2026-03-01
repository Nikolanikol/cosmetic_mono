/**
 * Supabase browser client
 * For use in Client Components and Zustand stores
 */

import { createBrowserClient } from '@supabase/ssr';
import { env } from '../config/env';
import type { Database } from './database.types';

// Create a singleton browser client
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return browserClient;
}

// Export for direct use
export const supabaseBrowser = getSupabaseBrowserClient();

// Re-export types
export type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>;
