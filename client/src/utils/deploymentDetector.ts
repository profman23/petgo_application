// Deployment detection and automatic cache clearing
export class DeploymentDetector {
  private static readonly DEPLOYMENT_CHECK_KEY = 'last_deployment_check';
  private static readonly CHECK_INTERVAL = 30000; // 30 seconds
  
  static async startMonitoring(): Promise<void> {
    // Initial check
    await this.checkForDeployment();
    
    // Set up periodic checks
    setInterval(async () => {
      await this.checkForDeployment();
    }, this.CHECK_INTERVAL);
    
    // Check when app becomes visible again
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) {
        await this.checkForDeployment();
      }
    });
    
    // Check when window gains focus
    window.addEventListener('focus', async () => {
      await this.checkForDeployment();
    });
  }
  
  private static async checkForDeployment(): Promise<boolean> {
    try {
      const response = await fetch('/api/version?' + Date.now(), {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        return false;
      }
      
      const serverVersion = await response.text();
      const lastCheck = localStorage.getItem(this.DEPLOYMENT_CHECK_KEY);
      
      if (lastCheck && lastCheck !== serverVersion) {
        console.log('🚀 New deployment detected, clearing cache...');
        await this.handleNewDeployment(serverVersion);
        return true;
      }
      
      // Store current version for next check
      localStorage.setItem(this.DEPLOYMENT_CHECK_KEY, serverVersion);
      return false;
      
    } catch (error) {
      console.error('Deployment check failed:', error);
      return false;
    }
  }
  
  private static async handleNewDeployment(newVersion: string): Promise<void> {
    try {
      // Clear all caches
      await this.clearAllApplicationCaches();
      
      // Update stored version
      localStorage.setItem(this.DEPLOYMENT_CHECK_KEY, newVersion);
      
      // Show notification to user
      this.showUpdateNotification();
      
      // Force reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error handling new deployment:', error);
    }
  }
  
  private static async clearAllApplicationCaches(): Promise<void> {
    try {
      // Clear Service Worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('✅ Service Worker caches cleared');
      }
      
      // Clear browser caches via Service Worker message
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
        
        // Wait for response
        await new Promise((resolve) => {
          messageChannel.port1.onmessage = () => resolve(true);
          setTimeout(resolve, 1000); // Timeout after 1 second
        });
      }
      
      // Clear localStorage (except essential data)
      const essentialKeys = ['selectedLanguage', 'last_deployment_check'];
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
      
      console.log('✅ All application caches cleared');
      
    } catch (error) {
      console.error('Error clearing application caches:', error);
    }
  }
  
  private static showUpdateNotification(): void {
    // Create and show update notification
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
      font-family: Arial, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      text-align: center;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">تم تحديث التطبيق</div>
      <div style="font-size: 14px;">جاري إعادة التحميل للحصول على آخر إصدار...</div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after reload
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
  
  // Force immediate deployment check
  static async forceCheck(): Promise<boolean> {
    return await this.checkForDeployment();
  }
}