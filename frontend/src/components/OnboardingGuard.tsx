import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    if (!loading && user) {
      // Check if AuthCallback is handling the redirect
      const authCallbackRedirect = sessionStorage.getItem('auth_callback_redirect');
      
      // Check actual data - user needs school AND children to be considered complete
      const needsSchool = !user.school_id;
      const needsChildren = !user.children || user.children.length === 0;
      
      if (
        isMounted &&
        !authCallbackRedirect &&
        user.role === 'parent' &&
        (needsSchool || needsChildren) &&
        window.location.pathname !== '/parent/onboarding' &&
        window.location.pathname !== '/parent/link-school' &&
        window.location.pathname !== '/parent/link-child' &&
        window.location.pathname !== '/auth/callback'
      ) {
        // Small delay to avoid race conditions with other navigation
        setTimeout(() => {
          if (isMounted) {
            navigate('/parent/onboarding', { replace: true });
          }
        }, 100);
      }
      setChecking(false);
    } else if (!loading && !user) {
      setChecking(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [user, loading, navigate]);

  if (loading || checking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default OnboardingGuard;

