import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface BookContent {
  arabic: string;
  english: string;
}

interface InteractiveBookProps {
  pages: BookContent[];
}

export function InteractiveBook({ pages }: InteractiveBookProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const { language } = useLanguage();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  const toggleBook = () => {
    setIsOpen(!isOpen);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEndRight = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;

    // Right side: swipe left to go to next page
    if (isLeftSwipe && currentPage < pages.length - 1) {
      nextPage();
    }
  };

  const handleTouchEndLeft = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isRightSwipe = distance < -50;

    // Left side: swipe right to go to previous page
    if (isRightSwipe && currentPage > 0) {
      prevPage();
    }
  };

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center justify-center my-4">
        {/* Custom Book Icon */}
        <button
          onClick={toggleBook}
          className="transition-all duration-300 hover:scale-105"
        >
          <div 
            className="w-16 h-16 mx-auto mb-2 rounded-lg shadow-lg flex items-center justify-center"
            style={{ 
              backgroundColor: '#852085',
              background: 'linear-gradient(45deg, #852085 0%, #a855f7 100%)'
            }}
          >
            <svg 
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
            </svg>
          </div>
        </button>
        {/* Text below book */}
        <div 
          className="text-sm font-semibold"
          style={{ color: '#852085' }}
        >
          {language === 'ar' ? 'كتاب فيتس فان' : 'VetsVan Book'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center my-4 px-4">
      {/* Book Control Buttons - Above the Book */}
      <div className="flex items-center justify-center mb-4 space-x-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <button
          onClick={prevPage}
          disabled={currentPage === 0}
          className="flex items-center px-4 py-2 text-sm font-medium bg-white border rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl hover:scale-105"
          style={{ 
            color: '#852085',
            borderColor: '#852085',
            background: 'linear-gradient(to bottom, #ffffff 0%, #f8f8f8 100%)',
            boxShadow: '0 4px 12px rgba(133, 32, 133, 0.15)'
          }}
        >
          <ChevronLeft className="w-4 h-4 ml-1" />
          {language === 'ar' ? 'السابق' : 'Previous'}
        </button>
        
        {/* Page Counter in Middle */}
        <div className="px-4 py-2 bg-white border-2 rounded-lg shadow-lg" style={{ 
          borderColor: '#852085',
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8f8f8 100%)',
          boxShadow: '0 4px 12px rgba(133, 32, 133, 0.15)'
        }}>
          <span className="text-sm font-semibold" style={{ color: '#852085' }}>
            {language === 'ar' ? `${currentPage + 1} / ${pages.length}` : `${currentPage + 1} / ${pages.length}`}
          </span>
        </div>
        
        <button
          onClick={nextPage}
          disabled={currentPage === pages.length - 1}
          className="flex items-center px-4 py-2 text-sm font-medium bg-white border rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl hover:scale-105"
          style={{ 
            color: '#852085',
            borderColor: '#852085',
            background: 'linear-gradient(to bottom, #ffffff 0%, #f8f8f8 100%)',
            boxShadow: '0 4px 12px rgba(133, 32, 133, 0.15)'
          }}
        >
          {language === 'ar' ? 'التالي' : 'Next'}
          <ChevronRight className="w-4 h-4 mr-1" />
        </button>
        
        <button
          onClick={toggleBook}
          className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg shadow-lg transition-all duration-200 hover:opacity-90 hover:scale-105"
          style={{ 
            backgroundColor: '#852085',
            boxShadow: '0 4px 12px rgba(133, 32, 133, 0.3)'
          }}
        >
          <X className="w-4 h-4 ml-1" />
          {language === 'ar' ? 'إغلاق' : 'Close'}
        </button>
      </div>

      {/* Open Book - White Paper Design */}
      <div className="relative w-full max-w-lg">
        {/* Real Book Design - Two Pages Side by Side */}
        <div 
          className={`flex min-h-[320px] bg-white transition-transform duration-300 ${isFlipping ? 'scale-95 rotate-1' : 'scale-100'} rounded-r-lg rounded-l-sm`}
          style={{ 
            boxShadow: '0 8px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)',
            border: '1px solid #e5e5e5',
            background: 'linear-gradient(to bottom, #fefefe 0%, #f8f8f8 100%)'
          }}

        >
          {/* Book Spine/Binding */}
          <div 
            className="w-2 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 relative"
            style={{ boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.1)' }}
          >
            {/* Binding holes */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>

          {/* Right Page */}
          <div 
            className="flex-1 p-6 bg-white relative cursor-pointer" 
            style={{ 
              background: 'linear-gradient(to bottom right, #ffffff 0%, #fafafa 100%)',
              boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.05)'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEndRight}
          >
            {/* Page lines - subtle */}
            <div className="absolute inset-0 opacity-5">
              {Array.from({length: 15}).map((_, i) => (
                <div key={i} className="border-b border-gray-300" style={{ marginTop: `${i * 20}px`, height: '1px' }}></div>
              ))}
            </div>
            
            <div className="h-full flex flex-col relative z-10">
              <div 
                className={language === 'ar' ? 'text-right' : 'text-left'} 
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <div className="text-xs mb-4 font-semibold" style={{ color: '#852085' }}>
                  {language === 'ar' ? 'الصفحة اليمنى' : 'Right Page'}
                </div>
                <p className={`text-sm leading-relaxed text-gray-800 ${language === 'ar' ? 'font-arabic' : ''}`}>
                  {language === 'ar' ? pages[currentPage]?.arabic : pages[currentPage]?.english}
                </p>
              </div>
            </div>
            
            {/* Page number - right */}
            <div className="absolute bottom-4 right-6 text-xs text-gray-400">
              {(currentPage * 2) + 2}
            </div>
            
            {/* Touch indicator for next page */}
            {currentPage < pages.length - 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-purple-400 opacity-50">
                {language === 'ar' ? '← اسحب للصفحة التالية' : 'Swipe for next page →'}
              </div>
            )}
          </div>

          {/* Left Page */}
          <div 
            className="flex-1 p-6 bg-white relative cursor-pointer" 
            style={{ 
              background: 'linear-gradient(to bottom left, #ffffff 0%, #fafafa 100%)',
              boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.05)'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEndLeft}
          >
            {/* Page lines - subtle */}
            <div className="absolute inset-0 opacity-5">
              {Array.from({length: 15}).map((_, i) => (
                <div key={i} className="border-b border-gray-300" style={{ marginTop: `${i * 20}px`, height: '1px' }}></div>
              ))}
            </div>
            
            <div className="h-full flex flex-col justify-center relative z-10">
              <div 
                className={language === 'ar' ? 'text-right' : 'text-left'} 
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <div className="text-xs mb-4 font-semibold" style={{ color: '#852085' }}>
                  {language === 'ar' ? 'الصفحة اليسرى' : 'Left Page'}
                </div>
                <p className={`text-sm leading-relaxed text-gray-600 italic ${language === 'ar' ? 'font-arabic' : ''}`}>
                  {language === 'ar' 
                    ? 'معلومات إضافية وإرشادات مفيدة حول العناية بالحيوانات الأليفة.'
                    : 'Additional information and helpful guidelines for pet care.'
                  }
                </p>
              </div>
            </div>
            
            {/* Page number - left */}
            <div className="absolute bottom-4 left-6 text-xs text-gray-400">
              {(currentPage * 2) + 1}
            </div>
            
            {/* Touch indicator for previous page */}
            {currentPage > 0 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-purple-400 opacity-50">
                {language === 'ar' ? 'اسحب للصفحة السابقة →' : '← Swipe for previous page'}
              </div>
            )}
          </div>
        </div>
        

        
        {/* Touch Instructions */}
        <div className="text-center mt-2">
          <span className="text-xs text-gray-500">
            {language === 'ar' ? 'اسحب لتقليب الصفحات أو استخدم الأزرار أعلاه' : 'Swipe to turn pages or use buttons above'}
          </span>
        </div>
      </div>
    </div>
  );
}