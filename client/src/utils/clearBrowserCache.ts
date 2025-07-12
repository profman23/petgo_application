// Cache clearing utility for immediate cache invalidation
export class BrowserCacheManager {
  private static instance: BrowserCacheManager;
  
  private constructor() {}
  
  static getInstance(): BrowserCacheManager {
    if (!BrowserCacheManager.instance) {
      BrowserCacheManager.instance = new BrowserCacheManager();
    }
    return BrowserCacheManager.instance;
  }
  
  /**
   * Clear all browser caches and force reload
   */
  async clearAllCaches(): Promise<void> {
    try {
      // Clear localStorage completely
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear IndexedDB if supported
      if ('indexedDB' in window) {
        try {
          const dbs = await indexedDB.databases();
          await Promise.all(
            dbs.map(db => {
              if (db.name) {
                return new Promise<void>((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve();
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
            })
          );
        } catch (e) {
          console.warn('Could not clear IndexedDB:', e);
        }
      }
      
      // Clear Service Worker caches
      if ('serviceWorker' in navigator && 'caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (e) {
          console.warn('Could not clear service worker caches:', e);
        }
      }
      
      console.log('All browser caches cleared successfully');
    } catch (error) {
      console.error('Error clearing browser caches:', error);
    }
  }
  
  /**
   * Force page reload with cache bypass
   */
  forceHardRefresh(): void {
    // Force hard refresh (bypass cache)
    window.location.reload();
  }
  
  /**
   * Clear specific localStorage keys related to location data
   */
  clearLocationCache(): void {
    const locationKeys = [
      'currentLocation',
      'locationInfo',
      'gpsCoordinates', 
      'userLocation',
      'systemInfo',
      'debugInfo'
    ];
    
    locationKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    console.log('Location cache cleared');
  }
  
  /**
   * Clear user session but preserve essential app data
   */
  clearUserSession(): void {
    const preserveKeys = ['language', 'theme'];
    const preserved: Record<string, string> = {};
    
    // Save keys to preserve
    preserveKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) preserved[key] = value;
    });
    
    // Clear everything
    localStorage.clear();
    
    // Restore preserved keys
    Object.entries(preserved).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    console.log('User session cleared, preserved essential settings');
  }
}