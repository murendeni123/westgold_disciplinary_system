import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const { user, loading } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Prevent double processing
      if (hasProcessed.current) return;
      hasProcessed.current = true;
      
      console.log('AuthCallback: Starting OAuth callback handling');
      console.log('AuthCallback: Current URL:', window.location.href);
      console.log('AuthCallback: Hash:', window.location.hash);
      console.log('AuthCallback: Search:', window.location.search);
      
      if (!supabase) {
        console.error('AuthCallback: Supabase not configured');
        setStatus('error');
        setMessage('Supabase is not configured');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        // Check for error in URL params
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || error);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Check for code in URL (PKCE flow - newer Supabase default)
        const code = urlParams.get('code');
        
        if (code) {
          console.log('AuthCallback: Found authorization code, exchanging for session...');
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('AuthCallback: Code exchange error:', exchangeError);
            setStatus('error');
            setMessage(exchangeError.message);
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
          
          if (data.session) {
            console.log('AuthCallback: Session established via PKCE for:', data.session.user.email);
            // onAuthStateChange in AuthContext will handle the sync
            return;
          }
        }
        
        // Check for tokens in hash (implicit flow - older method)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          console.log('AuthCallback: Found access_token in hash, getting session...');
          
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('AuthCallback: Session error:', sessionError);
            setStatus('error');
            setMessage(sessionError.message);
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
          
          if (data.session) {
            console.log('AuthCallback: Session established via hash for:', data.session.user.email);
            return;
          }
        }
        
        // No code or token found, check if we already have a session
        console.log('AuthCallback: No code/token in URL, checking existing session...');
        const { data: existingSession } = await supabase.auth.getSession();
        
        if (existingSession.session) {
          console.log('AuthCallback: Found existing session for:', existingSession.session.user.email);
          return;
        }
        
        console.log('AuthCallback: No session found, will wait for auth state change...');
        
      } catch (err: any) {
        console.error('AuthCallback: Exception:', err);
        setStatus('error');
        setMessage(err.message || 'Authentication failed');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  // Watch for user state changes
  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      console.log('AuthCallback: Auth still loading...');
      return;
    }

    // If user is authenticated, redirect
    if (user) {
      console.log('AuthCallback: User authenticated:', user.email, 'Role:', user.role);
      console.log('AuthCallback: User school_id:', user.school_id, 'Children:', user.children?.length || 0);
      
      // Check if this is a signup (new user) vs login (existing user)
      const isSignup = searchParams.get('signup') === 'true';
      
      // Check if parent user needs onboarding (no school or no children linked)
      const needsOnboarding = user.role === 'parent' && (!user.school_id || !user.children || user.children.length === 0);
      
      setStatus('success');
      setMessage(needsOnboarding || isSignup ? 'Account created successfully!' : 'Signed in successfully!');
      
      setTimeout(() => {
        // Set a flag to prevent OnboardingGuard from interfering
        sessionStorage.setItem('auth_callback_redirect', 'true');
        
        // Redirect based on user role and onboarding status
        // For new signups OR users missing school/children, go to onboarding
        if (user.role === 'parent' && (isSignup || needsOnboarding)) {
          console.log('AuthCallback: Redirecting to parent onboarding (isSignup:', isSignup, 'needsOnboarding:', needsOnboarding, ')');
          navigate('/parent/onboarding', { replace: true });
        } else {
          console.log('AuthCallback: Redirecting to dashboard:', `/${user.role}`);
          navigate(`/${user.role}`, { replace: true });
        }
        
        // Clear the flag after navigation
        setTimeout(() => sessionStorage.removeItem('auth_callback_redirect'), 500);
      }, 1500);
    } else {
      console.log('AuthCallback: No user yet, waiting...');
      // No user after loading complete - give more time
      const timeout = setTimeout(() => {
        if (!user) {
          console.log('AuthCallback: Timeout - no user found');
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      }, 5000); // Increased timeout to 5 seconds

      return () => clearTimeout(timeout);
    }
  }, [user, loading, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="mx-auto mb-6 w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
            />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{message}</h2>
            <p className="text-gray-600">Please wait...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              <CheckCircle className="mx-auto mb-6 text-green-500" size={64} />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{message}</h2>
            <p className="text-gray-600">Redirecting...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              <XCircle className="mx-auto mb-6 text-red-500" size={64} />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AuthCallback;
