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
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { DEFAULT_COORDINATES } from '@/lib/constants';
import { z } from 'zod';
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';

const formSchema = rideRequestSchema.extend({
  pickupLocation: z.string().min(1, 'الموقع مطلوب'),
});

type FormData = z.infer<typeof formSchema>;

export default function RideRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { requestRide, isRequestingRide } = useRide();
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const t = useTranslation();
  const { language } = useLanguage();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  
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
    // Get user's current location with high accuracy - force new location request
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // Force fresh location request
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('Fresh GPS Location:', latitude, longitude, 'Accuracy:', accuracy);
          
          setCurrentLocation({ latitude, longitude });
          form.setValue('pickupLatitude', latitude);
          form.setValue('pickupLongitude', longitude);
          
          // تحديد اسم الموقع بناءً على الإحداثيات الحقيقية - نطاقات أوسع
          let locationName = `موقعك الحالي (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          
          if (latitude >= 24.0 && latitude <= 25.5 && longitude >= 46.0 && longitude <= 47.5) {
            locationName = `الرياض - موقعك الحالي (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          } else if (latitude >= 21.0 && latitude <= 22.0 && longitude >= 39.0 && longitude <= 39.8) {
            locationName = `جدة - موقعك الحالي (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          } else if (latitude >= 26.0 && latitude <= 27.0 && longitude >= 49.5 && longitude <= 50.5) {
            locationName = `الدمام - موقعك الحالي (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          } else if (latitude >= 24.0 && latitude <= 25.0 && longitude >= 39.0 && longitude <= 40.5) {
            locationName = `المدينة المنورة - موقعك الحالي (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          }
          
          form.setValue('pickupLocation', locationName);
          
          toast({
            title: 'تم تحديد موقعك الحقيقي بنجاح',
            description: `الموقع: ${locationName}\nالدقة: ${Math.round(accuracy)} متر`,
            duration: 5000,
          });
        },
        (error) => {
          console.error('GPS Error:', error);
          let errorMessage = 'خطأ غير معروف';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'تم رفض إذن الوصول للموقع';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'الموقع غير متاح';
              break;
            case error.TIMEOUT:
              errorMessage = 'انتهت مهلة تحديد الموقع';
              break;
          }
          
          toast({
            title: 'فشل في تحديد الموقع الحقيقي',
            description: `${errorMessage}. يرجى السماح بالوصول للموقع وإعادة المحاولة.`,
            variant: 'destructive',
            duration: 8000,
          });
        },
        options
      );
    } else {
      toast({
        title: 'GPS غير مدعوم',
        description: 'متصفحك لا يدعم خدمات الموقع',
        variant: 'destructive',
      });
    }
  }, [form, toast]);

  const onSubmit = (data: FormData) => {
    // التحقق من وجود الموقع الحقيقي
    if (!currentLocation || !currentLocation.latitude || !currentLocation.longitude) {
      toast({
        title: 'خطأ في الموقع',
        description: 'لم يتم تحديد موقعك الحقيقي بعد. يرجى الانتظار أو الضغط على زر تحديث الموقع.',
        variant: 'destructive',
      });
      return;
    }

    // التأكد من استخدام الموقع الحقيقي
    const rideData = {
      ...data,
      pickupLatitude: currentLocation.latitude,
      pickupLongitude: currentLocation.longitude,
      destinationLatitude: currentLocation.latitude,
      destinationLongitude: currentLocation.longitude,
    };

    console.log('Submitting ride with real GPS location:', rideData);
    requestRide(rideData);
    setLocation('/ride-tracking');
  };

  // تحديث الموقع تلقائياً عند تغيير GPS من useGeolocation hook
  useEffect(() => {
    if (latitude && longitude && accuracy) {
      console.log('useGeolocation hook update:', latitude, longitude, accuracy);
      
      // فحص ما إذا كان الموقع داخل المملكة العربية السعودية
      const isInSaudiArabia = latitude >= 15 && latitude <= 33 && longitude >= 34 && longitude <= 56;
      
      if (isInSaudiArabia) {
        setCurrentLocation({ latitude, longitude });
        form.setValue('pickupLatitude', latitude);
        form.setValue('pickupLongitude', longitude);
        
        // تحديد اسم المنطقة حسب الإحداثيات الدقيقة
        let locationName = `موقعك الحالي GPS (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
        
        if (latitude >= 24.0 && latitude <= 25.5 && longitude >= 46.0 && longitude <= 47.5) {
          locationName = `الرياض - موقعك الحالي GPS (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
        } else if (latitude >= 21.0 && latitude <= 22.0 && longitude >= 39.0 && longitude <= 39.8) {
          locationName = `جدة - موقعك الحالي GPS (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
        } else if (latitude >= 26.0 && latitude <= 27.0 && longitude >= 49.5 && longitude <= 50.5) {
          locationName = `الدمام - موقعك الحالي GPS (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
        } else if (latitude >= 24.0 && latitude <= 25.0 && longitude >= 39.0 && longitude <= 40.5) {
          locationName = `المدينة المنورة - موقعك الحالي GPS (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
        }
        
        form.setValue('pickupLocation', locationName);
        
        if (accuracy < 50) {
          toast({
            title: 'تم تحديث موقعك بدقة عالية',
            description: `الدقة: ${Math.round(accuracy)} متر`,
            duration: 3000,
          });
        }
      } else {
        toast({
          title: 'موقع خارج المملكة',
          description: `تم اكتشاف موقع خارج المملكة العربية السعودية`,
          variant: 'destructive',
        });
      }
    }
  }, [latitude, longitude, accuracy, form, toast]);

  // التعامل مع أخطاء GPS من useGeolocation hook
  useEffect(() => {
    if (gpsError) {
      console.log('GPS Error from hook:', gpsError);
      toast({
        title: 'خطأ في GPS Hook',
        description: `${gpsError}`,
        variant: 'destructive',
      });
    }
  }, [gpsError, toast]);

  const refreshLocation = () => {
    // طلب موقع جديد بدقة عالية
    if (navigator.geolocation) {
      toast({
        title: 'يتم تحديث الموقع...',
        description: 'الرجاء الانتظار',
      });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('Refreshed GPS Location:', latitude, longitude, 'Accuracy:', accuracy);
          
          setCurrentLocation({ latitude, longitude });
          form.setValue('pickupLatitude', latitude);
          form.setValue('pickupLongitude', longitude);
          
          // تحديد اسم الموقع الجديد
          let locationName = `موقعك المحدث (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
          
          if (latitude >= 24.0 && latitude <= 25.5 && longitude >= 46.0 && longitude <= 47.5) {
            locationName = `الرياض - موقعك المحدث (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
          } else if (latitude >= 21.0 && latitude <= 22.0 && longitude >= 39.0 && longitude <= 39.8) {
            locationName = `جدة - موقعك المحدث (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
          } else if (latitude >= 26.0 && latitude <= 27.0 && longitude >= 49.5 && longitude <= 50.5) {
            locationName = `الدمام - موقعك المحدث (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
          }
          
          form.setValue('pickupLocation', locationName);
          
          toast({
            title: 'تم تحديث موقعك بنجاح',
            description: `الموقع الجديد: ${locationName}\nالدقة: ${Math.round(accuracy)} متر`,
            duration: 5000,
          });
        },
        (error) => {
          console.error('Refresh GPS Error:', error);
          toast({
            title: 'فشل في تحديث الموقع',
            description: 'يرجى التأكد من تفعيل GPS والسماح للمتصفح بالوصول للموقع',
            variant: 'destructive',
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Force fresh location
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ direction }}>
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
            <h1 className="text-lg font-semibold" style={{ textAlign }}>{t('requestVet')}</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4">
        {/* Service Type Selection */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ textAlign }}>{t('serviceType')}</h2>
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant={form.watch('vehicleType') === 'standard' ? 'default' : 'outline'}
              onClick={() => form.setValue('vehicleType', 'standard')}
              className="p-6 h-auto flex-col bg-green-50 border-green-200"
            >
              <div className="text-3xl mb-2">🏥</div>
              <span className="font-semibold" style={{ textAlign }}>
                {language === 'ar' ? 'عيادة بيطرية متنقلة' : 'Mobile Veterinary Clinic'}
              </span>
              <span className="text-sm text-gray-500" style={{ textAlign }}>
                {language === 'ar' ? 'خدمة بيطرية شاملة في موقعك' : 'Comprehensive veterinary service at your location'}
              </span>
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
                      <FormLabel style={{ textAlign }}>{t('yourLocation')}</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Circle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <Input
                            {...field}
                            placeholder={language === 'ar' ? 'موقعك الحالي' : 'Your current location'}
                            className={`flex-1 ${textAlign === 'right' ? 'text-right' : 'text-left'}`}
                            style={{ textAlign }}
                            readOnly
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={refreshLocation}
                            disabled={isLoadingGPS}
                            title={isLoadingGPS ? 
                              (language === 'ar' ? "يتم تحديد الموقع..." : "Detecting location...") : 
                              (language === 'ar' ? "تحديث الموقع" : "Update location")
                            }
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
                      <p className="text-xs text-gray-500 mt-1" style={{ textAlign }}>
                        {language === 'ar' ? 'العيادة البيطرية ستأتي إلى موقعك الحالي' : 'The veterinary clinic will come to your current location'}
                        {currentLocation && (
                          <span className="block text-blue-600 font-mono">
                            GPS: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                          </span>
                        )}
                      </p>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg"
                  disabled={isRequestingRide || !currentLocation}
                  style={{ direction }}
                >
                  {isRequestingRide ? 
                    (language === 'ar' ? 'جاري إرسال الطلب...' : 'Sending request...') : 
                   !currentLocation ? 
                    (language === 'ar' ? 'في انتظار تحديد الموقع...' : 'Waiting for location...') : 
                    (language === 'ar' ? 'طلب العيادة البيطرية الآن' : 'Request Veterinary Clinic Now')
                  }
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Service Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3" style={{ textAlign }}>
              {language === 'ar' ? 'معلومات الخدمة' : 'Service Information'}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1" style={{ textAlign }}>
                  {language === 'ar' ? 'وقت الوصول المقدر' : 'Estimated arrival time'}
                </p>
                <p className="font-semibold" style={{ textAlign }}>
                  {language === 'ar' ? '15-30 دقيقة' : '15-30 minutes'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1" style={{ textAlign }}>
                  {language === 'ar' ? 'مدة الخدمة' : 'Service duration'}
                </p>
                <p className="font-semibold" style={{ textAlign }}>
                  {language === 'ar' ? '45-60 دقيقة' : '45-60 minutes'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1" style={{ textAlign }}>
                  {language === 'ar' ? 'رسوم الخدمة' : 'Service fee'}
                </p>
                <p className="font-semibold text-green-600" style={{ textAlign }}>
                  150 {language === 'ar' ? 'ريال' : 'SAR'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1" style={{ textAlign }}>
                  {language === 'ar' ? 'طريقة الدفع' : 'Payment method'}
                </p>
                <p className="font-semibold" style={{ textAlign }}>
                  {language === 'ar' ? 'نقدي' : 'Cash'}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800" style={{ textAlign }}>
                <strong>
                  {language === 'ar' ? 'تشمل الخدمة:' : 'Service includes:'}
                </strong> {language === 'ar' ? 
                  'فحص شامل، تشخيص، علاج أساسي، استشارة طبية' : 
                  'Comprehensive examination, diagnosis, basic treatment, medical consultation'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
