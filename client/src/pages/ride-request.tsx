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
  pickupLocation: z.string().min(1, 'الموقع مطلوب'),
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
      destination: 'خدمة بيطرية في الموقع',
      pickupLatitude: DEFAULT_COORDINATES.latitude,
      pickupLongitude: DEFAULT_COORDINATES.longitude,
      destinationLatitude: DEFAULT_COORDINATES.latitude,
      destinationLongitude: DEFAULT_COORDINATES.longitude,
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
                            onClick={getCurrentLocation}
                          >
                            <Navigation className="w-4 h-4" />
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
