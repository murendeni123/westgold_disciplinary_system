import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { axiosInstance } from '../services/api';
import { translations, SUPPORTED_LANGUAGES, SupportedLanguage } from '../locales';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LanguageContextType {
  /** Resolved language currently in use (user pref → global → 'en') */
  currentLanguage: SupportedLanguage;
  /** The user's personal preference (null = follow global) */
  userLanguage: SupportedLanguage | null;
  /** The school-wide global default */
  globalLanguage: SupportedLanguage;
  /** Translation helper */
  t: (key: string) => string;
  /** Set the current user's personal language preference */
  setUserLanguage: (lang: SupportedLanguage | null) => Promise<void>;
  /** Set the school-wide global default (admin only) */
  setGlobalLanguage: (lang: SupportedLanguage) => Promise<void>;
  /** Whether a language load is in progress */
  isLoadingLanguage: boolean;
  /** All supported language options */
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LS_USER_LANG = 'classly_user_language';
const LS_GLOBAL_LANG = 'classly_global_language';

// ─── Helper: deep-get a dotted key from translations ─────────────────────────

function deepGet(obj: any, key: string): string {
  const parts = key.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return key;
    current = current[part];
  }
  return typeof current === 'string' ? current : key;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userLanguage, setUserLangState] = useState<SupportedLanguage | null>(() => {
    const stored = localStorage.getItem(LS_USER_LANG);
    return stored ? (stored as SupportedLanguage) : null;
  });

  const [globalLanguage, setGlobalLangState] = useState<SupportedLanguage>(() => {
    const stored = localStorage.getItem(LS_GLOBAL_LANG);
    return stored ? (stored as SupportedLanguage) : 'en';
  });

  const [isLoadingLanguage, setIsLoadingLanguage] = useState(false);

  // Resolved: user pref → global → 'en'
  const currentLanguage: SupportedLanguage = userLanguage || globalLanguage || 'en';

  // ── Fetch resolved language from backend (runs after login) ──────────────

  const fetchResolvedLanguage = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoadingLanguage(true);
    try {
      const { data } = await axiosInstance.get('/language/resolve');
      const globalLang = (data.global_language as SupportedLanguage) || 'en';
      const userLang = (data.user_language as SupportedLanguage | null) || null;

      // Sync backend values into state + localStorage
      setUserLangState(userLang);
      if (userLang) {
        localStorage.setItem(LS_USER_LANG, userLang);
      } else {
        localStorage.removeItem(LS_USER_LANG);
      }

      setGlobalLangState(globalLang);
      localStorage.setItem(LS_GLOBAL_LANG, globalLang);
    } catch (_) {
      // Non-critical — keep using cached/default values
    } finally {
      setIsLoadingLanguage(false);
    }
  }, []); // stable — only needs to run once per login session

  useEffect(() => {
    fetchResolvedLanguage();
    // Re-fetch when token changes in another tab
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token') fetchResolvedLanguage();
    };
    // Re-fetch after login in the same tab (AuthContext dispatches this event)
    const onLogin = () => fetchResolvedLanguage();
    window.addEventListener('storage', onStorage);
    window.addEventListener('userLoggedIn', onLogin);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('userLoggedIn', onLogin);
    };
  }, [fetchResolvedLanguage]);

  // ── Set user's personal language ─────────────────────────────────────────

  const setUserLanguage = useCallback(async (lang: SupportedLanguage | null) => {
    const token = localStorage.getItem('token');

    // Optimistic update
    setUserLangState(lang);
    if (lang) {
      localStorage.setItem(LS_USER_LANG, lang);
    } else {
      localStorage.removeItem(LS_USER_LANG);
    }

    if (!token) return; // Not logged in, only update locally

    try {
      await axiosInstance.patch('/language/me', { language: lang });
    } catch (err) {
      console.error('Failed to save language preference to backend:', err);
    }
  }, []);

  // ── Set global language (admin only) ─────────────────────────────────────

  const setGlobalLanguage = useCallback(async (lang: SupportedLanguage) => {
    // Optimistic update
    setGlobalLangState(lang);
    localStorage.setItem(LS_GLOBAL_LANG, lang);

    try {
      await axiosInstance.patch('/language/global', { language: lang });
    } catch (err) {
      console.error('Failed to save global language to backend:', err);
      throw err;
    }
  }, []);

  // ── Translation function ──────────────────────────────────────────────────

  const t = useCallback(
    (key: string): string => {
      const dict = translations[currentLanguage] || translations['en'];
      const result = deepGet(dict, key);
      // Fallback to English if key missing in current language
      if (result === key && currentLanguage !== 'en') {
        return deepGet(translations['en'], key);
      }
      return result;
    },
    [currentLanguage]
  );

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        userLanguage,
        globalLanguage,
        t,
        setUserLanguage,
        setGlobalLanguage,
        isLoadingLanguage,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
