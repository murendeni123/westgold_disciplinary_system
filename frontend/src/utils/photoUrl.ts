/**
 * Utility function to construct proper photo URLs based on environment
 * Handles both development and production environments correctly
 */

/**
 * Get the base URL for the backend API
 * Uses environment variable in production, falls back to localhost in development
 */
export const getApiBaseUrl = (): string => {
  // In production, use the environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    return apiUrl;
  }
  
  // In development, check if we're on localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If running on localhost or 127.0.0.1, use localhost backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // If running on local network (e.g., 192.168.x.x), use local network backend
    if (hostname.startsWith('192.168.')) {
      return 'http://192.168.18.160:5000';
    }
  }
  
  // Default fallback
  return 'http://localhost:5000';
};

/**
 * Construct a full photo URL from a photo path
 * @param photoPath - The photo path from the database (e.g., "/uploads/students/photo-123.jpg")
 * @returns Full URL to the photo
 */
export const getPhotoUrl = (photoPath: string | null | undefined): string | null => {
  if (!photoPath) {
    return null;
  }
  
  // If the path is already a full URL (starts with http:// or https://), return as-is
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  
  // Otherwise, construct the full URL using the base URL
  const baseUrl = getApiBaseUrl();
  
  // Ensure photoPath starts with /
  const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
  
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Handle photo load errors by showing a placeholder
 * @param event - The error event from the img element
 */
export const handlePhotoError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const target = event.currentTarget;
  target.style.display = 'none';
  
  // Show the placeholder if it exists
  const placeholder = target.parentElement?.querySelector('.photo-placeholder');
  if (placeholder) {
    placeholder.classList.remove('hidden');
  }
};
