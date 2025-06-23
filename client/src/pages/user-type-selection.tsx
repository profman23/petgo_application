import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Stethoscope, ArrowLeft } from 'lucide-react';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { useTranslation, getDirection } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';

export default function UserTypeSelection() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4" dir={getDirection(language)}>
      <div className="w-full max-w-md space-y-6">
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
              className="w-full h-full object-contain rounded-full border-2 border-green-200"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('mobileVetClinic')}</h1>
          <p className="text-gray-600">{t('selectAccountType')}</p>
        </div>

        {/* User Type Cards */}
        <div className="space-y-4">
          {/* Customer Login */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300">
            <CardContent className="p-6">
              <Button
                onClick={() => setLocation('/login/customer')}
                className="w-full h-auto p-0 bg-transparent hover:bg-transparent text-inherit"
                variant="ghost"
              >
                <div className="flex items-center space-x-4 rtl:space-x-reverse w-full">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="text-lg font-semibold text-gray-900">عميل</h3>
                    <p className="text-sm text-gray-600">طلب عيادة بيطرية متنقلة</p>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Doctor Login */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-300">
            <CardContent className="p-6">
              <Button
                onClick={() => setLocation('/login/doctor')}
                className="w-full h-auto p-0 bg-transparent hover:bg-transparent text-inherit"
                variant="ghost"
              >
                <div className="flex items-center space-x-4 rtl:space-x-reverse w-full">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="text-lg font-semibold text-gray-900">طبيب بيطري</h3>
                    <p className="text-sm text-gray-600">إدارة الطلبات والمواعيد</p>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-8">
          <p>خدمة العيادة البيطرية المتنقلة</p>
          <p>رعاية حيواناتك في منزلك</p>
        </div>
      </div>
    </div>
  );
}