import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRide } from '@/hooks/useRide';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ArrowLeft, MapPin, Navigation, Circle, RefreshCw, Loader2, Truck, Heart, Shield, Clock, Star, User, PawPrint } from 'lucide-react';
import { rideRequestSchema, type Patient } from '@shared/schema';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import petsImage from "@assets/freepik_assistant_1751437357520_1751437467714.png";
import serviceTypeIcon from "@assets/freepik_assistant_1751437667818_1751437676533.png";
import locationIcon from "@assets/freepik_assistant_1751438122960_1751438131963.png";
import { DEFAULT_COORDINATES } from '@/lib/constants';
import { z } from 'zod';
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';
import { FixedFooter } from '@/components/fixed-footer';

const formSchema = rideRequestSchema.extend({
  pickupLocation: z.string().min(1, 'الموقع مطلوب'),
  serviceType: z.string().min(1, 'نوع الخدمة مطلوب'),
  selectedPatients: z.array(z.number()).min(1, 'يرجى اختيار حيوان أليف واحد على الأقل'),
});

type FormData = z.infer<typeof formSchema>;

export default function RideRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { requestRide, isRequestingRide } = useRide();
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedPatients, setSelectedPatients] = useState<number[]>([]);
  const [serviceType, setServiceType] = useState<string>('');
  
  const { t } = useTranslation();
  const { language } = useLanguage();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  
  // جلب الحيوانات الأليفة المسجلة بتحسين الأداء
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    staleTime: 5 * 60 * 1000, // 5 دقائق
    gcTime: 10 * 60 * 1000, // 10 دقائق
    refetchOnWindowFocus: false,
  });
  
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
      serviceType: '',
      selectedPatients: [],
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
          
          // تحديد اسم الموقع بناءً على الإحداثيات الحقيقية - عرض مبسط
          let locationName = 'موقعك الحالي';
          
          if (latitude >= 24.0 && latitude <= 25.5 && longitude >= 46.0 && longitude <= 47.5) {
            locationName = 'الرياض - موقعك الحالي';
          } else if (latitude >= 21.0 && latitude <= 22.0 && longitude >= 39.0 && longitude <= 39.8) {
            locationName = 'جدة - موقعك الحالي';
          } else if (latitude >= 26.0 && latitude <= 27.0 && longitude >= 49.5 && longitude <= 50.5) {
            locationName = 'الدمام - موقعك الحالي';
          } else if (latitude >= 24.0 && latitude <= 25.0 && longitude >= 39.0 && longitude <= 40.5) {
            locationName = 'المدينة المنورة - موقعك الحالي';
          }
          
          form.setValue('pickupLocation', locationName);
          
          // Location set successfully without notification
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
        title: language === 'ar' ? 'خطأ في الموقع' : 'Location Error',
        description: language === 'ar' ? 
          'لم يتم تحديد موقعك الحقيقي بعد. يرجى الانتظار أو الضغط على زر تحديث الموقع.' : 
          'Your real location has not been determined yet. Please wait or press the refresh location button.',
        variant: 'destructive',
      });
      return;
    }

    // التحقق من اختيار الحيوانات الأليفة
    if (selectedPatients.length === 0) {
      toast({
        title: language === 'ar' ? 'يرجى اختيار الحيوانات الأليفة' : 'Please select pets',
        description: language === 'ar' ? 
          'يرجى اختيار حيوان أليف واحد على الأقل للخدمة البيطرية.' : 
          'Please select at least one pet for veterinary service.',
        variant: 'destructive',
      });
      return;
    }

    // التحقق من اختيار نوع الخدمة
    if (!serviceType) {
      toast({
        title: language === 'ar' ? 'يرجى اختيار نوع الخدمة' : 'Please select service type',
        description: language === 'ar' ? 
          'يرجى اختيار نوع الخدمة المطلوبة.' : 
          'Please select the required service type.',
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
      serviceType: serviceType,
      selectedPatients: selectedPatients,
    };

    console.log('Submitting ride with real GPS location and selected pets:', rideData);
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
        
        // تحديد اسم المنطقة حسب الإحداثيات - عرض مبسط
        let locationName = 'موقعك الحالي';
        
        if (latitude >= 24.0 && latitude <= 25.5 && longitude >= 46.0 && longitude <= 47.5) {
          locationName = 'الرياض - موقعك الحالي';
        } else if (latitude >= 21.0 && latitude <= 22.0 && longitude >= 39.0 && longitude <= 39.8) {
          locationName = 'جدة - موقعك الحالي';
        } else if (latitude >= 26.0 && latitude <= 27.0 && longitude >= 49.5 && longitude <= 50.5) {
          locationName = 'الدمام - موقعك الحالي';
        } else if (latitude >= 24.0 && latitude <= 25.0 && longitude >= 39.0 && longitude <= 40.5) {
          locationName = 'المدينة المنورة - موقعك الحالي';
        }
        
        form.setValue('pickupLocation', locationName);
        
        // Location updated with high accuracy - no notification needed
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
          
          // تحديد اسم الموقع الجديد - عرض مبسط
          let locationName = 'موقعك المحدث';
          
          if (latitude >= 24.0 && latitude <= 25.5 && longitude >= 46.0 && longitude <= 47.5) {
            locationName = 'الرياض - موقعك المحدث';
          } else if (latitude >= 21.0 && latitude <= 22.0 && longitude >= 39.0 && longitude <= 39.8) {
            locationName = 'جدة - موقعك المحدث';
          } else if (latitude >= 26.0 && latitude <= 27.0 && longitude >= 49.5 && longitude <= 50.5) {
            locationName = 'الدمام - موقعك المحدث';
          }
          
          form.setValue('pickupLocation', locationName);
          
          // Location refreshed successfully without notification
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
    <div className="min-h-screen bg-gray-50 pb-20 pt-4" style={{ direction }}>

      <div className="p-4">
        {/* Pet Selection Section */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3" style={{ textAlign }}>
              {t('selectPatients')}
            </h2>
            <p className="text-sm text-gray-600 mb-4" style={{ textAlign }}>
              {t('selectPatientsDesc')}
            </p>
            
            {/* Pets Image */}
            <div className="flex justify-center mb-6">
              <img 
                src={petsImage} 
                alt="Pets" 
                className="w-40 h-40 object-contain rounded-lg shadow-lg"
              />
            </div>
            
            {isLoadingPatients ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2" style={{ textAlign }}>
                  {language === 'ar' ? 'جاري تحميل الحيوانات الأليفة...' : 'Loading pets...'}
                </span>
              </div>
            ) : !patients || patients.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <PawPrint className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-2" style={{ textAlign }}>
                  {t('noRegisteredPatients')}
                </h3>
                <p className="text-gray-600 mb-4" style={{ textAlign }}>
                  {t('registerPetsFirst')}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/account')}
                >
                  {t('goToPatients')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {patients.map((patient: Patient) => (
                  <div
                    key={patient.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPatients.includes(patient.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      const isSelected = selectedPatients.includes(patient.id);
                      if (isSelected) {
                        setSelectedPatients(prev => prev.filter(id => id !== patient.id));
                      } else {
                        setSelectedPatients(prev => [...prev, patient.id]);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedPatients.includes(patient.id)}
                        onChange={() => {}}
                        className="pointer-events-none"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {patient.type === 'Cat' ? '🐱' : patient.type === 'Dog' ? '🐶' : '🐦'}
                          </span>
                          <h3 className="font-medium text-gray-900" style={{ textAlign }}>
                            {patient.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span style={{ textAlign }}>
                            {language === 'ar' ? 'النوع:' : 'Type:'} {
                              patient.type === 'Cat' ? (language === 'ar' ? 'قطة' : 'Cat') :
                              patient.type === 'Dog' ? (language === 'ar' ? 'كلب' : 'Dog') :
                              (language === 'ar' ? 'طائر' : 'Bird')
                            }
                          </span>
                          {patient.ageYear && (
                            <span style={{ textAlign }}>
                              {language === 'ar' ? 'العمر:' : 'Age:'} {patient.ageYear} {language === 'ar' ? 'سنة' : 'years'}
                              {patient.ageMonth && patient.ageMonth > 0 && (
                                <span> {patient.ageMonth} {language === 'ar' ? 'شهر' : 'months'}</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Type Selection */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <img 
                src={serviceTypeIcon} 
                alt="Service Type" 
                className="w-6 h-6 object-contain"
              />
              <h2 className="text-lg font-semibold text-gray-900" style={{ textAlign }}>
                {t('selectServiceType')}
              </h2>
            </div>
            <Select
              value={serviceType}
              onValueChange={(value) => {
                setServiceType(value);
                form.setValue('serviceType', value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={
                  language === 'ar' ? 'اختر نوع الخدمة...' : 'Select service type...'
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general-checkup">
                  <div className="flex items-center gap-2">
                    <span>🩺</span>
                    <span>{t('generalCheckUp')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="grooming">
                  <div className="flex items-center gap-2">
                    <span>✂️</span>
                    <span>{t('grooming')}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

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
                      <div className="flex items-center gap-2">
                        <img 
                          src={locationIcon} 
                          alt="Location" 
                          className="w-5 h-5 object-contain"
                        />
                        <FormLabel style={{ textAlign }}>{t('yourLocation')}</FormLabel>
                      </div>
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
                      </p>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isRequestingRide || !currentLocation || selectedPatients.length === 0 || !serviceType}
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
                          (language === 'ar' ? 'اضغط هنا للطلب البيطري' : 'Click Here to Vet Request')
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
      </div>

      {/* Fixed Footer */}
      <FixedFooter />
    </div>
  );
}
