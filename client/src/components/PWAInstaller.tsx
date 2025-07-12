import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, X } from 'lucide-react';
import { showInstallNotification } from '@/utils/install-notification';
import customShareIcon from '@assets/Screenshot 2025-07-12 145346_1752321286791.png';
import { getDeviceLanguageWithLogging, installMessages, safariInstructions } from '@/utils/device-language';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed install prompt before
    const dismissedTimeStr = localStorage.getItem('pwa-install-dismissed');
    const hasUserDismissed = dismissedTimeStr && new Date().getTime() < parseInt(dismissedTimeStr);
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('🎯 beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after a short delay if user hasn't dismissed it
      if (!hasUserDismissed) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 1500);
      }
    };

    // Add event listener
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For mobile browsers (iOS Safari, Android browsers without beforeinstallprompt)
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // Show install prompt for mobile devices after delay
    const timer = setTimeout(() => {
      if (!isStandalone && !hasUserDismissed && isMobile) {
        console.log('🎯 Showing mobile install prompt');
        setShowInstallPrompt(true);
      }
    }, 2500);

    // Show immediate prompt for iOS devices that don't get beforeinstallprompt
    if (isIOS && !hasUserDismissed && !isStandalone) {
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 1000);
    }

    // Listen for custom install prompt event
    const handleShowInstallPrompt = () => {
      if (!isStandalone && !hasUserDismissed) {
        setShowInstallPrompt(true);
      }
    };

    // Listen for service worker messages
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'TRIGGER_INSTALL') {
        handleShowInstallPrompt();
      }
    };

    window.addEventListener('show-install-prompt', handleShowInstallPrompt);
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    // Temporarily disable notifications to avoid errors
    // setTimeout(() => {
    //   if (!isStandalone && !hasUserDismissed && !deferredPrompt) {
    //     showInstallNotification();
    //   }
    // }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('show-install-prompt', handleShowInstallPrompt);
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      console.log('🎯 Showing install prompt');
      deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      console.log('🎯 User choice:', outcome);
      
      if (outcome === 'accepted') {
        console.log('🎯 User accepted the install prompt');
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } else {
      // Show manual instructions
      setShowInstructions(true);
    }
  };

  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const deviceLang = getDeviceLanguageWithLogging();
    const isArabic = deviceLang === 'ar';
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        browser: 'Chrome',
        steps: isArabic ? [
          'اضغط على الثلاث نقاط (⋮) في أعلى المتصفح',
          'اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"',
          'اضغط "إضافة" للتأكيد'
        ] : [
          'Tap the three dots (⋮) at the top of the browser',
          'Select "Add to Home screen" or "Install app"',
          'Tap "Add" to confirm'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        steps: isArabic ? [
          'اضغط على أيقونة المنزل (+) في شريط العنوان',
          'اختر "إضافة إلى الشاشة الرئيسية"',
          'اضغط "إضافة" للتأكيد'
        ] : [
          'Tap the home icon (+) in the address bar',
          'Select "Add to Home screen"',
          'Tap "Add" to confirm'
        ]
      };
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      const steps = isArabic ? [
        <div key="safari-step1" className="flex items-center gap-2 flex-row-reverse">
          <span>اضغط على أيقونة المشاركة</span>
          <div className="flex items-center gap-1">
            <img 
              src={customShareIcon} 
              alt="Share Icon" 
              className="w-6 h-6 bg-gray-100 rounded-sm p-0.5"
            />
            <div className="animate-bounce text-yellow-500">
              👇
            </div>
          </div>
          <span>في الأسفل</span>
        </div>,
        safariInstructions.ar[1],
        safariInstructions.ar[2]
      ] : [
        <div key="safari-step1" className="flex items-center gap-2">
          <span>Tap the Share icon</span>
          <div className="flex items-center gap-1">
            <img 
              src={customShareIcon} 
              alt="Share Icon" 
              className="w-6 h-6 bg-gray-100 rounded-sm p-0.5"
            />
            <div className="animate-bounce text-yellow-500">
              👇
            </div>
          </div>
          <span>at the bottom</span>
        </div>,
        safariInstructions.en[1],
        safariInstructions.en[2]
      ];
      
      return {
        browser: 'Safari',
        steps
      };
    } else if (userAgent.includes('edg')) {
      return {
        browser: 'Edge',
        steps: isArabic ? [
          'اضغط على الثلاث نقاط (...) في أعلى المتصفح',
          'اختر "التطبيقات" ثم "تثبيت التطبيق"',
          'اضغط "تثبيت" للتأكيد'
        ] : [
          'Tap the three dots (...) at the top of the browser',
          'Select "Apps" then "Install this site as an app"',
          'Tap "Install" to confirm'
        ]
      };
    }
    
    return {
      browser: isArabic ? 'المتصفح' : 'Browser',
      steps: isArabic ? [
        'ابحث عن خيار "إضافة إلى الشاشة الرئيسية" في قائمة المتصفح',
        'أو ابحث عن أيقونة التثبيت في شريط العنوان',
        'اتبع التعليمات لإكمال التثبيت'
      ] : [
        'Look for "Add to Home screen" option in browser menu',
        'Or look for install icon in the address bar',
        'Follow the instructions to complete installation'
      ]
    };
  };

  if (isInstalled) {
    return null;
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Remember user's choice for 7 days
    const dismissTime = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('pwa-install-dismissed', dismissTime.toString());
  };

  const handleNotNow = () => {
    setShowInstallPrompt(false);
    // Remember user's choice for 1 day only
    const dismissTime = new Date().getTime() + (24 * 60 * 60 * 1000);
    localStorage.setItem('pwa-install-dismissed', dismissTime.toString());
  };

  return (
    <>
      {/* Enhanced Install Popup */}
      {showInstallPrompt && !showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center transform animate-in zoom-in-95 duration-200">
            {/* App Icon */}
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-4 rounded-2xl">
                <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center p-2">
                  <img 
                    src="/attached_assets/Screenshot 2025-07-12 145346_1752321286791.png" 
                    alt="VetsVan Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
            
            {/* Title and Description */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {getDeviceLanguageWithLogging() === 'ar' ? 'تثبيت تطبيق VetsVan' : 'Install VetsVan App'}
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {getDeviceLanguageWithLogging() === 'ar' 
                ? 'ثبت التطبيق على جهازك للوصول السريع إلى خدمات العيادة البيطرية المتنقلة'
                : 'Install the app on your device for quick access to mobile veterinary services'
              }
            </p>
            
            {/* Benefits */}
            <div className={`bg-purple-50 rounded-lg p-4 mb-6 ${getDeviceLanguageWithLogging() === 'ar' ? 'text-right' : 'text-left'}`}>
              <ul className="text-sm text-purple-800 space-y-2">
                {getDeviceLanguageWithLogging() === 'ar' ? [
                  <li key="benefit1" className="flex items-center justify-end space-x-2 space-x-reverse">
                    <span>وصول سريع من الشاشة الرئيسية</span>
                    <span className="text-purple-600">✓</span>
                  </li>,
                  <li key="benefit2" className="flex items-center justify-end space-x-2 space-x-reverse">
                    <span>يعمل بدون إنترنت</span>
                    <span className="text-purple-600">✓</span>
                  </li>,
                  <li key="benefit3" className="flex items-center justify-end space-x-2 space-x-reverse">
                    <span>تحديثات تلقائية</span>
                    <span className="text-purple-600">✓</span>
                  </li>
                ] : [
                  <li key="benefit1" className="flex items-center justify-start space-x-2">
                    <span className="text-purple-600">✓</span>
                    <span>Quick access from home screen</span>
                  </li>,
                  <li key="benefit2" className="flex items-center justify-start space-x-2">
                    <span className="text-purple-600">✓</span>
                    <span>Works offline</span>
                  </li>,
                  <li key="benefit3" className="flex items-center justify-start space-x-2">
                    <span className="text-purple-600">✓</span>
                    <span>Automatic updates</span>
                  </li>
                ]}
              </ul>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg"
              >
                {deferredPrompt 
                  ? (getDeviceLanguageWithLogging() === 'ar' ? 'تثبيت الآن' : 'Install Now')
                  : (getDeviceLanguageWithLogging() === 'ar' ? 'عرض التعليمات' : 'Show Instructions')
                }
              </button>
              
              <div className={`flex ${getDeviceLanguageWithLogging() === 'ar' ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
                <button
                  onClick={handleNotNow}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  {getDeviceLanguageWithLogging() === 'ar' ? 'ليس الآن' : 'Not Now'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  {getDeviceLanguageWithLogging() === 'ar' ? 'لا أريد' : 'No Thanks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {getDeviceLanguageWithLogging() === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
              </h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className={`flex items-center mb-3 ${getDeviceLanguageWithLogging() === 'ar' ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}>
                <Smartphone className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">
                  {getDeviceLanguageWithLogging() === 'ar' 
                    ? `تعليمات التثبيت - ${getBrowserInstructions().browser}`
                    : `Installation Guide - ${getBrowserInstructions().browser}`
                  }
                </span>
              </div>
              
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                {getBrowserInstructions().steps.map((step, index) => (
                  <li key={index} className="leading-relaxed">
                    {typeof step === 'string' ? step : step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-purple-50 p-3 rounded-md">
              <p className="text-xs text-purple-700">
                {getDeviceLanguageWithLogging() === 'ar' 
                  ? '💡 بعد التثبيت، ستجد أيقونة VetsVan في الشاشة الرئيسية لجهازك'
                  : '💡 After installation, you will find the VetsVan icon on your device home screen'
                }
              </p>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-4 bg-purple-600 text-white py-2 rounded-md font-medium hover:bg-purple-700 transition-colors"
            >
              {getDeviceLanguageWithLogging() === 'ar' ? 'فهمت' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}