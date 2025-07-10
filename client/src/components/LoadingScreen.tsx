import React, { useState, useEffect } from 'react';
import logoImage from "@assets/IMG-20250415-WA0047_1751986059751.jpg";

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 3;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return newProgress;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [onComplete]);

  const circumference = 2 * Math.PI * 35; // radius = 35
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="relative">
        {/* Circular Progress Ring */}
        <svg 
          className="w-24 h-24 transform -rotate-90 absolute inset-0" 
          viewBox="0 0 80 80"
        >
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke="#f3e8ff"
            strokeWidth="3"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke="#852085"
            strokeWidth="3"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
          />
        </svg>
        
        {/* Logo in center */}
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-lg">
          <img 
            src={logoImage} 
            alt="VetsVan Logo" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;