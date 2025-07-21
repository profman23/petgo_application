import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRide } from '@/hooks/useRide';
import { Bell, Settings, User, Car, Star, Truck, CheckCircle, Clock, MapPin, Stethoscope, Loader2 } from 'lucide-react';
import { MEMBERSHIP_TYPES } from '@/lib/constants';
import logoImage from "@assets/Screenshot 2025-07-21 115341_1753088187495.png";
import vetsVanImage from "@assets/image_1751292329902.png";
import truckIcon from "@assets/10773561_1751295833176.png";
import petsImage from "@assets/freepik_assistant_1751361910420_1751361937178.png";
import newVetVanImage from "@assets/freepik__background__70346_1751363211262.png";
import newHouseImage from "@assets/freepik_assistant_1751363501296_1751363531753.jpeg";
import newClinicImage from "@assets/freepik_assistant_1751363666289_1751363695395.png";
import newestHouseImage from "@assets/freepik_assistant_1751364682430_1751364706224.png";
import newVetClinicImage from "@assets/freepik__a-different-3d-cartoon-style-veterinary-clinic-bui__89216_1751368110471.png";
// New purple theme icons
import whatsappIcon from '@assets/freepik__background__20710_1752913557710.png';
import phoneIcon from '@assets/freepik__a-modern-and-sleek-smartphone-icon-in-dark-mauve-c__20709_1752913557712.png';
import { useTranslation, getDirection, getTextAlign, useLanguage } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';
import { LocationPermissionModal } from '@/components/LocationPermissionModal';
import PWAInstallBanner from '@/components/PWAInstallBanner';

// Helper functions for status handling
const getStatusOrder = (status: string): number => {
  const statusOrder: Record<string, number> = {
    'requested': 1,
    'confirmed': 2,
    'enroute': 3,
    'arrived': 4,
    'in_progress': 5,
    'completed': 6
  };
  return statusOrder[status] || 0;
};

const getStatusText = (status: string, language: string): string => {
  const statusTexts: Record<string, { ar: string; en: string }> = {
    'requested': { ar: 'جاري المراجعة', en: 'Under Review' },
    'confirmed': { ar: 'تم القبول', en: 'Confirmed' },
    'enroute': { ar: 'في الطريق', en: 'On The Way' },
    'arrived': { ar: 'وصل', en: 'Arrived' },
    'in_progress': { ar: 'جاري الفحص', en: 'In Progress' },
    'completed': { ar: 'مكتمل', en: 'Completed' }
  };
  return statusTexts[status]?.[language as 'ar' | 'en'] || status;
};

const getStatusDescription = (status: string, language: string): string => {
  const descriptions: Record<string, { ar: string; en: string }> = {
    'requested': { ar: 'طلبك قيد المراجعة، في انتظار موافقة الطبيب', en: 'Your request is under review, waiting for doctor approval' },
    'confirmed': { ar: 'تم قبول طلبك، الطبيب في الطريق إليك', en: 'Your request has been accepted, doctor will head to you soon' },
    'enroute': { ar: 'الطبيب البيطري في الطريق إليك', en: 'Veterinarian is on the way to you' },
    'arrived': { ar: 'وصل الطبيب البيطري إلى موقعك', en: 'Veterinarian has arrived at your location' },
    'in_progress': { ar: 'جاري فحص حيوانك الأليف', en: 'Your pet is being examined' },
    'completed': { ar: 'تم إكمال الفحص البيطري بنجاح', en: 'Veterinary examination completed successfully' }
  };
  return descriptions[status]?.[language as 'ar' | 'en'] || status;
};

const getProgressPercentage = (status: string): number => {
  const progressMap: Record<string, number> = {
    'requested': 10,
    'confirmed': 30,
    'enroute': 60,
    'arrived': 80,
    'in_progress': 90,
    'completed': 100
  };
  return progressMap[status] || 0;
};

const getSimplifiedProgressPercentage = (status: string): number => {
  // Map old statuses to new simplified ones
  let mappedStatus = status;
  if (['requested', 'confirmed'].includes(status)) {
    mappedStatus = 'processing';
  }
  if (status === 'in_progress') {
    mappedStatus = 'arrived';
  }
  
  const progressMap: Record<string, number> = {
    'processing': 25,
    'enroute': 50,
    'arrived': 75,
    'completed': 100
  };
  return progressMap[mappedStatus] || 0;
};

