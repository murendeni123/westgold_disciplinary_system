import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface FeatureFlags {
  goldie_badge: boolean;
  [key: string]: boolean;
}

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  loading: boolean;
  isFeatureEnabled: (featureName: string) => boolean;
  refreshFlags: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export const FeatureFlagsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlags>({
    goldie_badge: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      // Check if user is authenticated before fetching
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🚩 No token found, setting default flags');
        setFlags({ goldie_badge: false });
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log('🔄 Fetching feature flags...');
      const response = await api.getCurrentFeatureFlags();
      console.log('✅ Feature flags received:', response.data);
      setFlags(response.data);
    } catch (error: any) {
      console.error('❌ Error fetching feature flags:', error);
      console.error('Error details:', error.response?.data);
      // Set default flags on error (don't throw to prevent breaking the app)
      setFlags({ goldie_badge: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
    
    // Re-fetch when token changes (user logs in/out)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        console.log('🔄 Token/user changed, refetching flags...');
        fetchFlags();
      }
    };
    
    // Re-fetch when user logs in
    const handleUserLogin = () => {
      console.log('🔑 User logged in, refetching flags...');
      setTimeout(() => fetchFlags(), 100); // Small delay to ensure token is set
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLoggedIn', handleUserLogin);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleUserLogin);
    };
  }, []);

  const isFeatureEnabled = (featureName: string): boolean => {
    return flags[featureName] === true;
  };

  const refreshFlags = async () => {
    await fetchFlags();
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, isFeatureEnabled, refreshFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};
