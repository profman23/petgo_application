import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useDeploymentUpdate = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const checkForUpdate = async () => {
      if (isChecking) return;
      
      setIsChecking(true);
      try {
        const response = await fetch('/api/version?' + Date.now(), {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (response.ok) {
          const serverVersion = await response.text();
          const clientVersion = localStorage.getItem('app_client_version');

          if (clientVersion && clientVersion !== serverVersion) {
            setUpdateAvailable(true);
            
            // Clear all caches
            await clearAppCaches();
            
            // Update client version
            localStorage.setItem('app_client_version', serverVersion);
            
            // Show update notification
            toast({
              title: "تحديث التطبيق",
              description: "تم اكتشاف تحديث جديد، سيتم إعادة تحميل التطبيق...",
              duration: 3000,
            });

            // Force reload after short delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
            
          } else if (!clientVersion) {
            // First time setup
            localStorage.setItem('app_client_version', serverVersion);
          }
        }
      } catch (error) {
        console.error('Update check failed:', error);
      } finally {
        setIsChecking(false);
      }
    };

    const clearAppCaches = async () => {
      try {
        // Clear Service Worker caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        }

        // Clear localStorage except essential data
        const essentialKeys = ['selectedLanguage', 'app_client_version'];
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && !essentialKeys.includes(key)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        console.log('✅ Application caches cleared for update');
      } catch (error) {
        console.error('Error clearing app caches:', error);
      }
    };

    // Initial check
    checkForUpdate();

    // Disabled automatic checks to prevent spam
    // checkInterval = setInterval(checkForUpdate, 5 * 60 * 1000);

    // Check when app becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdate();
      }
    };

    // Check when window gains focus
    const handleFocus = () => {
      checkForUpdate();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(checkInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isChecking, toast]);

  return {
    isChecking,
    updateAvailable
  };
};