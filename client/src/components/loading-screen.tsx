import { useEffect, useState } from 'react';
import { useLanguage, translations } from '@/lib/i18n';

// Import all images to preload them
import customPetImage from '@assets/image_1751354911432.png';
import customVanImage from '@assets/freepik__background__70346_1751363211262.png';
import customHouseImage from '@assets/freepik_assistant_1751364682430_1751364706224.png';
import newVetClinicImage from '@assets/freepik__a-different-3d-cartoon-style-veterinary-clinic-bui__89216_1751368110471.png';
import buttonImage from '@assets/freepik__background__89215_1751365610576.png';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const { language } = useLanguage();
  const t = translations[language];
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');

  useEffect(() => {
    const imagesToPreload = [
      customPetImage,
      customVanImage,
      customHouseImage,
      newVetClinicImage,
      buttonImage
    ];

    const loadingMessages = [
      t.loading,
      language === 'ar' ? 'تحميل الصور...' : 'Loading images...',
      language === 'ar' ? 'تحضير التطبيق...' : 'Preparing app...',
      language === 'ar' ? 'اكتمل التحميل!' : 'Loading complete!'
    ];

    let loadedCount = 0;
    let messageIndex = 0;

    // Update loading message every 800ms
    const messageInterval = setInterval(() => {
      if (messageIndex < loadingMessages.length - 1) {
        setLoadingText(loadingMessages[messageIndex]);
        messageIndex++;
      }
    }, 800);

    // Preload all images
    const preloadImage = (src: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          setLoadingProgress((loadedCount / imagesToPreload.length) * 100);
          resolve();
        };
        img.onerror = () => {
          loadedCount++;
          setLoadingProgress((loadedCount / imagesToPreload.length) * 100);
          resolve();
        };
        img.src = src;
      });
    };

    // Load all images
    Promise.all(imagesToPreload.map(preloadImage)).then(() => {
      setLoadingText(loadingMessages[loadingMessages.length - 1]);
      
      // Wait a bit more to show completion message
      setTimeout(() => {
        clearInterval(messageInterval);
        onLoadingComplete();
      }, 1000);
    });

    return () => {
      clearInterval(messageInterval);
    };
  }, [language, onLoadingComplete, t.loading]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white screen-border">
      {/* Logo and Title */}
      <div className="mb-8 text-center">
        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
          <span className="text-white text-2xl font-bold">VV</span>
        </div>
        <h1 className="text-2xl font-bold text-purple-700 mb-2">
          {language === 'ar' ? 'عيادة الحيوانات المتنقلة' : 'Mobile Veterinary Clinic'}
        </h1>
        <p className="text-gray-600">
          {language === 'ar' ? 'خدمة بيطرية متميزة في منزلك' : 'Premium veterinary service at your home'}
        </p>
      </div>

      {/* Loading Animation */}
      <div className="mb-6">
        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>

      {/* Loading Progress Bar */}
      <div className="w-64 mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-purple-700 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
        <div className="text-center mt-2 text-sm text-gray-600">
          {Math.round(loadingProgress)}%
        </div>
      </div>

      {/* Loading Text */}
      <div className="text-center">
        <p className="text-lg font-medium text-purple-700 animate-pulse">
          {loadingText}
        </p>
      </div>

      {/* Animated Pets */}
      <div className="mt-8 flex space-x-8">
        <div className="animate-bounce">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🐱</span>
          </div>
        </div>
        <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🐶</span>
          </div>
        </div>
        <div className="animate-bounce" style={{ animationDelay: '0.4s' }}>
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🐦</span>
          </div>
        </div>
      </div>
    </div>
  );
}