import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, X } from 'lucide-react';
import { showInstallNotification } from '@/utils/install-notification';
import customShareIcon from '@assets/freepik_assistant_1752317793556_1752317800669.png';

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
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        browser: 'Chrome',
        steps: [
          'اضغط على الثلاث نقاط (⋮) في أعلى المتصفح',
          'اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"',
          'اضغط "إضافة" للتأكيد'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        steps: [
          'اضغط على أيقونة المنزل (+) في شريط العنوان',
          'اختر "إضافة إلى الشاشة الرئيسية"',
          'اضغط "إضافة" للتأكيد'
        ]
      };
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return {
        browser: 'Safari',
        steps: [
          <div key="safari-step1" className="flex items-center gap-2">
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
          'مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية"',
          'اضغط "إضافة" للتأكيد'
        ]
      };
    } else if (userAgent.includes('edg')) {
      return {
        browser: 'Edge',
        steps: [
          'اضغط على الثلاث نقاط (...) في أعلى المتصفح',
          'اختر "التطبيقات" ثم "تثبيت التطبيق"',
          'اضغط "تثبيت" للتأكيد'
        ]
      };
    }
    
    return {
      browser: 'المتصفح',
      steps: [
        'ابحث عن خيار "إضافة إلى الشاشة الرئيسية" في قائمة المتصفح',
        'أو ابحث عن أيقونة التثبيت في شريط العنوان',
        'اتبع التعليمات لإكمال التثبيت'
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
                <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            
            {/* Title and Description */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">تثبيت تطبيق VetsVan</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              ثبت التطبيق على جهازك للوصول السريع إلى خدمات العيادة البيطرية المتنقلة
            </p>
            
            {/* Benefits */}
            <div className="bg-purple-50 rounded-lg p-4 mb-6 text-right">
              <ul className="text-sm text-purple-800 space-y-2">
                <li className="flex items-center justify-end space-x-2 space-x-reverse">
                  <span>وصول سريع من الشاشة الرئيسية</span>
                  <span className="text-purple-600">✓</span>
                </li>
                <li className="flex items-center justify-end space-x-2 space-x-reverse">
                  <span>يعمل بدون إنترنت</span>
                  <span className="text-purple-600">✓</span>
                </li>
                <li className="flex items-center justify-end space-x-2 space-x-reverse">
                  <span>تحديثات تلقائية</span>
                  <span className="text-purple-600">✓</span>
                </li>
              </ul>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg"
              >
                {deferredPrompt ? 'تثبيت الآن' : 'عرض التعليمات'}
              </button>
              
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={handleNotNow}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  ليس الآن
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  لا أريد
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
              <h3 className="text-lg font-semibold text-gray-900">تثبيت التطبيق</h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center space-x-2 space-x-reverse mb-3">
                <Smartphone className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">
                  تعليمات التثبيت - {getBrowserInstructions().browser}
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
                💡 بعد التثبيت، ستجد أيقونة VetsVan في الشاشة الرئيسية لجهازك
              </p>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-4 bg-purple-600 text-white py-2 rounded-md font-medium hover:bg-purple-700 transition-colors"
            >
              فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
}