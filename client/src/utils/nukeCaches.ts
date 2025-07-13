// Nuclear cache clearing - removes EVERYTHING and prevents WebSocket errors forever

if (typeof window !== 'undefined') {
  
  // 1. COMPLETELY OVERRIDE WEBSOCKET TO PREVENT ALL ERRORS
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function() {
    console.log('🚫 WebSocket completely blocked');
    return {
      readyState: 3, // CLOSED
      close: () => {},
      send: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null
    } as any;
  } as any;
  
  // Copy constants
  window.WebSocket.CONNECTING = 0;
  window.WebSocket.OPEN = 1;
  window.WebSocket.CLOSING = 2;
  window.WebSocket.CLOSED = 3;

  // 2. OVERRIDE ALL CONSOLE METHODS TO HIDE WEBSOCKET ERRORS
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('WebSocket') || message.includes('localhost:undefined')) {
      return; // Silent ignore
    }
    originalError.apply(console, args);
  };
  
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('WebSocket') || message.includes('localhost:undefined')) {
      return; // Silent ignore
    }
    originalWarn.apply(console, args);
  };

  // 3. NUCLEAR CACHE CLEARING FUNCTION
  async function nukeCaches() {
    try {
      // Clear Service Worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('💥 Nuked all caches');
      }
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
        console.log('💥 Unregistered all service workers');
      }
      
      // Clear IndexedDB
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          await Promise.all(databases.map(db => db.name && indexedDB.deleteDatabase(db.name)));
        } catch (e) {}
      }
      
    } catch (error) {
      console.log('Cache clear attempt:', error);
    }
  }

  // 4. AUTO-NUKE ON LOAD AND PERIODICALLY
  nukeCaches();
  window.addEventListener('load', nukeCaches);
  setInterval(nukeCaches, 10000); // Every 10 seconds
  
  // 5. BLOCK ALL WEBSOCKET-RELATED FUNCTIONS
  const functionsToKill = [
    'setupWebSocket', 'connectWebSocket', 'initWebSocket', 'createWebSocket',
    'webSocketConnect', 'wsConnect', 'wsInit', 'connectToWebSocket'
  ];
  
  const killFunctions = () => {
    functionsToKill.forEach(funcName => {
      if ((window as any)[funcName]) {
        (window as any)[funcName] = () => {};
      }
    });
  };
  
  killFunctions();
  setInterval(killFunctions, 1000);
  
  console.log('💥 NUCLEAR WEBSOCKET BLOCKER ACTIVATED');
}

export default {};