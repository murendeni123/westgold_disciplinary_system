/**
 * RequireRole Component
 * 
 * A reusable role-based route guard that:
 * - Shows loading state while auth is loading
 * - Redirects to /login if unauthenticated
 * - Redirects to /unauthorized if role mismatch
 * - Allows access if role matches
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import type { UserRole } from '../types/supabase';

interface RequireRoleProps {
  role: UserRole | UserRole[];
  children: React.ReactElement;
}

const RequireRole: React.FC<RequireRoleProps> = ({ role, children }) => {
  const { profile, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalize role prop to array for consistent checking
  const allowedRoles = Array.isArray(role) ? role : [role];

  // Check if user's role is in the allowed roles
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has the required role
  return children;
};

export default RequireRole;
