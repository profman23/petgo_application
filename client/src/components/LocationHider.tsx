import { useEffect } from 'react';

// Component to forcefully hide any GPS technical information
export function LocationHider() {
  useEffect(() => {
    // Remove any displayed technical GPS information from DOM
    const hideGPSInfo = () => {
      const elementsToHide = [
        // Common text patterns that might show GPS info
        'System Info',
        'معلومات النظام',
        'Precise location system active',
        'Shows detailed streets and neighbourhoods',
        'Supports Saudi cities with fallback system',
        'Coordinates:',
        'Accuracy:',
        'GPS Status',
        'Location System',
        'Precise Location'
      ];

      elementsToHide.forEach(pattern => {
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          if (el.textContent && el.textContent.includes(pattern)) {
            // Hide the element completely
            (el as HTMLElement).style.display = 'none !important';
            (el as HTMLElement).style.visibility = 'hidden !important';
            (el as HTMLElement).style.opacity = '0 !important';
            (el as HTMLElement).style.height = '0 !important';
            (el as HTMLElement).style.overflow = 'hidden !important';
            
            // Also hide parent if it only contains technical info
            const parent = el.closest('div, p, span, section');
            if (parent && parent.textContent && parent.textContent.trim() === el.textContent?.trim()) {
              (parent as HTMLElement).style.display = 'none !important';
              (parent as HTMLElement).style.visibility = 'hidden !important';
              (parent as HTMLElement).style.opacity = '0 !important';
              (parent as HTMLElement).style.height = '0 !important';
            }
          }
        });
      });
      
      // Also remove any elements that contain coordinates in latitude,longitude format
      const coordinatePattern = /\d+\.\d+,\s*\d+\.\d+/;
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.textContent && coordinatePattern.test(el.textContent)) {
          (el as HTMLElement).style.display = 'none !important';
        }
      });
    };

    // Run immediately and then every 500ms to catch any dynamically added content
    hideGPSInfo();
    const interval = setInterval(hideGPSInfo, 500);

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}