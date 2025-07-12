import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BrowserCacheManager } from '@/utils/clearBrowserCache';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface CacheClearButtonProps {
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function CacheClearButton({ 
  variant = 'outline', 
  size = 'sm',
  className = ''
}: CacheClearButtonProps) {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const cacheManager = BrowserCacheManager.getInstance();
  
  const handleClearCache = async () => {
    setIsClearing(true);
    
    try {
      // Clear all caches
      await cacheManager.clearAllCaches();
      
      // Show success message
      toast({
        title: language === 'ar' ? 'تم مسح التخزين المؤقت' : 'Cache Cleared',
        description: language === 'ar' ? 
          'تم مسح جميع البيانات المؤقتة بنجاح. جاري إعادة التحميل...' : 
          'All cached data cleared successfully. Reloading...',
      });
      
      // Force page reload after a short delay
      setTimeout(() => {
        cacheManager.forceHardRefresh();
      }, 1000);
      
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: language === 'ar' ? 'خطأ في مسح التخزين المؤقت' : 'Cache Clear Error',
        description: language === 'ar' ? 
          'حدث خطأ أثناء مسح التخزين المؤقت' : 
          'An error occurred while clearing cache',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClearCache}
      disabled={isClearing}
      className={`${className} min-w-[120px]`}
    >
      {isClearing ? (
        <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4 mr-2" />
      )}
      {language === 'ar' ? 
        (isClearing ? 'جاري المسح...' : 'مسح التخزين المؤقت') : 
        (isClearing ? 'Clearing...' : 'Clear Cache')
      }
    </Button>
  );
}