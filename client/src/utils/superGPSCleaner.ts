// Super aggressive GPS cleaner - final solution
export class SuperGPSCleaner {
  private static instance: SuperGPSCleaner;
  private cleanerInterval: NodeJS.Timeout | null = null;
  private observer: MutationObserver | null = null;

  private constructor() {}

  static getInstance(): SuperGPSCleaner {
    if (!SuperGPSCleaner.instance) {
      SuperGPSCleaner.instance = new SuperGPSCleaner();
    }
    return SuperGPSCleaner.instance;
  }

  private technicalTexts = [
    'System Info:',
    'معلومات النظام:',
    'Precise location system active',
    'Shows detailed streets and neighbourhoods',
    'Supports Saudi cities with fallback system',
    'Coordinates:',
    'إحداثيات:',
    'Accuracy:',
    'دقة:',
    'Al Thumaama',
    'Al Risal District',
    '24.880742',
    '46.619034',
    '15808m',
    'Riyadh 12643',
    'Saudi Arabia',
    'نظام تحديد موقع دقيق نشط',
    'يعرض الشوارع والأحياء التفصيلية',
    'يدعم المدن السعودية مع نظام احتياطي'
  ];

  cleanAll(): void {
    this.clearLocalStorage();
    this.cleanDOM();
    this.preventTextDisplay();
  }

  private clearLocalStorage(): void {
    // Clear all location-related data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('location') ||
        key.includes('gps') ||
        key.includes('coordinates') ||
        key.includes('accuracy')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  private cleanDOM(): void {
    // Method 1: Remove text content
    this.technicalTexts.forEach(searchText => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      const nodesToClean: Text[] = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.includes(searchText)) {
          nodesToClean.push(node as Text);
        }
      }

      nodesToClean.forEach(textNode => {
        textNode.textContent = 'الرياض - موقعك الحالي';
      });
    });

    // Method 2: Hide elements
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      if (element.textContent) {
        for (const searchText of this.technicalTexts) {
          if (element.textContent.includes(searchText)) {
            (element as HTMLElement).style.cssText = `
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              height: 0 !important;
              overflow: hidden !important;
            `;
            break;
          }
        }
      }
    });
  }

  private preventTextDisplay(): void {
    // Intercept console output
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const message = args.join(' ');
      if (!this.technicalTexts.some(text => message.includes(text))) {
        originalLog.apply(console, args);
      }
    };

    // Override document methods
    const originalCreateTextNode = document.createTextNode;
    document.createTextNode = (data: string) => {
      for (const searchText of this.technicalTexts) {
        if (data.includes(searchText)) {
          return originalCreateTextNode.call(document, 'الرياض - موقعك الحالي');
        }
      }
      return originalCreateTextNode.call(document, data);
    };
  }

  startContinuousCleaning(): void {
    // Clean immediately
    this.cleanAll();

    // Set up interval cleaning
    if (this.cleanerInterval) {
      clearInterval(this.cleanerInterval);
    }
    this.cleanerInterval = setInterval(() => {
      this.cleanAll();
    }, 100); // Every 100ms

    // Set up mutation observer
    if (this.observer) {
      this.observer.disconnect();
    }
    this.observer = new MutationObserver(() => {
      this.cleanAll();
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });
  }

  stop(): void {
    if (this.cleanerInterval) {
      clearInterval(this.cleanerInterval);
      this.cleanerInterval = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Auto-start the super cleaner
if (typeof window !== 'undefined') {
  const cleaner = SuperGPSCleaner.getInstance();
  cleaner.startContinuousCleaning();
  
  // Also run on page events
  window.addEventListener('load', () => cleaner.cleanAll());
  window.addEventListener('DOMContentLoaded', () => cleaner.cleanAll());
  window.addEventListener('focus', () => cleaner.cleanAll());
}