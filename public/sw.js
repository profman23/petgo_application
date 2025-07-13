// Service Worker COMPLETELY DISABLED to fix login persistence issues
// User requested PWA removal if it causes login problems

console.log('🚫 Service Worker DISABLED - No caching, no PWA functionality');

// UNREGISTER THIS SERVICE WORKER AND CLEAR ALL CACHES
self.addEventListener('install', (event) => {
  console.log('🗑️ Service Worker installing - will clear all caches');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🗑️ Service Worker activating - clearing all caches and unregistering');
  
  event.waitUntil(
    (async () => {
      try {
        // Clear all caches
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => {
            console.log('🗑️ Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        
        // Unregister this service worker
        await self.registration.unregister();
        console.log('✅ Service Worker unregistered successfully');
        
        // Force page reload to clear any cached content
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.navigate(client.url);
          });
        });
      } catch (error) {
        console.error('❌ Error during service worker cleanup:', error);
      }
    })()
  );
});

// Block all fetch requests to prevent caching
self.addEventListener('fetch', (event) => {
  // Don't intercept any requests - let them go directly to network
  console.log('🔄 Request bypassed service worker:', event.request.url);
  return;
});

console.log('🚫 Service Worker script loaded - PWA functionality disabled');