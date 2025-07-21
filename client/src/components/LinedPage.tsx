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
          className={`relative bg-white ${className}`}
          style={{
            width: '100%',
            height: '100%',
            minHeight: dimensions.width < 200 ? '220px' : '400px',
            backgroundImage: `
              linear-gradient(to bottom, transparent 0px, transparent 24px, #cbd5e1 24px, #cbd5e1 25px),
              linear-gradient(to right, ${isLeft ? 'transparent 0px, transparent 60px, #ef4444 60px, #ef4444 62px, transparent 62px' : '#ef4444 60px, #ef4444 62px, transparent 62px'}),
              radial-gradient(circle at 40px 40px, rgba(0,0,0,0.06) 1px, transparent 1px),
              radial-gradient(circle at 120px 80px, rgba(0,0,0,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '100% 25px, 100% 100%, 180px 180px, 300px 300px',
            backgroundRepeat: 'repeat-y, no-repeat, repeat, repeat',
            boxShadow: `
              0 8px 16px rgba(0,0,0,0.15),
              0 4px 8px rgba(0,0,0,0.1),
              inset 0 1px 2px rgba(255,255,255,0.8),
              0 12px 24px rgba(0,0,0,0.08)
            `,
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '2px',
          }}
        >
          <div 
            className={`${language === 'ar' ? 'text-right' : 'text-left'}`}
            style={{ 
              paddingLeft: isLeft ? (dimensions.width < 200 ? '20px' : '40px') : (dimensions.width < 200 ? '75px' : '105px'),
              paddingRight: isLeft ? (dimensions.width < 200 ? '75px' : '105px') : (dimensions.width < 200 ? '20px' : '40px'),
              paddingTop: dimensions.width < 200 ? '35px' : '60px',
              paddingBottom: dimensions.width < 200 ? '25px' : '40px',
              minHeight: '100%',
              lineHeight: dimensions.width < 200 ? '25px' : '30px',
              maxWidth: '100%',
              overflow: 'hidden',
              wordWrap: 'break-word'
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