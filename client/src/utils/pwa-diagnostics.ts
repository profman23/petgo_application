// PWA Diagnostics Utility
export function runPWADiagnostics() {
  console.log('🔍 PWA Diagnostics Starting...');
  
  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
  
  console.log('📱 Standalone mode:', isStandalone);
  
  // Check Service Worker registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log('🔧 Service Worker registrations:', registrations.length);
      registrations.forEach((reg, index) => {
        console.log(`   Registration ${index + 1}:`, {
          scope: reg.scope,
          state: reg.active?.state,
          scriptURL: reg.active?.scriptURL
        });
      });
    });
  } else {
    console.log('❌ Service Worker not supported');
  }
  
  // Check beforeinstallprompt event availability
  let beforeInstallPromptFired = false;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    beforeInstallPromptFired = true;
    console.log('✅ beforeinstallprompt event fired');
    console.log('   Platforms:', (e as any).platforms);
  });
  
  // Check after 2 seconds if event fired
  setTimeout(() => {
    if (!beforeInstallPromptFired) {
      console.log('⚠️ beforeinstallprompt event did not fire');
      console.log('   This could mean:');
      console.log('   - App is already installed');
      console.log('   - Browser doesn\'t support PWA installation');
      console.log('   - PWA criteria not met');
      
      // Additional checks
      checkPWACriteria();
    }
  }, 2000);
  
  // Check manifest
  const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (manifestLink) {
    console.log('📄 Manifest found:', manifestLink.href);
    
    fetch(manifestLink.href)
      .then(response => response.json())
      .then(manifest => {
        console.log('📝 Manifest content:', manifest);
        
        // Check required fields
        const required = ['name', 'start_url', 'display', 'icons'];
        const missing = required.filter(field => !manifest[field]);
        
        if (missing.length === 0) {
          console.log('✅ All required manifest fields present');
        } else {
          console.log('❌ Missing manifest fields:', missing);
        }
        
        // Check icons
        if (manifest.icons && manifest.icons.length > 0) {
          console.log('🖼️ Icons found:', manifest.icons.length);
          manifest.icons.forEach((icon: any, index: number) => {
            console.log(`   Icon ${index + 1}:`, {
              src: icon.src,
              sizes: icon.sizes,
              type: icon.type,
              purpose: icon.purpose
            });
          });
        } else {
          console.log('❌ No icons in manifest');
        }
      })
      .catch(error => {
        console.log('❌ Error loading manifest:', error);
      });
  } else {
    console.log('❌ No manifest link found');
  }
  
  // Check HTTPS
  if (location.protocol === 'https:' || location.hostname === 'localhost') {
    console.log('🔒 HTTPS requirement met');
  } else {
    console.log('❌ HTTPS required for PWA');
  }
  
  console.log('🔍 PWA Diagnostics Complete');
}

function checkPWACriteria() {
  console.log('🧪 Checking PWA Installation Criteria:');
  
  // 1. HTTPS
  const hasHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
  console.log('   ✓ HTTPS:', hasHTTPS);
  
  // 2. Service Worker
  const hasSW = 'serviceWorker' in navigator;
  console.log('   ✓ Service Worker support:', hasSW);
  
  // 3. Manifest
  const hasManifest = !!document.querySelector('link[rel="manifest"]');
  console.log('   ✓ Manifest link:', hasManifest);
  
  // 4. Icons
  fetch('/manifest.json')
    .then(response => response.json())
    .then(manifest => {
      const hasIcons = manifest.icons && manifest.icons.length > 0;
      const hasLargeIcon = manifest.icons.some((icon: any) => 
        icon.sizes.includes('192x192') || icon.sizes.includes('512x512')
      );
      
      console.log('   ✓ Has icons:', hasIcons);
      console.log('   ✓ Has large icon (192x192 or 512x512):', hasLargeIcon);
      
      // Overall assessment
      const meetsAllCriteria = hasHTTPS && hasSW && hasManifest && hasIcons && hasLargeIcon;
      
      if (meetsAllCriteria) {
        console.log('✅ All PWA criteria met - install should be available');
      } else {
        console.log('❌ Some PWA criteria not met - this may prevent installation');
      }
    })
    .catch(() => {
      console.log('   ❌ Could not check manifest icons');
    });
}

// Auto-run diagnostics in development
if (import.meta.env.DEV) {
  setTimeout(runPWADiagnostics, 1000);
}