// Final solution: Nuclear GPS info cleaner
export const finalGPSCleaner = () => {
  // List of technical texts to remove
  const technicalTexts = [
    'System Info:',
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

  // Method 1: Replace text content directly
  const replaceTextContent = () => {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      if (element.textContent) {
        let text = element.textContent;
        let changed = false;
        
        technicalTexts.forEach(searchText => {
          if (text.includes(searchText)) {
            text = text.replace(new RegExp(searchText, 'gi'), '');
            changed = true;
          }
        });
        
        if (changed) {
          element.textContent = text.trim() || (element.closest('[data-location-display]') ? 'الرياض - موقعك الحالي' : '');
        }
      }
    });
  };

  // Method 2: Hide elements completely
  const hideElements = () => {
    technicalTexts.forEach(searchText => {
      const elements = document.querySelectorAll('*');
      elements.forEach(element => {
        if (element.textContent && element.textContent.includes(searchText)) {
          (element as HTMLElement).style.cssText = `
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            top: -9999px !important;
            left: -9999px !important;
          `;
          
          // Also hide parent if it only contains technical info
          const parent = element.parentElement;
          if (parent && parent.textContent?.trim() === element.textContent?.trim()) {
            (parent as HTMLElement).style.cssText = (element as HTMLElement).style.cssText;
          }
        }
      });
    });
  };

  // Method 3: Remove elements from DOM
  const removeElements = () => {
    technicalTexts.forEach(searchText => {
      const elements = Array.from(document.querySelectorAll('*'));
      elements.forEach(element => {
        if (element.textContent && element.textContent.includes(searchText)) {
          element.remove();
        }
      });
    });
  };

  // Method 4: Clean text nodes
  const cleanTextNodes = () => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    const nodesToClean: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent) {
        for (const searchText of technicalTexts) {
          if (node.textContent.includes(searchText)) {
            nodesToClean.push(node as Text);
            break;
          }
        }
      }
    }

    nodesToClean.forEach(textNode => {
      let newText = textNode.textContent || '';
      technicalTexts.forEach(searchText => {
        newText = newText.replace(new RegExp(searchText, 'gi'), '');
      });
      textNode.textContent = newText.trim() || 'الرياض - موقعك الحالي';
    });
  };

  // Execute all methods
  try {
    replaceTextContent();
    hideElements();
    removeElements();
    cleanTextNodes();
  } catch (error) {
    console.warn('GPS cleaner error:', error);
  }
};

// Auto-execute
if (typeof window !== 'undefined') {
  // Run immediately
  finalGPSCleaner();
  
  // Run every 50ms
  setInterval(finalGPSCleaner, 50);
  
  // Run on DOM changes
  const observer = new MutationObserver(finalGPSCleaner);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}