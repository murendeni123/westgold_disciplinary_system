/**
 * Supabase Authentication Context
 * 
 * Manages authentication state globally using Supabase Auth.
 * Handles session persistence, profile fetching, and auth state changes.
 * 
 * Key responsibilities:
 * - Restore session on app load
 * - Subscribe to auth state changes
 * - Fetch user profile from public.user_profiles
 * - Provide signIn/signOut methods
 * - Expose loading state to prevent UI flash
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile, UserRole } from '../types/supabase';
import type { AuthContextType, SignInResult } from '../types/auth';

// Create context with undefined default to enforce provider usage
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to access auth context
 * Throws if used outside AuthProvider to catch misuse early
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Core auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived role for convenience
  const role: UserRole | null = profile?.role ?? null;

  /**
   * Fetch user profile from public.user_profiles
   * Called after successful authentication to get role and other profile data
   */
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const ALLOWED_ROLES: UserRole[] = ['super_admin', 'school_admin', 'teacher', 'parent'];
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error.message);
        return null;
      }

      if (!data) {
        return null;
      }

      const profile = data as UserProfile;

      // Validate role to protect against corrupted data
      if (!ALLOWED_ROLES.includes(profile.role)) {
        console.error('Invalid role detected:', profile.role);
        throw new Error('Invalid role');
      }

      return profile;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  }, []);

  /**
   * Refresh profile data without re-authenticating
   * Useful after profile updates
   */
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user?.id) return;
    const profileData = await fetchProfile(user.id);
    if (profileData) {
      setProfile(profileData);
    }
  }, [user?.id, fetchProfile]);

  /**
   * Sign in with email and password
   * Returns result object with success status and role for redirect
   */
  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'No user returned from authentication' };
      }

      // Fetch profile to get role for redirect
      const profileData = await fetchProfile(data.user.id);
      
      // Fail-safe: Handle missing profile to prevent half-authenticated users
      if (!profileData) {
        // User exists in auth but not in profiles - sign them out
        await supabase.auth.signOut();
        return { success: false, error: 'User profile not found. Please contact support.' };
      }

      // State will be updated by onAuthStateChange listener
      return { success: true, role: profileData.role };
    } catch (err) {
      console.error('Sign in error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [fetchProfile]);

  /**
   * Sign out and clear all auth state
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error.message);
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err);
    } finally {
      // Always clear local state even if signOut fails
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  }, []);

  /**
   * Handle auth state changes from Supabase
   * This is the single source of truth for auth state
   */
  const handleAuthStateChange = useCallback(async (
    _event: string,
    currentSession: Session | null
  ) => {
    // Update session and user state
    setSession(currentSession);
    setUser(currentSession?.user ?? null);

    if (currentSession?.user) {
      // User is authenticated - fetch their profile
      const profileData = await fetchProfile(currentSession.user.id);
      setProfile(profileData);
    } else {
      // User is not authenticated - clear profile
      setProfile(null);
    }

    // Only set loading false after initial check
    setLoading(false);
  }, [fetchProfile]);

  /**
   * Initialize auth state on mount
   * - Get existing session
   * - Subscribe to auth changes
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get existing session from storage
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
          if (mounted) setLoading(false);
          return;
        }

        if (existingSession?.user && mounted) {
          setSession(existingSession);
          setUser(existingSession.user);
          
          // Fetch profile for existing session
          const profileData = await fetchProfile(existingSession.user.id);
          if (mounted) {
            setProfile(profileData);
            setLoading(false);
          }
        } else if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (mounted) {
          handleAuthStateChange(event, currentSession);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, handleAuthStateChange]);

  const value: AuthContextType = {
    user,
    session,
    profile,
    role,
    loading,
    signIn,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
