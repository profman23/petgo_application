// Simple Authentication Fix - No Loops, Direct Redirect
// Completely eliminates authentication loops and redirect issues

if (typeof window !== 'undefined') {
  console.log('🔧 Simple Auth Fix activated');
  
  // Override any problematic auth monitoring
  let authCheckInProgress = false;
  
  // Simple function to handle post-login redirect
  window.handleLoginSuccess = (token: string, user: any) => {
    if (authCheckInProgress) return;
    authCheckInProgress = true;
    
    console.log('🎯 handleLoginSuccess called with:', {
      tokenPreview: token.substring(0, 10) + '...',
      userExists: !!user
    });
    
    // Clear any existing data
    localStorage.clear();
    sessionStorage.clear();
    
    // Set new auth data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Verify storage
    const stored = localStorage.getItem('token');
    console.log('✅ Token stored:', !!stored, stored === token);
    
    // IMMEDIATE redirect without any delays or checks
    console.log('🚀 REDIRECTING TO HOME NOW');
    window.location.replace('/home');
  };
  
  // Block any automatic auth checking that might interfere
  const originalSetInterval = window.setInterval;
  window.setInterval = (callback: any, delay?: number) => {
    // Block frequent auth checking intervals
    if (delay && delay <= 2000 && callback.toString().includes('auth')) {
      console.log('🚫 Blocked frequent auth interval');
      return 0 as any;
    }
    return originalSetInterval(callback, delay);
  };
  
  console.log('✅ Simple auth fix ready');
}

declare global {
  interface Window {
    handleLoginSuccess: (token: string, user: any) => void;
  }
}

export {};