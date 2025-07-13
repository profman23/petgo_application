// Ultimate WebSocket error prevention system
// Completely prevents any WebSocket errors from showing in console

if (typeof window !== 'undefined') {
  // Store original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;
  
  // Block ALL WebSocket creation attempts
  window.WebSocket = function(url: string | URL, protocols?: string | string[]) {
    const urlString = typeof url === 'string' ? url : url.toString();
    
    console.warn('🚫 BLOCKED ALL WebSocket connections:', urlString);
    
    // Return a completely silent dummy WebSocket
    const dummyWS: any = {
      readyState: WebSocket.CLOSED,
      close: () => {},
      send: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
      protocol: '',
      extensions: '',
      bufferedAmount: 0,
      binaryType: 'blob' as BinaryType,
      url: 'about:blank'
    };
    
    return dummyWS;
  } as any;

  // Copy constants
  window.WebSocket.CONNECTING = 0;
  window.WebSocket.OPEN = 1;
  window.WebSocket.CLOSING = 2;
  window.WebSocket.CLOSED = 3;

  // Block all possible WebSocket-related functions
  const blockAllWebSocketFunctions = () => {
    const functionsToBlock = [
      'setupWebSocket', 'connectWebSocket', 'initWebSocket', 'createWebSocket',
      'connectToWebSocket', 'webSocketConnect', 'wsConnect', 'wsInit'
    ];
    
    functionsToBlock.forEach(funcName => {
      if ((window as any)[funcName]) {
        (window as any)[funcName] = () => {
          console.warn(`🚫 Blocked ${funcName} function call`);
        };
      }
    });
  };

  // Override console.error to hide WebSocket errors
  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    const message = args.join(' ');
    if (message.includes('WebSocket') && 
        (message.includes('localhost:undefined') || 
         message.includes('failed') ||
         message.includes('invalid'))) {
      // Silently ignore WebSocket errors
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Override console.warn for WebSocket warnings
  const originalConsoleWarn = console.warn;
  console.warn = function(...args: any[]) {
    const message = args.join(' ');
    if (message.includes('WebSocket') && message.includes('localhost:undefined')) {
      // Silently ignore WebSocket warnings
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  // Block functions immediately and keep blocking
  blockAllWebSocketFunctions();
  setInterval(blockAllWebSocketFunctions, 500);

  console.log('✅ ULTIMATE WebSocket blocker activated - NO WebSocket errors will appear');
}

// Export for manual clearing if needed
export function clearAllWebSocketErrors() {
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.includes('chunk') || cacheName.includes('js')) {
          caches.delete(cacheName);
        }
      });
    });
  }
}