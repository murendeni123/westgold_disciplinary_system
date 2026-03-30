import { useLocation } from 'react-router-dom';

/**
 * Returns the current portal base path so shared pages can build
 * correct navigate() URLs regardless of which portal renders them.
 * e.g. /admin, /grade-head, /teacher
 */
export const usePortalPrefix = (): string => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/grade-head')) return '/grade-head';
  if (pathname.startsWith('/teacher')) return '/teacher';
  return '/admin';
};
