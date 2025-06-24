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

  // Check if ride was cancelled by doctor and redirect to home
  useEffect(() => {
    if (activeRide && (activeRide.status === 'cancelled_by_doctor' || activeRide.status === 'rejected')) {
      toast({
        title: language === 'ar' ? 'تم إلغاء الطلب' : 'Request Cancelled',
        description: language === 'ar' ? 
          'تم إلغاء طلب العيادة البيطرية من قبل الطبيب. يمكنك طلب عيادة أخرى.' : 
          'The veterinary clinic request has been cancelled by the doctor. You can request another clinic.',
        variant: 'destructive',
        duration: 5000,
      });
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(
          language === 'ar' ? 'تم إلغاء الطلب' : 'Request Cancelled',
          {
            body: language === 'ar' ? 
              'تم إلغاء طلب العيادة البيطرية. يمكنك طلب عيادة أخرى.' : 
              'The veterinary clinic request has been cancelled. You can request another clinic.',
            icon: '/favicon.ico'
          }
        );
      }
      
      // Store cancellation info for home page
      localStorage.setItem('cancelledRide', 'true');
      
      // Delay redirect to show the message
      setTimeout(() => {
        setLocation('/');
      }, 3000);
    }
  }, [activeRide, setLocation, toast, language]);

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
              alt="Vets Van" 
              className="h-8 object-contain"
            />
            <h1 className="text-lg font-semibold" style={{ textAlign }}>{t('trackRequest')}</h1>
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
