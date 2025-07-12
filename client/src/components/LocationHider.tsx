import { useEffect } from 'react';

// Component to forcefully hide any GPS technical information
export function LocationHider() {
  useEffect(() => {
    // Enhanced GPS information hiding with white overlay
    const hideGPSInfo = () => {
      const elementsToHide = [
        'System Info',
        'معلومات النظام',
        'Precise location system active',
        'Shows detailed streets and neighbourhoods',
        'Supports Saudi cities with fallback system',
        'Coordinates:',
        'Accuracy:',
        'GPS Status',
        'Location System',
        'Precise Location',
        'Al Thumaama',
        'Al Risal District'
      ];

      elementsToHide.forEach(pattern => {
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          if (el.textContent && el.textContent.includes(pattern)) {
            // Create white overlay to cover the element
            const overlay = document.createElement('div');
            overlay.style.cssText = `
              position: absolute;
              background: white;
              z-index: 9999;
              width: 100%;
              height: 100%;
              top: 0;
              left: 0;
              pointer-events: none;
            `;
            
            // Make parent relative if needed
            const parentEl = el as HTMLElement;
            if (parentEl.style.position !== 'absolute' && parentEl.style.position !== 'relative') {
              parentEl.style.position = 'relative';
            }
            
            // Add overlay
            parentEl.appendChild(overlay);
            
            // Also completely hide the element
            parentEl.style.display = 'none !important';
            parentEl.style.visibility = 'hidden !important';
            parentEl.style.opacity = '0 !important';
            parentEl.style.height = '0 !important';
            parentEl.style.overflow = 'hidden !important';
            
            // Hide parent containers too
            const parent = el.closest('div, p, span, section');
            if (parent && parent !== el) {
              (parent as HTMLElement).style.display = 'none !important';
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

    // Run immediately and then every 100ms for aggressive hiding
    hideGPSInfo();
    const interval = setInterval(hideGPSInfo, 100);

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}