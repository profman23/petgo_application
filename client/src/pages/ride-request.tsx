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
import { ArrowLeft, MapPin, Navigation, Circle, RefreshCw, Loader2, Truck, Heart, Shield, Clock, Star } from 'lucide-react';
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
  
  const { t } = useTranslation();
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
      {/* Outer container with purple border */}
      <div className="min-h-screen border-4 border-purple-600 m-2 rounded-lg bg-white" style={{ borderColor: '#8B5CF6' }}>
        {/* Header */}
        <header className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg sticky top-0 z-50 rounded-t-lg">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 text-white hover:bg-purple-800"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </Button>
            <div className="flex items-center gap-3">
              <img 
                src={logoImage} 
                alt="Vets Van" 
                className="h-10 object-contain rounded-lg border-2 border-purple-300"
              />
              <h1 className="text-xl font-bold text-white" style={{ textAlign }}>{t('requestVet')}</h1>
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
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isRequestingRide || !currentLocation}
                  style={{ direction }}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Truck className="w-5 h-5" />
                    <div className="text-center">
                      <div>
                        {isRequestingRide ? 
                          (language === 'ar' ? 'جاري إرسال الطلب...' : 'Sending request...') : 
                         !currentLocation ? 
                          (language === 'ar' ? 'في انتظار تحديد الموقع...' : 'Waiting for location...') : 
                          (language === 'ar' ? 'اضغط هنا للطلب' : 'Click Here to Request')
                        }
                      </div>
                      {!isRequestingRide && currentLocation && (
                        <div className="text-sm opacity-90">
                          {language === 'ar' ? 'عيادة بيطرية متنقلة' : 'Mobile Veterinary Clinic'}
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Enhanced Visual Journey Animation */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-6">
            <h3 className="font-bold text-xl text-purple-700 mb-4 text-center" style={{ textAlign }}>
              {language === 'ar' ? 'رحلة العيادة البيطرية إليك' : 'Veterinary Clinic Journey to You'}
            </h3>
            
            {/* Enhanced Animation with SVG */}
            <div className="relative h-32 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg overflow-hidden">
              {/* Hospital SVG Icon */}
              <div className={`absolute top-4 ${language === 'ar' ? 'right-4' : 'left-4'} flex flex-col items-center`}>
                <div className="w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center border-2 border-green-300">
                  <svg viewBox="0 0 64 64" className="w-12 h-12">
                    <rect x="10" y="20" width="44" height="35" fill="#4ade80" rx="4"/>
                    <rect x="18" y="12" width="28" height="15" fill="#22c55e" rx="2"/>
                    <rect x="28" y="30" width="8" height="3" fill="white"/>
                    <rect x="30.5" y="27.5" width="3" height="8" fill="white"/>
                    <circle cx="22" cy="38" r="2" fill="white"/>
                    <circle cx="42" cy="38" r="2" fill="white"/>
                    <rect x="26" y="45" width="12" height="2" fill="white"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-green-700 mt-1">
                  {language === 'ar' ? 'العيادة' : 'Clinic'}
                </span>
              </div>

              {/* Enhanced Veterinary Truck Animation */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                <div className="relative">
                  <svg viewBox="0 0 120 60" className="w-24 h-12 animate-bounce">
                    {/* Truck Body */}
                    <rect x="20" y="25" width="50" height="20" fill="#8b5cf6" rx="3"/>
                    <rect x="70" y="30" width="25" height="15" fill="#7c3aed" rx="2"/>
                    
                    {/* Medical Cross */}
                    <rect x="40" y="30" width="10" height="3" fill="white"/>
                    <rect x="43" y="27" width="4" height="9" fill="white"/>
                    
                    {/* Windows */}
                    <rect x="72" y="32" width="8" height="6" fill="#e0e7ff"/>
                    <rect x="82" y="32" width="8" height="6" fill="#e0e7ff"/>
                    
                    {/* Wheels */}
                    <circle cx="30" cy="48" r="6" fill="#374151"/>
                    <circle cx="30" cy="48" r="4" fill="#6b7280"/>
                    <circle cx="80" cy="48" r="6" fill="#374151"/>
                    <circle cx="80" cy="48" r="4" fill="#6b7280"/>
                    
                    {/* Lights */}
                    <circle cx="95" cy="35" r="2" fill="#fbbf24"/>
                    <rect x="18" y="33" width="3" height="4" fill="#ef4444"/>
                  </svg>
                  
                  {/* Movement lines */}
                  <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 opacity-60">
                    <div className="w-4 h-0.5 bg-purple-400 animate-pulse"></div>
                    <div className="w-3 h-0.5 bg-purple-300 mt-1 animate-pulse delay-100"></div>
                    <div className="w-2 h-0.5 bg-purple-200 mt-1 animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>

              {/* Home SVG Icon */}
              <div className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} flex flex-col items-center`}>
                <div className="w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center border-2 border-blue-300">
                  <svg viewBox="0 0 64 64" className="w-12 h-12">
                    <polygon points="32,8 8,28 8,56 24,56 24,40 40,40 40,56 56,56 56,28" fill="#3b82f6"/>
                    <polygon points="32,8 8,28 56,28" fill="#1d4ed8"/>
                    <rect x="28" y="44" width="8" height="12" fill="#1e40af"/>
                    <rect x="30" y="46" width="4" height="4" fill="#93c5fd"/>
                    <circle cx="18" cy="34" r="2" fill="#60a5fa"/>
                    <circle cx="46" cy="34" r="2" fill="#60a5fa"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-blue-700 mt-1">
                  {language === 'ar' ? 'منزلك' : 'Your Home'}
                </span>
              </div>

              {/* Direction Arrow */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-8">
                <svg className={`w-8 h-4 text-purple-500 animate-pulse ${language === 'ar' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-lg text-purple-700 mb-4" style={{ textAlign }}>
              {language === 'ar' ? 'معلومات الخدمة' : 'Service Information'}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-green-600 font-medium mb-1" style={{ textAlign }}>
                  {language === 'ar' ? 'وقت الوصول المقدر' : 'Estimated Arrival'}
                </p>
                <p className="font-bold text-green-800" style={{ textAlign }}>
                  {language === 'ar' ? '15-30 دقيقة' : '15-30 minutes'}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-600 font-medium mb-1" style={{ textAlign }}>
                  {language === 'ar' ? 'مدة الخدمة' : 'Service Duration'}
                </p>
                <p className="font-bold text-blue-800" style={{ textAlign }}>
                  {language === 'ar' ? '45-60 دقيقة' : '45-60 minutes'}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-purple-600 font-medium mb-1" style={{ textAlign }}>
                  {language === 'ar' ? 'رسوم الخدمة' : 'Service Fee'}
                </p>
                <p className="font-bold text-purple-800" style={{ textAlign }}>
                  150 {language === 'ar' ? 'ريال' : 'SAR'}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-orange-600 font-medium mb-1" style={{ textAlign }}>
                  {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                </p>
                <p className="font-bold text-orange-800" style={{ textAlign }}>
                  {language === 'ar' ? 'نقدي' : 'Cash'}
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <p className="font-bold text-blue-800" style={{ textAlign }}>
                  {language === 'ar' ? 'تشمل الخدمة:' : 'Service Includes:'}
                </p>
              </div>
              <p className="text-sm text-blue-700" style={{ textAlign }}>
                {language === 'ar' ? 
                  'فحص شامل • تشخيص دقيق • علاج أساسي • استشارة طبية • أدوية أساسية' : 
                  'Comprehensive examination • Accurate diagnosis • Basic treatment • Medical consultation • Essential medications'
                }
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
