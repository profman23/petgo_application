import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Languages, ChevronDown } from 'lucide-react';
import { useLanguage, useTranslation } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleLanguageChange = (newLanguage: 'ar' | 'en') => {
    setLanguage(newLanguage);
    
    // Show success notification with auto-dismiss after 2 seconds
    setTimeout(() => {
      const toastInstance = toast({
        title: newLanguage === 'ar' ? 'تم تغيير اللغة بنجاح' : 'Language changed successfully',
        description: newLanguage === 'ar' ? 'تم تطبيق اللغة العربية' : 'English language applied',
        variant: 'default',
      });
      
      // Auto-dismiss after 2 seconds
      setTimeout(() => {
        toastInstance.dismiss();
      }, 2000);
    }, 100);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative px-2 py-1 text-xs border bg-white hover:bg-gray-50 transition-all duration-200 rounded-md shadow-sm"
          style={{ 
            borderColor: '#d1d5db',
            color: '#6b7280'
          }}
        >
          <span className="text-xs font-medium">
            {language === 'ar' ? 'ع' : 'EN'}
          </span>
          <span className="sr-only">{t('selectLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="min-w-[140px] border-2 shadow-lg"
        style={{ 
          borderColor: 'var(--purple-primary)',
          boxShadow: '0 8px 25px rgba(139, 47, 139, 0.15)'
        }}
      >
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('ar')}
          className={`cursor-pointer transition-colors ${
            language === 'ar' 
              ? 'bg-purple-600 text-purple-600 font-medium' 
              : 'hover:bg-purple-100'
          }`}
        >
          <span className="text-sm flex items-center gap-2">
            🇸🇦 العربية
            {language === 'ar' && <span className="ml-auto text-purple-600">✓</span>}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className={`cursor-pointer transition-colors ${
            language === 'en' 
              ? 'bg-purple-600 text-purple-600 font-medium' 
              : 'hover:bg-purple-100'
          }`}
        >
          <span className="text-sm flex items-center gap-2">
            🇺🇸 English
            {language === 'en' && <span className="ml-auto text-purple-600">✓</span>}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}