// Cache management utilities to prevent WebSocket and other browser errors

export async function clearAllBrowserCaches() {
  try {
    // Clear all service worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      console.log('All browser caches cleared');
    }
    
    // Clear localStorage entries that might cause issues
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('websocket') || 
        key.includes('cache') || 
        key.includes('sw-') ||
        key.includes('replit')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    return true;
  } catch (error) {
    console.error('Failed to clear caches:', error);
    return false;
  }
}

export function forceRefreshWithoutWebSocketErrors() {
  // Clear problematic caches first
  clearAllBrowserCaches().then(() => {
    // Use location.replace instead of reload to prevent history issues
    window.location.replace(window.location.href);
  });
}

export function preventWebSocketURLErrors() {
  // Monitor for WebSocket construction attempts
  const originalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url: string | URL, protocols?: string | string[]) {
    const urlStr = typeof url === 'string' ? url : url.toString();
    
    // Block invalid localhost:undefined URLs
    if (urlStr.includes('localhost:undefined') || urlStr.includes(':undefined')) {
      console.warn('Blocked WebSocket with invalid URL:', urlStr);
      
      // Create a dummy closed WebSocket to prevent errors
      const dummyWS = new originalWebSocket('wss://dummy.invalid');
      dummyWS.close();
      return dummyWS;
    }
    
    // For valid URLs, proceed normally
    return new originalWebSocket(url, protocols);
  } as any;
  
  // Copy static properties
  Object.setPrototypeOf(window.WebSocket, originalWebSocket);
  Object.defineProperty(window.WebSocket, 'prototype', {
    value: originalWebSocket.prototype,
    writable: false
  });
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  preventWebSocketURLErrors();
  console.log('Cache utilities and WebSocket protection initialized');
}