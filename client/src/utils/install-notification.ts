// Install notification utility for PWA
export async function showInstallNotification() {
  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.log('📱 Notifications not supported');
    return false;
  }

  // Request permission if not already granted
  let permission = Notification.permission;
  
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission === 'granted') {
    // Show notification
    const notification = new Notification('تطبيق VetsVan متاح للتثبيت', {
      body: 'ثبت التطبيق على جهازك للوصول السريع إلى خدمات العيادة البيطرية',
      icon: '/app-icon.png',
      badge: '/app-icon.png',
      tag: 'pwa-install',
      requireInteraction: true,
      actions: [
        {
          action: 'install',
          title: 'تثبيت',
          icon: '/app-icon.png'
        },
        {
          action: 'dismiss',
          title: 'إغلاق',
          icon: '/app-icon.png'
        }
      ]
    });

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Dispatch custom event to trigger install prompt
      window.dispatchEvent(new CustomEvent('show-install-prompt'));
    };

    return true;
  }

  return false;
}

// Service worker message handler
export function setupInstallNotificationHandler() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SHOW_INSTALL_NOTIFICATION') {
        showInstallNotification();
      }
    });
  }
}