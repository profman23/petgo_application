// Cache management utilities for automatic cache clearing after deployment
export class CacheManager {
  private static readonly CACHE_VERSION_KEY = 'app_cache_version';
  private static readonly CURRENT_VERSION = Date.now().toString();
  
  // Check if cache needs to be cleared (version mismatch)
  static async checkAndClearCache(): Promise<boolean> {
    try {
      const storedVersion = localStorage.getItem(this.CACHE_VERSION_KEY);
      
      if (storedVersion !== this.CURRENT_VERSION) {
        await this.clearAllCaches();
        localStorage.setItem(this.CACHE_VERSION_KEY, this.CURRENT_VERSION);
        console.log('Cache cleared due to version update');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking cache version:', error);
      return false;
    }
  }
  
  // Clear all types of caches
  static async clearAllCaches(): Promise<void> {
    try {
      // Clear localStorage (except essential data)
      const essentialKeys = ['selectedLanguage', 'app_cache_version'];
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
      
      // Clear Service Worker caches
      if ('serviceWorker' in navigator && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      console.log('All caches cleared successfully');
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }
  
  // Force reload with cache bypass
  static forceReload(): void {
    // Add timestamp to force cache bypass
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('_t', Date.now().toString());
    window.location.href = currentUrl.toString();
  }
  
  // Check for app updates
  static async checkForUpdates(): Promise<boolean> {
    try {
      const response = await fetch('/api/version?' + Date.now(), {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const serverVersion = await response.text();
        const clientVersion = localStorage.getItem(this.CACHE_VERSION_KEY);
        
        if (serverVersion !== clientVersion) {
          await this.clearAllCaches();
          localStorage.setItem(this.CACHE_VERSION_KEY, serverVersion);
          
          // Show deployment update notification
          console.log('🚀 تم اكتشاف نشر جديد - تنظيف الكاش تلقائياً');
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
    return false;
  }

  // Detect if running after deployment
  static isPostDeployment(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('utm_source') && urlParams.get('utm_source') === 'pwa';
  }
}

// Auto-check cache on app start
export const initializeCacheManager = async (): Promise<void> => {
  const cacheCleared = await CacheManager.checkAndClearCache();
  
  if (cacheCleared) {
    // Show user notification that cache was cleared
    console.log('تم تحديث التطبيق وتنظيف الكاش تلقائياً');
  }
  
  // Check for updates every 10 minutes (reduced frequency)
  setInterval(async () => {
    const updateAvailable = await CacheManager.checkForUpdates();
    if (updateAvailable) {
      // Optionally show update notification to user
      console.log('تحديث جديد متوفر - تم تنظيف الكاش');
    }
  }, 10 * 60 * 1000);
};