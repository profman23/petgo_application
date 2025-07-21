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

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentPage < pages.length - 1) {
      nextPage();
    }
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
        {/* Book Pages - White Paper - Single Language Based on System */}
        <div 
          className={`min-h-[280px] bg-white shadow-lg transition-transform duration-300 ${isFlipping ? 'scale-95' : 'scale-100'}`}
          style={{ 
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #f0f0f0'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Single Page - Based on Language */}
          <div className="w-full p-6">
            <div className="h-full flex flex-col justify-center">
              <div 
                className={language === 'ar' ? 'text-right' : 'text-left'} 
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                <div className="text-xs mb-3 font-semibold" style={{ color: '#852085' }}>
                  {language === 'ar' ? 'VetsVan Book' : 'VetsVan Book'}
                </div>
                <p className={`text-sm leading-relaxed text-gray-800 ${language === 'ar' ? 'font-arabic' : ''}`}>
                  {language === 'ar' ? pages[currentPage]?.arabic : pages[currentPage]?.english}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Page Counter */}
        <div className="flex justify-center mt-4">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-white shadow-sm border" style={{ color: '#852085' }}>
            {currentPage + 1} / {pages.length}
          </span>
        </div>
        
        {/* Close Book Button */}
        <div className="flex justify-center mt-3">
          <button
            onClick={toggleBook}
            className="text-xs font-medium text-white px-4 py-2 rounded-full transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: '#852085' }}
          >
            {language === 'ar' ? 'إغلاق الكتاب' : 'Close Book'}
          </button>
        </div>
        
        {/* Touch Instructions */}
        <div className="text-center mt-2">
          <span className="text-xs text-gray-500">
            {language === 'ar' ? 'اسحب لتقليب الصفحات' : 'Swipe to turn pages'}
          </span>
        </div>
      </div>
    </div>
  );
}