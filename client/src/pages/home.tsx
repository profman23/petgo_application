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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4" dir={getDirection(language)}>
      {/* Full screen border with logo integration */}
      <div className="min-h-screen border-4 rounded-2xl relative overflow-hidden" style={{ 
        borderColor: 'var(--purple-primary)', 
        boxShadow: 'inset 0 0 50px rgba(139, 47, 139, 0.1), 0 20px 40px rgba(139, 47, 139, 0.15)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)'
      }}>
        


        {/* Main content with padding for border */}
        <div className="min-h-full pt-16">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-16 z-50 rounded-lg mx-4 mb-4">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
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
                  
                  {/* Modern Mercedes Veterinary Ambulance */}
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
                    {/* Mercedes Ambulance SVG */}
                    <svg viewBox="0 0 80 56" className="w-full h-full drop-shadow-lg">
                      {/* Main vehicle body - white Mercedes */}
                      <rect x="8" y="20" width="52" height="24" rx="4" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
                      
                      {/* Front cab */}
                      <rect x="2" y="22" width="12" height="20" rx="3" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
                      
                      {/* Rear doors */}
                      <rect x="56" y="24" width="16" height="16" rx="2" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
                      
                      {/* Windows */}
                      <rect x="4" y="24" width="8" height="6" rx="1" fill="#87CEEB" opacity="0.8"/>
                      <rect x="16" y="22" width="36" height="6" rx="1" fill="#87CEEB" opacity="0.8"/>
                      <rect x="58" y="26" width="12" height="6" rx="1" fill="#87CEEB" opacity="0.8"/>
                      
                      {/* Mercedes Grille */}
                      <rect x="2" y="28" width="2" height="8" fill="#c0c0c0"/>
                      <circle cx="3" cy="32" r="1" fill="#silver"/>
                      
                      {/* Veterinary Cross - Red */}
                      <g transform="translate(36,30)">
                        <rect x="-1" y="-4" width="2" height="8" fill="#ff4444"/>
                        <rect x="-4" y="-1" width="8" height="2" fill="#ff4444"/>
                        <rect x="-1" y="-4" width="2" height="8" fill="white" fillOpacity="0.3"/>
                      </g>
                      
                      {/* Vets Van Text */}
                      <text x="30" y="38" fontSize="4" fill="#666" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold">VETS VAN</text>
                      
                      {/* Emergency Lights */}
                      <rect x="20" y="20" width="3" height="2" rx="1" fill="#ff6b6b" opacity="0.9"/>
                      <rect x="25" y="20" width="3" height="2" rx="1" fill="#4dabf7" opacity="0.9"/>
                      <rect x="30" y="20" width="3" height="2" rx="1" fill="#ff6b6b" opacity="0.9"/>
                      
                      {/* Wheels */}
                      <circle cx="15" cy="46" r="6" fill="#333"/>
                      <circle cx="15" cy="46" r="4" fill="#666"/>
                      <circle cx="15" cy="46" r="2" fill="#999"/>
                      
                      <circle cx="55" cy="46" r="6" fill="#333"/>
                      <circle cx="55" cy="46" r="4" fill="#666"/>
                      <circle cx="55" cy="46" r="2" fill="#999"/>
                      
                      {/* Headlights */}
                      <circle cx="2" cy="30" r="2" fill="#fffacd" opacity="0.9"/>
                      <circle cx="2" cy="36" r="2" fill="#fffacd" opacity="0.9"/>
                      
                      {/* Side medical stripe */}
                      <rect x="16" y="34" width="36" height="2" fill="#ff4444"/>
                    </svg>
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
                  
                  {/* Modern House Icon */}
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 z-10">
                    <svg width="32" height="32" viewBox="0 0 32 32" className="drop-shadow-md">
                      {/* House Base */}
                      <rect x="4" y="16" width="24" height="14" rx="2" fill="#10b981" stroke="#047857" strokeWidth="1"/>
                      
                      {/* Roof */}
                      <polygon points="16,6 4,16 28,16" fill="#059669"/>
                      
                      {/* Chimney */}
                      <rect x="22" y="8" width="3" height="8" fill="#7c2d12"/>
                      
                      {/* Windows */}
                      <rect x="8" y="20" width="4" height="4" rx="1" fill="#fef3c7"/>
                      <rect x="20" y="20" width="4" height="4" rx="1" fill="#fef3c7"/>
                      
                      {/* Door */}
                      <rect x="13" y="22" width="6" height="8" rx="1" fill="#92400e"/>
                      <circle cx="17" cy="26" r="1" fill="#fbbf24"/>
                      
                      {/* Roof Details */}
                      <rect x="15" y="10" width="2" height="6" fill="#047857"/>
                      
                      {/* Garden */}
                      <circle cx="6" cy="28" r="2" fill="#22c55e"/>
                      <circle cx="26" cy="28" r="2" fill="#22c55e"/>
                    </svg>
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
                  
                  {/* Moving Mercedes Ambulance */}
                  <div className={`absolute top-1 h-14 w-20 transform transition-all duration-4000 ease-in-out ${
                    language === 'ar' ? 'animate-bounce-right-to-left' : 'animate-bounce-left-to-right'
                  }`}>
                    {/* Mercedes Ambulance SVG */}
                    <svg viewBox="0 0 80 56" className="w-full h-full drop-shadow-lg">
                      {/* Main vehicle body - white Mercedes */}
                      <rect x="8" y="20" width="52" height="24" rx="4" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
                      
                      {/* Front cab */}
                      <rect x="2" y="22" width="12" height="20" rx="3" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
                      
                      {/* Rear doors */}
                      <rect x="56" y="24" width="16" height="16" rx="2" fill="white" stroke="#e0e0e0" strokeWidth="1"/>
                      
                      {/* Windows */}
                      <rect x="4" y="24" width="8" height="6" rx="1" fill="#87CEEB" opacity="0.8"/>
                      <rect x="16" y="22" width="36" height="6" rx="1" fill="#87CEEB" opacity="0.8"/>
                      <rect x="58" y="26" width="12" height="6" rx="1" fill="#87CEEB" opacity="0.8"/>
                      
                      {/* Mercedes Grille */}
                      <rect x="2" y="28" width="2" height="8" fill="#c0c0c0"/>
                      <circle cx="3" cy="32" r="1" fill="#silver"/>
                      
                      {/* Veterinary Cross - Red */}
                      <g transform="translate(36,30)">
                        <rect x="-1" y="-4" width="2" height="8" fill="#ff4444"/>
                        <rect x="-4" y="-1" width="8" height="2" fill="#ff4444"/>
                        <rect x="-1" y="-4" width="2" height="8" fill="white" fillOpacity="0.3"/>
                      </g>
                      
                      {/* Vets Van Text */}
                      <text x="30" y="38" fontSize="4" fill="#666" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold">VETS VAN</text>
                      
                      {/* Emergency Lights */}
                      <rect x="20" y="20" width="3" height="2" rx="1" fill="#ff6b6b" opacity="0.9"/>
                      <rect x="25" y="20" width="3" height="2" rx="1" fill="#4dabf7" opacity="0.9"/>
                      <rect x="30" y="20" width="3" height="2" rx="1" fill="#ff6b6b" opacity="0.9"/>
                      
                      {/* Wheels */}
                      <circle cx="15" cy="46" r="6" fill="#333"/>
                      <circle cx="15" cy="46" r="4" fill="#666"/>
                      <circle cx="15" cy="46" r="2" fill="#999"/>
                      
                      <circle cx="55" cy="46" r="6" fill="#333"/>
                      <circle cx="55" cy="46" r="4" fill="#666"/>
                      <circle cx="55" cy="46" r="2" fill="#999"/>
                      
                      {/* Headlights */}
                      <circle cx="2" cy="30" r="2" fill="#fffacd" opacity="0.9"/>
                      <circle cx="2" cy="36" r="2" fill="#fffacd" opacity="0.9"/>
                      
                      {/* Side medical stripe */}
                      <rect x="16" y="34" width="36" height="2" fill="#ff4444"/>
                    </svg>
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
          
          {/* Enhanced Request Button with Modern Design */}
          <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-3xl border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            {/* Top Section with Pets and Logo */}
            <div className="flex items-center justify-center gap-6 mb-6">
              {/* Dog Icon */}
              <div className="flex-shrink-0">
                <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-lg">
                  <ellipse cx="24" cy="32" rx="14" ry="12" fill="#d2691e" stroke="#8b4513" strokeWidth="1"/>
                  <circle cx="24" cy="20" r="12" fill="#daa520" stroke="#b8860b" strokeWidth="1"/>
                  <ellipse cx="18" cy="14" rx="4" ry="6" fill="#daa520" stroke="#b8860b" strokeWidth="1"/>
                  <ellipse cx="30" cy="14" rx="4" ry="6" fill="#daa520" stroke="#b8860b" strokeWidth="1"/>
                  <circle cx="20" cy="18" r="2" fill="#000"/>
                  <circle cx="28" cy="18" r="2" fill="#000"/>
                  <ellipse cx="24" cy="22" rx="1.5" ry="1" fill="#000"/>
                  <path d="M22 24 Q24 26 26 24" stroke="#000" strokeWidth="1.5" fill="none"/>
                  <path d="M18 26 Q20 28 22 26" stroke="#ff69b4" strokeWidth="1" fill="none"/>
                </svg>
              </div>

              {/* Company Logo */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-white border-4 border-purple-300 flex items-center justify-center shadow-lg">
                  <img 
                    src={logoImage} 
                    alt="Vets Van" 
                    className="h-12 w-12 object-contain rounded-full"
                  />
                </div>
              </div>

              {/* Cat Icon */}
              <div className="flex-shrink-0">
                <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-lg">
                  <ellipse cx="24" cy="30" rx="12" ry="10" fill="#d3d3d3" stroke="#a9a9a9" strokeWidth="1"/>
                  <circle cx="24" cy="20" r="10" fill="#f5f5f5" stroke="#dcdcdc" strokeWidth="1"/>
                  <polygon points="16,12 20,8 22,14" fill="#f5f5f5" stroke="#dcdcdc" strokeWidth="1"/>
                  <polygon points="32,12 28,8 26,14" fill="#f5f5f5" stroke="#dcdcdc" strokeWidth="1"/>
                  <circle cx="20" cy="18" r="1.5" fill="#32cd32"/>
                  <circle cx="28" cy="18" r="1.5" fill="#32cd32"/>
                  <path d="M22 22 L24 23 L26 22" stroke="#ff69b4" strokeWidth="1" fill="none"/>
                  <path d="M18 24 Q20 26 22 24" stroke="#000" strokeWidth="0.5" fill="none"/>
                  <path d="M26 24 Q28 26 30 24" stroke="#000" strokeWidth="0.5" fill="none"/>
                </svg>
              </div>
            </div>

            {/* Modern Mercedes Ambulance Display */}
            <div className="flex justify-center mb-6">
              <div className="w-32 h-24">
                <svg viewBox="0 0 128 96" className="w-full h-full drop-shadow-xl">
                  {/* Main vehicle body - white Mercedes */}
                  <rect x="12" y="32" width="84" height="38" rx="6" fill="white" stroke="#e0e0e0" strokeWidth="2"/>
                  
                  {/* Front cab */}
                  <rect x="3" y="35" width="19" height="32" rx="5" fill="white" stroke="#e0e0e0" strokeWidth="2"/>
                  
                  {/* Rear doors */}
                  <rect x="90" y="38" width="26" height="26" rx="3" fill="white" stroke="#e0e0e0" strokeWidth="2"/>
                  
                  {/* Windows */}
                  <rect x="6" y="38" width="13" height="10" rx="2" fill="#87CEEB" opacity="0.8"/>
                  <rect x="26" y="35" width="58" height="10" rx="2" fill="#87CEEB" opacity="0.8"/>
                  <rect x="93" y="42" width="19" height="10" rx="2" fill="#87CEEB" opacity="0.8"/>
                  
                  {/* Mercedes Grille */}
                  <rect x="3" y="45" width="3" height="13" fill="#c0c0c0"/>
                  <circle cx="4.5" cy="51" r="2" fill="#silver"/>
                  
                  {/* Large Veterinary Cross - Red */}
                  <g transform="translate(58,48)">
                    <rect x="-2" y="-6" width="4" height="12" fill="#ff4444"/>
                    <rect x="-6" y="-2" width="12" height="4" fill="#ff4444"/>
                    <rect x="-2" y="-6" width="4" height="12" fill="white" fillOpacity="0.3"/>
                  </g>
                  
                  {/* Vets Van Text */}
                  <text x="58" y="60" fontSize="6" fill="#666" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold">VETS VAN</text>
                  
                  {/* Emergency Lights */}
                  <rect x="32" y="32" width="5" height="3" rx="1.5" fill="#ff6b6b" opacity="0.9"/>
                  <rect x="40" y="32" width="5" height="3" rx="1.5" fill="#4dabf7" opacity="0.9"/>
                  <rect x="48" y="32" width="5" height="3" rx="1.5" fill="#ff6b6b" opacity="0.9"/>
                  
                  {/* Wheels */}
                  <circle cx="24" cy="74" r="9" fill="#333"/>
                  <circle cx="24" cy="74" r="6" fill="#666"/>
                  <circle cx="24" cy="74" r="3" fill="#999"/>
                  
                  <circle cx="88" cy="74" r="9" fill="#333"/>
                  <circle cx="88" cy="74" r="6" fill="#666"/>
                  <circle cx="88" cy="74" r="3" fill="#999"/>
                  
                  {/* Headlights */}
                  <circle cx="3" cy="48" r="3" fill="#fffacd" opacity="0.9"/>
                  <circle cx="3" cy="58" r="3" fill="#fffacd" opacity="0.9"/>
                  
                  {/* Side medical stripe */}
                  <rect x="26" y="54" width="58" height="3" fill="#ff4444"/>
                  
                  {/* Mercedes Badge */}
                  <circle cx="58" cy="42" r="4" fill="#silver" stroke="#666" strokeWidth="1"/>
                  <text x="58" y="44" fontSize="3" fill="#000" textAnchor="middle" fontFamily="serif">MB</text>
                </svg>
              </div>
            </div>

            {/* Request Button */}
            <Button
              onClick={handleRequestRide}
              disabled={!!actualActiveRide}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-6 h-auto flex-col shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl"
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
      </div>
    </div>
  );
}
