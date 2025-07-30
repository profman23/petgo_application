import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/map-override.css";

// Clear all service workers and caches to fix domain redirect issue
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
      console.log('Service Worker unregistered');
    }
  });
  
  // Clear all caches
  caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames.map((cacheName) => {
        console.log('Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
  });
}

createRoot(document.getElementById("root")!).render(<App />);
