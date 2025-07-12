// Force refresh PWA icons by clearing browser cache
export function forceIconRefresh() {
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('Clearing cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('All caches cleared for icon refresh');
      
      // Force reload page to get fresh icons
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister();
          });
          setTimeout(() => {
            window.location.reload(true);
          }, 1000);
        });
      } else {
        setTimeout(() => {
          window.location.reload(true);
        }, 1000);
      }
    });
  }
}

// Add to window for console access
if (typeof window !== 'undefined') {
  (window as any).forceIconRefresh = forceIconRefresh;
}