import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Apple } from 'lucide-react';
import customShareIcon from '@assets/freepik_assistant_1752317793556_1752317800669.png';
import { getDeviceLanguage, installMessages } from '@/utils/device-language';

export function MobileInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    const iOS = /ipad|iphone|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    
    setIsIOS(iOS);
    setIsAndroid(android);

    // Check if already installed or dismissed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    
    const dismissedTimeStr = localStorage.getItem('mobile-install-banner-dismissed');
    const hasDismissed = dismissedTimeStr && new Date().getTime() < parseInt(dismissedTimeStr);

    // Show banner for mobile devices that aren't installed and haven't dismissed
    if ((iOS || android) && !isStandalone && !hasDismissed) {
      // Small delay to let page load
      setTimeout(() => {
        setShowBanner(true);
      }, 2000);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    // Remember dismissal for 3 days
    const dismissTime = new Date().getTime() + (3 * 24 * 60 * 60 * 1000);
    localStorage.setItem('mobile-install-banner-dismissed', dismissTime.toString());
  };

  const getInstallInstructions = () => {
    const deviceLang = getDeviceLanguage();
    const messages = installMessages[deviceLang];
    
    if (isIOS) {
      return {
        icon: <Apple className="h-5 w-5" />,
        title: messages.ios.title,
        steps: (
          <div className={`flex items-center gap-2 ${deviceLang === 'ar' ? 'flex-row-reverse' : ''}`}>
            <span>{messages.ios.shareText}</span>
            <div className="flex items-center gap-1">
              <img 
                src={customShareIcon} 
                alt="Share Icon" 
                className="w-6 h-6 bg-white rounded-sm p-0.5"
              />
              <div className="animate-bounce text-yellow-300">
                👇
              </div>
            </div>
            <span>{messages.ios.thenText}</span>
          </div>
        )
      };
    } else if (isAndroid) {
      return {
        icon: <Smartphone className="h-5 w-5" />,
        title: messages.android.title,
        steps: messages.android.steps
      };
    }
    return null;
  };

  if (!showBanner) return null;

  const instructions = getInstallInstructions();
  if (!instructions) return null;

  const deviceLang = getDeviceLanguage();
  const isRTL = deviceLang === 'ar';

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-300 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-start ${isRTL ? 'space-x-3 space-x-reverse' : 'space-x-3'} flex-1`}>
          <div className="bg-white bg-opacity-20 p-2 rounded-lg mt-1">
            {instructions.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{instructions.title}</h3>
            <div className="text-xs opacity-90 leading-relaxed">
              {instructions.steps}
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-full transition-colors ml-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Small animation indicator */}
      <div className="mt-3 flex justify-center">
        <div className="flex space-x-1 space-x-reverse">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}