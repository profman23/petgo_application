import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import HTMLFlipBook from 'react-pageflip';

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
  const { language } = useLanguage();
  const bookRef = useRef<any>(null);

  const toggleBook = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setCurrentPage(0);
    }
  };

  const nextPage = () => {
    if (bookRef.current && currentPage < pages.length - 1) {
      bookRef.current.getPageFlip().flipNext();
    }
  };

  const prevPage = () => {
    if (bookRef.current && currentPage > 0) {
      bookRef.current.getPageFlip().flipPrev();
    }
  };

  const onFlip = (e: any) => {
    setCurrentPage(e.data);
  };

  // Component for lined paper page
  const LinedPage = React.forwardRef<HTMLDivElement, { 
    children: React.ReactNode; 
    className?: string;
    isLeft?: boolean;
  }>(({ children, className = '', isLeft = false }, ref) => (
    <div 
      ref={ref} 
      className={`relative bg-white border border-gray-300 shadow-md ${className}`}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
        backgroundImage: `
          linear-gradient(to bottom, transparent 0px, transparent 27px, #cbd5e1 27px, #cbd5e1 28px),
          linear-gradient(to right, ${isLeft ? 'transparent 0px, transparent 70px, #ef4444 70px, #ef4444 72px, transparent 72px' : '#ef4444 70px, #ef4444 72px, transparent 72px'}),
          radial-gradient(circle at 40px 40px, rgba(0,0,0,0.1) 1px, transparent 1px),
          radial-gradient(circle at 120px 80px, rgba(0,0,0,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '100% 28px, 100% 100%, 200px 200px, 300px 300px',
        backgroundRepeat: 'repeat-y, no-repeat, repeat, repeat',
      }}
    >
      <div 
        className={`p-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}
        style={{ 
          paddingLeft: isLeft ? '30px' : '90px',
          paddingRight: isLeft ? '90px' : '30px',
          paddingTop: '50px',
          paddingBottom: '30px',
          minHeight: '100%',
          lineHeight: '28px'
        }}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {children}
      </div>
    </div>
  ));

  LinedPage.displayName = 'LinedPage';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-6xl mx-auto bg-gradient-to-b from-amber-50 to-amber-100 rounded-xl shadow-2xl">
        
        {/* Navigation Controls */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-10">
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

        {/* Book Container */}
        <div className="p-8 pt-20">
          <div className="w-full max-w-4xl mx-auto">
            <HTMLFlipBook
              ref={bookRef}
              width={400}
              height={500}
              size="stretch"
              minWidth={300}
              maxWidth={800}
              minHeight={400}
              maxHeight={600}
              showCover={false}
              flippingTime={800}
              usePortrait={false}
              startZIndex={0}
              autoSize={true}
              maxShadowOpacity={0.5}
              showPageCorners={true}
              disableFlipByClick={false}
              startPage={0}
              drawShadow={true}
              mobileScrollSupport={false}
              clickEventForward={false}
              useMouseEvents={true}
              swipeDistance={30}
              onFlip={onFlip}
              className="mx-auto"
              style={{ 
                margin: '0 auto',
                background: 'linear-gradient(45deg, #8b4513, #a0522d)',
                borderRadius: '8px',
                padding: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              {pages.map((page, index) => (
                <LinedPage 
                  key={index}
                  isLeft={index % 2 === 0}
                >
                  <div className="h-full">
                    <h3 className="text-lg font-bold mb-6" style={{ color: '#852085' }}>
                      {language === 'ar' ? `الصفحة ${index + 1}` : `Page ${index + 1}`}
                    </h3>
                    <p className={`text-sm leading-relaxed text-gray-800 ${language === 'ar' ? 'font-arabic' : ''}`}>
                      {language === 'ar' ? page.arabic : page.english}
                    </p>
                  </div>
                </LinedPage>
              ))}
            </HTMLFlipBook>
          </div>
        </div>

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