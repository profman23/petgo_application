// WebSocket Error Prevention Utility
// This utility prevents WebSocket connection errors that appear in console

export function preventWebSocketErrors() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  // Override WebSocket constructor to prevent invalid URL errors
  const originalWebSocket = window.WebSocket;
  
  window.WebSocket = class extends originalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      // Check if URL is invalid (contains localhost:undefined)
      if (typeof url === 'string' && url.includes('localhost:undefined')) {
        console.warn('Blocked invalid WebSocket URL:', url);
        // Return a dummy WebSocket that won't cause errors
        super('wss://dummy.invalid');
        this.close(); // Close immediately
        return this;
      }
      
      // For valid URLs, proceed normally
      super(url, protocols);
    }
  };
  
  // Also override global setupWebSocket function if it exists
  if (typeof (window as any).setupWebSocket === 'function') {
    const originalSetupWebSocket = (window as any).setupWebSocket;
    (window as any).setupWebSocket = function(...args: any[]) {
      try {
        return originalSetupWebSocket.apply(this, args);
      } catch (error) {
        console.warn('Blocked setupWebSocket error:', error);
        return null;
      }
    };
  }
  
  console.log('WebSocket error prevention activated');
}

// Auto-run prevention on import
if (typeof window !== 'undefined') {
  preventWebSocketErrors();
}