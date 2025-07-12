const CACHE_NAME = 'vetsvan-v2.0.1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/app-icon.png'
];

// Install service worker
self.addEventListener('install', event => {
  console.log('🎯 Service Worker installing...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache opened:', CACHE_NAME);
        return cache.addAll(urlsToCache).catch(err => {
          console.log('⚠️ Cache add failed:', err);
          // Don't fail installation if cache fails
          return Promise.resolve();
        });
      })
  );
});

// Fetch resources
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate service worker
self.addEventListener('activate', event => {
  console.log('🎯 Service Worker activating...');
  self.clients.claim();
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      console.log('📦 All caches:', cacheNames);
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated successfully');
      
      // Notify clients that SW is ready
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ 
            type: 'SW_ACTIVATED',
            cacheName: CACHE_NAME 
          });
        });
      });

      // Don't auto-show notifications - let the app handle it
      console.log('📱 Service Worker ready for install notifications');
    })
  );
});

// Handle messages from main thread
self.addEventListener('message', event => {
  console.log('📩 SW received message:', event.data);
  
  if (event.data && event.data.type === 'SHOW_INSTALL_NOTIFICATION') {
    const options = {
      body: event.data.body || 'ثبت التطبيق على جهازك للوصول السريع إلى خدمات العيادة البيطرية',
      icon: '/app-icon.png',
      badge: '/app-icon.png',
      tag: 'pwa-install',
      requireInteraction: true,
      actions: [
        {
          action: 'install',
          title: 'تثبيت'
        },
        {
          action: 'close',
          title: 'إغلاق'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        event.data.title || 'تطبيق VetsVan متاح للتثبيت', 
        options
      )
    );
  }
});

// Push notification handler (for future use)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'رسالة جديدة من VetsVan',
    icon: '/app-icon.png',
    badge: '/app-icon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'عرض التطبيق'
      },
      {
        action: 'close',
        title: 'إغلاق'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('VetsVan - العيادة البيطرية المتنقلة', options)
  );
});

// Handle notification actions for install prompts
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'install' || event.action === 'explore') {
    // Open app and trigger install prompt
    event.waitUntil(
      clients.matchAll().then(clientList => {
        // Focus existing tab if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'TRIGGER_INSTALL' });
            return client.focus();
          }
        }
        // Open new window if no existing tab
        if (clients.openWindow) {
          return clients.openWindow('/').then(client => {
            if (client) {
              setTimeout(() => {
                client.postMessage({ type: 'TRIGGER_INSTALL' });
              }, 1000);
            }
          });
        }
      })
    );
  } else if (event.action === 'close') {
    console.log('📱 Install notification dismissed by user');
  } else {
    // Default action - open app and show install prompt
    event.waitUntil(
      clients.openWindow('/').then(client => {
        if (client) {
          setTimeout(() => {
            client.postMessage({ type: 'TRIGGER_INSTALL' });
          }, 1000);
        }
      })
    );
  }
});