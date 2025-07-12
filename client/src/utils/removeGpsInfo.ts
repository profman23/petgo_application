// Utility to remove any GPS technical information from the application
export class GPSInfoCleaner {
  private static instance: GPSInfoCleaner;
  
  private constructor() {}
  
  static getInstance(): GPSInfoCleaner {
    if (!GPSInfoCleaner.instance) {
      GPSInfoCleaner.instance = new GPSInfoCleaner();
    }
    return GPSInfoCleaner.instance;
  }
  
  /**
   * Remove all GPS technical information from localStorage
   */
  clearGPSTechnicalInfo(): void {
    try {
      // Clear ALL localStorage completely to remove any cached GPS technical data
      const importantKeys = [
        'token',
        'user', 
        'language',
        'locationPermissionGranted'
      ];
      
      // Save important data
      const importantData: {[key: string]: string | null} = {};
      importantKeys.forEach(key => {
        importantData[key] = localStorage.getItem(key);
      });
      
      // Clear everything
      localStorage.clear();
      
      // Restore important data
      Object.entries(importantData).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });
      
      console.log('All GPS technical information cleared from storage');
    } catch (error) {
      console.error('Error clearing GPS technical info:', error);
    }
  }
  
  /**
   * Clean any GPS technical data from session storage
   */
  clearSessionGPSInfo(): void {
    try {
      const gpsKeys = [
        'gpsSystemInfo',
        'locationSystemInfo',
        'gpsAccuracy',
        'locationAccuracy'
      ];
      
      gpsKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      console.log('GPS technical information cleared from session storage');
    } catch (error) {
      console.error('Error clearing session GPS info:', error);
    }
  }
}

// Enhanced GPS info removal with DOM cleaning
const removeGPSFromDOM = () => {
  const technicalTexts = [
    'System Info:',
    'معلومات النظام:',
    'Precise location system active',
    'Shows detailed streets and neighbourhoods',
    'Supports Saudi cities with fallback system',
    'Coordinates:',
    'Accuracy:',
    'GPS Status',
    'Location System'
  ];
  
  technicalTexts.forEach(text => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    const nodesToRemove: Node[] = [];
    
    while (node = walker.nextNode()) {
      if (node.textContent && node.textContent.includes(text)) {
        nodesToRemove.push(node.parentElement || node);
      }
    }
    
    nodesToRemove.forEach(node => {
      if (node.parentElement) {
        node.parentElement.style.display = 'none';
      }
    });
  });
};

// Initialize and run cleaner immediately
const gpsCleaner = GPSInfoCleaner.getInstance();
gpsCleaner.clearGPSTechnicalInfo();
gpsCleaner.clearSessionGPSInfo();

// Run DOM cleaning when page loads
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeGPSFromDOM);
  } else {
    removeGPSFromDOM();
  }
  
  // Also run every 2 seconds to catch dynamic content
  setInterval(removeGPSFromDOM, 2000);
}