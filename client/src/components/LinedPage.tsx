import React, { useRef, useEffect } from 'react';

interface LinedPageProps {
  children: React.ReactNode;
  className?: string;
  isLeft?: boolean;
  language?: string;
  dimensions?: { width: number; height: number };
  isCleanupRef?: React.MutableRefObject<boolean>;
}

// Error Boundary for LinedPage
class LinedPageErrorBoundary extends React.Component<
  { children: React.ReactNode; language?: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; language?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('LinedPage error caught and handled:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-white border border-gray-300 shadow-md">
          <p className="text-gray-600 text-center p-4">
            {this.props.language === 'ar' ? 'خطأ في تحميل الصفحة' : 'Page loading error'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe LinedPage Component
export const LinedPage = React.forwardRef<HTMLDivElement, LinedPageProps>(
  ({ children, className = '', isLeft = false, language = 'ar', dimensions = { width: 400, height: 500 }, isCleanupRef }, ref) => {
    const pageRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      return () => {
        if (pageRef.current) {
          try {
            pageRef.current = null;
          } catch (error) {
            console.warn('LinedPage cleanup error:', error);
          }
        }
      };
    }, []);

    const handleRef = (el: HTMLDivElement | null) => {
      if (isCleanupRef?.current) return;
      
      try {
        pageRef.current = el;
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref) {
          ref.current = el;
        }
      } catch (error) {
        console.warn('LinedPage ref assignment error:', error);
      }
    };

    return (
      <LinedPageErrorBoundary language={language}>
        <div 
          ref={handleRef}
          className={`relative bg-white border border-gray-300 shadow-md ${className}`}
          style={{
            width: '100%',
            height: '100%',
            minHeight: dimensions.width < 200 ? '220px' : '400px',
            backgroundImage: `
              linear-gradient(to bottom, transparent 0px, transparent 19px, #cbd5e1 19px, #cbd5e1 20px),
              linear-gradient(to right, ${isLeft ? 'transparent 0px, transparent 50px, #ef4444 50px, #ef4444 52px, transparent 52px' : '#ef4444 50px, #ef4444 52px, transparent 52px'}),
              radial-gradient(circle at 30px 30px, rgba(0,0,0,0.08) 1px, transparent 1px),
              radial-gradient(circle at 80px 60px, rgba(0,0,0,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '100% 20px, 100% 100%, 150px 150px, 250px 250px',
            backgroundRepeat: 'repeat-y, no-repeat, repeat, repeat',
          }}
        >
          <div 
            className={`p-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}
            style={{ 
              paddingLeft: isLeft ? (dimensions.width < 200 ? '15px' : '30px') : (dimensions.width < 200 ? '60px' : '90px'),
              paddingRight: isLeft ? (dimensions.width < 200 ? '60px' : '90px') : (dimensions.width < 200 ? '15px' : '30px'),
              paddingTop: dimensions.width < 200 ? '25px' : '50px',
              paddingBottom: dimensions.width < 200 ? '15px' : '30px',
              minHeight: '100%',
              lineHeight: dimensions.width < 200 ? '20px' : '28px'
            }}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            {children}
          </div>
        </div>
      </LinedPageErrorBoundary>
    );
  }
);

LinedPage.displayName = 'LinedPage';