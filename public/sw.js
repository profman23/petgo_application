const CACHE_NAME = 'vetsvan-v2.1.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install service worker with immediate activation
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch resources with network-first strategy for CSS/JS files
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Network-first strategy for CSS and JS files to ensure latest version
  if (event.request.url.includes('.css') || 
      event.request.url.includes('.js') || 
      event.request.url.includes('/src/')) {
    event.respondWith(
      fetch(event.request).then(response => {
        // If successful, update cache
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // If network fails, fall back to cache
        return caches.match(event.request);
      })
    );
  } else {
    // Cache-first for other resources
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
    );
  }
});

// Activate service worker with immediate control
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  // Take control of all pages immediately
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Push notification handler
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'رسالة جديدة من VetsVan',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'عرض التطبيق',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('VetsVan - العيادة البيطرية المتنقلة', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('Notification click received.');

  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Close notification
    event.notification.close();
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});