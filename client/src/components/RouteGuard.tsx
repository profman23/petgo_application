import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  redirectTo?: string;
}

export const RouteGuard = ({ 
  children, 
  requiredPermission = '',
  redirectTo = '/admin-dashboard' 
}: RouteGuardProps) => {
  const { isAuthenticated, hasPermission, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setLocation('/admin-login');
      return;
    }

    // Check specific permissions
    if (requiredPermission === 'usersAccess') {
      // If admin has usersHidden permission, they cannot access users
      if (hasPermission('usersHidden')) {
        setLocation(redirectTo);
        return;
      }
    }
  }, [isAuthenticated, isLoading, hasPermission, requiredPermission, redirectTo, setLocation]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if access is denied
  if (requiredPermission === 'usersAccess' && hasPermission('usersHidden')) {
    return null;
  }

  return <>{children}</>;
};