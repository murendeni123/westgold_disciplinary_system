import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface Theme {
  brand: {
    schoolName: string;
    logoUrl: string | null;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  login: {
    headline: string;
    subtext: string;
    bannerUrl: string | null;
  };
  ui: {
    radius: number;
    density: 'compact' | 'comfortable';
  };
}

interface ThemeContextType {
  theme: Theme | null;
  isPreviewMode: boolean;
  previewSchoolName: string | null;
  exitPreview: () => void;
  publishPreview: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewSchoolName, setPreviewSchoolName] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check for preview mode
    const urlParams = new URLSearchParams(location.search);
    const previewParam = urlParams.get('previewTheme');
    const previewEnabled = sessionStorage.getItem('themePreviewEnabled') === 'true';
    const previewJson = sessionStorage.getItem('themePreviewJson');
    const previewSchool = sessionStorage.getItem('themePreviewSchool');

    if ((previewParam === '1' || previewEnabled) && previewJson) {
      try {
        const parsedTheme = JSON.parse(previewJson);
        setTheme(parsedTheme);
        setIsPreviewMode(true);
        setPreviewSchoolName(previewSchool);
        applyThemeVariables(parsedTheme);
      } catch (error) {
        console.error('Error parsing preview theme:', error);
        exitPreview();
      }
    } else {
      // Load active theme from school context if available
      // For now, we'll use default theme
      setIsPreviewMode(false);
      setTheme(null);
      resetThemeVariables();
    }
  }, [location]);

  const applyThemeVariables = (themeData: Theme) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', themeData.colors.primary);
    root.style.setProperty('--color-secondary', themeData.colors.secondary);
    root.style.setProperty('--color-accent', themeData.colors.accent);
    root.style.setProperty('--color-bg', themeData.colors.background);
    root.style.setProperty('--color-surface', themeData.colors.surface);
    root.style.setProperty('--color-text', themeData.colors.text);
    root.style.setProperty('--radius', `${themeData.ui.radius}px`);
  };

  const resetThemeVariables = () => {
    const root = document.documentElement;
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-secondary');
    root.style.removeProperty('--color-accent');
    root.style.removeProperty('--color-bg');
    root.style.removeProperty('--color-surface');
    root.style.removeProperty('--color-text');
    root.style.removeProperty('--radius');
  };

  const exitPreview = () => {
    sessionStorage.removeItem('themePreviewEnabled');
    sessionStorage.removeItem('themePreviewJson');
    sessionStorage.removeItem('themePreviewSchool');
    setIsPreviewMode(false);
    setTheme(null);
    setPreviewSchoolName(null);
    resetThemeVariables();
    
    // Remove preview param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('previewTheme');
    window.history.replaceState({}, '', url.toString());
  };

  const publishPreview = () => {
    // This would trigger the publish action in Theme Studio
    // For now, we'll just show an alert
    alert('Please return to Theme Studio to publish this theme.');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isPreviewMode,
        previewSchoolName,
        exitPreview,
        publishPreview,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