export default function Home() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = useTranslation();
  const textAlign = getTextAlign(language);
  const direction = getDirection(language);
  
  // Location permission modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // Simple location state management
  const [locationInfo, setLocationInfo] = useState({
    isLoading: true,
    address: language === 'ar' ? 'جاري تحديد موقعك...' : 'Detecting your location...',
    error: null as string | null,
    coordinates: null as { lat: number, lon: number } | null,
    accuracy: null as number | null
  });

  // Saudi cities for location detection
  const saudiCities = [
    { name: 'الرياض', nameEn: 'Riyadh', lat: 24.7136, lon: 46.6753, radius: 50 },
    { name: 'جدة', nameEn: 'Jeddah', lat: 21.4858, lon: 39.1925, radius: 40 },
    { name: 'الدمام', nameEn: 'Dammam', lat: 26.4207, lon: 50.0888, radius: 30 },
    { name: 'مكة المكرمة', nameEn: 'Mecca', lat: 21.3891, lon: 39.8579, radius: 25 },
    { name: 'المدينة المنورة', nameEn: 'Medina', lat: 24.5247, lon: 39.5692, radius: 25 },
    { name: 'الطائف', nameEn: 'Taif', lat: 21.2703, lon: 40.4178, radius: 20 }
  ];

  // Calculate distance and find closest city
  const findClosestCity = (lat: number, lon: number) => {
    const R = 6371; // Earth's radius in km
    let closestCity = saudiCities[0];
    let minDistance = Infinity;

    for (const city of saudiCities) {
      const dLat = (lat - city.lat) * Math.PI / 180;
      const dLon = (lon - city.lon) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(city.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance < minDistance && distance <= city.radius) {
        minDistance = distance;
        closestCity = city;
      }
    }

    return { city: closestCity, distance: minDistance };
  };

  // Get user location and detailed address
  const getCurrentLocation = () => {
    setLocationInfo(prev => ({
      ...prev,
      isLoading: true,
      address: language === 'ar' ? 'جاري تحديد موقعك...' : 'Detecting your location...',
      error: null
    }));

    if (!navigator.geolocation) {
      setLocationInfo({
        isLoading: false,
        address: language === 'ar' ? 'الرياض - موقع افتراضي' : 'Riyadh - Default Location',
        error: language === 'ar' ? 'المتصفح لا يدعم تحديد الموقع' : 'Browser does not support geolocation',
        coordinates: null,
        accuracy: null
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const { city, distance } = findClosestCity(latitude, longitude);
        
        try {
          // Try to get detailed address from OpenStreetMap
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&accept-language=${language === 'ar' ? 'ar' : 'en'}`
          );
          
          if (response.ok) {
            const data = await response.json();
            let address = '';
            
            if (data && data.address) {
              const addr = data.address;
              const parts = [];
              
              if (addr.road || addr.pedestrian) {
                parts.push(addr.road || addr.pedestrian);
              }
              if (addr.neighbourhood || addr.suburb) {
                parts.push(addr.neighbourhood || addr.suburb);
              }
              if (addr.city || addr.town) {
                parts.push(addr.city || addr.town);
              }
              
              if (parts.length > 0) {
                address = parts.join(', ');
              } else if (data.display_name) {
                const displayParts = data.display_name.split(',').slice(0, 3);
                address = displayParts.join(', ');
              }
            }
            
            if (address) {
              setLocationInfo({
                isLoading: false,
                address: address,
                error: null,
                coordinates: { lat: latitude, lon: longitude },
                accuracy: accuracy
              });
              return;
            }
          }
        } catch (error) {
          console.warn('Geocoding failed, using fallback:', error);
        }
        
        // Fallback to closest city
        const cityName = language === 'ar' ? city.name : city.nameEn;
        let fallbackAddress;
        
        if (distance < 5) {
          fallbackAddress = language === 'ar' ? `${cityName} - موقعك الحالي` : `${cityName} - Your Current Location`;
        } else if (distance < 20) {
          fallbackAddress = language === 'ar' ? `بالقرب من ${cityName}` : `Near ${cityName}`;
        } else {
          fallbackAddress = language === 'ar' ? `${cityName} - المملكة العربية السعودية` : `${cityName} - Saudi Arabia`;
        }
        
        setLocationInfo({
          isLoading: false,
          address: fallbackAddress,
          error: null,
          coordinates: { lat: latitude, lon: longitude },
          accuracy: accuracy
        });
      },
      (error) => {
        let errorMessage = language === 'ar' ? 'خطأ في تحديد الموقع' : 'Location error';
        let fallbackAddress = language === 'ar' ? 'الرياض - موقع افتراضي' : 'Riyadh - Default Location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = language === 'ar' ? 'تم رفض إذن الوصول للموقع' : 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = language === 'ar' ? 'الموقع غير متاح' : 'Location unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = language === 'ar' ? 'انتهت مهلة تحديد الموقع' : 'Location timeout';
            break;
        }
        
        setLocationInfo({
          isLoading: false,
          address: fallbackAddress,
          error: errorMessage,
          coordinates: null,
          accuracy: null
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  };

  // Initialize location detection on component mount
  useEffect(() => {
    getCurrentLocation();
  }, [language]); // Re-run when language changes

  // Get active ride info
  const { activeRide, isLoadingActiveRide } = useRide();
  const actualActiveRide = activeRide || null;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLocation('/');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Check if user has granted location permission before
        const locationPermission = localStorage.getItem('locationPermissionGranted');
        if (locationPermission !== 'true') {
          setShowLocationModal(true);
        } else {
          setLocationPermissionGranted(true);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setLocation('/');
      }
    }

    // التحقق من عودة المستخدم من صفحة الدفع
    const pendingPaymentBooking = localStorage.getItem('pendingPaymentBooking');
    if (pendingPaymentBooking) {
      console.log('🔄 User returned from payment, redirecting to processing page...');
      // إزالة العلامة لمنع التكرار
      localStorage.removeItem('pendingPaymentBooking');
      // توجه لصفحة معالجة الطلب
      setLocation('/payment-processing');
      return;
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/');
  };

  const handleLocationPermissionAllow = () => {
    setLocationPermissionGranted(true);
    setShowLocationModal(false);
    localStorage.setItem('locationPermissionGranted', 'true');
    getCurrentLocation();
  };

  const handleLocationPermissionSkip = () => {
    setShowLocationModal(false);
    localStorage.setItem('locationPermissionGranted', 'skipped');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={direction}>
      <div className="max-w-md mx-auto bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-white text-gray-800 px-3 py-3 h-12 shadow-sm">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-2">
              <div className="h-8 bg-white rounded-lg border-2 border-purple-600 px-2 py-1 shadow-sm hover:shadow-md transition-all duration-300">
                <img 
                  src={logoImage} 
                  alt="VETS VAN Logo" 
                  className="h-full w-auto object-contain"
                  style={{ 
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    maxWidth: '120px'
                  }}
                />
              </div>
              <div className="text-lg font-bold text-gray-800">
                {user?.name || (language === 'ar' ? 'مرحباً' : 'Welcome')}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <LanguageSelector />
              <Bell className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-800" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="bg-purple-600 text-white hover:bg-purple-600 px-3 py-1 h-8 rounded-md font-medium transition-colors"
              >
                {language === 'ar' ? 'خروج' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>

        {/* Purple Divider Line */}
        <div className="h-1 bg-purple-600 shadow-sm"></div>

        {/* Current Location - Hidden but functional */}
        <div className="hidden">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-800 text-sm" style={{ textAlign }}>
              {language === 'ar' ? 'موقعك الحالي' : 'Your Current Location'}
            </h3>
            {locationInfo.isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-gray-700 text-sm flex-1">
              {locationInfo.address}
            </span>
            {locationInfo.error && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={getCurrentLocation}
                className="text-xs text-blue-600 p-1 h-auto"
              >
                {language === 'ar' ? 'إعادة تحديد' : 'Refresh'}
              </Button>
            )}
          </div>
          {/* Debug location info - kept for functionality */}
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            <div className="text-gray-600">
              <strong>{language === 'ar' ? 'معلومات النظام:' : 'System Info:'}</strong>
            </div>
            <div className="text-gray-700 mt-1">
              {language === 'ar' ? 'نظام تحديد الموقع الدقيق مفعل' : 'Precise location system active'}
            </div>
            <div className="text-gray-700">
              {language === 'ar' ? 'يعرض الشوارع والأحياء التفصيلية' : 'Shows detailed streets and neighborhoods'}
            </div>
            <div className="text-gray-700">
              {language === 'ar' ? 'يدعم المدن السعودية مع نظام احتياطي' : 'Supports Saudi cities with fallback system'}
            </div>
            {locationInfo.coordinates && (
              <div className="text-gray-600 mt-1 text-xs">
                <strong>{language === 'ar' ? 'الإحداثيات:' : 'Coordinates:'}</strong> {locationInfo.coordinates.lat.toFixed(6)}, {locationInfo.coordinates.lon.toFixed(6)}
                {locationInfo.accuracy && (
                  <span className="ml-2">
                    {language === 'ar' ? 'الدقة:' : 'Accuracy:'} {locationInfo.accuracy.toFixed(0)}m
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Progress Animation for Active Ride */}
        {actualActiveRide && (
          <div className="p-3 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b">
            <div className="text-sm font-bold text-purple-600 mb-3 text-center" style={{ textAlign }}>
              {language === 'ar' ? 'تتبع العيادة البيطرية المتنقلة' : 'Mobile Veterinary Clinic Tracking'}
            </div>
            
            {/* Enhanced Progress Road with buildings */}
            <div className="relative h-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl mb-2 overflow-hidden shadow-inner">
              {/* Progress road surface */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 transition-all duration-2000 ease-in-out"
                style={{ 
                  width: `${getProgressPercentage(actualActiveRide.status)}%`,
                  zIndex: 1
                }}
              ></div>
              
              {/* Road markings - completed section */}
              <div 
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                style={{ width: `${getProgressPercentage(actualActiveRide.status)}%` }}
              >
                <div className="w-full h-1 bg-white opacity-90 shadow-sm"></div>
              </div>
              
              {/* Road markings - remaining section */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-1 bg-gray-300 opacity-70"></div>
              </div>
              
              {/* Veterinary Clinic Building - Start Position */}
              <div className={`absolute -top-10 ${language === 'ar' ? '-right-6' : '-left-6'} z-10`}>
                <img 
                  src={newVetClinicImage}
                  alt="Veterinary Clinic" 
                  className="w-16 h-16 drop-shadow-xl"
                />
              </div>
              
              {/* House Building - End Position */}
              <div className={`absolute -top-12 ${language === 'ar' ? '-left-12' : '-right-12'} z-10`}>
                <img 
                  src={newestHouseImage}
                  alt="House" 
                  className="w-24 h-24 drop-shadow-xl"
                />
              </div>
              
              {/* Moving Van */}
              <div 
                className="absolute top-6 z-20 transition-all duration-3000 ease-in-out"
                style={{ 
                  left: `${Math.max(5, Math.min(85, getProgressPercentage(actualActiveRide.status) - 5))}%`,
                  transform: language === 'ar' ? 'scaleX(-1)' : 'scaleX(1)'
                }}
              >
                <img 
                  src={newVetVanImage}
                  alt="Veterinary Van" 
                  className="w-8 h-8 drop-shadow-lg animate-bounce"
                />
              </div>
              
              {/* Status Progress Indicators */}
              {getProgressPercentage(actualActiveRide.status) > 80 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs font-bold text-white bg-green-600 px-2 py-1 rounded-full shadow-lg animate-pulse">
                    {getStatusText(actualActiveRide.status, language)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Request Tracking Details - Only show when there's an active ride */}
        {actualActiveRide && (
          <div className="p-3">
            <Card className="shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900" style={{ textAlign }}>
                        {language === 'ar' ? 'طلبك النشط' : 'Your Active Request'}
                      </div>
                      <div className="text-sm text-gray-500" style={{ textAlign }}>
                        {language === 'ar' ? 'خدمة بيطرية' : 'Veterinary Service'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <span className="font-medium text-gray-600">
                      {language === 'ar' ? 'الموقع:' : 'Location:'}
                    </span>
                    <div className="text-gray-800 truncate">
                      {actualActiveRide.pickupLocation || (language === 'ar' ? 'موقعك الحالي' : 'Your current location')}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-gray-600">
                      {language === 'ar' ? 'التكلفة:' : 'Cost:'}
                    </span>
                    <div className="text-gray-800">
                      {actualActiveRide.estimatedCost ? `${actualActiveRide.estimatedCost} ${language === 'ar' ? 'ريال' : 'SAR'}` : (language === 'ar' ? 'محدد' : 'TBD')}
                    </div>
                  </div>
                </div>

                {/* Compact Status Progress */}
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm" style={{ textAlign }}>
                    {language === 'ar' ? 'حالة الطلب' : 'Request Status'}
                  </h4>
                  
                  {/* Horizontal Progress Bar */}
                  <div className="relative mb-2">
                    {/* Progress Line */}
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded-full"></div>
                      <div 
                        className="absolute top-4 left-0 h-1 bg-purple-600 rounded-full transition-all duration-1000"
                        style={{ width: `${getSimplifiedProgressPercentage(actualActiveRide.status)}%` }}
                      ></div>
                      
                      {[
                        { status: 'processing', icon: Clock },
                        { status: 'enroute', icon: Car },
                        { status: 'arrived', icon: MapPin },
                        { status: 'completed', icon: CheckCircle }
                      ].map((step, index) => {
                        const IconComponent = step.icon;
                        
                        // Map current status to simplified steps
                        let mappedStatus = actualActiveRide.status;
                        if (['requested', 'confirmed'].includes(actualActiveRide.status)) {
                          mappedStatus = 'processing';
                        }
                        if (actualActiveRide.status === 'in_progress') {
                          mappedStatus = 'arrived';
                        }
                        
                        const statusOrder = ['processing', 'enroute', 'arrived', 'completed'];
                        const currentIndex = statusOrder.indexOf(mappedStatus);
                        
                        const isActive = currentIndex > index;
                        const isCurrent = currentIndex === index;
                        
                        return (
                          <div key={step.status} className="relative flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 ${
                              isActive 
                                ? 'bg-purple-600 border-purple-600 text-white' 
                                : isCurrent
                                ? 'bg-white border-purple-600 text-purple-600 ring-2 ring-#852085'
                                : 'bg-white border-gray-300 text-gray-300'
                            }`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className={`mt-1 text-xs font-medium ${
                              isActive || isCurrent ? 'text-purple-600' : 'text-gray-400'
                            }`} style={{ textAlign }}>
                              {step.status === 'processing' && (language === 'ar' ? 'معالجة' : 'Processing')}
                              {step.status === 'enroute' && (language === 'ar' ? 'في الطريق' : 'On the Way')}
                              {step.status === 'arrived' && (language === 'ar' ? 'وصل' : 'Arrived')}
                              {step.status === 'completed' && (language === 'ar' ? 'مكتمل' : 'Completed')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Status Description */}
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-700" style={{ textAlign }}>
                    {getStatusDescription(actualActiveRide.status, language)}
                  </div>
                  <div className="text-xs text-blue-600 mt-1" style={{ textAlign }}>
                    {language === 'ar' ? 'رقم الطلب: ' : 'Request ID: '}{actualActiveRide.id}
                  </div>
                </div>

                {/* Cancel Button for active rides */}
                {actualActiveRide && actualActiveRide.status !== 'completed' && (
                  <div className="mt-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={async () => {
                        if (confirm(language === 'ar' 
                          ? 'هل أنت متأكد من إلغاء الطلب؟' 
                          : 'Are you sure you want to cancel the request?')) {
                          try {
                            const response = await fetch(`/api/rides/${actualActiveRide.id}/cancel`, {
                              method: 'PUT',
                              headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                'Content-Type': 'application/json'
                              }
                            });
                            
                            if (response.ok) {
                              toast({
                                title: language === 'ar' ? 'تم إلغاء الطلب' : 'Request Cancelled',
                                description: language === 'ar' ? 'تم إلغاء طلبك بنجاح' : 'Your request has been cancelled successfully'
                              });
                              window.location.reload();
                            } else {
                              throw new Error('Failed to cancel');
                            }
                          } catch (error) {
                            toast({
                              title: language === 'ar' ? 'خطأ' : 'Error',
                              description: language === 'ar' ? 'فشل في إلغاء الطلب' : 'Failed to cancel request',
                              variant: 'destructive'
                            });
                          }
                        }
                      }}
                    >
                      {language === 'ar' ? 'إلغاء الطلب' : 'Cancel Request'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Request Status and Actions */}
        <div className="p-3">
          <h2 className="text-lg font-bold text-gray-900 mb-2" style={{ textAlign }}>
            {language === 'ar' ? 'طلب العيادة البيطرية المتنقلة' : 'Request Mobile Veterinary Clinic'}
          </h2>
          
          {/* Animated Car Coming Soon - Only show when no active ride */}
          {!actualActiveRide && (
            <div className="mb-3 p-3 bg-white rounded-2xl border-2 border-purple-600 shadow-lg">
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-800 mb-2" style={{ textAlign }}>
                  {language === 'ar' ? 'العيادة البيطرية المتنقلة' : 'Mobile Veterinary Clinic'}
                </div>
                
                {/* Enhanced Road Animation */}
                <div className="relative h-16 bg-gradient-to-r from-pink-100 via-pink-50 to-pink-100 rounded-xl mb-2 overflow-hidden shadow-inner">
                  {/* Road markings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-2 bg-purple-600 opacity-50 animate-pulse rounded-full"></div>
                  </div>
                  
                  {/* New Veterinary Van Image */}
                  <div className={`absolute top-1 h-12 w-16 transform transition-all duration-4000 ease-in-out ${
                    language === 'ar' ? 'animate-bounce-right-to-left' : 'animate-bounce-left-to-right'
                  }`}>
                    <img 
                      src={newVetVanImage}
                      alt="Veterinary Van" 
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  </div>
                  
                  {/* 3D Veterinary Clinic - Start Position */}
                  <div className={`absolute top-0 ${language === 'ar' ? '-right-4' : '-left-4'} z-10`}>
                    <img 
                      src={newVetClinicImage}
                      alt="Veterinary Clinic" 
                      className="w-16 h-16 drop-shadow-xl"
                    />
                  </div>
                  
                  {/* Custom House - End Position - Same Level as Clinic */}
                  <div className={`absolute top-0 ${language === 'ar' ? '-left-6' : '-right-6'} z-10`}>
                    <img 
                      src={newestHouseImage}
                      alt="House" 
                      className="w-20 h-20 drop-shadow-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Dog and Cat Image */}
          <div className="flex justify-center mb-3">
            <div className="relative w-48 h-32 bg-gradient-to-br from-purple-600 to-blue-100 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm border border-purple-600">
              <img 
                src={petsImage}
                alt="Dogs and Cats" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 drop-shadow-lg"
              />
            </div>
          </div>

          {/* Request Button */}
          <button
            className="w-full font-bold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer"
            style={{ 
              background: 'linear-gradient(to right, #852085, #6d1a6d)',
              color: 'white',
              border: 'none',
              outline: 'none'
            }}
            onClick={() => setLocation('/ride-request')}
            disabled={!!actualActiveRide}
          >
            <div className="flex flex-col items-center">
              <Truck className="w-6 h-6 mb-1 !text-white" style={{ color: 'white' }} />
              <span className="text-lg !text-white" style={{ textAlign, color: 'white' }}>
                {language === 'ar' ? 'اضغط هنا للطلب' : 'Click Here to Request'}
              </span>
              <span className="text-sm opacity-90 !text-white" style={{ textAlign, color: 'white' }}>
                {language === 'ar' ? 'العيادة البيطرية المتنقلة' : 'Vetsvan Mobile Clinic'}
              </span>
            </div>
          </button>

          {/* Contact Section - Icons Only */}
          <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border border-purple-100">
            <div className="flex items-center justify-center space-x-6 rtl:space-x-reverse">
              {/* WhatsApp Button */}
              <a
                href="https://wa.me/966535152250"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-20 h-20 bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 shake-animation"
              >
                <img 
                  src={whatsappIcon}
                  alt="WhatsApp"
                  className="w-14 h-14 object-contain"
                  style={{
                    filter: 'drop-shadow(0 4px 12px rgba(139, 47, 139, 0.3))'
                  }}
                />
              </a>
              
              {/* Phone Call Button */}
              <a
                href="tel:+966535152250"
                className="flex items-center justify-center w-20 h-20 bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 shake-animation-delayed"
              >
                <img 
                  src={phoneIcon}
                  alt="Phone Call"
                  className="w-14 h-14 object-contain"
                  style={{
                    filter: 'drop-shadow(0 4px 12px rgba(139, 47, 139, 0.3))'
                  }}
                />
              </a>
            </div>
          </div>
        </div>


      </div>
      
      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={handleLocationPermissionSkip}
        onAllow={handleLocationPermissionAllow}
      />
      
      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
}