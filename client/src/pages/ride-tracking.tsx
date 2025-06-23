import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRide } from '@/hooks/useRide';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ArrowLeft, X, Satellite, MapPin, Navigation, Loader2 } from 'lucide-react';
import { Map } from '@/components/map';
import { DriverCard } from '@/components/driver-card';
import { RideStatus } from '@/components/ride-status';
import { DEFAULT_COORDINATES } from '@/lib/constants';

export default function RideTracking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { activeRide, assignedDriver, cancelRide, isCancellingRide, fetchNearbyDrivers } = useRide();
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  
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
            العودة
          </Button>
          <h1 className="text-lg font-semibold">متابعة الرحلة</h1>
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
        
        {/* Google Maps Navigation Button */}
        {assignedDriver && customerLat && customerLng && (
          <div className="absolute top-4 right-4 z-[1000]">
            <Button
              onClick={() => {
                const googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(assignedDriver.latitude)},${encodeURIComponent(assignedDriver.longitude)}/${encodeURIComponent(customerLat)},${encodeURIComponent(customerLng)}`;
                console.log('Opening Google Maps:', googleMapsUrl);
                const newWindow = window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
                if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                  window.location.href = googleMapsUrl;
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2"
            >
              <Navigation className="w-4 h-4 mr-1" />
              التنقل عبر Google Maps
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* GPS Status Card */}
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">حالة الموقع</span>
              </div>
              {isLoadingGPS && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
            </div>
            
            {customerLat && customerLng ? (
              <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>تم تحديد موقعك بدقة {accuracy ? Math.round(accuracy) : '---'} متر</span>
              </div>
            ) : gpsError ? (
              <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <X className="w-3 h-3" />
                <span>خطأ في تحديد الموقع</span>
              </div>
            ) : (
              <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                <span>جاري تحديد الموقع...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardContent className="p-4">
            <RideStatus status={activeRide.status} className="mb-4" />
            
            {/* Driver Card */}
            {assignedDriver && (
              <DriverCard
                driver={assignedDriver}
                onCall={handleCall}
                onMessage={handleMessage}
              />
            )}
          </CardContent>
        </Card>

        {/* Trip Details */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">تفاصيل الرحلة</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">المسافة المقدرة</p>
                <p className="font-semibold">{activeRide.estimatedDistance} كم</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">الوقت المقدر</p>
                <p className="font-semibold">{activeRide.estimatedTime} دقيقة</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">التكلفة المقدرة</p>
                <p className="font-semibold text-green-600">{activeRide.estimatedCost} ريال</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">طريقة الدفع</p>
                <p className="font-semibold">نقدي</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route Details */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">تفاصيل المسار</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">من</p>
                  <p className="font-medium">{activeRide.pickupLocation}</p>
                </div>
              </div>
              <div className="border-r-2 border-gray-300 border-dashed h-4 mr-1" />
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">إلى</p>
                  <p className="font-medium">{activeRide.destination}</p>
                </div>
              </div>
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
          >
            <X className="w-4 h-4 ml-2" />
            {isCancellingRide ? 'جاري الإلغاء...' : 'إلغاء الرحلة'}
          </Button>
        )}
      </div>
    </div>
  );
}
