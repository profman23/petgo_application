// Fix authentication issues by ensuring tokens are preserved
export function preserveAuthTokens() {
  // Check if tokens exist and are being cleared incorrectly
  const token = localStorage.getItem('token');
  const doctorToken = localStorage.getItem('doctorToken');
  const user = localStorage.getItem('user');
  
  console.log('🔐 Auth tokens status:', {
    customerToken: !!token,
    doctorToken: !!doctorToken,
    user: !!user
  });
  
  // Store tokens temporarily if they exist
  if (token) sessionStorage.setItem('temp_token', token);
  if (doctorToken) sessionStorage.setItem('temp_doctorToken', doctorToken);
  if (user) sessionStorage.setItem('temp_user', user);
}

export function restoreAuthTokens() {
  // Restore tokens from session storage if they were cleared
  const tempToken = sessionStorage.getItem('temp_token');
  const tempDoctorToken = sessionStorage.getItem('temp_doctorToken');
  const tempUser = sessionStorage.getItem('temp_user');
  
  if (tempToken && !localStorage.getItem('token')) {
    localStorage.setItem('token', tempToken);
    sessionStorage.removeItem('temp_token');
  }
  
  if (tempDoctorToken && !localStorage.getItem('doctorToken')) {
    localStorage.setItem('doctorToken', tempDoctorToken);
    sessionStorage.removeItem('temp_doctorToken');
  }
  
  if (tempUser && !localStorage.getItem('user')) {
    localStorage.setItem('user', tempUser);
    sessionStorage.removeItem('temp_user');
  }
}

// Auto-preserve tokens on load
preserveAuthTokens();

// Auto-restore tokens after 500ms and 2 seconds
setTimeout(restoreAuthTokens, 500);
setTimeout(restoreAuthTokens, 2000);

// Monitor localStorage changes and restore if needed
setInterval(() => {
  const token = localStorage.getItem('token');
  const doctorToken = localStorage.getItem('doctorToken');
  
  // Restore from session if missing
  if (!token && sessionStorage.getItem('temp_token')) {
    localStorage.setItem('token', sessionStorage.getItem('temp_token')!);
  }
  
  if (!doctorToken && sessionStorage.getItem('temp_doctorToken')) {
    localStorage.setItem('doctorToken', sessionStorage.getItem('temp_doctorToken')!);
  }
}, 1000);