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
    
    // Show success notification
    setTimeout(() => {
      toast({
        title: newLanguage === 'ar' ? 'تم تغيير اللغة بنجاح' : 'Language changed successfully',
        description: newLanguage === 'ar' ? 'تم تطبيق اللغة العربية' : 'English language applied',
        variant: 'default',
      });
    }, 100);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative px-4 py-2 border-2 bg-white hover:bg-purple-50 transition-all duration-200 rounded-lg shadow-sm"
          style={{ 
            borderColor: 'var(--purple-primary)',
            color: 'var(--purple-primary)'
          }}
        >
          <Languages className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">
            {language === 'ar' ? 'العربية' : 'English'}
          </span>
          <ChevronDown className="w-3 h-3 ml-2 opacity-70" />
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
              ? 'bg-purple-100 text-purple-900 font-medium' 
              : 'hover:bg-purple-50'
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
              ? 'bg-purple-100 text-purple-900 font-medium' 
              : 'hover:bg-purple-50'
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