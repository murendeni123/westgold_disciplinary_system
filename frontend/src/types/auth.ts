/**
 * Authentication Types
 * 
 * Centralized type definitions for the authentication system.
 * These types are used across AuthContext, ProtectedRoute, and Login components.
 */

// User role type - compatible with both JWT and Supabase auth
export type UserRole = 'super_admin' | 'school_admin' | 'admin' | 'teacher' | 'parent';

// Result of sign in attempt
export interface SignInResult {
  success: boolean;
  error?: string;
  role?: string | null;
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
export const ROLE_ROUTES: Record<string, string> = {
  super_admin: '/super-admin',
  school_admin: '/admin/dashboard',
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  parent: '/parent/dashboard',
};

// Default route for each role (used when accessing root or unauthorized)
export const getDefaultRouteForRole = (role: string | null): string => {
  if (!role) return '/login';
  return ROLE_ROUTES[role] || '/login';
};
