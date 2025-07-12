import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { InstallInstructions } from './InstallInstructions';

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

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Force show button for testing purposes
    const forceShow = localStorage.getItem('force-install-button') === 'true';
    
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('📱 beforeinstallprompt event received');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
      setInstallStatus('متاح للتثبيت');
    };

    const handleAppInstalled = () => {
      console.log('✅ App installed successfully');
      setShowButton(false);
      setDeferredPrompt(null);
      setIsInstalling(false);
      setInstallStatus('مثبت');
    };

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      console.log('📱 App is already installed');
      setShowButton(false);
      setInstallStatus('مثبت بالفعل');
    } else {
      console.log('📱 App not installed, checking for install support...');
      setInstallStatus('في انتظار الدعم');
      
      // Show button after a delay if no beforeinstallprompt event
      setTimeout(() => {
        if (!deferredPrompt && !showButton && (forceShow || window.location.protocol === 'https:')) {
          console.log('📱 Showing install button (timeout or force)');
          setShowButton(true);
          setInstallStatus('متاح (تفعيل يدوي)');
        }
      }, 2000);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt, showButton]);

  const handleInstallClick = async () => {
    setIsInstalling(true);
    
    if (deferredPrompt) {
      // Native install prompt available
      try {
        console.log('📱 Triggering native install prompt');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log('📱 Install outcome:', outcome);
        if (outcome === 'accepted') {
          setShowButton(false);
          setInstallStatus('مثبت');
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Error during installation:', error);
        setInstallStatus('خطأ في التثبيت');
      }
    } else {
      // Show detailed instructions modal
      setShowInstructions(true);
      console.log('📱 Showing install instructions modal');
    }
    
    setIsInstalling(false);
  };

  // Debug: Always show button in development or when forced
  const shouldShow = showButton || 
    process.env.NODE_ENV === 'development' || 
    localStorage.getItem('force-install-button') === 'true';

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
          title={`تثبيت التطبيق - ${installStatus}`}
        >
          <Download className={`w-5 h-5 ${isInstalling ? 'animate-pulse' : ''}`} />
        </button>
        
        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute -bottom-6 left-0 text-xs text-gray-500 whitespace-nowrap hidden">
            {installStatus}
          </div>
        )}
      </div>
      
      <InstallInstructions 
        isOpen={showInstructions} 
        onClose={() => setShowInstructions(false)} 
      />
    </>
  );
}