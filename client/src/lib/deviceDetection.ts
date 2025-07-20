// Device and browser detection utilities

export function isIPhoneSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIPhone = /iphone|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|opios|edgios/.test(userAgent);
  
  return isIPhone && isSafari;
}

export function shouldShowTutorialVideo(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if user has chosen to hide the tutorial
  const hideTutorial = localStorage.getItem('hideTutorialVideo');
  if (hideTutorial === 'true') {
    return false;
  }
  
  // Only show for iPhone Safari users
  return isIPhoneSafari();
}

export function getUserAgentInfo() {
  if (typeof window === 'undefined') return {};
  
  const userAgent = window.navigator.userAgent;
  return {
    userAgent,
    isIPhone: /iphone|ipod/i.test(userAgent),
    isSafari: /safari/i.test(userAgent) && !/chrome|crios|fxios|opios|edgios/i.test(userAgent),
    isChrome: /chrome|crios/i.test(userAgent),
    isIOS: /iphone|ipad|ipod/i.test(userAgent)
  };
}