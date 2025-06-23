import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function AuthChecker() {
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // No token, redirect to login
        window.location.href = '/login';
        return;
      }

      try {
        // Test token validity
        const response = await fetch('/api/rides/active', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
          // Token expired, clear and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast({
            title: 'انتهت جلسة العمل',
            description: 'يتم إعادة توجيهك لتسجيل الدخول...',
            variant: 'destructive',
          });
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      } catch (error) {
        // Network error, ignore
      }
    };

    // Check immediately on mount
    checkAuth();
    
    // Check every 10 seconds
    const interval = setInterval(checkAuth, 10000);
    
    return () => clearInterval(interval);
  }, [toast]);

  return null;
}