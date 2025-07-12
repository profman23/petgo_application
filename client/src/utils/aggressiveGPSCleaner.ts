// Ultra-aggressive GPS information cleaner
export const cleanAllGPSInfo = () => {
  // Method 1: Clear localStorage completely except essential data
  const essentialKeys = ['token', 'user', 'language', 'locationPermissionGranted'];
  const backup: {[key: string]: string | null} = {};
  
  essentialKeys.forEach(key => {
    backup[key] = localStorage.getItem(key);
  });
  
  localStorage.clear();
  
  Object.entries(backup).forEach(([key, value]) => {
    if (value) localStorage.setItem(key, value);
  });
  
  // Method 2: Remove all elements containing GPS text
  const gpsTexts = [
    'System Info:',
    'معلومات النظام:',
    'Precise location system active',
    'Shows detailed streets and neighbourhoods',
    'Supports Saudi cities with fallback system',
    'Coordinates:',
    'Accuracy:',
    'Al Thumaama',
    'Al Risal District',
    '24.880742',
    '46.619034',
    '15808m'
  ];
  
  // Method 3: Nuclear DOM cleaning
  const getAllElements = () => document.querySelectorAll('*');
  
  gpsTexts.forEach(searchText => {
    getAllElements().forEach(element => {
      if (element.textContent?.includes(searchText)) {
        // Method A: Remove completely
        element.remove();
        
        // Method B: Hide if still exists
        if (element.parentNode) {
          (element as HTMLElement).style.display = 'none';
          (element as HTMLElement).innerHTML = '';
          (element as HTMLElement).textContent = '';
        }
      }
    });
  });
  
  // Method 4: Remove by coordinate pattern
  const coordinateRegex = /\d+\.\d+,?\s*\d+\.\d+/g;
  getAllElements().forEach(element => {
    if (element.textContent && coordinateRegex.test(element.textContent)) {
      element.remove();
    }
  });
  
  // Method 5: Clean text nodes directly
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT
  );
  
  const nodesToClean: Node[] = [];
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent) {
      for (const searchText of gpsTexts) {
        if (node.textContent.includes(searchText)) {
          nodesToClean.push(node);
          break;
        }
      }
    }
  }
  
  nodesToClean.forEach(node => {
    if (node.parentElement) {
      node.parentElement.remove();
    }
  });
  
  console.log('🧹 GPS technical information cleaned aggressively');
};

// Auto-run cleaner
if (typeof window !== 'undefined') {
  // Run immediately
  cleanAllGPSInfo();
  
  // Run every 100ms
  setInterval(cleanAllGPSInfo, 100);
  
  // Run on page load events
  window.addEventListener('load', cleanAllGPSInfo);
  window.addEventListener('DOMContentLoaded', cleanAllGPSInfo);
  
  // Run on hash/URL changes
  window.addEventListener('hashchange', cleanAllGPSInfo);
  window.addEventListener('popstate', cleanAllGPSInfo);
}