import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

// Component to show cache status and force refresh if needed
export function CacheStatus() {
  const [cacheCleared, setCacheCleared] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkCacheStatus = async () => {
      try {
        // Check if caches exist
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          const hasOldCaches = cacheNames.some(name => 
            name.includes('api') || name.includes('notification')
          );
          
          if (hasOldCaches) {
            // Clear problematic caches
            await Promise.all(
              cacheNames
                .filter(name => name.includes('api') || name.includes('notification'))
                .map(name => caches.delete(name))
            );
            console.log('🧹 Cleared problematic caches');
          }
        }
        
        setCacheCleared(true);
        setIsChecking(false);
      } catch (error) {
        console.error('Cache check failed:', error);
        setIsChecking(false);
      }
    };

    checkCacheStatus();
  }, []);

  const forceRefresh = () => {
    // Disabled window.location.reload() to prevent refresh loops
    console.log('Refresh request blocked to prevent infinite loop');
  };

  if (isChecking) {
    return (
      <div className="fixed top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2 z-50">
        <RefreshCw className="w-4 h-4 animate-spin" />
        تحقق من الذاكرة المؤقتة...
      </div>
    );
  }

  if (!cacheCleared) {
    return (
      <div className="fixed top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2 z-50">
        <AlertCircle className="w-4 h-4" />
        <span>قد تحتاج لتحديث الصفحة</span>
        <button onClick={forceRefresh} className="bg-white bg-opacity-20 px-2 py-1 rounded">
          تحديث
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2 z-50 opacity-75">
      <CheckCircle className="w-4 h-4" />
      الذاكرة محدثة
    </div>
  );
}