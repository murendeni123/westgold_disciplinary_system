import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import axios from 'axios';

interface PlatformUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

interface PlatformAuthContextType {
  user: PlatformUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const PlatformAuthContext = createContext<PlatformAuthContextType | undefined>(undefined);

export const usePlatformAuth = () => {
  const context = useContext(PlatformAuthContext);
  if (!context) {
    // Return default values if not in provider (for non-platform routes)
    return {
      user: null,
      token: null,
      login: async () => {},
      logout: () => {},
      loading: false,
    };
  }
  return context;
};

export const PlatformAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('platform_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize from localStorage on mount
    const storedToken = localStorage.getItem('platform_token');
    const storedUser = localStorage.getItem('platform_user');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        // Clear invalid data
        localStorage.removeItem('platform_token');
        localStorage.removeItem('platform_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.platformLogin(email, password);
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('platform_token', newToken);
      localStorage.setItem('platform_user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('platform_token');
    localStorage.removeItem('platform_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <PlatformAuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </PlatformAuthContext.Provider>
  );
};

