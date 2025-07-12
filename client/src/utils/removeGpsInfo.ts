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
      // List of localStorage keys that might contain GPS technical data
      const gpsKeys = [
        'gpsSystemInfo',
        'locationSystemInfo', 
        'gpsAccuracy',
        'locationAccuracy',
        'gpsStatus',
        'locationStatus',
        'gpsCoordinates',
        'locationCoordinates',
        'preciseLocation',
        'detailedStreets',
        'systemLocationInfo'
      ];
      
      // Remove GPS technical information from localStorage
      gpsKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clean any stored location data that contains technical information
      const locationData = localStorage.getItem('location-data');
      if (locationData) {
        try {
          const parsed = JSON.parse(locationData);
          // Keep only the simple address, remove technical details
          if (parsed && typeof parsed === 'object') {
            const cleaned = {
              address: parsed.address || 'موقعك الحالي'
            };
            localStorage.setItem('location-data', JSON.stringify(cleaned));
          }
        } catch (e) {
          localStorage.removeItem('location-data');
        }
      }
      
      console.log('GPS technical information cleared from storage');
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

// Initialize and run cleaner immediately
const gpsCleaner = GPSInfoCleaner.getInstance();
gpsCleaner.clearGPSTechnicalInfo();
gpsCleaner.clearSessionGPSInfo();