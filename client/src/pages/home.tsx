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
import truckIcon from "@assets/Screenshot 2025-06-30 172555_1751293572215.png";
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
                  
                  {/* Mercedes Sprinter VETS VAN - Moving */}
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
                    {/* Mercedes Sprinter SVG */}
                    <svg viewBox="0 0 80 56" className="w-full h-full drop-shadow-lg">
                      {/* Main van body */}
                      <rect x="12" y="18" width="55" height="22" rx="4" fill="white" stroke="#ddd" strokeWidth="1"/>
                      
                      {/* Front cab */}
                      <path d="M2 22 L12 18 L12 40 L2 40 Z" fill="white" stroke="#ddd" strokeWidth="1"/>
                      
                      {/* Mercedes grille */}
                      <rect x="1" y="25" width="2" height="9" rx="1" fill="#333"/>
                      <circle cx="2" cy="29" r="1.5" fill="#c0c0c0"/>
                      
                      {/* Windshield */}
                      <path d="M3 22 L12 18 L12 25 L3 27 Z" fill="#87CEEB" opacity="0.7"/>
                      
                      {/* Side windows */}
                      <rect x="15" y="19" width="8" height="4" rx="0.5" fill="#87CEEB" opacity="0.7"/>
                      <rect x="25" y="19" width="8" height="4" rx="0.5" fill="#87CEEB" opacity="0.7"/>
                      <rect x="35" y="19" width="8" height="4" rx="0.5" fill="#87CEEB" opacity="0.7"/>
                      
                      {/* Purple stripe */}
                      <path d="M12 30 Q20 28 30 29 Q40 30 50 29 Q60 28 67 30 L67 37 Q60 35 50 36 Q40 37 30 36 Q20 35 12 37 Z" fill="#8B5CF6" opacity="0.8"/>
                      
                      {/* VETS VAN text */}
                      <text x="40" y="16" fontSize="4" fill="#8B5CF6" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold">VETS VAN</text>
                      <text x="30" y="26" fontSize="3" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold">VETS</text>
                      
                      {/* Veterinary cross */}
                      <g transform="translate(22,32)">
                        <rect x="-1" y="-2" width="2" height="4" fill="#8B5CF6"/>
                        <rect x="-2" y="-1" width="4" height="2" fill="#8B5CF6"/>
                      </g>
                      
                      {/* Mercedes logo */}
                      <circle cx="7" cy="23" r="1.5" fill="#c0c0c0"/>
                      
                      {/* Headlights */}
                      <ellipse cx="3" cy="24" rx="1" ry="1.5" fill="#fff3cd"/>
                      <ellipse cx="3" cy="28" rx="1" ry="1.5" fill="#fff3cd"/>
                      
                      {/* Wheels */}
                      <circle cx="17" cy="41" r="4" fill="#333"/>
                      <circle cx="17" cy="41" r="3" fill="#666"/>
                      <circle cx="17" cy="41" r="1.5" fill="#999"/>
                      
                      <circle cx="55" cy="41" r="4" fill="#333"/>
                      <circle cx="55" cy="41" r="3" fill="#666"/>
                      <circle cx="55" cy="41" r="1.5" fill="#999"/>
                      
                      {/* Rear doors */}
                      <rect x="62" y="22" width="7" height="15" rx="1" fill="white" stroke="#ddd"/>
                      <line x1="65" y1="22" x2="65" y2="37" stroke="#ccc" strokeWidth="0.5"/>
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
                
                {/* Enhanced Road Animation */}
                <div className="relative h-24 bg-gradient-to-r from-pink-100 via-pink-50 to-pink-100 rounded-xl mb-4 overflow-hidden shadow-inner">
                  {/* Road markings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-2 bg-purple-300 opacity-50 animate-pulse rounded-full"></div>
                  </div>
                  
                  {/* Actual Truck Image from Attachment */}
                  <div className={`absolute top-2 h-16 w-20 transform transition-all duration-4000 ease-in-out ${
                    language === 'ar' ? 'animate-bounce-right-to-left' : 'animate-bounce-left-to-right'
                  }`}>
                    {/* SVG Truck - Recreated to match attached image exactly but without background */}
                    <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-lg">
                      {/* Main cargo area - light pink/beige */}
                      <rect x="10" y="15" width="50" height="30" rx="6" fill="#F5E6D8" stroke="#8B4590" strokeWidth="2.5"/>
                      
                      {/* Front cab */}
                      <path d="M60 20 L80 20 Q85 20 85 25 L85 35 Q85 40 80 40 L60 40 Z" fill="#E8C5B5" stroke="#8B4590" strokeWidth="2.5"/>
                      
                      {/* Red emergency light on cab roof */}
                      <rect x="72" y="12" width="6" height="4" rx="1" fill="#E53E3E"/>
                      
                      {/* Blue windshield */}
                      <path d="M65 22 L78 22 L78 30 L65 30 Z" fill="#63B3ED" opacity="0.9"/>
                      
                      {/* Door handle */}
                      <circle cx="75" cy="32" r="1" fill="#8B4590"/>
                      
                      {/* Large paw print in center - exact match to original */}
                      <g transform="translate(35,30)">
                        {/* Main paw pad */}
                        <ellipse cx="0" cy="2" rx="4" ry="3" fill="#8B4590"/>
                        {/* Four toe pads */}
                        <ellipse cx="-3" cy="-2" rx="2" ry="1.5" fill="#8B4590"/>
                        <ellipse cx="-1" cy="-3" rx="2" ry="1.5" fill="#8B4590"/>
                        <ellipse cx="1" cy="-3" rx="2" ry="1.5" fill="#8B4590"/>
                        <ellipse cx="3" cy="-2" rx="2" ry="1.5" fill="#8B4590"/>
                      </g>
                      
                      {/* Wheels - dark with purple centers */}
                      <circle cx="22" cy="48" r="6" fill="#4A5568"/>
                      <circle cx="22" cy="48" r="4" fill="#8B4590"/>
                      <circle cx="22" cy="48" r="2" fill="#2D3748"/>
                      
                      <circle cx="68" cy="48" r="6" fill="#4A5568"/>
                      <circle cx="68" cy="48" r="4" fill="#8B4590"/>
                      <circle cx="68" cy="48" r="2" fill="#2D3748"/>
                      
                      {/* Small details from original */}
                      <circle cx="50" cy="35" r="1" fill="#8B4590"/>
                      <rect x="52" y="34" width="3" height="2" rx="1" fill="#8B4590"/>
                    </svg>
                  </div>
                  
                  {/* Enhanced Start and End markers */}
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    {/* Modern Clinic Building */}
                    <svg width="32" height="32" viewBox="0 0 32 32" className="drop-shadow-lg">
                      <rect x="4" y="12" width="24" height="16" rx="2" fill="#8B5CF6" opacity="0.9"/>
                      <rect x="6" y="8" width="20" height="8" rx="1" fill="#A855F7"/>
                      <rect x="8" y="4" width="16" height="8" rx="1" fill="#C084FC"/>
                      {/* Cross */}
                      <rect x="14" y="18" width="4" height="8" fill="white"/>
                      <rect x="12" y="20" width="8" height="4" fill="white"/>
                      {/* Windows */}
                      <rect x="7" y="10" width="2" height="2" fill="white" opacity="0.8"/>
                      <rect x="10" y="10" width="2" height="2" fill="white" opacity="0.8"/>
                      <rect x="20" y="10" width="2" height="2" fill="white" opacity="0.8"/>
                      <rect x="23" y="10" width="2" height="2" fill="white" opacity="0.8"/>
                    </svg>
                  </div>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {/* Modern House */}
                    <svg width="32" height="32" viewBox="0 0 32 32" className="drop-shadow-lg">
                      {/* House base */}
                      <rect x="6" y="16" width="20" height="12" rx="1" fill="#8B5CF6" opacity="0.9"/>
                      {/* Roof */}
                      <polygon points="4,16 16,6 28,16" fill="#A855F7"/>
                      {/* Door */}
                      <rect x="13" y="20" width="6" height="8" rx="1" fill="#7C3AED"/>
                      {/* Windows */}
                      <rect x="8" y="18" width="3" height="3" fill="white" opacity="0.9"/>
                      <rect x="21" y="18" width="3" height="3" fill="white" opacity="0.9"/>
                      {/* Door handle */}
                      <circle cx="17" cy="24" r="0.5" fill="white"/>
                      {/* Chimney */}
                      <rect x="22" y="8" width="3" height="6" fill="#6B21A8"/>
                    </svg>
                  </div>
                  
                  {/* Animated pets waiting */}
                  <div className="absolute bottom-2 left-8 animate-bounce">
                    <svg width="20" height="16" viewBox="0 0 20 16">
                      {/* Dog */}
                      <ellipse cx="5" cy="12" rx="3" ry="2" fill="#8B5CF6"/>
                      <ellipse cx="5" cy="8" rx="2" ry="2" fill="#8B5CF6"/>
                      <ellipse cx="3" cy="6" rx="1" ry="1.5" fill="#8B5CF6"/>
                      <ellipse cx="7" cy="6" rx="1" ry="1.5" fill="#8B5CF6"/>
                      <circle cx="4" cy="7" r="0.5" fill="white"/>
                      <circle cx="6" cy="7" r="0.5" fill="white"/>
                    </svg>
                  </div>
                  
                  <div className="absolute bottom-2 right-8 animate-bounce delay-1000">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                      {/* Cat */}
                      <ellipse cx="8" cy="12" rx="2.5" ry="2" fill="#8B5CF6"/>
                      <ellipse cx="8" cy="8" rx="2" ry="2" fill="#8B5CF6"/>
                      <polygon points="6,5 8,3 10,5" fill="#8B5CF6"/>
                      <circle cx="7" cy="7" r="0.5" fill="white"/>
                      <circle cx="9" cy="7" r="0.5" fill="white"/>
                      <path d="M8 8 Q7 9 6 8 M8 8 Q9 9 10 8" stroke="white" strokeWidth="0.5" fill="none"/>
                    </svg>
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

            {/* Real VETS VAN Image Display */}
            <div className="flex justify-center mb-6">
              <div className="w-48 h-28 rounded-xl overflow-hidden shadow-2xl border-2 border-purple-200">
                <img 
                  src={vetsVanImage} 
                  alt="VETS VAN Mobile Veterinary Clinic" 
                  className="w-full h-full object-cover object-center"
                />
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
