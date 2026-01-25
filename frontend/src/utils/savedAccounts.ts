// Utility functions for managing saved login accounts

export interface SavedAccount {
  email: string;
  lastLogin: string;
  displayName?: string;
}

const STORAGE_KEY = 'savedAccounts';
const MAX_ACCOUNTS = 5;

/**
 * Get all saved accounts from localStorage
 */
export const getSavedAccounts = (): SavedAccount[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading saved accounts:', error);
    return [];
  }
};

/**
 * Save an account after successful login
 */
export const saveAccount = (email: string, displayName?: string): void => {
  try {
    const accounts = getSavedAccounts();
    
    // Remove existing entry for this email
    const filtered = accounts.filter(acc => acc.email !== email);
    
    // Add new entry at the beginning
    const newAccount: SavedAccount = {
      email,
      lastLogin: new Date().toISOString(),
      displayName,
    };
    
    const updated = [newAccount, ...filtered].slice(0, MAX_ACCOUNTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving account:', error);
  }
};

/**
 * Remove a saved account
 */
export const removeAccount = (email: string): void => {
  try {
    const accounts = getSavedAccounts();
    const filtered = accounts.filter(acc => acc.email !== email);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing account:', error);
  }
};

/**
 * Clear all saved accounts
 */
export const clearAllAccounts = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing accounts:', error);
  }
};

/**
 * Format last login time as relative time
 */
export const formatLastLogin = (lastLogin: string): string => {
  const now = new Date();
  const loginDate = new Date(lastLogin);
  const diffMs = now.getTime() - loginDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return loginDate.toLocaleDateString();
};
