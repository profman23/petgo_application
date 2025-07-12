import { useEffect, useState } from 'react';
import { CacheManager } from '@/utils/cacheManager';
import { useToast } from '@/hooks/use-toast';
import { useDeploymentUpdate } from '@/hooks/useDeploymentUpdate';

export const CacheManagerComponent = () => {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();
  const { isChecking, updateAvailable } = useDeploymentUpdate();

  useEffect(() => {
    // Initialize cache management on component mount
    const initializeCache = async () => {
      try {
        const cacheCleared = await CacheManager.checkAndClearCache();
        
        if (cacheCleared) {
          toast({
            title: "تم تحديث التطبيق",
            description: "تم تنظيف الكاش تلقائياً للحصول على أحدث إصدار",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Cache initialization error:', error);
      }
    };

    initializeCache();

    // Listen for Service Worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CACHE_UPDATED') {
          toast({
            title: "تحديث متوفر",
            description: "تم تحديث التطبيق، اعد تحميل الصفحة للحصول على آخر تحديث",
            duration: 5000,
          });
        }
      });
    }

    // Check for updates periodically
    const updateInterval = setInterval(async () => {
      const updateAvailable = await CacheManager.checkForUpdates();
      if (updateAvailable) {
        toast({
          title: "تحديث جديد",
          description: "تم اكتشاف تحديث جديد وتنظيف الكاش تلقائياً",
          duration: 4000,
        });
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      clearInterval(updateInterval);
    };
  }, [toast]);

  const handleManualCacheClear = async () => {
    setIsClearing(true);
    try {
      await CacheManager.clearAllCaches();
      
      toast({
        title: "تم مسح الكاش",
        description: "تم مسح جميع الكاش المحفوظ بنجاح",
        duration: 3000,
      });

      // Force reload after cache clear
      setTimeout(() => {
        CacheManager.forceReload();
      }, 1000);
      
    } catch (error) {
      console.error('Manual cache clear error:', error);
      toast({
        title: "خطأ في مسح الكاش",
        description: "حدث خطأ أثناء مسح الكاش، جرب مرة أخرى",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsClearing(false);
    }
  };

  // Only show manual clear button in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={handleManualCacheClear}
        disabled={isClearing}
        className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
      >
        {isClearing ? 'جاري المسح...' : 'مسح الكاش'}
      </button>
    </div>
  );
};