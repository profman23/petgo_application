import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
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
        {/* Simple Book Icon */}
        <button
          onClick={toggleBook}
          className="transition-all duration-300 hover:scale-105"
        >
          <BookOpen 
            className="w-16 h-16 mx-auto mb-2" 
            style={{ color: '#852085' }}
          />
        </button>
        {/* Text below book */}
        <div 
          className="text-sm font-semibold"
          style={{ color: '#852085' }}
        >
          VetsVan Book
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center my-4 px-4">
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
        
        {/* Page Counter - Book Style */}
        <div className="flex justify-center mt-4">
          <div className="bg-white shadow-lg rounded-sm px-4 py-2 border" style={{ 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            background: 'linear-gradient(to bottom, #ffffff 0%, #f8f8f8 100%)'
          }}>
            <span className="text-xs font-medium" style={{ color: '#852085' }}>
              {language === 'ar' ? `صفحة ${currentPage + 1} من ${pages.length}` : `Page ${currentPage + 1} of ${pages.length}`}
            </span>
          </div>
        </div>
        
        {/* Page Navigation Buttons - Book Style */}
        <div className="flex justify-center mt-3 space-x-4">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="px-3 py-1 text-xs font-medium bg-white border rounded-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
            style={{ 
              color: '#852085',
              borderColor: '#852085'
            }}
          >
            {language === 'ar' ? '← السابق' : '← Previous'}
          </button>
          
          <button
            onClick={toggleBook}
            className="px-3 py-1 text-xs font-medium text-white rounded-sm transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: '#852085' }}
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
          
          <button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            className="px-3 py-1 text-xs font-medium bg-white border rounded-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
            style={{ 
              color: '#852085',
              borderColor: '#852085'
            }}
          >
            {language === 'ar' ? 'التالي →' : 'Next →'}
          </button>
        </div>
        
        {/* Touch Instructions */}
        <div className="text-center mt-2">
          <span className="text-xs text-gray-500">
            {language === 'ar' ? 'اسحب لتقليب الصفحات أو استخدم الأزرار' : 'Swipe to turn pages or use buttons'}
          </span>
        </div>
      </div>
    </div>
  );
}