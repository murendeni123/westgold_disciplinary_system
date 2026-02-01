import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { saveAccount } from '../utils/savedAccounts';
import { supabase, isSupabaseConfigured, getSupabaseSession } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { axiosInstance as api } from '../services/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'parent' | 'platform_admin';
  school_id?: number;
  teacher?: any;
  children?: any[];
  supabase_user_id?: string;
  auth_provider?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signupWithGoogle: () => Promise<void>;
  signupWithEmail: (email: string, password: string, name: string) => Promise<{ requiresVerification: boolean; message: string } | undefined>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateUser: (userData: User) => void;
  isSupabaseEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const isSupabaseEnabled = isSupabaseConfigured();

  useEffect(() => {
    // One-time fix: Clear potentially corrupted auth data
    const needsReset = localStorage.getItem('auth_needs_reset');
    if (needsReset !== 'false') {
      console.log('Clearing auth data to fix refresh loop...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.setItem('auth_needs_reset', 'false');
    }
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Supabase auth event:', event);
        setSupabaseSession(session);
        
        if (event === 'SIGNED_IN' && session) {
          await handleSupabaseSignIn(session);
        } else if (event === 'SIGNED_OUT') {
          handleSignOut();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isSupabaseEnabled]);

  const initializeAuth = async () => {
    try {
      console.log('Initializing auth, Supabase enabled:', isSupabaseEnabled);
      
      if (isSupabaseEnabled && supabase) {
        // Check for OAuth callback in URL (hash contains access_token)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          console.log('Found access_token in URL hash, getting session...');
        }
        
        const session = await getSupabaseSession();
        console.log('Supabase session:', session ? 'Found' : 'Not found');
        
        if (session) {
          setSupabaseSession(session);
          await handleSupabaseSignIn(session);
          return;
        }
      }
      
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Try to fetch user, but don't loop if it fails
        try {
          const response = await api.get('/auth/me');
          const userData = response.data.user;
          setUser(userData);
        } catch (error: any) {
          console.error('Error fetching user on init:', error);
          
          // Handle outdated token - force re-login
          if (error.response?.data?.code === 'TOKEN_OUTDATED' || 
              error.response?.data?.code === 'TOKEN_MISSING_CONTEXT') {
            console.log('Token outdated or missing context - clearing and requiring re-login');
            handleSignOut();
          } else if (error.response?.status === 401 || error.response?.status === 403) {
            // Other auth errors - clear token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error initializing auth:', error);
      setLoading(false);
    }
  };

  const handleSupabaseSignIn = async (session: Session) => {
    try {
      console.log('Handling Supabase sign in for:', session.user.email);
      console.log('User metadata:', session.user.user_metadata);
      console.log('App metadata:', session.user.app_metadata);
      
      const syncData = {
        supabase_user_id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
        auth_provider: session.user.app_metadata?.provider || 'google',
      };
      
      console.log('Sending sync request:', syncData);
      
      const response = await api.post('/auth/supabase-sync', syncData);

      console.log('Sync response:', response.data);

      const { user: userData, token: jwtToken } = response.data;
      
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error syncing Supabase user:', error);
      console.error('Error response:', error.response?.data);
      setLoading(false);
      throw error;
    }
  };

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      // Only clear token if it's actually invalid (401/403), not for network errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Token invalid, clearing...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Store school context for tenant-scoped API requests
      if (userData.schoolId) {
        localStorage.setItem('schoolId', userData.schoolId.toString());
      }
      if (userData.schemaName) {
        localStorage.setItem('schemaName', userData.schemaName);
      }
      if (userData.schoolName) {
        localStorage.setItem('schoolName', userData.schoolName);
      }
      if (userData.schoolCode) {
        localStorage.setItem('schoolCode', userData.schoolCode);
      }
      
      // For school admin users, fetch and store school-info immediately after login
      // This ensures school context is available before any dashboard API calls
      if (userData.role !== 'platform_admin' && userData.schoolId) {
        try {
          const schoolInfoResponse = await api.get('/school-info');
          if (schoolInfoResponse.data) {
            localStorage.setItem('school_info', JSON.stringify(schoolInfoResponse.data));
            // Dispatch event to notify components that school context is ready
            window.dispatchEvent(new CustomEvent('schoolContextReady', { 
              detail: { schoolId: userData.schoolId, schoolInfo: schoolInfoResponse.data }
            }));
          }
        } catch (error) {
          console.error('Error fetching school info after login:', error);
          // Don't fail login if school-info fetch fails
        }
      }
      
      // Save email to saved accounts for quick login next time
      saveAccount(email, userData.name);
      
      // Trigger event to refresh feature flags
      window.dispatchEvent(new CustomEvent('userLoggedIn'));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const loginWithGoogle = async () => {
    if (!isSupabaseEnabled || !supabase) {
      throw new Error('Supabase is not configured. Please set up environment variables.');
    }
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.message || 'Google login failed');
    }
  };

  const signupWithGoogle = async () => {
    if (!isSupabaseEnabled || !supabase) {
      throw new Error('Supabase is not configured. Please set up environment variables.');
    }
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?signup=true`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Google signup error:', error);
      throw new Error(error.message || 'Google signup failed');
    }
  };

  const signupWithEmail = async (email: string, password: string, name: string) => {
    if (!isSupabaseEnabled || !supabase) {
      throw new Error('Supabase is not configured. Please set up environment variables.');
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?signup=true`,
          data: {
            full_name: name,
          },
        },
      });
      
      if (error) throw error;
      
      console.log('Signup response:', { user: data.user?.id, session: !!data.session });
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required - user will receive verification email
        console.log('Email verification required for:', email);
        return {
          requiresVerification: true,
          message: 'Please check your email to verify your account before signing in.'
        };
      }
      
      // If session exists (auto-confirm enabled in Supabase), sign in immediately
      if (data.session) {
        console.log('Auto-confirm enabled, signing in user:', email);
        await handleSupabaseSignIn(data.session);
        return {
          requiresVerification: false,
          message: 'Account created successfully!'
        };
      }
      
      return {
        requiresVerification: true,
        message: 'Please check your email to verify your account.'
      };
    } catch (error: any) {
      console.error('Email signup error:', error);
      throw new Error(error.message || 'Signup failed');
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    if (!isSupabaseEnabled || !supabase) {
      throw new Error('Supabase is not configured. Please set up environment variables.');
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });

      if (error) throw error;

      if (data.session) {
        console.log('OTP verified successfully, signing in user');
        await handleSupabaseSignIn(data.session);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      throw new Error(error.message || 'Invalid or expired verification code');
    }
  };

  const resendVerificationEmail = async (email: string) => {
    if (!isSupabaseEnabled || !supabase) {
      throw new Error('Supabase is not configured. Please set up environment variables.');
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?signup=true`,
        }
      });

      if (error) throw error;
      console.log('Verification email resent to:', email);
    } catch (error: any) {
      console.error('Resend verification error:', error);
      throw new Error(error.message || 'Failed to resend verification email');
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseEnabled && supabase && supabaseSession) {
        await supabase.auth.signOut();
      }
      handleSignOut();
    } catch (error) {
      console.error('Logout error:', error);
      handleSignOut();
    }
  };

  const handleSignOut = () => {
    setToken(null);
    setUser(null);
    setSupabaseSession(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUser();
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      loginWithGoogle,
      signupWithGoogle,
      signupWithEmail,
      verifyOtp,
      resendVerificationEmail,
      logout, 
      loading, 
      refreshUser, 
      updateUser,
      isSupabaseEnabled
    }}>
      {children}
    </AuthContext.Provider>
  );
};

