import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRide } from '@/hooks/useRide';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ArrowLeft, X, Satellite, MapPin, Navigation, Loader2 } from 'lucide-react';
import { Map } from '@/components/map';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import vanImage from "@assets/freepik__background__70346_1751363211262.png";
import houseImage from "@assets/freepik_assistant_1751364682430_1751364706224.png";
import clinicImage from "@assets/freepik__a-different-3d-cartoon-style-veterinary-clinic-bui__89216_1751368110471.png";
import { DriverCard } from '@/components/driver-card';
import { RideStatus } from '@/components/ride-status';
import { DEFAULT_COORDINATES } from '@/lib/constants';
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';

export default function RideTracking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { activeRide, assignedDriver, cancelRide, isCancellingRide, fetchNearbyDrivers } = useRide();
  const [nearbyDrivers, setNearbyDrivers] = useState([]);

  
  const { t } = useTranslation();
  const { language } = useLanguage();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  
  // Real GPS tracking for customer
  const {
    latitude: customerLat,
    longitude: customerLng,
    accuracy,
    error: gpsError,
    isLoading: isLoadingGPS,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000,
    watch: true, // Continuous tracking during ride
  });

  // Dynamic customer location with fallback
  const customerLocation: [number, number] = customerLat && customerLng 
    ? [customerLat, customerLng] 
    : [DEFAULT_COORDINATES.latitude, DEFAULT_COORDINATES.longitude];

  useEffect(() => {
    if (!activeRide) {
      setLocation('/');
      return;
    }

    // Fetch nearby drivers for map display
    fetchNearbyDrivers(customerLocation[0], customerLocation[1])
      .then(setNearbyDrivers)
      .catch(console.error);
  }, [activeRide, setLocation, fetchNearbyDrivers, customerLocation]);

  // Check if ride was cancelled by doctor and redirect to home immediately
  useEffect(() => {
    if (activeRide && (activeRide.status === 'cancelled_by_doctor' || activeRide.status === 'rejected')) {
      // Store cancellation info and redirect to home immediately
      localStorage.setItem('cancelledRide', 'true');
      setLocation('/');
    }
  }, [activeRide, setLocation]);

  const handleCancelRide = () => {
    if (activeRide && window.confirm('هل أنت متأكد من إلغاء الرحلة؟')) {
      cancelRide(activeRide.id);
      setLocation('/');
    }
  };

  const handleCall = () => {
    toast({
      title: 'جاري الاتصال',
      description: 'سيتم الاتصال بالسائق قريباً',
    });
  };

  const handleMessage = () => {
    toast({
      title: 'إرسال رسالة',
      description: 'تم إرسال رسالة للسائق',
    });
  };

  if (!activeRide) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('back')}
          </Button>
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="PetGo" 
              className="h-8 object-contain"
            />
            <h1 className="text-lg font-semibold" style={{ textAlign }}>
              {language === 'ar' ? 'تتبع الطلب' : 'Track Request'}
            </h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Map */}
      <div className="h-64 relative">
        <Map
          customerLocation={customerLocation}
          drivers={nearbyDrivers}
          assignedDriver={assignedDriver}
          showBothLocations={true}
          className="h-full"
        />
        

      </div>

      {/* Animation Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white p-4 mx-4 mt-4 rounded-lg border">
        <div className="relative h-32 overflow-hidden">
          {/* Road Background */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded-lg shadow-inner">
            {/* Road stripes */}
            <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-1 bg-white border-dashed border-t-2 border-white opacity-60"></div>
          </div>

          {/* Clinic Building - Far Left */}
          <div 
            className={`absolute ${language === 'ar' ? 'right-0' : 'left-0'} bottom-0 w-16 h-16 flex items-end justify-center`}
            style={{ transform: 'translateX(0)' }}
          >
            <img
              src={clinicImage}
              alt={language === 'ar' ? 'العيادة البيطرية' : 'Veterinary Clinic'}
              className="w-12 h-12 object-contain drop-shadow-lg"
            />
          </div>

          {/* House - Far Right */}
          <div 
            className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} bottom-0 w-16 h-16 flex items-end justify-center`}
            style={{ transform: 'translateX(0)' }}
          >
            <img
              src={houseImage}
              alt={language === 'ar' ? 'المنزل' : 'House'}
              className="w-14 h-14 object-contain drop-shadow-lg"
            />
          </div>

          {/* Moving Van Animation */}
          <div 
            className="absolute bottom-0 w-12 h-12 flex items-end justify-center transition-all duration-1000 ease-in-out"
            style={{
              left: activeRide?.status === 'requested' ? '25%' :
                    activeRide?.status === 'confirmed' ? '50%' :
                    activeRide?.status === 'in_progress' ? '75%' :
                    activeRide?.status === 'arrived' ? '85%' : '25%',
              transform: 'translateX(-50%)'
            }}
          >
            <img
              src={vanImage}
              alt={language === 'ar' ? 'شاحنة العيادة البيطرية' : 'Veterinary Van'}
              className="w-10 h-8 object-contain drop-shadow-lg"
            />
          </div>

          {/* Status Journey Dots */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-8">
            {['requested', 'confirmed', 'in_progress', 'arrived'].map((status, index) => (
              <div
                key={status}
                className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                  activeRide?.status === status
                    ? 'bg-purple-600 border-purple-600 scale-125 shadow-lg'
                    : 'bg-gray-200 border-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Journey Labels */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-6 text-xs">
            <span className={`${activeRide?.status === 'requested' ? 'text-purple-600 font-semibold' : 'text-gray-500'}`}>
              {language === 'ar' ? 'طلب' : 'Request'}
            </span>
            <span className={`${activeRide?.status === 'confirmed' ? 'text-purple-600 font-semibold' : 'text-gray-500'}`}>
              {language === 'ar' ? 'قبول' : 'Accept'}
            </span>
            <span className={`${activeRide?.status === 'in_progress' ? 'text-purple-600 font-semibold' : 'text-gray-500'}`}>
              {language === 'ar' ? 'قادم' : 'Coming'}
            </span>
            <span className={`${activeRide?.status === 'arrived' ? 'text-purple-600 font-semibold' : 'text-gray-500'}`}>
              {language === 'ar' ? 'وصل' : 'Arrived'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* GPS Status Card */}
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900" style={{ textAlign }}>
                  {language === 'ar' ? 'حالة الموقع' : 'Location Status'}
                </span>
              </div>
              {isLoadingGPS && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
            </div>
            
            {customerLat && customerLng ? (
              <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span style={{ textAlign }}>
                  {language === 'ar' ? 
                    `تم تحديد موقعك بدقة ${accuracy ? Math.round(accuracy) : '---'} متر` :
                    `Location detected with ${accuracy ? Math.round(accuracy) : '---'} meters accuracy`
                  }
                </span>
              </div>
            ) : gpsError ? (
              <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <X className="w-3 h-3" />
                <span style={{ textAlign }}>
                  {language === 'ar' ? 'خطأ في تحديد الموقع' : 'Location detection error'}
                </span>
              </div>
            ) : (
              <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                <span style={{ textAlign }}>
                  {language === 'ar' ? 'جاري تحديد الموقع...' : 'Detecting location...'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <RideStatus status={activeRide.status} className="mb-4" />
              
              {/* حالات الطلب */}
              <div className="mt-6 space-y-3">
                {activeRide.status === 'requested' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2" style={{ textAlign }}>
                      {language === 'ar' ? 'جاري المعالجة' : 'Processing'}
                    </h3>
                    <p className="text-sm text-yellow-700" style={{ textAlign }}>
                      {language === 'ar' ? 'طلبك قيد المراجعة وننتظر موافقة الطبيب' : 'Your request is under review, waiting for doctor approval'}
                    </p>
                  </div>
                )}
                
                {activeRide.status === 'confirmed' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2" style={{ textAlign }}>
                      {language === 'ar' ? 'تم القبول' : 'Accepted'}
                    </h3>
                    <p className="text-sm text-blue-700" style={{ textAlign }}>
                      {language === 'ar' ? 'تم قبول طلبك وسيتم التوجه إليك قريباً' : 'Your request has been accepted and the doctor will head to you soon'}
                    </p>
                  </div>
                )}
                
                {activeRide.status === 'enroute' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-800 mb-2" style={{ textAlign }}>
                      {language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}
                    </h3>
                    <p className="text-sm text-orange-700" style={{ textAlign }}>
                      {language === 'ar' ? 'العيادة البيطرية في الطريق إليك' : 'The veterinary clinic is on the way to you'}
                    </p>
                  </div>
                )}
                
                {activeRide.status === 'arrived' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2" style={{ textAlign }}>
                      {language === 'ar' ? 'تم الوصول' : 'Arrived'}
                    </h3>
                    <p className="text-sm text-green-700" style={{ textAlign }}>
                      {language === 'ar' ? 'وصلت العيادة البيطرية إلى موقعك' : 'The veterinary clinic has arrived at your location'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* معلومات الطلب المبسطة */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-center" style={{ textAlign }}>
              {language === 'ar' ? 'طلب العيادة البيطرية' : 'Veterinary Clinic Request'}
            </h3>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600" style={{ textAlign }}>
                {language === 'ar' ? 'تم تقديم طلبك بنجاح' : 'Your request has been submitted successfully'}
              </p>
              <p className="text-sm text-gray-600" style={{ textAlign }}>
                {language === 'ar' ? 'ننتظر رد العيادة البيطرية' : 'Waiting for veterinary clinic response'}
              </p>
            </div>
          </CardContent>
        </Card>



        {/* Cancel Button */}
        {!['completed', 'cancelled'].includes(activeRide.status) && (
          <Button
            onClick={handleCancelRide}
            variant="destructive"
            className="w-full"
            disabled={isCancellingRide}
            style={{ direction }}
          >
            <X className="w-4 h-4 ml-2" />
            {isCancellingRide ? 
              (language === 'ar' ? 'جاري الإلغاء...' : 'Cancelling...') : 
              (language === 'ar' ? 'إلغاء الرحلة' : 'Cancel Request')
            }
          </Button>
        )}
      </div>


    </div>
  );
}
