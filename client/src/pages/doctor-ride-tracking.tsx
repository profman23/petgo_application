import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Navigation, MapPin, Phone, Clock } from "lucide-react";
import { Map } from "@/components/map";
import { useLocation } from "wouter";
import { useDoctorLocation } from "@/hooks/useDoctorLocation";
import { useToast } from "@/hooks/use-toast";

export default function DoctorRideTracking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { latitude: doctorLat, longitude: doctorLng, accuracy, error } = useDoctorLocation();

  const { data: activeRide, isLoading } = useQuery({
    queryKey: ['/api/doctor/active-ride'],
    refetchInterval: 2000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل معلومات الرحلة...</p>
        </div>
      </div>
    );
  }

  if (!activeRide?.ride) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">لا توجد رحلة نشطة</h2>
            <p className="text-gray-600 mb-6">لا توجد رحلة مقبولة حالياً</p>
            <Button onClick={() => setLocation('/doctor-dashboard')} className="w-full">
              العودة للوحة التحكم
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ride = activeRide.ride;
  const customer = activeRide.customer;

  const handleGoogleMapsNavigation = () => {
    if (doctorLat && doctorLng && ride.pickupLatitude && ride.pickupLongitude) {
      // Create Google Maps URL with proper encoding
      const googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(doctorLat)},${encodeURIComponent(doctorLng)}/${encodeURIComponent(ride.pickupLatitude)},${encodeURIComponent(ride.pickupLongitude)}`;
      
      console.log('Opening Google Maps:', googleMapsUrl);
      
      // Show confirmation toast
      toast({
        title: "فتح Google Maps",
        description: "جاري فتح التطبيق للتنقل...",
      });
      
      // Try multiple methods to open the URL
      try {
        const newWindow = window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
        
        // Check if popup was blocked after a short delay
        setTimeout(() => {
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            toast({
              title: "تعذر فتح نافذة جديدة",
              description: "سيتم فتح Google Maps في نفس النافذة",
              variant: "destructive",
            });
            setTimeout(() => {
              window.location.href = googleMapsUrl;
            }, 1500);
          }
        }, 1000);
        
      } catch (error) {
        console.error('Error opening Google Maps:', error);
        toast({
          title: "خطأ في فتح Google Maps",
          description: "سيتم المحاولة مرة أخرى...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = googleMapsUrl;
        }, 1000);
      }
    } else {
      console.log('Missing coordinates:', { doctorLat, doctorLng, pickupLat: ride.pickupLatitude, pickupLng: ride.pickupLongitude });
      toast({
        title: "خطأ في الموقع",
        description: "لا يمكن تحديد إحداثيات الموقع",
        variant: "destructive",
      });
    }
  };

  const handleCallCustomer = () => {
    if (customer?.phone) {
      window.location.href = `tel:${customer.phone}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/doctor-dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">متابعة الرحلة</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* GPS Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <span className="font-medium">حالة GPS</span>
              </div>
              <Badge variant={doctorLat && doctorLng ? "default" : "destructive"}>
                {doctorLat && doctorLng ? "متصل" : "غير متصل"}
              </Badge>
            </div>
            {accuracy && (
              <p className="text-sm text-gray-600 mt-2">
                دقة الموقع: {Math.round(accuracy)} متر
              </p>
            )}
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Map with both locations */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                خريطة التنقل
              </h3>
              {doctorLat && doctorLng && ride.pickupLatitude && ride.pickupLongitude && (
                <Button
                  onClick={handleGoogleMapsNavigation}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Google Maps
                </Button>
              )}
            </div>
            
            <div className="h-64 rounded-lg overflow-hidden">
              <Map
                customerLocation={ride.pickupLatitude && ride.pickupLongitude ? 
                  [ride.pickupLatitude, ride.pickupLongitude] : 
                  [24.7136, 46.6753]
                }
                drivers={doctorLat && doctorLng ? [{
                  id: 999,
                  name: "موقعي الحالي",
                  latitude: doctorLat,
                  longitude: doctorLng,
                  phone: "",
                  vehicleType: "",
                  isAvailable: true,
                  rating: 0,
                  carModel: "",
                  carColor: "",
                  membershipType: ""
                }] : []}
                assignedDriver={doctorLat && doctorLng ? {
                  id: 999,
                  name: "موقعي الحالي",
                  latitude: doctorLat,
                  longitude: doctorLng,
                  phone: "",
                  vehicleType: "",
                  isAvailable: true,
                  rating: 0,
                  carModel: "",
                  carColor: "",
                  membershipType: ""
                } : undefined}
                showBothLocations={true}
                className="h-full w-full"
              />
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span>موقعي (أخضر)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span>موقع العميل (أزرق)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">معلومات العميل</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">الاسم:</span>
                <span className="font-medium">{customer?.name || 'غير محدد'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">رقم الهاتف:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{customer?.phone || 'غير محدد'}</span>
                  {customer?.phone && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCallCustomer}
                      className="h-8 px-3"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">الموقع:</span>
                <span className="font-medium text-right">{ride.pickupLocation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">وقت الطلب:</span>
                <span className="font-medium">
                  {new Date(ride.createdAt).toLocaleTimeString('ar-SA')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={handleGoogleMapsNavigation}
              disabled={!doctorLat || !doctorLng || !ride.pickupLatitude || !ride.pickupLongitude}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              <Navigation className="w-5 h-5 mr-2" />
              فتح التنقل في Google Maps (نافذة جديدة)
            </Button>
            
            <Button
              onClick={() => {
                if (doctorLat && doctorLng && ride.pickupLatitude && ride.pickupLongitude) {
                  const googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(doctorLat)},${encodeURIComponent(doctorLng)}/${encodeURIComponent(ride.pickupLatitude)},${encodeURIComponent(ride.pickupLongitude)}`;
                  window.location.href = googleMapsUrl;
                }
              }}
              disabled={!doctorLat || !doctorLng || !ride.pickupLatitude || !ride.pickupLongitude}
              variant="outline"
              className="w-full py-3"
            >
              <Navigation className="w-5 h-5 mr-2" />
              فتح Google Maps مباشرة
            </Button>
          </div>

          {/* Alternative navigation options */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => {
                if (doctorLat && doctorLng && ride.pickupLatitude && ride.pickupLongitude) {
                  const appleUrl = `http://maps.apple.com/?saddr=${doctorLat},${doctorLng}&daddr=${ride.pickupLatitude},${ride.pickupLongitude}`;
                  window.location.href = appleUrl;
                }
              }}
              variant="outline"
              className="py-2 text-sm"
              disabled={!doctorLat || !doctorLng || !ride.pickupLatitude || !ride.pickupLongitude}
            >
              Apple Maps
            </Button>
            
            <Button
              onClick={() => {
                if (doctorLat && doctorLng && ride.pickupLatitude && ride.pickupLongitude) {
                  const wazeUrl = `https://waze.com/ul?ll=${ride.pickupLatitude},${ride.pickupLongitude}&navigate=yes`;
                  window.open(wazeUrl, '_blank') || (window.location.href = wazeUrl);
                }
              }}
              variant="outline"
              className="py-2 text-sm"
              disabled={!doctorLat || !doctorLng || !ride.pickupLatitude || !ride.pickupLongitude}
            >
              Waze
            </Button>
          </div>
          
          {customer?.phone && (
            <Button
              onClick={handleCallCustomer}
              variant="outline"
              className="w-full py-3"
            >
              <Phone className="w-5 h-5 mr-2" />
              اتصال بالعميل
            </Button>
          )}

          {/* Debug info for troubleshooting */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
              <p>Debug Info:</p>
              <p>Doctor: {doctorLat?.toFixed(6)}, {doctorLng?.toFixed(6)}</p>
              <p>Customer: {ride.pickupLatitude?.toFixed(6)}, {ride.pickupLongitude?.toFixed(6)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}