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
import { ArrowLeft, MapPin, Navigation, Circle } from 'lucide-react';
import { rideRequestSchema } from '@shared/schema';
import { DEFAULT_COORDINATES } from '@/lib/constants';
import { z } from 'zod';

const formSchema = rideRequestSchema.extend({
  pickupLocation: z.string().min(1, 'موقع الانطلاق مطلوب'),
  destination: z.string().min(1, 'الوجهة مطلوبة'),
});

type FormData = z.infer<typeof formSchema>;

export default function RideRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { requestRide, isRequestingRide } = useRide();
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pickupLocation: '',
      destination: '',
      pickupLatitude: DEFAULT_COORDINATES.latitude,
      pickupLongitude: DEFAULT_COORDINATES.longitude,
      destinationLatitude: DEFAULT_COORDINATES.latitude + 0.01,
      destinationLongitude: DEFAULT_COORDINATES.longitude + 0.01,
      vehicleType: 'standard',
    },
  });

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          form.setValue('pickupLatitude', latitude);
          form.setValue('pickupLongitude', longitude);
          form.setValue('pickupLocation', 'موقعك الحالي');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: 'تعذر الحصول على الموقع',
            description: 'سيتم استخدام موقع افتراضي',
            variant: 'destructive',
          });
        }
      );
    }
  }, [form, toast]);

  const onSubmit = (data: FormData) => {
    requestRide(data);
    setLocation('/ride-tracking');
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          form.setValue('pickupLatitude', latitude);
          form.setValue('pickupLongitude', longitude);
          form.setValue('pickupLocation', 'موقعك الحالي');
          toast({
            title: 'تم تحديد الموقع',
            description: 'تم الحصول على موقعك الحالي بنجاح',
          });
        },
        (error) => {
          toast({
            title: 'خطأ في تحديد الموقع',
            description: 'تأكد من تفعيل خدمة الموقع',
            variant: 'destructive',
          });
        }
      );
    }
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
          <h1 className="text-lg font-semibold">طلب رحلة جديدة</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4">
        {/* Vehicle Type Selection */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">نوع المركبة</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={form.watch('vehicleType') === 'standard' ? 'default' : 'outline'}
              onClick={() => form.setValue('vehicleType', 'standard')}
              className="p-6 h-auto flex-col"
            >
              <MapPin className="w-8 h-8 mb-2" />
              <span className="font-semibold">سيارة عادية</span>
              <span className="text-sm text-gray-500">توفير في التكلفة</span>
            </Button>
            <Button
              variant={form.watch('vehicleType') === 'premium' ? 'default' : 'outline'}
              onClick={() => form.setValue('vehicleType', 'premium')}
              className="p-6 h-auto flex-col"
            >
              <Navigation className="w-8 h-8 mb-2" />
              <span className="font-semibold">سيارة مميزة</span>
              <span className="text-sm text-gray-500">راحة إضافية</span>
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
                      <FormLabel>موقع الانطلاق</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Circle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <Input
                            {...field}
                            placeholder="موقعك الحالي"
                            className="flex-1 text-right"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={getCurrentLocation}
                          >
                            <Navigation className="w-4 h-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="border-r-2 border-gray-300 border-dashed h-4 mr-1" />
                
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوجهة</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Circle className="w-3 h-3 text-red-500 flex-shrink-0" />
                          <Input
                            {...field}
                            placeholder="إلى أين تريد الذهاب؟"
                            className="flex-1 text-right"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-gray-800 text-white py-4 text-lg"
                  disabled={isRequestingRide}
                >
                  {isRequestingRide ? 'جاري إرسال الطلب...' : 'طلب الرحلة الآن'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Ride Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">معلومات الرحلة</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">المسافة المقدرة</p>
                <p className="font-semibold">5.2 كم</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">الوقت المقدر</p>
                <p className="font-semibold">12 دقيقة</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">التكلفة المقدرة</p>
                <p className="font-semibold text-green-600">25 ريال</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">طريقة الدفع</p>
                <p className="font-semibold">نقدي</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
