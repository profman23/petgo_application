import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRide } from '@/hooks/useRide';
import { Bell, Settings, User, Car, Star, Truck, CheckCircle, Clock, MapPin, Stethoscope } from 'lucide-react';
import { MEMBERSHIP_TYPES } from '@/lib/constants';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import vetsVanImage from "@assets/image_1751292329902.png";
import truckIcon from "@assets/10773561_1751295833176.png";
import petsImage from "@assets/freepik_assistant_1751361910420_1751361937178.png";
import newVetVanImage from "@assets/freepik__background__70346_1751363211262.png";
import newHouseImage from "@assets/freepik_assistant_1751363501296_1751363531753.jpeg";
import { useTranslation, getDirection, getTextAlign, useLanguage } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';
import { FixedFooter } from '@/components/fixed-footer';

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-2" dir={getDirection(language)}>
      {/* Full screen border with logo integration */}
      <div className="min-h-screen border-4 rounded-2xl relative overflow-hidden" style={{ 
        borderColor: 'var(--purple-primary)', 
        boxShadow: 'inset 0 0 50px rgba(139, 47, 139, 0.1), 0 20px 40px rgba(139, 47, 139, 0.15)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)'
      }}>
        


        {/* Main content with minimal padding */}
        <div className="min-h-full pt-2">
          {/* Header - Compact Design */}
          <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-2 z-50 rounded-lg mx-2 mb-2">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img 
                src={logoImage} 
                alt="Vets Van" 
                className="h-6 object-contain"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">
                {MEMBERSHIP_TYPES[user.membershipType as keyof typeof MEMBERSHIP_TYPES]}
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

      <div className="p-2">
        {/* Active Ride Card - Only show if ride is active */}
        {actualActiveRide && (
          <Card className="mb-3 border-blue-200 bg-blue-50">
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
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900 mb-2" style={{ textAlign }}>{t('requestMobileVet')}</h2>
          
          {/* Show current ride status if exists */}
          {actualActiveRide && (
            <div className="mb-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg shadow-sm">
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
              <div className="mt-2 p-2 bg-white rounded-lg border border-purple-200">
                <div className="text-xs font-semibold text-purple-800 mb-2 text-center" style={{ textAlign }}>
                  {language === 'ar' ? 'تتبع العيادة البيطرية المتنقلة' : 'Mobile Veterinary Clinic Tracking'}
                </div>
                
                {/* Progress Road */}
                <div className="relative h-12 bg-gray-300 rounded-lg mb-1 overflow-hidden">
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
                  
                  {/* New Veterinary Van - Moving */}
                  <div 
                    className="absolute top-1 h-14 w-20 transition-all duration-2000 ease-in-out"
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
                    {/* Beautiful VET van with pets inside */}
                    <img 
                      src={newVetVanImage} 
                      alt="Veterinary Van with Pets" 
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  </div>
                  
                  {/* Modern Clinic Icon */}
                  <div className="absolute left-1 top-1/2 transform -translate-y-1/2 z-10">
                    <svg width="32" height="32" viewBox="0 0 32 32" className="drop-shadow-md">
                      {/* Clinic Building */}
                      <rect x="2" y="12" width="28" height="18" rx="2" fill="#4f46e5" stroke="#3730a3" strokeWidth="1"/>
                      
                      {/* Roof */}
                      <polygon points="16,4 2,12 30,12" fill="#6366f1"/>
                      
                      {/* Windows */}
                      <rect x="6" y="16" width="4" height="4" rx="1" fill="#93c5fd"/>
                      <rect x="14" y="16" width="4" height="4" rx="1" fill="#93c5fd"/>
                      <rect x="22" y="16" width="4" height="4" rx="1" fill="#93c5fd"/>
                      
                      {/* Main Door */}
                      <rect x="13" y="22" width="6" height="8" rx="1" fill="#1e40af"/>
                      <circle cx="17" cy="26" r="1" fill="#fbbf24"/>
                      
                      {/* Medical Cross */}
                      <g transform="translate(16,10)">
                        <rect x="-1" y="-3" width="2" height="6" fill="white"/>
                        <rect x="-3" y="-1" width="6" height="2" fill="white"/>
                      </g>
                      
                      {/* Clinic Sign */}
                      <rect x="8" y="6" width="16" height="4" rx="1" fill="white" stroke="#e5e7eb"/>
                      <text x="16" y="8.5" fontSize="3" fill="#374151" textAnchor="middle" fontFamily="Arial">VET CLINIC</text>
                    </svg>
                  </div>
                  
                  {/* Beautiful New House Image */}
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 z-10">
                    <img 
                      src={newHouseImage} 
                      alt="Beautiful House" 
                      className="w-8 h-8 object-contain drop-shadow-lg"
                    />
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
            <div className="mb-3 p-3 bg-gradient-to-r from-purple-100 via-blue-100 to-purple-100 rounded-2xl border-2 border-purple-200 shadow-lg">
              <div className="text-center">
                <div className="text-sm font-semibold text-purple-800 mb-2" style={{ textAlign }}>
                  {language === 'ar' ? 'العيادة البيطرية المتنقلة' : 'Mobile Veterinary Clinic'}
                </div>
                
                {/* Enhanced Road Animation */}
                <div className="relative h-16 bg-gradient-to-r from-pink-100 via-pink-50 to-pink-100 rounded-xl mb-2 overflow-hidden shadow-inner">
                  {/* Road markings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-2 bg-purple-300 opacity-50 animate-pulse rounded-full"></div>
                  </div>
                  
                  {/* New Veterinary Van Image */}
                  <div className={`absolute top-1 h-12 w-16 transform transition-all duration-4000 ease-in-out ${
                    language === 'ar' ? 'animate-bounce-right-to-left' : 'animate-bounce-left-to-right'
                  }`}>
                    {/* Beautiful VET van with pets inside */}
                    <img 
                      src={newVetVanImage} 
                      alt="Veterinary Van with Pets" 
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  </div>
                  
                  {/* Enhanced Start and End markers - Compact */}
                  <div className="absolute left-1 top-1/2 transform -translate-y-1/2">
                    {/* Professional Veterinary Clinic - Compact */}
                    <svg width="32" height="32" viewBox="0 0 48 48" className="drop-shadow-lg">
                      {/* Main building foundation */}
                      <rect x="2" y="20" width="44" height="24" rx="3" fill="#8B4590" stroke="#6B21A8" strokeWidth="2"/>
                      
                      {/* Second floor */}
                      <rect x="6" y="12" width="36" height="16" rx="2" fill="#A855F7" stroke="#7C3AED" strokeWidth="1.5"/>
                      
                      {/* Top floor/sign area */}
                      <rect x="10" y="6" width="28" height="12" rx="2" fill="#C084FC" stroke="#9333EA" strokeWidth="1"/>
                      
                      {/* Large Medical Cross - Center focal point */}
                      <rect x="20" y="28" width="8" height="12" fill="white" stroke="#8B4590" strokeWidth="1"/>
                      <rect x="16" y="32" width="16" height="4" fill="white" stroke="#8B4590" strokeWidth="1"/>
                      
                      {/* Multiple Windows */}
                      <rect x="8" y="15" width="4" height="4" rx="1" fill="white" opacity="0.9" stroke="#7C3AED" strokeWidth="0.5"/>
                      <rect x="14" y="15" width="4" height="4" rx="1" fill="white" opacity="0.9" stroke="#7C3AED" strokeWidth="0.5"/>
                      <rect x="30" y="15" width="4" height="4" rx="1" fill="white" opacity="0.9" stroke="#7C3AED" strokeWidth="0.5"/>
                      <rect x="36" y="15" width="4" height="4" rx="1" fill="white" opacity="0.9" stroke="#7C3AED" strokeWidth="0.5"/>
                      
                      {/* Ground floor windows */}
                      <rect x="6" y="25" width="3" height="4" rx="0.5" fill="white" opacity="0.8"/>
                      <rect x="39" y="25" width="3" height="4" rx="0.5" fill="white" opacity="0.8"/>
                      
                      {/* Door */}
                      <rect x="10" y="35" width="6" height="9" rx="1" fill="#4C1D95" stroke="white" strokeWidth="1"/>
                      <circle cx="15" cy="39" r="0.8" fill="white"/>
                      
                      {/* Roof line */}
                      <polygon points="0,20 24,4 48,20" fill="#6B21A8" opacity="0.7"/>
                      
                      {/* Veterinary Sign */}
                      <text x="24" y="12" textAnchor="middle" fill="white" fontSize="4" fontWeight="bold">VET</text>
                    </svg>
                  </div>
                  
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                    {/* Beautiful New House Image */}
                    <img 
                      src={newHouseImage} 
                      alt="Beautiful House" 
                      className="w-8 h-8 object-contain drop-shadow-lg"
                    />
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
          
          {/* Enhanced Request Button with Modern Design */}
          <div className="mb-3 p-3 bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-3xl border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300">


            {/* Cute Pets Image Display */}
            <div className="flex justify-center mb-3">
              <img 
                src={petsImage} 
                alt="Cute Dog and Cat" 
                className="w-48 h-32 object-contain hover:scale-105 transition-transform duration-300 drop-shadow-lg"
              />
            </div>

            {/* Request Button */}
            <Button
              onClick={handleRequestRide}
              disabled={!!actualActiveRide}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 h-auto flex-col shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl"
            >
              <div className="text-center">
                <div className="font-bold text-xl mb-2">
                  {actualActiveRide 
                    ? (language === 'ar' ? 'لديك طلب نشط' : 'You have an active request')
                    : (language === 'ar' ? 'اضغط هنا للطلب' : 'Click Here to Request')
                  }
                </div>
                <div className="text-base opacity-90 mb-2">
                  {language === 'ar' ? 'عيادة بيطرية متنقلة - مرسيدس' : 'Mobile Veterinary Clinic - Mercedes'}
                </div>
                <div className="text-sm opacity-75">
                  {language === 'ar' ? 'خدمة احترافية للكلاب والقطط' : 'Professional service for dogs and cats'}
                </div>
              </div>
            </Button>
          </div>
        </div>

        {/* Add padding for fixed footer */}
        <div className="pb-20"></div>
        </div>
        </div>
      </div>
      
      {/* Fixed Footer */}
      <FixedFooter />
    </div>
  );
}
