import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useParentStudents } from '../hooks/useParentStudents';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { hasStudents, loading: studentsLoading } = useParentStudents();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && !studentsLoading && user) {
      // Check if onboarding is completed
      const onboardingCompleted = localStorage.getItem('parent_onboarding_completed');
      
      // Only redirect to onboarding if:
      // 1. User is a parent
      // 2. Onboarding not completed
      // 3. User has no school linked OR no students linked (first-time user)
      if (
        profile?.role === 'parent' &&
        !onboardingCompleted &&
        (!profile?.school_id || !hasStudents) &&
        window.location.pathname !== '/parent/onboarding' &&
        window.location.pathname !== '/parent/link-school' &&
        window.location.pathname !== '/parent/link-child'
      ) {
        navigate('/parent/onboarding');
      }
      setChecking(false);
    } else if (!loading && !user) {
      setChecking(false);
    }
  }, [user, loading, studentsLoading, hasStudents, navigate, profile]);

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

