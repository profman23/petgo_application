import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRide } from '@/hooks/useRide';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ArrowLeft, MapPin, Navigation, Circle, RefreshCw, Loader2 } from 'lucide-react';
import { rideRequestSchema } from '@shared/schema';
import { DEFAULT_COORDINATES } from '@/lib/constants';
import { z } from 'zod';

const formSchema = rideRequestSchema.extend({
  pickupLocation: z.string().min(1, 'الموقع مطلوب'),
});

type FormData = z.infer<typeof formSchema>;

export default function RideRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { requestRide, isRequestingRide } = useRide();
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // استخدام نظام GPS الحقيقي
  const {
    latitude,
    longitude,
    accuracy,
    error: gpsError,
    isLoading: isLoadingGPS,
    getCurrentPosition,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 60000, // تحديث كل دقيقة
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pickupLocation: '',
      destination: 'خدمة بيطرية في الموقع',
      pickupLatitude: DEFAULT_COORDINATES.latitude,
      pickupLongitude: DEFAULT_COORDINATES.longitude,
      destinationLatitude: DEFAULT_COORDINATES.latitude,
      destinationLongitude: DEFAULT_COORDINATES.longitude,
      vehicleType: 'standard',
    },
  });

  useEffect(() => {
    // Get user's current location with high accuracy
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Real GPS Location:', latitude, longitude);
          setCurrentLocation({ latitude, longitude });
          form.setValue('pickupLatitude', latitude);
          form.setValue('pickupLongitude', longitude);
          
          // تحديد اسم الموقع بناءً على الإحداثيات الحقيقية
          let locationName = 'موقعك الحالي';
          if (latitude >= 24.5 && latitude <= 24.9 && longitude >= 46.4 && longitude <= 47.0) {
            locationName = 'الرياض - موقعك الحالي';
          } else if (latitude >= 21.3 && latitude <= 21.7 && longitude >= 39.1 && longitude <= 39.3) {
            locationName = 'جدة - موقعك الحالي';
          } else if (latitude >= 26.3 && latitude <= 26.5 && longitude >= 50.0 && longitude <= 50.2) {
            locationName = 'الدمام - موقعك الحالي';
          }
          
          form.setValue('pickupLocation', locationName);
          
          toast({
            title: 'تم تحديد موقعك',
            description: `الموقع: ${locationName}`,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: 'تعذر الحصول على الموقع الحقيقي',
            description: 'يرجى السماح بالوصول للموقع أو تفعيل GPS',
            variant: 'destructive',
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }
  }, [form, toast]);

  const onSubmit = (data: FormData) => {
    requestRide(data);
    setLocation('/ride-tracking');
  };

  // تحديث الموقع تلقائياً عند تغيير GPS
  useEffect(() => {
    if (latitude && longitude) {
      // فحص ما إذا كان الموقع داخل المملكة العربية السعودية
      const isInSaudiArabia = latitude >= 16 && latitude <= 32 && longitude >= 34 && longitude <= 56;
      
      if (isInSaudiArabia) {
        setCurrentLocation({ latitude, longitude });
        form.setValue('pickupLatitude', latitude);
        form.setValue('pickupLongitude', longitude);
        
        // تحديد اسم المنطقة حسب الإحداثيات
        let locationName = 'موقعك الحالي';
        if (latitude >= 24.5 && latitude <= 24.9 && longitude >= 46.4 && longitude <= 47.0) {
          locationName = 'الرياض - موقعك الحالي';
        } else if (latitude >= 21.3 && latitude <= 21.7 && longitude >= 39.1 && longitude <= 39.3) {
          locationName = 'جدة - موقعك الحالي';
        } else if (latitude >= 26.3 && latitude <= 26.5 && longitude >= 49.9 && longitude <= 50.3) {
          locationName = 'الدمام - موقعك الحالي';
        }
        
        form.setValue('pickupLocation', locationName);
        
        if (accuracy && accuracy < 100) {
          toast({
            title: 'تم تحديد موقعك بدقة',
            description: `الدقة: ${Math.round(accuracy)} متر`,
          });
        }
      } else {
        // استخدام إحداثيات الرياض إذا كان الموقع خارج المملكة
        const riyadhLat = 24.7136;
        const riyadhLng = 46.6753;
        setCurrentLocation({ latitude: riyadhLat, longitude: riyadhLng });
        form.setValue('pickupLatitude', riyadhLat);
        form.setValue('pickupLongitude', riyadhLng);
        form.setValue('pickupLocation', 'الرياض - الموقع الافتراضي');
        toast({
          title: 'تم تصحيح الموقع',
          description: 'تم استخدام موقع الرياض (الموقع المكتشف خارج المملكة)',
          variant: 'destructive',
        });
      }
    }
  }, [latitude, longitude, accuracy, form, toast]);

  // التعامل مع أخطاء GPS
  useEffect(() => {
    if (gpsError) {
      const riyadhLat = 24.7136;
      const riyadhLng = 46.6753;
      setCurrentLocation({ latitude: riyadhLat, longitude: riyadhLng });
      form.setValue('pickupLatitude', riyadhLat);
      form.setValue('pickupLongitude', riyadhLng);
      form.setValue('pickupLocation', 'الرياض - الموقع الافتراضي');
      toast({
        title: 'خطأ في تحديد الموقع',
        description: `${gpsError}. تم استخدام موقع الرياض كبديل.`,
        variant: 'destructive',
      });
    }
  }, [gpsError, form, toast]);

  const refreshLocation = () => {
    getCurrentPosition();
    toast({
      title: 'يتم تحديث الموقع...',
      description: 'الرجاء الانتظار',
    });
  };

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
          <h1 className="text-lg font-semibold">طلب عيادة بيطرية متنقلة</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4">
        {/* Service Type Selection */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">نوع الخدمة البيطرية</h2>
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant={form.watch('vehicleType') === 'standard' ? 'default' : 'outline'}
              onClick={() => form.setValue('vehicleType', 'standard')}
              className="p-6 h-auto flex-col bg-green-50 border-green-200"
            >
              <div className="text-3xl mb-2">🏥</div>
              <span className="font-semibold">عيادة بيطرية متنقلة</span>
              <span className="text-sm text-gray-500">خدمة بيطرية شاملة في موقعك</span>
            </Button>
          </div>
        </div>

        {/* Location Input */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="pickupLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>موقعك الحالي</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Circle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <Input
                            {...field}
                            placeholder="موقعك الحالي"
                            className="flex-1 text-right"
                            readOnly
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={refreshLocation}
                            disabled={isLoadingGPS}
                            title={isLoadingGPS ? "يتم تحديد الموقع..." : "تحديث الموقع"}
                          >
                            {isLoadingGPS ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500 mt-1">
                        العيادة البيطرية ستأتي إلى موقعك الحالي
                      </p>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg"
                  disabled={isRequestingRide}
                >
                  {isRequestingRide ? 'جاري إرسال الطلب...' : 'طلب العيادة البيطرية الآن'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Service Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">معلومات الخدمة</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">وقت الوصول المقدر</p>
                <p className="font-semibold">15-30 دقيقة</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">مدة الخدمة</p>
                <p className="font-semibold">45-60 دقيقة</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">رسوم الخدمة</p>
                <p className="font-semibold text-green-600">150 ريال</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">طريقة الدفع</p>
                <p className="font-semibold">نقدي</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>تشمل الخدمة:</strong> فحص شامل، تشخيص، علاج أساسي، استشارة طبية
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
