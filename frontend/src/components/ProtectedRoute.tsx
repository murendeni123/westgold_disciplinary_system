import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { usePlatformAuth } from '../contexts/PlatformAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'teacher' | 'parent' | 'platform_admin')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const { user: platformUser, loading: platformLoading, token: platformToken } = usePlatformAuth();

  // Check if this is a platform route
  const isPlatformRoute = allowedRoles.includes('platform_admin');
  const currentUser = isPlatformRoute ? platformUser : user;
  const isLoading = isPlatformRoute ? platformLoading : loading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // For platform routes, check both user and token
  if (isPlatformRoute) {
    if (!platformUser || !platformToken) {
      return <Navigate to="/platform/login" replace />;
    }
    if (platformUser.role !== 'platform_admin') {
      return <Navigate to="/platform/login" replace />;
    }
    return <>{children}</>;
  }

  // For regular routes
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const userRole = currentUser.role as 'admin' | 'teacher' | 'parent' | 'platform_admin';
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={`/${currentUser.role}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;



