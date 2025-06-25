import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRide } from '@/hooks/useRide';
import { Bell, Settings, User, Car, Star, Truck, CheckCircle, Clock, MapPin, Stethoscope } from 'lucide-react';
import { MEMBERSHIP_TYPES } from '@/lib/constants';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { useTranslation, getDirection, getTextAlign, useLanguage } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { activeRide, isLoadingActiveRide } = useRide();
  
  // Force clear activeRide if it's cancelled
  const actualActiveRide = activeRide && ['cancelled', 'cancelled_by_doctor', 'rejected'].includes(activeRide.status) ? null : activeRide;
  const { t } = useTranslation();
  const { language } = useLanguage();
  const textAlign = getTextAlign(language);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      setLocation('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // رسالة ترحيب للمستخدمين الجدد (يتم عرضها مرة واحدة فقط)
    const hasSeenWelcome = localStorage.getItem(`welcome_${parsedUser.id}`);
    if (!hasSeenWelcome) {
      setTimeout(() => {
        toast({
          title: `مرحباً ${parsedUser.firstName}! 👋`,
          description: `نحن سعداء لانضمامك إلى عيادة الحيوانات المتنقلة. يمكنك الآن طلب طبيب بيطري لحيوانك الأليف ${parsedUser.petName || 'الأليف'}.`,
        });
        localStorage.setItem(`welcome_${parsedUser.id}`, 'true');
      }, 1000);
    }
    
    // Test token validity on page load
    fetch('/api/rides/active', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast({
          title: 'انتهت جلسة العمل',
          description: 'يرجى تسجيل الدخول مرة أخرى',
          variant: 'destructive',
        });
        setLocation('/login');
      }
    }).catch(() => {
      // Network error, ignore
    });
  }, [setLocation, toast]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast({
      title: 'تم تسجيل الخروج',
      description: 'تم تسجيل خروجك بنجاح',
    });
    setLocation('/login');
  };

  // Check for cancelled ride and show simple notification
  useEffect(() => {
    const cancelledRide = localStorage.getItem('cancelledRide');
    if (cancelledRide) {
      toast({
        title: language === 'ar' ? 'تم إلغاء الطلب' : 'Request Cancelled',
        description: language === 'ar' ? 
          'يمكنك تقديم طلب جديد الآن' : 
          'You can submit a new request now',
        variant: 'destructive',
        duration: 3000,
      });
      localStorage.removeItem('cancelledRide');
    }
  }, [toast, language]);

  const handleRequestRide = () => {
    // Always go to request a new ride since cancelled rides are filtered out
    setLocation('/ride-request');
  };

  // Function to get progress percentage based on ride status
  const getProgressPercentage = (status: string): number => {
    switch (status) {
      case 'requested':
        return 10; // Just started
      case 'confirmed':
        return 25; // Doctor accepted, preparing
      case 'enroute':
        return 60; // On the way
      case 'arrived':
        return 100; // Clinic has arrived
      case 'in_progress':
        return 100; // Service in progress
      case 'completed':
        return 100; // Completed
      default:
        return 0;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={getDirection(language)}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation('/user-type-selection')}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
              title={language === 'ar' ? 'العودة للخلف' : 'Go Back'}
            >
              <ArrowLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src={logoImage} 
                alt="Vets Van" 
                className="h-8 object-contain"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">
                {t('membership')}: {MEMBERSHIP_TYPES[user.membershipType as keyof typeof MEMBERSHIP_TYPES]}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button variant="ghost" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="text-red-600">
              {t('logout')}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Active Ride Card - Only show if ride is active */}
        {actualActiveRide && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-900">{t('activeRide')}</p>
                  <p className="text-sm text-blue-700">{t('clickToContinue')}</p>
                </div>
                <Button onClick={() => setLocation('/ride-tracking')} className="bg-blue-600 hover:bg-blue-700">
                  {t('continueTracking')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request Status and Actions */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ textAlign }}>{t('requestMobileVet')}</h2>
          
          {/* Show current ride status if exists */}
          {actualActiveRide && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg shadow-sm">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {actualActiveRide.status === 'requested' && <Clock className="w-5 h-5 text-blue-600 mr-2" />}
                  {actualActiveRide.status === 'confirmed' && <CheckCircle className="w-5 h-5 text-green-600 mr-2" />}
                  {actualActiveRide.status === 'enroute' && <MapPin className="w-5 h-5 text-orange-600 mr-2" />}
                  {actualActiveRide.status === 'arrived' && <MapPin className="w-5 h-5 text-purple-600 mr-2" />}
                  {actualActiveRide.status === 'in_progress' && <Stethoscope className="w-5 h-5 text-red-600 mr-2" />}
                  <div className="text-lg font-semibold text-gray-900" style={{ textAlign }}>
                    {t(actualActiveRide.status)}
                  </div>
                </div>
                <div className="text-sm text-gray-700 mb-2" style={{ textAlign }}>
                  {t(`${actualActiveRide.status}Desc`)}
                </div>
                <div className="mt-2 text-xs text-blue-600" style={{ textAlign }}>
                  {language === 'ar' ? 'رقم الطلب: ' : 'Request ID: '}{actualActiveRide.id}
                </div>
              </div>

              {/* Progress Animation for Active Ride */}
              <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
                <div className="text-sm font-semibold text-purple-800 mb-3 text-center" style={{ textAlign }}>
                  {language === 'ar' ? 'تتبع العيادة البيطرية المتنقلة' : 'Mobile Veterinary Clinic Tracking'}
                </div>
                
                {/* Progress Road */}
                <div className="relative h-16 bg-gray-300 rounded-lg mb-2 overflow-hidden">
                  {/* Progress line - completed portion */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 transition-all duration-1000 ease-in-out"
                    style={{ 
                      width: `${getProgressPercentage(actualActiveRide.status)}%`,
                      zIndex: 1
                    }}
                  ></div>
                  
                  {/* Remaining road */}
                  <div className="absolute inset-0 bg-gray-300"></div>
                  
                  {/* Road markings on completed section */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center overflow-hidden"
                    style={{ width: `${getProgressPercentage(actualActiveRide.status)}%` }}
                  >
                    <div className="w-full h-1 bg-white opacity-80"></div>
                  </div>
                  
                  {/* Road markings on remaining section */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-1 bg-white opacity-40 animate-pulse"></div>
                  </div>
                  
                  {/* Moving car positioned based on progress */}
                  <div 
                    className="absolute top-2 h-12 w-16 bg-purple-600 rounded-lg shadow-lg transition-all duration-2000 ease-in-out"
                    style={{
                      left: language === 'ar' 
                        ? `${100 - getProgressPercentage(actualActiveRide.status)}%`
                        : `${getProgressPercentage(actualActiveRide.status)}%`,
                      transform: language === 'ar' 
                        ? `translateX(50%) scaleX(-1)` 
                        : 'translateX(-50%)',
                      zIndex: 2
                    }}
                  >
                    {/* Car body */}
                    <div className="relative w-full h-full">
                      {/* Car main body */}
                      <div className="absolute inset-1 bg-purple-700 rounded-md"></div>
                      {/* Car windows */}
                      <div className="absolute top-2 left-2 right-2 h-3 bg-blue-200 rounded-sm opacity-80"></div>
                      {/* Car wheels */}
                      <div className="absolute -bottom-1 left-1 w-3 h-3 bg-gray-800 rounded-full"></div>
                      <div className="absolute -bottom-1 right-1 w-3 h-3 bg-gray-800 rounded-full"></div>
                      {/* Medical cross */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-2 h-2 bg-white relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-1 h-2 bg-red-500"></div>
                            <div className="absolute w-2 h-1 bg-red-500"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Start and End markers */}
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-purple-700 z-10">
                    🏥
                  </div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-700 z-10">
                    🏠
                  </div>
                </div>

                {/* Progress percentage */}
                <div className="text-center text-sm text-purple-700" style={{ textAlign }}>
                  {language === 'ar' 
                    ? `تقدم الرحلة: ${getProgressPercentage(actualActiveRide.status)}%`
                    : `Journey Progress: ${getProgressPercentage(actualActiveRide.status)}%`
                  }
                </div>

                {/* Arrival Message when clinic arrives */}
                {(actualActiveRide.status === 'arrived' || actualActiveRide.status === 'in_progress') && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl shadow-lg animate-pulse">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🚐✨</div>
                      <div className="text-lg font-bold text-green-800 mb-2" style={{ textAlign }}>
                        {language === 'ar' ? 'وصلت العيادة البيطرية!' : 'Veterinary Clinic Has Arrived!'}
                      </div>
                      <div className="text-sm text-green-700" style={{ textAlign }}>
                        {language === 'ar' 
                          ? 'العيادة البيطرية المتنقلة في الخارج في انتظارك 🏥' 
                          : 'The mobile veterinary clinic is outside waiting for you 🏥'
                        }
                      </div>
                      {actualActiveRide.status === 'in_progress' && (
                        <div className="mt-2 text-xs text-green-600" style={{ textAlign }}>
                          {language === 'ar' ? 'جاري فحص الحيوان الأليف...' : 'Pet examination in progress...'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Animated Car Coming Soon - Only show when no active ride */}
          {!actualActiveRide && (
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-100 via-blue-100 to-purple-100 rounded-2xl border-2 border-purple-200 shadow-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-800 mb-4" style={{ textAlign }}>
                  {language === 'ar' ? 'العيادة البيطرية المتنقلة' : 'Mobile Veterinary Clinic'}
                </div>
                
                {/* Road Animation */}
                <div className="relative h-16 bg-gray-300 rounded-lg mb-4 overflow-hidden">
                  {/* Road markings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-1 bg-white opacity-60 animate-pulse"></div>
                  </div>
                  
                  {/* Moving car */}
                  <div className={`absolute top-2 h-12 w-16 bg-purple-600 rounded-lg shadow-lg transform transition-all duration-4000 ease-in-out ${
                    language === 'ar' ? 'animate-bounce-right-to-left' : 'animate-bounce-left-to-right'
                  }`}>
                    {/* Car body */}
                    <div className="relative w-full h-full">
                      {/* Car main body */}
                      <div className="absolute inset-1 bg-purple-700 rounded-md"></div>
                      {/* Car windows */}
                      <div className="absolute top-2 left-2 right-2 h-3 bg-blue-200 rounded-sm opacity-80"></div>
                      {/* Car wheels */}
                      <div className="absolute -bottom-1 left-1 w-3 h-3 bg-gray-800 rounded-full"></div>
                      <div className="absolute -bottom-1 right-1 w-3 h-3 bg-gray-800 rounded-full"></div>
                      {/* Medical cross */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-2 h-2 bg-white relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-1 h-2 bg-red-500"></div>
                            <div className="absolute w-2 h-1 bg-red-500"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Start and End markers */}
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-purple-700">
                    🏥
                  </div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-700">
                    🏠
                  </div>
                </div>

                <div className="text-sm text-purple-700 mb-2" style={{ textAlign }}>
                  {language === 'ar' ? 'خدمة طبية بيطرية سريعة وموثوقة' : 'Fast & Reliable Veterinary Service'}
                </div>
                <div className="text-xs text-purple-600" style={{ textAlign }}>
                  {language === 'ar' ? 'نصل إليك في أقل من 30 دقيقة' : 'We reach you in less than 30 minutes'}
                </div>
              </div>
            </div>
          )}
          
          <Button
            onClick={handleRequestRide}
            disabled={!!actualActiveRide}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white p-8 h-auto flex-col shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <Truck className="w-8 h-8" />
            </div>
            <div className="text-center">
              <div className="font-bold text-lg mb-1">
                {actualActiveRide 
                  ? (language === 'ar' ? 'لديك طلب نشط' : 'You have an active request')
                  : (language === 'ar' ? 'اضغط هنا للطلب' : 'Click Here to Request')
                }
              </div>
              <div className="text-sm opacity-90">
                {language === 'ar' ? 'عيادة بيطرية متنقلة' : 'Mobile Veterinary Clinic'}
              </div>
            </div>
          </Button>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{t('recentOrders')}</h3>
            <div className="text-center py-8">
              <p className="text-gray-500">{t('noPreviousOrders')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
