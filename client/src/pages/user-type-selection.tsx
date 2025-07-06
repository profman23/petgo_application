import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, ArrowLeft } from 'lucide-react';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { useTranslation, getDirection } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';

export default function UserTypeSelection() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4" dir={getDirection(language)}>
      <div 
        className="w-full max-w-md space-y-6 p-8 rounded-lg border-2" 
        style={{ 
          borderColor: 'var(--purple-primary)', 
          boxShadow: '0 15px 35px rgba(139, 47, 139, 0.15)',
          backgroundColor: 'white'
        }}
      >
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>
        
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <img 
              src={logoImage} 
              alt="Vets Van" 
              className="w-full h-full object-contain rounded-full border-2" 
              style={{ borderColor: 'var(--purple-primary)' }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('mobileVetClinic')}</h1>
          <p className="text-gray-600">{t('selectAccountType')}</p>
        </div>

        {/* User Type Cards */}
        <div className="space-y-4">
          {/* Customer Login */}
          <Card 
            className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2" 
            style={{ borderColor: 'var(--purple-primary)', boxShadow: '0 8px 25px rgba(139, 47, 139, 0.1)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(139, 47, 139, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 47, 139, 0.1)';
            }}
          >
            <CardContent className="p-6">
              <Button
                onClick={() => setLocation('/login/customer')}
                className="w-full h-auto p-0 bg-transparent hover:bg-transparent text-inherit"
                variant="ghost"
              >
                <div className="flex items-center space-x-4 rtl:space-x-reverse w-full">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(139, 47, 139, 0.1)' }}>
                    <User className="w-6 h-6" style={{ color: 'var(--purple-primary)' }} />
                  </div>
                  <div className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <h3 className="text-lg font-semibold text-gray-900">{t('customerLogin')}</h3>
                    <p className="text-sm text-gray-600">{t('customerLoginDesc')}</p>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </div>
              </Button>
            </CardContent>
          </Card>


        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-8">
          <p>{t('mobileVetService')}</p>
          <p>{t('petCareAtHome')}</p>
        </div>
      </div>
    </div>
  );
}