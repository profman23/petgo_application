import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/map-override.css";
import "./utils/pwa-diagnostics";
import "./utils/websocketFix"; // Import WebSocket error prevention
import "./utils/cacheUtils"; // Import cache management utilities
import { setupInstallNotificationHandler } from "./utils/install-notification";

// Setup install notification handler
setupInstallNotificationHandler();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Listen for SW updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New SW available, updating...');
                // Force update
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                // Disabled window.location.reload() to prevent infinite refresh loops
                console.log('Main refresh blocked to prevent infinite loops');
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
      
    // Listen for messages from SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('Cache updated, refreshing icons...');
        // Clear icon cache in browser
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              if (cacheName.includes('icon') || cacheName.includes('manifest')) {
                caches.delete(cacheName);
              }
            });
          });
        }
      }
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
