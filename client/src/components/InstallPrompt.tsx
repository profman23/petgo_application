import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

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

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('ar');

  const translations = {
    ar: {
      install: 'تثبيت التطبيق',
      installDesc: 'ثبت VetsVan على جهازك للوصول السريع',
      installing: 'جاري التثبيت...',
      installed: 'تم التثبيت بنجاح',
      close: 'إغلاق'
    },
    en: {
      install: 'Install App',
      installDesc: 'Install VetsVan on your device for quick access',
      installing: 'Installing...',
      installed: 'Successfully Installed',
      close: 'Close'
    }
  };

  const getCurrentTranslations = () => translations[currentLanguage] || translations.en;

  useEffect(() => {
    // Check if app is already installed
    const checkInstallState = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = (window.navigator as any).standalone === true || isStandalone;
      setIsInstalled(isInstalled);
      
      // Hide install button if already installed
      if (isInstalled) {
        setShowInstallButton(false);
        return;
      }
    };

    checkInstallState();

    // Get language from localStorage
    const savedLanguage = localStorage.getItem('language') || 'ar';
    setCurrentLanguage(savedLanguage);

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallButton(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallButton(false);
    setDeferredPrompt(null);
  };

  if (!showInstallButton || isInstalled) {
    return null;
  }

  const trans = getCurrentTranslations();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">
                {trans.install}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {trans.installDesc}
              </p>
            </div>
          </div>
          <button
            onClick={dismissInstallPrompt}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md"
          >
            {trans.install}
          </button>
          <button
            onClick={dismissInstallPrompt}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {trans.close}
          </button>
        </div>
      </div>
    </div>
  );
}