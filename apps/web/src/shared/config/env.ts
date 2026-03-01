/**
 * Environment validation with Zod
 * Validates all required environment variables at build time
 */

import { z } from 'zod';

// Client-side: only NEXT_PUBLIC_* vars are available
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().catch('https://placeholder.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).catch('placeholder'),
  NEXT_PUBLIC_APP_URL: z.string().url().catch('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_YM_ID: z.string().optional(),
});

// Server-side: all vars including secrets
const serverSchema = clientSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  YOOKASSA_SHOP_ID: z.string().min(1, 'YOOKASSA_SHOP_ID is required'),
  YOOKASSA_SECRET_KEY: z.string().min(1, 'YOOKASSA_SECRET_KEY is required'),
  YOOKASSA_WEBHOOK_SECRET: z.string().min(1, 'YOOKASSA_WEBHOOK_SECRET is required'),
});

const isServer = typeof window === 'undefined';

let parsedEnv: z.infer<typeof serverSchema>;

if (isServer) {
  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    console.warn(
      '⚠️ Some environment variables are missing:',
      result.error.flatten().fieldErrors
    );
    // Use partial data — don't throw, allow dev server to run
    parsedEnv = serverSchema.partial().parse(process.env) as z.infer<typeof serverSchema>;
  } else {
    parsedEnv = result.data;
  }
} else {
  // Browser: NEXT_PUBLIC_* vars are inlined by webpack at build time.
  // process.env as a whole object is empty in the browser — must reference
  // each variable explicitly so Next.js replaces them with their values.
  parsedEnv = clientSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_YM_ID: process.env.NEXT_PUBLIC_YM_ID,
  }) as z.infer<typeof serverSchema>;
}

export const env = parsedEnv;

// Type for environment variables
export type Env = z.infer<typeof serverSchema>;

// Helper to check if we're in development
export const isDev = env.NODE_ENV === 'development';

// Helper to check if we're in production
export const isProd = env.NODE_ENV === 'production';

// Helper to check if we're in test
export const isTest = env.NODE_ENV === 'test';
