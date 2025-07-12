import React, { useState, useEffect } from 'react';

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
      <div className="flex items-center justify-center w-full h-full">
        <div className="flex items-center justify-center">
          {/* Circular Progress Ring */}
          <svg 
            className="w-24 h-24 transform -rotate-90" 
            viewBox="0 0 80 80"
            style={{ display: 'block', margin: '0 auto' }}
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
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;