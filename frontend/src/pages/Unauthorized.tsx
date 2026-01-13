/**
 * Unauthorized Page
 * 
 * Displayed when a user tries to access a route they don't have permission for.
 * Provides clear feedback and navigation options.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { getDefaultRouteForRole } from '../types/auth';

interface LocationState {
  from?: string;
  requiredRoles?: string[];
  userRole?: string;
}

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, signOut } = useAuth();
  
  const state = location.state as LocationState | null;
  const attemptedPath = state?.from || 'this page';
  const defaultRoute = getDefaultRouteForRole(role);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate(defaultRoute);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <ShieldX className="w-10 h-10 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            You don't have permission to access{' '}
            <span className="font-medium text-gray-800">{attemptedPath}</span>.
            {role && (
              <span className="block mt-2 text-sm">
                Your current role is <span className="font-medium">{role}</span>.
              </span>
            )}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Go to Dashboard</span>
            </button>

            <button
              onClick={handleGoBack}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Go Back</span>
            </button>

            <button
              onClick={handleSignOut}
              className="w-full px-4 py-3 text-gray-500 font-medium rounded-xl hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Sign in with a different account
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          If you believe this is an error, please contact your administrator.
        </p>
      </div>
    </div>
  );
};

export default Unauthorized;
