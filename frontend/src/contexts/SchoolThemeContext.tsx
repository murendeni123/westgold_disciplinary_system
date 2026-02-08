import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface SchoolCustomizations {
  // Branding
  logo_path?: string | null;
  favicon_path?: string | null;
  login_background_path?: string | null;
  dashboard_background_path?: string | null;
  
  // Colors
  primary_color?: string;
  secondary_color?: string;
  success_color?: string;
  warning_color?: string;
  danger_color?: string;
  background_color?: string;
  text_primary_color?: string;
  text_secondary_color?: string;
  
  // Typography
  primary_font?: string;
  secondary_font?: string;
  base_font_size?: string;
  
  // UI Components
  button_border_radius?: string;
  card_border_radius?: string;
  sidebar_background?: string;
  header_background?: string;
  
  // Login Page
  login_welcome_message?: string | null;
  login_tagline?: string | null;
  login_background_color?: string;
  
  // Content
  contact_email?: string | null;
  contact_phone?: string | null;
  support_email?: string | null;
  terms_url?: string | null;
  privacy_url?: string | null;
  
  // Advanced
  custom_css?: string | null;
  custom_js?: string | null;
}

interface SchoolThemeContextType {
  customizations: SchoolCustomizations | null;
  loading: boolean;
  refreshCustomizations: () => Promise<void>;
  getImageUrl: (path: string | null | undefined) => string | null;
}

const SchoolThemeContext = createContext<SchoolThemeContextType | undefined>(undefined);

export const useSchoolTheme = () => {
  const context = useContext(SchoolThemeContext);
  if (!context) {
    return {
      customizations: null,
      loading: false,
      refreshCustomizations: async () => {},
      getImageUrl: () => null,
    };
  }
  return context;
};

interface SchoolThemeProviderProps {
  children: ReactNode;
  schoolId?: number | null;
}

