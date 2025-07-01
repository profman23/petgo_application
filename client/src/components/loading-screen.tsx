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
    <div className="min-h-screen flex items-center justify-center bg-white screen-border">
      {/* Simple Loading Text */}
      <div className="text-center">
        <p className="text-2xl font-bold text-purple-700">
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </p>
      </div>
    </div>
  );
}