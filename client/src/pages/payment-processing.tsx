import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";

export default function PaymentProcessing() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);

  // توجه لصفحة الأنشطة بعد 5 ثوان
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation('/activity');
    }, 5000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  const handleGoToActivity = () => {
    setLocation('/activity');
  };

  return (
    <div 
      className={`min-h-screen bg-gradient-to-br from-purple-50 to-white flex flex-col ${direction === 'rtl' ? 'font-arabic' : ''}`}
      dir={direction}
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white border-2 border-purple-200 rounded-xl p-1 shadow-md hover:shadow-lg transition-all duration-200">
              <img 
                src={logoImage} 
                alt="VetsVan Logo" 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-gray-800 font-semibold text-lg">
                {language === 'ar' ? 'معالجة الطلب' : 'Processing Request'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-xl border-0">
          <CardContent className="p-8 text-center">
            {/* Success Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-purple-600 animate-pulse" />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-4" style={{ textAlign }}>
              <h1 className="text-2xl font-bold text-gray-800">
                {language === 'ar' ? 'جاري معالجة طلبك' : 'Processing Your Request'}
              </h1>
              
              <p className="text-gray-600 leading-relaxed">
                {language === 'ar' 
                  ? 'تم استلام طلب حجز موعدك بنجاح. نحن الآن نقوم بمعالجة طلبك وسيتم التواصل معك قريباً لتأكيد تفاصيل الزيارة.'
                  : 'Your appointment booking request has been received successfully. We are now processing your request and will contact you soon to confirm the visit details.'
                }
              </p>

              <div className="bg-purple-50 rounded-lg p-4 mt-6">
                <p className="text-sm text-purple-700">
                  {language === 'ar'
                    ? '• سيتم التواصل معك خلال 15 دقيقة\n• يمكنك متابعة حالة طلبك في صفحة الأنشطة\n• تأكد من تشغيل الإشعارات'
                    : '• You will be contacted within 15 minutes\n• You can track your request status in the Activity page\n• Make sure notifications are enabled'
                  }
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-8">
              <Button
                onClick={handleGoToActivity}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center justify-center gap-2">
                  {language === 'ar' ? 'عرض أنشطتي' : 'View My Activities'}
                  <ArrowRight 
                    className={`w-4 h-4 ${direction === 'rtl' ? 'rotate-180' : ''}`} 
                  />
                </span>
              </Button>
            </div>

            {/* Auto redirect notice */}
            <p className="text-xs text-gray-500 mt-4">
              {language === 'ar' 
                ? 'سيتم توجيهك تلقائياً لصفحة الأنشطة خلال 5 ثوان...'
                : 'You will be automatically redirected to Activities page in 5 seconds...'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}