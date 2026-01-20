/**
 * Supabase Client Configuration
 * 
 * Centralizes Supabase client creation using environment variables.
 * This single instance is used throughout the app for all Supabase operations.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Environment variables are prefixed with VITE_ to be exposed to the client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Flag to check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Log warning if not configured (don't throw - allow fallback to JWT auth)
if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables not set. ' +
    'Using legacy JWT authentication. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Supabase Auth.'
  );
}

// Create Supabase client only if configured, otherwise create a dummy client
// that won't be used (JWT auth will be used instead)
export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storage: localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

export default supabase;
