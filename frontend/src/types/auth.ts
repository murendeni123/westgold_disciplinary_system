/**
 * Authentication Types
 * 
 * Centralized type definitions for the authentication system.
 * These types are used across AuthContext, ProtectedRoute, and Login components.
 */

import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile, UserRole } from './supabase';

// Auth context state and methods
export interface AuthContextType {
  // Supabase user object (from auth.users)
  user: User | null;
  // Current session with access token
  session: Session | null;
  // User profile from public.user_profiles
  profile: UserProfile | null;
  // Convenience accessor for role
  role: UserRole | null;
  // Loading state to prevent flash of unauthenticated content
  loading: boolean;
  // Sign in with email and password
  signIn: (email: string, password: string) => Promise<SignInResult>;
  // Sign out and clear all auth state
  signOut: () => Promise<void>;
  // Refresh user profile data
  refreshProfile: () => Promise<void>;
}

// Result of sign in attempt
export interface SignInResult {
  success: boolean;
  error?: string;
  role?: UserRole;
}

// Props for ProtectedRoute component
export interface ProtectedRouteProps {
  children: React.ReactNode;
  // Roles allowed to access this route
  allowedRoles?: UserRole[];
  // Custom redirect path if unauthorized
  redirectTo?: string;
}

// Role to route mapping for post-login redirect
export const ROLE_ROUTES: Record<UserRole, string> = {
  super_admin: '/super-admin',
  school_admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  parent: '/parent/dashboard',
};

// Default route for each role (used when accessing root or unauthorized)
export const getDefaultRouteForRole = (role: UserRole | null): string => {
  if (!role) return '/login';
  return ROLE_ROUTES[role] || '/login';
};
