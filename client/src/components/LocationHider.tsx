import { useEffect } from 'react';

// Component to forcefully hide any GPS technical information
export function LocationHider() {
  useEffect(() => {
    // Ultra-aggressive GPS information removal
    const hideGPSInfo = () => {
      // First method: Remove by text content
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
        'Al Risal District',
        'Riyadh',
        'الرياض'
      ];
      
      // Second method: Remove by coordinate patterns
      const coordinatePatterns = [
        /\d+\.\d+,\s*\d+\.\d+/g, // latitude,longitude
        /\d+\.\d+m/g, // accuracy in meters
        /Accuracy:\s*\d+/g,
        /24\.\d+.*46\.\d+/g // Riyadh coordinates
      ];

      // Method 1: Hide by text content
      elementsToHide.forEach(pattern => {
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          if (el.textContent && el.textContent.includes(pattern)) {
            const element = el as HTMLElement;
            
            // Nuclear option: completely remove from DOM
            element.remove();
            
            // If still exists, hide with multiple methods
            if (element.parentNode) {
              element.style.cssText = `
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                position: absolute !important;
                top: -9999px !important;
                left: -9999px !important;
                z-index: -1 !important;
              `;
              
              // Hide parent if it only contains this content
              const parent = element.parentElement;
              if (parent && parent.textContent?.trim() === element.textContent?.trim()) {
                parent.style.cssText = element.style.cssText;
              }
            }
          }
        });
      });
      
      // Method 2: Hide by coordinate patterns
      coordinatePatterns.forEach(pattern => {
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          if (el.textContent && pattern.test(el.textContent)) {
            (el as HTMLElement).remove();
          }
        });
      });
      
      // Method 3: Search and destroy by class/id names
      const suspiciousSelectors = [
        '[class*="location"]',
        '[class*="gps"]', 
        '[class*="coordinates"]',
        '[class*="system"]',
        '[id*="location"]',
        '[id*="gps"]',
        '[id*="coordinates"]'
      ];
      
      suspiciousSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const element = el as HTMLElement;
          if (element.textContent && (
            element.textContent.includes('System Info') ||
            element.textContent.includes('Coordinates') ||
            element.textContent.includes('Accuracy') ||
            element.textContent.includes('Al Thumaama')
          )) {
            element.remove();
          }
        });
      });
      
      // Method 4: Clean any remaining technical text
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      const textNodesToRemove: Node[] = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent) {
          const text = node.textContent;
          if (text.includes('System Info') || 
              text.includes('Precise location') ||
              text.includes('Shows detailed streets') ||
              text.includes('Coordinates:') ||
              text.includes('Accuracy:') ||
              text.includes('Al Thumaama')) {
            textNodesToRemove.push(node);
          }
        }
      }
      
      textNodesToRemove.forEach(node => {
        if (node.parentElement) {
          node.parentElement.remove();
        }
      });
    };

    // Ultra-aggressive: Run immediately and every 50ms
    hideGPSInfo();
    const interval = setInterval(hideGPSInfo, 50);
    
    // Also run on DOM mutations
    const observer = new MutationObserver(() => {
      hideGPSInfo();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
}