import React, { useState, useRef, forwardRef } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import HTMLFlipBook from 'react-pageflip';

interface BookContent {
  arabic: string;
  english: string;
}

interface InteractiveBookProps {
  pages: BookContent[];
}

// Component for individual page
const PageComponent = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => {
    return (
      <div ref={ref} className="page-wrapper">
        <div className="lined-page">
          {children}
        </div>
      </div>
    );
  }
);

PageComponent.displayName = 'PageComponent';

export function InteractiveBook({ pages }: InteractiveBookProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [startPage, setStartPage] = useState(0);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const { language } = useLanguage();
  const flipBookRef = useRef<any>(null);

  const toggleBook = () => {
    setIsOpen(!isOpen);
    if (!isOpen && startPage > 0) {
      setTimeout(() => {
        goToPage(startPage);
      }, 100);
    }
  };

  const togglePageSelector = () => {
    setShowPageSelector(!showPageSelector);
  };

  const goToNextPage = () => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flipNext();
    }
  };

  const goToPrevPage = () => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flipPrev();
    }
  };

  const goToPage = (pageNum: number) => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flip(pageNum);
    }
  };

  const onFlip = (e: any) => {
    setCurrentPage(e.data);
  };

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={toggleBook}
          className="flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          style={{ 
            background: 'linear-gradient(135deg, #852085 0%, #a855f7 100%)',
            color: 'white'
          }}
        >
          <BookOpen size={20} />
          <span className="font-semibold">
            {language === 'ar' ? 'فتح الكتاب التفاعلي' : 'Open Interactive Book'}
          </span>
        </button>

        {/* Page Selector */}
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePageSelector}
            className="text-sm px-4 py-2 rounded-md border border-purple-300 text-purple-600 hover:bg-purple-50 transition-colors"
          >
            {language === 'ar' ? 'اختيار صفحة البداية' : 'Select Start Page'}
          </button>
          
          {showPageSelector && (
            <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
              <label className="text-sm text-gray-600">
                {language === 'ar' ? 'الصفحة:' : 'Page:'}
              </label>
              <select
                value={startPage}
                onChange={(e) => setStartPage(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={0}>{language === 'ar' ? 'الغلاف' : 'Cover'}</option>
                {pages.map((_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {language === 'ar' ? `صفحة ${index + 1}` : `Page ${index + 1}`}
                  </option>
                ))}
                <option value={pages.length + 1}>{language === 'ar' ? 'الغلاف الخلفي' : 'Back Cover'}</option>
              </select>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Top Navigation Bar */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
          
          {/* Previous Page Button */}
          <button
            onClick={goToPrevPage}
            className="p-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{ 
              background: 'linear-gradient(135deg, #852085 0%, #a855f7 100%)',
              color: 'white'
            }}
            disabled={currentPage === 0}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Close Button */}
          <button
            onClick={toggleBook}
            className="p-3 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
          >
            <X size={20} />
          </button>

          {/* Next Page Button */}
          <button
            onClick={goToNextPage}
            className="p-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{ 
              background: 'linear-gradient(135deg, #852085 0%, #a855f7 100%)',
              color: 'white'
            }}
            disabled={currentPage >= pages.length - 1}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* FlipBook Container */}
        <div className="flex items-center justify-center h-full p-8 pt-20">
          <HTMLFlipBook
            ref={flipBookRef}
            width={350}
            height={500}
            size="stretch"
            minWidth={315}
            maxWidth={1000}
            minHeight={420}
            maxHeight={1350}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={false}
            onFlip={onFlip}
            className="flip-book"
            style={{ margin: '0 auto' }}
            startPage={0}
            drawShadow={true}
            flippingTime={800}
            usePortrait={true}
            startZIndex={0}
            autoSize={true}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            disableFlipByClick={false}
          >
            
            {/* Cover Page */}
            <PageComponent>
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-purple-100 to-pink-100">
                <div className="mb-6">
                  <BookOpen size={64} className="text-purple-600 mx-auto mb-4" />
                  <h1 className="text-3xl font-bold text-purple-800 mb-2">
                    {language === 'ar' ? 'الكتاب التفاعلي' : 'Interactive Book'}
                  </h1>
                  <p className="text-purple-600">
                    {language === 'ar' ? 'دليل الرعاية البيطرية' : 'Veterinary Care Guide'}
                  </p>
                </div>
              </div>
            </PageComponent>

            {/* Content Pages */}
            {pages.map((page, index) => (
              <PageComponent key={index}>
                <div className="h-full p-6 flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <div 
                      className={`${language === 'ar' ? 'text-right' : 'text-left'} h-full`}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    >
                      <p className={`text-base leading-relaxed text-gray-800 ${language === 'ar' ? 'font-arabic' : ''}`}>
                        {language === 'ar' ? page.arabic : page.english}
                      </p>
                    </div>
                  </div>
                </div>
              </PageComponent>
            ))}

            {/* Back Cover */}
            <PageComponent>
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-purple-100 to-pink-100">
                <div className="text-purple-800">
                  <h2 className="text-2xl font-bold mb-4">
                    {language === 'ar' ? 'نهاية الكتاب' : 'End of Book'}
                  </h2>
                  <p className="text-purple-600">
                    {language === 'ar' ? 'شكراً لك على القراءة' : 'Thank you for reading'}
                  </p>
                </div>
              </div>
            </PageComponent>

          </HTMLFlipBook>
        </div>
      </div>
    </div>
  );
}