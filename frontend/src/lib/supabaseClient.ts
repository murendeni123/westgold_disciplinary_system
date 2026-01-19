/**
 * Supabase Client Configuration
 * 
 * Centralizes Supabase client creation using environment variables.
 * This single instance is used throughout the app for all Supabase operations.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Environment variables are prefixed with VITE_ to be exposed to the client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables at startup to fail fast
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Create and export a single Supabase client instance
// Using Database type for full type safety with your schema
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage for automatic restoration
    persistSession: true,
    // Use localStorage for session storage (default)
    storage: localStorage,
    // Automatically refresh token before expiry
    autoRefreshToken: true,
    // Detect session from URL (for OAuth/magic link flows)
    detectSessionInUrl: true,
  },
});

export default supabase;