export const SchoolThemeProvider: React.FC<SchoolThemeProviderProps> = ({ children, schoolId }) => {
  const [customizations, setCustomizations] = useState<SchoolCustomizations | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const getImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    const getApiBaseUrl = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
          return 'http://192.168.18.160:5000';
        }
      }
      return 'http://localhost:5000';
    };
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${path}`;
  };

  const fetchCustomizations = async () => {
    try {
      setLoading(true);
      const targetSchoolId = schoolId || user?.school_id;
      
      if (!targetSchoolId) {
        setCustomizations(null);
        setLoading(false);
        return;
      }

      // Only fetch if we have a school_id (not for platform admin)
      if (user?.role === 'platform_admin') {
        setCustomizations(null);
        setLoading(false);
        return;
      }

      // First try to get published theme from new Theme Builder API
      try {
        const themeResponse = await api.getPublishedTheme(targetSchoolId);
        if (themeResponse.data.theme) {
          // Apply new theme system
          applyThemeTokens(themeResponse.data.theme);
          setCustomizations(null); // Clear old customizations
          setLoading(false);
          return;
        }
      } catch (themeError) {
        // If no published theme exists, fall back to old customizations
        console.log('No published theme found, using legacy customizations');
      }

      // Fallback to old customizations API
      const response = await api.getSchoolCustomizationsPublic(targetSchoolId);
      setCustomizations(response.data || null);
      applyCustomizations(response.data);
    } catch (error) {
      console.error('Error fetching school customizations:', error);
      setCustomizations(null);
    } finally {
      setLoading(false);
    }
  };

  const applyThemeTokens = (theme: any) => {
    if (!theme || !theme.tokens) return;

    const { tokens, assets, advanced_overrides } = theme;

    // Apply color tokens
    if (tokens.colors) {
      Object.entries(tokens.colors).forEach(([key, value]) => {
        const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        document.documentElement.style.setProperty(`--${cssVar}`, value as string);
      });
    }

    // Apply typography tokens
    if (tokens.typography) {
      document.documentElement.style.setProperty('--primary-font', tokens.typography.fontPrimary);
      document.documentElement.style.setProperty('--secondary-font', tokens.typography.fontSecondary);
      document.documentElement.style.setProperty('--base-font-size', tokens.typography.baseFontSize);
      
      if (tokens.typography.headingScale) {
        Object.entries(tokens.typography.headingScale).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--heading-${key}`, value as string);
        });
      }
      
      if (tokens.typography.fontWeights) {
        Object.entries(tokens.typography.fontWeights).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--font-weight-${key}`, String(value));
        });
      }
      
      if (tokens.typography.lineHeights) {
        Object.entries(tokens.typography.lineHeights).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--line-height-${key}`, String(value));
        });
      }
    }

    // Apply component tokens
    if (tokens.components) {
      document.documentElement.style.setProperty('--button-radius', tokens.components.buttonRadius);
      document.documentElement.style.setProperty('--card-radius', tokens.components.cardRadius);
      document.documentElement.style.setProperty('--input-radius', tokens.components.inputRadius);
      document.documentElement.style.setProperty('--border-width', tokens.components.borderWidth);
      
      if (tokens.components.spacingScale) {
        Object.entries(tokens.components.spacingScale).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--spacing-${key}`, value as string);
        });
      }
    }

    // Apply layout tokens
    if (tokens.layout) {
      document.documentElement.style.setProperty('--sidebar-width', tokens.layout.sidebarWidth);
      document.documentElement.style.setProperty('--header-height', tokens.layout.headerHeight);
    }

    // Apply favicon
    if (assets?.favicon) {
      const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = assets.favicon;
      }
    }

    // Apply custom CSS
    if (advanced_overrides?.customCss) {
      const existingStyle = document.getElementById('school-custom-css');
      if (existingStyle) existingStyle.remove();
      
      const style = document.createElement('style');
      style.id = 'school-custom-css';
      style.textContent = advanced_overrides.customCss;
      document.head.appendChild(style);
    }
  };

  const applyCustomizations = (customs: SchoolCustomizations | null) => {
    if (!customs) {
      // Reset to defaults
      document.documentElement.style.setProperty('--primary-color', '#3b82f6');
      document.documentElement.style.setProperty('--secondary-color', '#8b5cf6');
      document.documentElement.style.setProperty('--success-color', '#10b981');
      document.documentElement.style.setProperty('--warning-color', '#f59e0b');
      document.documentElement.style.setProperty('--danger-color', '#ef4444');
      document.documentElement.style.setProperty('--background-color', '#f9fafb');
      document.documentElement.style.setProperty('--text-primary-color', '#111827');
      document.documentElement.style.setProperty('--text-secondary-color', '#6b7280');
      document.documentElement.style.setProperty('--button-border-radius', '8px');
      document.documentElement.style.setProperty('--card-border-radius', '12px');
      document.documentElement.style.setProperty('--sidebar-background', '#ffffff');
      document.documentElement.style.setProperty('--header-background', '#ffffff');
      document.documentElement.style.setProperty('--primary-font', 'Inter');
      document.documentElement.style.setProperty('--secondary-font', 'Inter');
      document.documentElement.style.setProperty('--base-font-size', '16px');
      
      // Remove custom CSS/JS
      const existingStyle = document.getElementById('school-custom-css');
      const existingScript = document.getElementById('school-custom-js');
      if (existingStyle) existingStyle.remove();
      if (existingScript) existingScript.remove();
      
      // Reset favicon
      const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = '/favicon.ico';
      }
      
      return;
    }

    // Apply CSS variables
    if (customs.primary_color) {
      document.documentElement.style.setProperty('--primary-color', customs.primary_color);
    }
    if (customs.secondary_color) {
      document.documentElement.style.setProperty('--secondary-color', customs.secondary_color);
    }
    if (customs.success_color) {
      document.documentElement.style.setProperty('--success-color', customs.success_color);
    }
    if (customs.warning_color) {
      document.documentElement.style.setProperty('--warning-color', customs.warning_color);
    }
    if (customs.danger_color) {
      document.documentElement.style.setProperty('--danger-color', customs.danger_color);
    }
    if (customs.background_color) {
      document.documentElement.style.setProperty('--background-color', customs.background_color);
    }
    if (customs.text_primary_color) {
      document.documentElement.style.setProperty('--text-primary-color', customs.text_primary_color);
    }
    if (customs.text_secondary_color) {
      document.documentElement.style.setProperty('--text-secondary-color', customs.text_secondary_color);
    }
    if (customs.button_border_radius) {
      document.documentElement.style.setProperty('--button-border-radius', customs.button_border_radius);
    }
    if (customs.card_border_radius) {
      document.documentElement.style.setProperty('--card-border-radius', customs.card_border_radius);
    }
    if (customs.sidebar_background) {
      document.documentElement.style.setProperty('--sidebar-background', customs.sidebar_background);
    }
    if (customs.header_background) {
      document.documentElement.style.setProperty('--header-background', customs.header_background);
    }
    if (customs.primary_font) {
      document.documentElement.style.setProperty('--primary-font', customs.primary_font);
    }
    if (customs.secondary_font) {
      document.documentElement.style.setProperty('--secondary-font', customs.secondary_font);
    }
    if (customs.base_font_size) {
      document.documentElement.style.setProperty('--base-font-size', customs.base_font_size);
    }

    // Load custom fonts
    if (customs.primary_font && customs.primary_font !== 'Inter') {
      loadFont(customs.primary_font);
    }
    if (customs.secondary_font && customs.secondary_font !== 'Inter' && customs.secondary_font !== customs.primary_font) {
      loadFont(customs.secondary_font);
    }

    // Apply custom CSS
    if (customs.custom_css) {
      let styleElement = document.getElementById('school-custom-css') as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'school-custom-css';
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = customs.custom_css;
    } else {
      const existingStyle = document.getElementById('school-custom-css');
      if (existingStyle) existingStyle.remove();
    }

    // Apply custom JS
    if (customs.custom_js) {
      let scriptElement = document.getElementById('school-custom-js') as HTMLScriptElement;
      if (scriptElement) {
        scriptElement.remove(); // Remove old script before adding new one
      }
      scriptElement = document.createElement('script');
      scriptElement.id = 'school-custom-js';
      scriptElement.textContent = customs.custom_js;
      document.head.appendChild(scriptElement);
    } else {
      const existingScript = document.getElementById('school-custom-js');
      if (existingScript) existingScript.remove();
    }

    // Apply favicon
    if (customs.favicon_path) {
      const faviconUrl = getImageUrl(customs.favicon_path);
      if (faviconUrl) {
        let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.rel = 'icon';
          document.head.appendChild(favicon);
        }
        favicon.href = faviconUrl;
      }
    }
  };

  const loadFont = (fontName: string) => {
    // Check if font is already loaded
    if (document.fonts.check(`1em "${fontName}"`)) {
      return;
    }

    // Try to load from Google Fonts
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  };

  useEffect(() => {
    fetchCustomizations();
  }, [schoolId, user?.school_id]);

  const refreshCustomizations = async () => {
    await fetchCustomizations();
  };

  return (
    <SchoolThemeContext.Provider
      value={{
        customizations,
        loading,
        refreshCustomizations,
        getImageUrl,
      }}
    >
      {children}
    </SchoolThemeContext.Provider>
  );
};

