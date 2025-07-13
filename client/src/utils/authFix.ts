// Ultimate authentication fix
// Ensures customer login always works without redirect loops

if (typeof window !== 'undefined') {
  
  // Monitor authentication state and prevent loops
  let lastAuthCheck = 0;
  let loginInProgress = false;
  
  const monitorAuth = () => {
    const now = Date.now();
    if (now - lastAuthCheck < 1000) return; // Prevent too frequent checks
    lastAuthCheck = now;
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const currentPath = window.location.pathname;
    
    console.log('🔍 Auth Monitor:', {
      path: currentPath,
      hasAuth: !!(token && user),
      loginInProgress
    });
    
    // If user is authenticated but on login page, redirect to home
    if (token && user && currentPath === '/login' && !loginInProgress) {
      console.log('✅ User authenticated, redirecting from login to home');
      window.location.href = '/home';
      return;
    }
    
    // If user is not authenticated but on protected page, redirect to login
    if ((!token || !user) && currentPath !== '/login' && !currentPath.includes('admin') && !currentPath.includes('doctor')) {
      console.log('❌ User not authenticated, redirecting to login');
      window.location.href = '/login';
      return;
    }
  };
  
  // Monitor on load and periodically
  window.addEventListener('load', monitorAuth);
  setInterval(monitorAuth, 2000);
  
  // Monitor login attempts
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [url] = args;
    
    if (typeof url === 'string' && url.includes('/api/auth/login')) {
      loginInProgress = true;
      console.log('🔄 Login attempt started');
    }
    
    const response = await originalFetch(...args);
    
    if (typeof url === 'string' && url.includes('/api/auth/login')) {
      loginInProgress = false;
      console.log('🔄 Login attempt finished');
      
      if (response.ok) {
        console.log('✅ Login successful, triggering auth check');
        setTimeout(monitorAuth, 500);
      }
    }
    
    return response;
  };
  
  console.log('🛡️ Auth monitoring activated');
}

export default {};