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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Loading...');

  useEffect(() => {
    // Simple timeout-based loading instead of complex image preloading
    const timer = setTimeout(() => {
      onLoadingComplete();
    }, 1500); // 1.5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onLoadingComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {/* Simple Loading Text */}
      <div className="text-center">
        <p className="text-2xl font-bold text-purple-600">
          Loading...
        </p>
      </div>
    </div>
  );
}