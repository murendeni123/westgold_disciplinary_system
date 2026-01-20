/**
 * Supabase Authentication Context - Compatibility Layer
 * 
 * Re-exports from the original AuthContext to maintain compatibility
 * with code that imports from this file. When Supabase is properly configured,
 * this file can be replaced with the full Supabase auth implementation.
 */

export { useAuth, AuthProvider } from './AuthContext';
