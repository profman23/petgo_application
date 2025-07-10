import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import logoImage from "@assets/IMG-20250415-WA0047_1751986059751.jpg";

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const { language } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);

  const stages = [
    { ar: 'تحميل البيانات...', en: 'Loading data...' },
    { ar: 'تهيئة النظام...', en: 'Initializing system...' },
    { ar: 'جاري الإعداد...', en: 'Setting up...' },
    { ar: 'تم التحميل!', en: 'Loading complete!' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        
        // Update stage based on progress
        if (newProgress >= 25 && stage === 0) setStage(1);
        if (newProgress >= 50 && stage === 1) setStage(2);
        if (newProgress >= 75 && stage === 2) setStage(3);
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete, stage]);

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 to-white flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo with Circular Progress */}
        <div className="relative mb-8">
          {/* Circular Progress Ring */}
          <svg 
            className="w-32 h-32 transform -rotate-90 absolute inset-0" 
            viewBox="0 0 100 100"
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#f3e8ff"
              strokeWidth="4"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="4"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300 ease-out"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B2F8B" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#8B2F8B" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Logo in center */}
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
            <img 
              src={logoImage} 
              alt="VetsVan Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Progress percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-md mt-20">
              <span className="text-xs font-bold text-purple-800">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>

        {/* App Title */}
        <h1 className="text-2xl font-bold text-purple-800 mb-2">
          {language === 'ar' ? 'فيتس فان' : 'VetsVan'}
        </h1>
        
        {/* Subtitle */}
        <p className="text-purple-600 mb-6">
          {language === 'ar' 
            ? 'العيادة البيطرية المتنقلة' 
            : 'Mobile Veterinary Clinic'
          }
        </p>

        {/* Loading Stage */}
        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
          {/* Animated dots */}
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          
          {/* Loading text */}
          <span className="text-purple-700 font-medium">
            {stages[stage][language as 'ar' | 'en']}
          </span>
        </div>

        {/* Progress bar (linear) */}
        <div className="w-64 bg-purple-100 rounded-full h-2 mt-6 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-purple-800 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;