/**
 * Protected Route Component for Supabase Auth
 * 
 * Guards routes based on authentication status and user role.
 * Shows loading spinner while auth state is being determined.
 * Redirects to appropriate pages based on auth/role status.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import type { ProtectedRouteProps } from '../types/auth';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo,
}) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while determining auth state
  // This prevents flash of login page for authenticated users
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  // Preserve the attempted URL for post-login redirect
  if (!user) {
    return (
      <Navigate 
        to={redirectTo || '/login'} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Authenticated but no role restrictions - allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user's role is in the allowed roles list
  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  // User is authenticated but doesn't have the required role
  // Redirect to unauthorized page or their default dashboard
  return (
    <Navigate 
      to="/unauthorized" 
      state={{ 
        from: location.pathname,
        requiredRoles: allowedRoles,
        userRole: role,
      }} 
      replace 
    />
  );
};

export default ProtectedRoute;
