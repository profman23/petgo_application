import { useState } from 'react';
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
  const { language } = useLanguage();

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const toggleBook = () => {
    setIsOpen(!isOpen);
  };

  if (!isOpen) {
    return (
      <div className="flex justify-center my-4">
        <button
          onClick={toggleBook}
          className="flex items-center justify-center w-24 h-20 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
          style={{ backgroundColor: '#852085' }}
        >
          <div className="text-center">
            <BookOpen className="w-10 h-10 text-white mx-auto mb-1" />
            <div className="text-xs text-white font-semibold">
              {language === 'ar' ? 'VetsVan Book' : 'VetsVan Book'}
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center my-4 px-4">
      {/* Book Container - No background, no frame */}
      <div className="relative w-full max-w-sm" style={{ backgroundColor: '#852085' }}>
        {/* Book Spine Effect */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-purple-900 rounded-l-2xl" style={{ backgroundColor: '#6b1a6b' }}></div>
        
        {/* Decorative Book Title */}
        <div className="text-center py-2 mb-2">
          <div className="text-xs font-bold text-white px-3 py-1 inline-block">
            {language === 'ar' ? 'VetsVan Book' : 'VetsVan Book'}
          </div>
        </div>
        
        {/* Book Pages */}
        <div className="flex min-h-[220px] bg-white rounded-xl overflow-hidden">
          {/* Right Page - Arabic */}
          <div className="flex-1 p-4">
            <div className="h-full flex flex-col justify-center">
              <div className="text-right" dir="rtl">
                <div className="text-xs text-purple-600 mb-2 font-semibold">
                  {language === 'ar' ? 'صفحة عربية' : 'Arabic Page'}
                </div>
                <p className="text-sm leading-relaxed text-gray-800 font-arabic">
                  {pages[currentPage]?.arabic}
                </p>
              </div>
            </div>
          </div>
          
          {/* Center Binding */}
          <div className="w-2 bg-purple-600" style={{ backgroundColor: '#852085' }}></div>
          
          {/* Left Page - English */}
          <div className="flex-1 p-4">
            <div className="h-full flex flex-col justify-center">
              <div className="text-left" dir="ltr">
                <div className="text-xs text-purple-600 mb-2 font-semibold">
                  {language === 'ar' ? 'صفحة إنجليزية' : 'English Page'}
                </div>
                <p className="text-sm leading-relaxed text-gray-800">
                  {pages[currentPage]?.english}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Page Navigation */}
        <div className="flex justify-between items-center mt-4 px-3">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="flex items-center justify-center w-10 h-10 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            style={{ backgroundColor: '#852085' }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-white font-bold rounded-full px-3 py-1" style={{ backgroundColor: '#852085' }}>
              {currentPage + 1} / {pages.length}
            </span>
          </div>
          
          <button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            className="flex items-center justify-center w-10 h-10 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            style={{ backgroundColor: '#852085' }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Close Book Button */}
        <div className="flex justify-center mt-3">
          <button
            onClick={toggleBook}
            className="text-sm font-medium text-white transition-all duration-200 px-4 py-2 rounded-full"
            style={{ backgroundColor: '#852085' }}
          >
            {language === 'ar' ? 'إغلاق الكتاب' : 'Close Book'}
          </button>
        </div>
      </div>
    </div>
  );
}