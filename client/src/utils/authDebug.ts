// Debug authentication system to identify login issues
export function debugAuthState() {
  const token = localStorage.getItem('token');
  const doctorToken = localStorage.getItem('doctorToken');
  const user = localStorage.getItem('user');
  
  console.log('🔐 Current Auth State:', {
    hasToken: !!token,
    hasDoctorToken: !!doctorToken,
    hasUser: !!user,
    tokenLength: token?.length || 0,
    doctorTokenLength: doctorToken?.length || 0,
    userDataValid: user ? (() => {
      try {
        JSON.parse(user);
        return true;
      } catch {
        return false;
      }
    })() : false
  });
  
  if (token) console.log('Customer token:', token.substring(0, 10) + '...');
  if (doctorToken) console.log('Doctor token:', doctorToken.substring(0, 10) + '...');
  if (user) console.log('User data:', user.substring(0, 50) + '...');
  
  return { token, doctorToken, user };
}

// Force reload auth state
export function reloadAuthState() {
  // Clear any cached queries that might be using old tokens
  if (window.queryClient) {
    window.queryClient.clear();
  }
  
  // Check if we have valid auth state
  const authState = debugAuthState();
  
  // Determine where user should be based on current tokens
  const currentPath = window.location.pathname;
  
  if (authState.token && !currentPath.includes('/home') && !currentPath.includes('/account') && !currentPath.includes('/activity')) {
    console.log('Customer token found but not on customer page - redirecting');
    window.location.href = '/home';
  }
  
  if (authState.doctorToken && !currentPath.includes('/doctor-')) {
    console.log('Doctor token found but not on doctor page - redirecting');
    window.location.href = '/doctor-activity';
  }
  
  if (!authState.token && !authState.doctorToken && !currentPath.includes('/login') && !currentPath.includes('/user-type')) {
    console.log('No tokens found - redirecting to login');
    window.location.href = '/login';
  }
}

// Auto-debug on load (disabled to prevent refresh loops)
if (typeof window !== 'undefined') {
  setTimeout(debugAuthState, 1000);
  // Disabled automatic reload to prevent refresh loops
  // setTimeout(reloadAuthState, 2000);
}