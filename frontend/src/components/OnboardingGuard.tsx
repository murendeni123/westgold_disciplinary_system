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
    if (!loading && user) {
      // Check if onboarding is completed
      const onboardingCompleted = localStorage.getItem('parent_onboarding_completed');
      
      // Only redirect to onboarding if:
      // 1. User is a parent
      // 2. Onboarding not completed
      // 3. User has no school linked OR no children linked (first-time user)
      const needsSchool = !user.school_id;
      const needsChildren = !user.children || user.children.length === 0;
      
      if (
        user.role === 'parent' &&
        !onboardingCompleted &&
        (needsSchool || needsChildren) &&
        window.location.pathname !== '/parent/onboarding' &&
        window.location.pathname !== '/parent/link-school' &&
        window.location.pathname !== '/parent/link-child'
      ) {
        // Redirect to parent onboarding
        navigate('/parent/onboarding');
      }
      setChecking(false);
    } else if (!loading && !user) {
      setChecking(false);
    }
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

