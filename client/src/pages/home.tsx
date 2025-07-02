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
import newClinicImage from "@assets/freepik_assistant_1751363666289_1751363695395.png";
import newestHouseImage from "@assets/freepik_assistant_1751364682430_1751364706224.png";
import newVetClinicImage from "@assets/freepik__a-different-3d-cartoon-style-veterinary-clinic-bui__89216_1751368110471.png";
import { useTranslation, getDirection, getTextAlign, useLanguage } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';

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

export default function Home() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = useTranslation();
  const textAlign = getTextAlign(language);
  const direction = getDirection(language);

  // Get active ride info
  const { data: rideData, isLoading: rideLoading } = useRide();
  const actualActiveRide = rideData?.ride || null;

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
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setLocation('/');
      }
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 border-2 border-gray-400 rounded-lg m-2" dir={direction}>
      <div className="max-w-md mx-auto bg-white shadow-sm rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white px-3 py-2 h-10">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-purple-800 rounded-full border-4 border-purple-400 p-1 shadow-lg">
                <img 
                  src={logoImage} 
                  alt="VETS VAN Logo" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="text-lg font-bold text-white">
                {user?.name || (language === 'ar' ? 'مرحباً' : 'Welcome')}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <LanguageSelector />
              <Bell className="w-5 h-5 cursor-pointer hover:text-purple-200" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:bg-purple-700 px-2 py-1 h-8"
              >
                {language === 'ar' ? 'خروج' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>

        {/* Current Location */}
        <div className="p-3 bg-blue-50 border-b">
          <h3 className="font-semibold text-gray-800 mb-1 text-sm" style={{ textAlign }}>
            {language === 'ar' ? 'موقعك الحالي' : 'Your Current Location'}
          </h3>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-gray-700 text-sm">
              {language === 'ar' ? 'الرياض - موقعك الحالي' : 'Riyadh - Your Current Location'}
            </span>
          </div>
        </div>

        {/* Enhanced Progress Animation for Active Ride */}
        {actualActiveRide && (
          <div className="p-3 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b">
            <div className="text-sm font-bold text-purple-800 mb-3 text-center" style={{ textAlign }}>
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
              <div className={`absolute top-2 ${language === 'ar' ? '-right-6' : '-left-6'} z-10`}>
                <img 
                  src={newVetClinicImage}
                  alt="Veterinary Clinic" 
                  className="w-16 h-16 drop-shadow-xl"
                />
              </div>
              
              {/* House Building - End Position */}
              <div className={`absolute top-1 ${language === 'ar' ? '-left-12' : '-right-12'} z-10`}>
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
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
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
                        className="absolute top-4 left-0 h-1 bg-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(getStatusOrder(actualActiveRide.status) - 1) * 20}%` }}
                      ></div>
                      
                      {[
                        { status: 'requested', icon: Clock },
                        { status: 'confirmed', icon: CheckCircle },
                        { status: 'enroute', icon: Car },
                        { status: 'arrived', icon: MapPin },
                        { status: 'in_progress', icon: Stethoscope },
                        { status: 'completed', icon: CheckCircle }
                      ].map((step, index) => {
                        const IconComponent = step.icon;
                        const isActive = getStatusOrder(actualActiveRide.status) > index;
                        const isCurrent = getStatusOrder(actualActiveRide.status) === index + 1;
                        
                        return (
                          <div key={step.status} className="relative flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 ${
                              isActive 
                                ? 'bg-purple-500 border-purple-500 text-white' 
                                : isCurrent
                                ? 'bg-white border-purple-500 text-purple-500 ring-2 ring-purple-200'
                                : 'bg-white border-gray-300 text-gray-300'
                            }`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className={`mt-1 text-xs font-medium ${
                              isActive || isCurrent ? 'text-purple-700' : 'text-gray-400'
                            }`} style={{ textAlign }}>
                              {getStatusText(step.status, language)}
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
                            await fetch(`/api/rides/${actualActiveRide.id}/cancel`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                'Content-Type': 'application/json'
                              }
                            });
                            toast({
                              title: language === 'ar' ? 'تم إلغاء الطلب' : 'Request Cancelled',
                              description: language === 'ar' ? 'تم إلغاء طلبك بنجاح' : 'Your request has been cancelled successfully'
                            });
                            window.location.reload();
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
          <h2 className="text-lg font-bold text-gray-900 mb-2" style={{ textAlign }}>{t('requestMobileVet')}</h2>
          
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
                    <img 
                      src={newVetVanImage}
                      alt="Veterinary Van" 
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  </div>
                  
                  {/* 3D Veterinary Clinic - Start Position */}
                  <div className={`absolute top-2 ${language === 'ar' ? '-right-4' : '-left-4'} z-10`}>
                    <img 
                      src={newVetClinicImage}
                      alt="Veterinary Clinic" 
                      className="w-16 h-16 drop-shadow-xl"
                    />
                  </div>
                  
                  {/* Custom House - End Position */}
                  <div className={`absolute top-1 ${language === 'ar' ? '-left-6' : '-right-6'} z-10`}>
                    <img 
                      src={newestHouseImage}
                      alt="House" 
                      className="w-24 h-24 drop-shadow-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Dog and Cat Image */}
          <div className="flex justify-center mb-3">
            <div className="relative w-48 h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm border border-purple-200">
              <img 
                src={petsImage}
                alt="Dogs and Cats" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 drop-shadow-lg"
              />
            </div>
          </div>

          {/* Request Button */}
          <Button
            className="w-full bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => setLocation('/ride-request')}
            disabled={!!actualActiveRide}
          >
            <div className="flex flex-col items-center">
              <Truck className="w-6 h-6 mb-1" />
              <span className="text-lg" style={{ textAlign }}>
                {language === 'ar' ? 'اضغط هنا للطلب' : 'Click Here to Request'}
              </span>
              <span className="text-sm opacity-90" style={{ textAlign }}>
                {language === 'ar' ? 'العيادة البيطرية المتنقلة' : 'Vetsvan Mobile Clinic'}
              </span>
            </div>
          </Button>
        </div>

        {/* Enhanced 3D Footer Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-transparent">
          <div className="max-w-md mx-auto px-4 pb-2">
            <div className="flex justify-center space-x-4">
              {/* Home Button */}
              <Button
                onClick={() => setLocation('/home')}
                className="relative flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-white"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <span className="text-2xl">🏠</span>
                </div>
              </Button>

              {/* Activity Button */}
              <Button
                onClick={() => setLocation('/activity')}
                className="relative flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-white"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <span className="text-2xl text-purple-800">🐾</span>
                </div>
              </Button>

              {/* Account Button */}
              <Button
                onClick={() => setLocation('/account')}
                className="relative flex flex-col items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-white"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <span className="text-2xl">🐱</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}