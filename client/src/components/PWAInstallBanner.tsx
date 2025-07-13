import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { useLanguage, getTextAlign, getDirection } from '../lib/i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const { language } = useLanguage();
  const textAlign = getTextAlign(language);
  const direction = getDirection(language);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user hasn't dismissed the banner before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone ||
                       document.referrer.includes('android-app://');

    if (isInstalled) {
      setShowBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt variable
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showBanner || !deferredPrompt) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl shadow-2xl border border-purple-500"
      dir={direction}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-full p-2">
              <Smartphone className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg" style={{ textAlign }}>
                {language === 'ar' ? 'تثبيت تطبيق VetsVan' : 'Install VetsVan App'}
              </h3>
              <p className="text-purple-100 text-sm" style={{ textAlign }}>
                {language === 'ar' 
                  ? 'احصل على تجربة أفضل مع التطبيق المثبت على هاتفك'
                  : 'Get a better experience with the app installed on your phone'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-purple-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-white text-purple-600 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span style={{ textAlign }}>
              {language === 'ar' ? 'تثبيت الآن' : 'Install Now'}
            </span>
          </button>
          <button
            onClick={handleDismiss}
            className="bg-purple-800 text-white font-semibold py-3 px-6 rounded-xl hover:bg-purple-900 transition-colors"
            style={{ textAlign }}
          >
            {language === 'ar' ? 'لاحقاً' : 'Later'}
          </button>
        </div>

        {/* Features List */}
        <div className="mt-4 pt-3 border-t border-purple-500">
          <div className="grid grid-cols-2 gap-2 text-sm text-purple-100">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
              <span style={{ textAlign }}>
                {language === 'ar' ? 'وصول سريع' : 'Quick Access'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
              <span style={{ textAlign }}>
                {language === 'ar' ? 'إشعارات فورية' : 'Push Notifications'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
              <span style={{ textAlign }}>
                {language === 'ar' ? 'يعمل بدون إنترنت' : 'Works Offline'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
              <span style={{ textAlign }}>
                {language === 'ar' ? 'تحديثات تلقائية' : 'Auto Updates'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}