// Ultimate cache clearing script
// Clears ALL possible caches that might contain WebSocket errors

export async function clearAllCaches() {
  console.log('🧹 Starting ultimate cache clearing...');
  
  try {
    // 1. Clear Service Worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('📦 Found caches:', cacheNames);
      
      await Promise.all(cacheNames.map(async (cacheName) => {
        await caches.delete(cacheName);
        console.log(`🗑️ Deleted cache: ${cacheName}`);
      }));
    }
    
    // 2. Clear localStorage completely
    localStorage.clear();
    console.log('🗑️ Cleared localStorage');
    
    // 3. Clear sessionStorage
    sessionStorage.clear();
    console.log('🗑️ Cleared sessionStorage');
    
    // 4. Clear IndexedDB (if any)
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        await Promise.all(databases.map(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
            console.log(`🗑️ Deleted IndexedDB: ${db.name}`);
          }
        }));
      } catch (error) {
        console.log('IndexedDB clear failed:', error);
      }
    }
    
    // 5. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => {
        registration.unregister();
        console.log('🗑️ Unregistered service worker');
      }));
    }
    
    console.log('✅ Ultimate cache clearing completed');
    return true;
  } catch (error) {
    console.error('❌ Cache clearing error:', error);
    return false;
  }
}

// Auto-clear caches every time the app loads
if (typeof window !== 'undefined') {
  // Clear caches when page loads
  window.addEventListener('load', () => {
    setTimeout(clearAllCaches, 1000);
  });
  
  // Clear caches immediately
  clearAllCaches();
}

export default clearAllCaches;