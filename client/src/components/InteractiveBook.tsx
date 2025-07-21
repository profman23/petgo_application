import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import HTMLFlipBook from 'react-pageflip';
import { LinedPage } from '@/components/LinedPage';

interface BookContent {
  arabic: string;
  english: string;
}

interface InteractiveBookProps {
  pages: BookContent[];
}

export function InteractiveBook({ pages }: InteractiveBookProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 400, height: 500 });
  const [isBookReady, setIsBookReady] = useState(false);
  const { language } = useLanguage();
  const bookRef = useRef<any>(null);
  const isCleanupRef = useRef(false);

  // Hook للتعامل مع تغيير حجم الشاشة
  useEffect(() => {
    const updateDimensions = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      let bookWidth, bookHeight;
      
      if (screenWidth < 640) { // Mobile
        bookWidth = Math.min(160, screenWidth * 0.35);
        bookHeight = Math.min(220, screenHeight * 0.4);
      } else if (screenWidth < 1024) { // Tablet
        bookWidth = 280;
        bookHeight = 380;
      } else { // Desktop
        bookWidth = 380;
        bookHeight = 480;
      }
      
      setDimensions({ width: bookWidth, height: bookHeight });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, []);

  // تنظيف عند إغلاق المكون
  useEffect(() => {
    return () => {
      if (bookRef.current) {
        try {
          isCleanupRef.current = true;
          bookRef.current = null;
        } catch (error) {
          console.warn('Cleanup error:', error);
        }
      }
    };
  }, [isOpen]);

  // تنظيف شامل عند unmount
  useEffect(() => {
    return () => {
      isCleanupRef.current = true;
      if (bookRef.current) {
        try {
          bookRef.current = null;
        } catch (error) {
          console.warn('Component unmount cleanup error:', error);
        }
      }
    };
  }, []);

  const toggleBook = () => {
    try {
      if (isOpen) {
        // تنظيف عند الإغلاق
        isCleanupRef.current = true;
        setIsBookReady(false);
        setTimeout(() => {
          if (bookRef.current) {
            bookRef.current = null;
          }
          setIsOpen(false);
          setCurrentPage(0);
          isCleanupRef.current = false;
        }, 100);
      } else {
        // فتح الكتاب
        setIsOpen(true);
        setTimeout(() => {
          setIsBookReady(true);
        }, 200);
      }
    } catch (error) {
      console.warn('Toggle book error:', error);
      setIsOpen(!isOpen);
    }
  };

  const nextPage = () => {
    if (isCleanupRef.current || !isBookReady) return; // منع التنفيذ أثناء التنظيف
    try {
      if (bookRef.current && currentPage < pages.length - 1) {
        bookRef.current.getPageFlip().flipNext();
      }
    } catch (error) {
      console.warn('Next page error:', error);
      if (currentPage < pages.length - 1) {
        setCurrentPage(currentPage + 1);
      }
    }
  };

  const prevPage = () => {
    if (isCleanupRef.current || !isBookReady) return; // منع التنفيذ أثناء التنظيف
    try {
      if (bookRef.current && currentPage > 0) {
        bookRef.current.getPageFlip().flipPrev();
      }
    } catch (error) {
      console.warn('Previous page error:', error);
      if (currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  const onFlip = (e: any) => {
    if (isCleanupRef.current) return; // منع التنفيذ أثناء التنظيف
    try {
      setCurrentPage(e.data);
    } catch (error) {
      console.warn('Flip event error:', error);
    }
  };



  if (!isOpen) {
    return (
      <button
        onClick={toggleBook}
        className="flex items-center gap-2 p-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #852085, #a855f7)' }}
      >
        <BookOpen size={24} />
        <span className="font-semibold">
          {language === 'ar' ? 'اقرأ الكتاب' : 'Read Book'}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        
        {/* Navigation Controls */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-10">
          {/* Previous button */}
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className={`p-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl ${
              currentPage === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-white text-purple-600 hover:bg-purple-50'
            }`}
            style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Close button */}
          <button
            onClick={toggleBook}
            className="p-3 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
          >
            <X size={20} />
          </button>

          {/* Next button */}
          <button
            onClick={nextPage}
            disabled={currentPage >= pages.length - 1}
            className={`p-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl ${
              currentPage >= pages.length - 1 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-white text-purple-600 hover:bg-purple-50'
            }`}
            style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Loading State */}
        {!isBookReady && (
          <div className="p-2 sm:p-4 md:p-8 pt-16 sm:pt-18 md:pt-20">
            <div className="w-full max-w-7xl mx-auto flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{language === 'ar' ? 'جاري تحميل الكتاب...' : 'Loading book...'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Book Container */}
        {isBookReady && (
          <div className="p-2 sm:p-4 md:p-8 pt-16 sm:pt-18 md:pt-20">
            <div className="w-full max-w-7xl mx-auto">
              <HTMLFlipBook
              ref={(el) => {
                if (isCleanupRef.current) return; // منع التحديث أثناء التنظيف
                try {
                  // تنظيف المرجع القديم إذا وجد
                  if (bookRef.current && bookRef.current !== el) {
                    bookRef.current = null;
                  }
                  bookRef.current = el;
                  if (el && !isBookReady) {
                    setTimeout(() => setIsBookReady(true), 100);
                  }
                } catch (error) {
                  console.warn('Ref assignment error:', error);
                }
              }}
              width={dimensions.width}
              height={dimensions.height}
              size="fixed"
              minWidth={140}
              maxWidth={500}
              minHeight={180}
              maxHeight={650}
              showCover={false}
              flippingTime={600}
              usePortrait={false}
              startZIndex={0}
              autoSize={false}
              maxShadowOpacity={0.4}
              showPageCorners={true}
              disableFlipByClick={false}
              startPage={0}
              drawShadow={true}
              mobileScrollSupport={true}
              clickEventForward={false}
              useMouseEvents={true}
              swipeDistance={15}
              onFlip={onFlip}
              onChangeOrientation={() => {
                try {
                  setTimeout(updateDimensions, 100);
                } catch (error) {
                  console.warn('Orientation change error:', error);
                }
              }}
              onChangeState={(e) => {
                try {
                  console.log('Book state changed:', e);
                } catch (error) {
                  console.warn('State change error:', error);
                }
              }}
              className="mx-auto book-container"
              style={{ 
                margin: '0 auto',
                background: 'linear-gradient(45deg, #8b4513, #a0522d)',
                borderRadius: '6px',
                padding: '3px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            >
              {pages.map((page, index) => (
                <LinedPage 
                  key={index}
                  isLeft={index % 2 === 0}
                  language={language}
                  dimensions={dimensions}
                  isCleanupRef={isCleanupRef}
                >
                  <div className="h-full">
                    <h3 
                      className={`font-bold mb-4 ${dimensions.width < 200 ? 'text-sm' : 'text-lg'}`}
                      style={{ color: '#852085' }}
                    >
                      {language === 'ar' ? `الصفحة ${index + 1}` : `Page ${index + 1}`}
                    </h3>
                    <p className={`${dimensions.width < 200 ? 'text-xs' : 'text-sm'} leading-relaxed text-gray-800 ${language === 'ar' ? 'font-arabic' : ''}`}>
                      {language === 'ar' ? page.arabic : page.english}
                    </p>
                  </div>
                </LinedPage>
              ))}
            </HTMLFlipBook>
          </div>
        </div>
        )}

        {/* Page indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-gray-600">
          <span className="bg-white px-3 py-1 rounded-full shadow-md">
            {currentPage + 1} / {pages.length}
          </span>
        </div>
      </div>
    </div>
  );
}