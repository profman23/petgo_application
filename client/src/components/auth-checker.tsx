import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function AuthChecker() {
  const { toast } = useToast();

  useEffect(() => {
    // Disabled automatic auth checking to prevent refresh loops
    console.log('AuthChecker disabled to prevent infinite redirects');
    
    // Only do token cleanup if token is invalid, but don't redirect
    const checkTokenValidity = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('/api/rides/active', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
          // Token expired, only clear localStorage - no redirect
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          console.log('Invalid token cleared from localStorage');
        }
      } catch (error) {
        // Network error, ignore
      }
    };

    // Only check token validity without redirects
    const interval = setInterval(checkTokenValidity, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [toast]);

  return null;
}