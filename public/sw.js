// Enhanced Service Worker with automatic cache management
const CACHE_NAME = 'vetsvan-cache-v' + Date.now();
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/app-icon.png',
  '/app-icon-maskable.png'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing with cache:', CACHE_NAME);
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Cache essential assets with cache-busting
        const cachePromises = ASSETS_TO_CACHE.map(async (url) => {
          try {
            const cacheBustUrl = url + (url.includes('?') ? '&' : '?') + '_sw=' + Date.now();
            const response = await fetch(cacheBustUrl, { cache: 'no-cache' });
            if (response.ok) {
              await cache.put(url, response);
              console.log('Cached:', url);
            }
          } catch (error) {
            console.warn('Failed to cache:', url, error);
          }
        });
        
        await Promise.all(cachePromises);
        
        // Force immediate activation
        await self.skipWaiting();
      } catch (error) {
        console.error('Service Worker install failed:', error);
      }
    })()
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating, cleaning old caches');
  
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        
        // Delete all old caches
        const deletePromises = cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          });
        
        await Promise.all(deletePromises);
        
        // Claim all clients immediately
        await self.clients.claim();
        
        console.log('Service Worker activated with cache:', CACHE_NAME);
      } catch (error) {
        console.error('Service Worker activation failed:', error);
      }
    })()
  );
});

// Fetch event - serve from cache with fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // NEVER cache API requests - force fresh fetch every time
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    );
    return;
  }
  
  // NEVER cache notification hooks or JS files
  if (event.request.url.includes('useGlobalNotifications') || 
      event.request.url.includes('notification') ||
      event.request.url.includes('/src/hooks/') ||
      event.request.url.includes('.js?') ||
      event.request.url.includes('.ts?')) {
    event.respondWith(
      fetch(event.request, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    );
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        // Try network first for critical resources
        if (event.request.url.includes('manifest.json') || 
            event.request.url.includes('app-icon')) {
          
          try {
            const networkResponse = await fetch(event.request, {
              cache: 'no-cache',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            
            if (networkResponse.ok) {
              // Update cache with fresh version
              const cache = await caches.open(CACHE_NAME);
              await cache.put(event.request, networkResponse.clone());
              return networkResponse;
            }
          } catch (error) {
            console.log('Network failed, trying cache for:', event.request.url);
          }
        }
        
        // Try cache first for other resources
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Fallback to network
        const networkResponse = await fetch(event.request);
        
        // Cache successful responses (but not partial content)
        if (networkResponse.ok && networkResponse.type === 'basic' && 
            networkResponse.status !== 206 && 
            !networkResponse.headers.get('content-range')) {
          const cache = await caches.open(CACHE_NAME);
          try {
            await cache.put(event.request, networkResponse.clone());
          } catch (cacheError) {
            console.log('Cache put failed (probably partial content):', cacheError);
          }
        }
        
        return networkResponse;
        
      } catch (error) {
        console.error('Fetch failed:', error);
        
        // Return cached version if available
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Return error response
        return new Response('Network error occurred', {
          status: 408,
          statusText: 'Network Error'
        });
      }
    })()
  );
});

// Message event - handle cache clearing commands
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      (async () => {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
          console.log('All caches cleared via message');
          
          // Notify client
          event.ports[0]?.postMessage({ success: true });
        } catch (error) {
          console.error('Failed to clear caches:', error);
          event.ports[0]?.postMessage({ success: false, error: error.message });
        }
      })()
    );
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'VetsVan Update', {
        body: data.body || 'التطبيق محدث ومتاح الآن',
        icon: '/app-icon.png',
        badge: '/app-icon.png',
        tag: 'app-update',
        requireInteraction: true,
        actions: [
          {
            action: 'open',
            title: 'فتح التطبيق'
          }
        ]
      })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

console.log('Enhanced Service Worker loaded with version:', CACHE_NAME);