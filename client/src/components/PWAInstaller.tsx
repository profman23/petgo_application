import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, X } from 'lucide-react';

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

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('🎯 beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Add event listener
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For browsers that don't support beforeinstallprompt, show after delay
    const timer = setTimeout(() => {
      if (!deferredPrompt && !isStandalone) {
        console.log('🎯 No beforeinstallprompt, showing manual instructions');
        setShowInstallPrompt(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [deferredPrompt, isInstalled]);

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
          'اضغط على أيقونة المشاركة (□↗) في الأسفل',
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

  return (
    <>
      {/* Install Button */}
      {showInstallPrompt && !showInstructions && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-white border border-purple-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-purple-100 p-2 rounded-full">
                <Download className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">تثبيت تطبيق VetsVan</h3>
                <p className="text-sm text-gray-600">للوصول السريع من الشاشة الرئيسية</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={handleInstallClick}
                className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                تثبيت
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
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
                  <li key={index}>{step}</li>
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