// Simple cache management for deployment issues
export class SimpleCacheManager {
  private static readonly VERSION_KEY = 'app_deployment_version';
  
  // Check and clear cache only on page load if needed
  static async initializeOnLoad(): Promise<void> {
    try {
      // Only run on PWA startup (not regular page loads)
      const urlParams = new URLSearchParams(window.location.search);
      const isPWALaunch = urlParams.get('utm_source') === 'pwa';
      
      if (isPWALaunch) {
        console.log('🔄 PWA launch detected, checking for updates...');
        await this.checkAndClearIfNeeded();
      }
    } catch (error) {
      console.error('Cache initialization error:', error);
    }
  }
  
  private static async checkAndClearIfNeeded(): Promise<void> {
    try {
      // Get server version once
      const response = await fetch('/api/version?' + Date.now(), {
        cache: 'no-cache'
      });
      
      if (!response.ok) return;
      
      const serverVersion = await response.text();
      const storedVersion = localStorage.getItem(this.VERSION_KEY);
      
      // Only clear if versions don't match
      if (storedVersion && storedVersion !== serverVersion) {
        console.log('🚀 New deployment detected, clearing cache...');
        await this.clearApplicationCache();
        localStorage.setItem(this.VERSION_KEY, serverVersion);
        
        // Show single notification
        this.showUpdateNotification();
        
        // Reload once after clearing cache
        setTimeout(() => {
          window.location.href = window.location.pathname;
        }, 2000);
        
      } else if (!storedVersion) {
        // First time - just store version
        localStorage.setItem(this.VERSION_KEY, serverVersion);
      }
    } catch (error) {
      console.error('Version check error:', error);
    }
  }
  
  private static async clearApplicationCache(): Promise<void> {
    try {
      // Clear Service Worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Clear essential storage (keep language preference)
      const keysToKeep = ['selectedLanguage', this.VERSION_KEY];
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
      
      console.log('✅ Cache cleared successfully');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
  
  private static showUpdateNotification(): void {
    // Simple notification without framework dependencies
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #852085;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 300px;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">تم تحديث التطبيق</div>
      <div style="font-size: 14px;">جاري تطبيق التحديثات...</div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
}