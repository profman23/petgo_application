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
  const language = useLanguage();

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
          className="flex items-center justify-center w-24 h-20 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-2 border-amber-500"
        >
          <div className="text-center">
            <BookOpen className="w-10 h-10 text-amber-900 mx-auto mb-1" />
            <div className="text-xs text-amber-900 font-semibold">كتاب تعليمي</div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center my-4 px-4">
      {/* Book Container */}
      <div className="relative w-full max-w-sm bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 rounded-2xl shadow-2xl p-2 book-shadow">
        {/* Book Spine Effect */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-b from-amber-800 via-amber-900 to-amber-800 rounded-l-2xl shadow-inner"></div>
        
        {/* Decorative Book Title */}
        <div className="text-center py-2 mb-2">
          <div className="text-xs font-bold text-amber-900 bg-amber-200 rounded-full px-3 py-1 inline-block shadow-sm">
            معلومات بيطرية مفيدة
          </div>
        </div>
        
        {/* Book Pages */}
        <div className="flex min-h-[220px] bg-gradient-to-br from-cream-50 to-amber-50 rounded-xl overflow-hidden shadow-inner border border-amber-300">
          {/* Right Page - Arabic */}
          <div className="flex-1 p-4 border-l-2 border-amber-300">
            <div className="h-full flex flex-col justify-center">
              <div className="text-right" dir="rtl">
                <div className="text-xs text-amber-700 mb-2 font-semibold">صفحة عربية</div>
                <p className="text-sm leading-relaxed text-gray-800 font-arabic">
                  {pages[currentPage]?.arabic}
                </p>
              </div>
            </div>
          </div>
          
          {/* Center Binding with decorative line */}
          <div className="w-2 bg-gradient-to-b from-amber-400 via-amber-600 to-amber-400 relative">
            <div className="absolute inset-0 bg-amber-800 opacity-30"></div>
          </div>
          
          {/* Left Page - English */}
          <div className="flex-1 p-4 border-r-2 border-amber-300">
            <div className="h-full flex flex-col justify-center">
              <div className="text-left" dir="ltr">
                <div className="text-xs text-amber-700 mb-2 font-semibold">English Page</div>
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
            className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-amber-300 to-amber-400 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:from-amber-400 hover:to-amber-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:hover:shadow-lg"
          >
            <ChevronLeft className="w-5 h-5 text-amber-900" />
          </button>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-amber-800 font-bold bg-white rounded-full px-3 py-1 shadow-sm">
              {currentPage + 1} / {pages.length}
            </span>
          </div>
          
          <button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-amber-300 to-amber-400 rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:from-amber-400 hover:to-amber-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:hover:shadow-lg"
          >
            <ChevronRight className="w-5 h-5 text-amber-900" />
          </button>
        </div>
        
        {/* Close Book Button */}
        <div className="flex justify-center mt-3">
          <button
            onClick={toggleBook}
            className="text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 transition-all duration-200 px-4 py-2 rounded-full shadow-sm hover:shadow-md"
          >
            إغلاق الكتاب / Close Book
          </button>
        </div>
      </div>
    </div>
  );
}