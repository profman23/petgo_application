// Cache busting utilities to force fresh data
export class CacheBuster {
  // Clear all browser caches
  static async clearAllCaches() {
    try {
      // Clear browser cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ All caches cleared');
      }
      
      // Clear localStorage cache data but preserve authentication tokens
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('notification') || key.includes('booking') || key.includes('cache')) 
            && !key.includes('token') && !key.includes('user')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('✅ LocalStorage cache cleared');
    } catch (error) {
      console.error('❌ Cache clear failed:', error);
    }
  }
  
  // Force Service Worker to update
  static async updateServiceWorker() {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          console.log('✅ Service Worker updated');
        }
      }
    } catch (error) {
      console.error('❌ Service Worker update failed:', error);
    }
  }
  
  // Generate cache-busting URL
  static bustUrl(url: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_cb=${timestamp}&_r=${random}`;
  }
  
  // Force fetch with no cache
  static async forceFetch(url: string, options: RequestInit = {}) {
    return fetch(this.bustUrl(url), {
      ...options,
      cache: 'no-store',
      headers: {
        ...options.headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

// Auto-clear caches on app start (only once per session) but preserve auth tokens
if (!sessionStorage.getItem('cache-cleared')) {
  console.log('🧹 Cache clearing started - preserving auth tokens');
  
  // Backup tokens before cache clear
  const token = localStorage.getItem('token');
  const doctorToken = localStorage.getItem('doctorToken');
  const user = localStorage.getItem('user');
  
  if (token) sessionStorage.setItem('backup_token', token);
  if (doctorToken) sessionStorage.setItem('backup_doctorToken', doctorToken);
  if (user) sessionStorage.setItem('backup_user', user);
  
  // Only clear caches, not localStorage tokens
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  
  CacheBuster.updateServiceWorker();
  sessionStorage.setItem('cache-cleared', 'true');
  
  // Restore tokens after cache clear
  setTimeout(() => {
    const backupToken = sessionStorage.getItem('backup_token');
    const backupDoctorToken = sessionStorage.getItem('backup_doctorToken');
    const backupUser = sessionStorage.getItem('backup_user');
    
    if (backupToken && !localStorage.getItem('token')) {
      localStorage.setItem('token', backupToken);
    }
    if (backupDoctorToken && !localStorage.getItem('doctorToken')) {
      localStorage.setItem('doctorToken', backupDoctorToken);
    }
    if (backupUser && !localStorage.getItem('user')) {
      localStorage.setItem('user', backupUser);
    }
    
    console.log('🔐 Auth tokens restored after cache clear');
  }, 100);
}