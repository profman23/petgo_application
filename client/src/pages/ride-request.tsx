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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRide } from '@/hooks/useRide';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ArrowLeft, MapPin, Navigation, Circle, RefreshCw, Loader2, Truck, Heart, Shield, Clock, Star, User, PawPrint, Check, ChevronDown, Bell } from 'lucide-react';
import { rideRequestSchema, type Patient } from '@shared/schema';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import petsImage from "@assets/freepik_assistant_1751437357520_1751437467714.png";
import selectPetsLogo from "@/assets/select-pets-logo-new.png";
import serviceTypeIcon from "@assets/freepik_assistant_1751437667818_1751437676533.png";
import locationIcon from "@assets/freepik_assistant_1751438122960_1751438131963.png";
import vetVanImage from "@assets/freepik__background__70346_1751441138494.png";
import { DEFAULT_COORDINATES } from '@/lib/constants';
import { z } from 'zod';
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';



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
  const [slidePosition, setSlidePosition] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [isSlideComplete, setIsSlideComplete] = useState(false);
  const [user, setUser] = useState<any>(null);
  
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
          
          // الحصول على العنوان الدقيق باستخدام reverse geocoding
          let locationName = language === 'ar' ? 'موقعك الحالي' : 'Your Current Location';
          
          // استخدام reverse geocoding للحصول على العنوان الدقيق
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${language === 'ar' ? 'ar' : 'en'}`)
            .then(response => response.json())
            .then(data => {
              if (data && data.display_name) {
                locationName = data.display_name;
                console.log('Address from reverse geocoding:', locationName);
                form.setValue('pickupLocation', locationName);
              } else {
                // Fallback to city detection if reverse geocoding fails
                if (latitude >= 24.0 && latitude <= 25.5 && longitude >= 46.0 && longitude <= 47.5) {
                  locationName = language === 'ar' ? 'الرياض - موقعك الحالي' : 'Riyadh - Your Location';
                } else if (latitude >= 21.0 && latitude <= 22.0 && longitude >= 39.0 && longitude <= 39.8) {
                  locationName = language === 'ar' ? 'جدة - موقعك الحالي' : 'Jeddah - Your Location';
                } else if (latitude >= 26.0 && latitude <= 27.0 && longitude >= 49.5 && longitude <= 50.5) {
                  locationName = language === 'ar' ? 'الدمام - موقعك الحالي' : 'Dammam - Your Location';
                } else if (latitude >= 24.0 && latitude <= 25.0 && longitude >= 39.0 && longitude <= 40.5) {
                  locationName = language === 'ar' ? 'المدينة المنورة - موقعك الحالي' : 'Medina - Your Location';
                }
                form.setValue('pickupLocation', locationName);
              }
            })
            .catch(error => {
              console.log('Reverse geocoding failed:', error);
              // Fallback to city detection
              if (latitude >= 24.0 && latitude <= 25.5 && longitude >= 46.0 && longitude <= 47.5) {
                locationName = language === 'ar' ? 'الرياض - موقعك الحالي' : 'Riyadh - Your Location';
              } else if (latitude >= 21.0 && latitude <= 22.0 && longitude >= 39.0 && longitude <= 39.8) {
                locationName = language === 'ar' ? 'جدة - موقعك الحالي' : 'Jeddah - Your Location';
              } else if (latitude >= 26.0 && latitude <= 27.0 && longitude >= 49.5 && longitude <= 50.5) {
                locationName = language === 'ar' ? 'الدمام - موقعك الحالي' : 'Dammam - Your Location';
              } else if (latitude >= 24.0 && latitude <= 25.0 && longitude >= 39.0 && longitude <= 40.5) {
                locationName = language === 'ar' ? 'المدينة المنورة - موقعك الحالي' : 'Medina - Your Location';
              }
              form.setValue('pickupLocation', locationName);
            });
          
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

    // التحقق من اختيار الحيوان الأليف
    if (selectedPatients.length === 0) {
      toast({
        title: language === 'ar' ? 'يرجى اختيار الحيوانات الأليفة' : 'Please select pets',
        description: language === 'ar' ? 
          'يرجى اختيار حيوان أليف واحد على الأقل واحد على الأقل للخدمة البيطرية.' : 
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

    // حفظ بيانات الطلب في localStorage للانتقال إلى صفحة حجز VetsVan
    const requestData = {
      ...data,
      pickupLatitude: currentLocation.latitude,
      pickupLongitude: currentLocation.longitude,
      destinationLatitude: currentLocation.latitude,
      destinationLongitude: currentLocation.longitude,
      serviceType: serviceType,
      selectedPatients: selectedPatients,
      location: data.pickupLocation || 'موقعك الحالي'
    };

    console.log('Saving request data for VetsVan booking:', requestData);
    localStorage.setItem('pendingRequest', JSON.stringify(requestData));
    
    // التوجه إلى صفحة حجز VetsVan
    setLocation('/vetsvan-booking');
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

  // دوال التحكم في زر السحب
  const handleSlideStart = (e: React.TouchEvent | React.MouseEvent) => {
    console.log('handleSlideStart called');
    console.log('Location:', currentLocation);
    console.log('Patients:', selectedPatients);
    console.log('Service:', serviceType);
    
    if (!currentLocation || selectedPatients.length === 0 || !serviceType) {
      console.log('Cannot slide - missing data');
      return;
    }
    
    console.log('Starting slide...');
    setIsSliding(true);
    e.preventDefault();
  };

  const handleSlideMove = (e: React.TouchEvent | React.MouseEvent) => {
    console.log('handleSlideMove called, isSliding:', isSliding);
    if (!isSliding) return;
    
    const container = e.currentTarget as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    let clientX: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    const maxPosition = containerRect.width - 64; // 64px = w-16
    const newPosition = Math.max(0, Math.min(maxPosition, clientX - containerRect.left - 32));
    setSlidePosition(newPosition);
    console.log('New position:', newPosition, 'Container width:', containerRect.width);
    
    // تحقق من اكتمال السحب (75% لإعطاء المستخدم فرصة أكبر للتأكيد)
    const threshold = containerRect.width * 0.75;
    console.log('Threshold:', threshold, 'Position:', newPosition);
    if (newPosition > threshold) {
      console.log('Threshold reached! Completing slide...');
      setIsSlideComplete(true);
      setIsSliding(false);
      // استدعاء مباشر بدلاً من setTimeout لتجنب مشكلة state timing
      executeRideRequest();
    }
  };

  const handleSlideEnd = () => {
    setIsSliding(false);
    if (!isSlideComplete) {
      // إعادة السيارة بسلاسة للموقع الأصلي
      setTimeout(() => setSlidePosition(0), 50);
    }
  };

  // دالة منفصلة لتنفيذ الطلب - توجه لصفحة اختيار المواعيد
  const executeRideRequest = async () => {
    console.log('executeRideRequest called');
    console.log('Current location:', currentLocation);
    console.log('Selected patients:', selectedPatients);
    console.log('Service type:', serviceType);
    
    // التأكد من صحة البيانات قبل الإرسال
    if (!currentLocation || selectedPatients.length === 0 || !serviceType) {
      console.log('Missing required data for ride request');
      
      if (!currentLocation) {
        toast({
          title: language === 'ar' ? 'خطأ في الموقع' : 'Location Error',
          description: language === 'ar' ? 'لم يتم تحديد موقعك بعد' : 'Location not determined yet',
          variant: 'destructive',
        });
      } else if (selectedPatients.length === 0) {
        toast({
          title: language === 'ar' ? 'يرجى اختيار الحيوانات الأليفة' : 'Please select pets',
          description: language === 'ar' ? 'يرجى اختيار حيوان أليف واحد على الأقل' : 'Please select at least one pet',
          variant: 'destructive',
        });
      } else if (!serviceType) {
        toast({
          title: language === 'ar' ? 'يرجى اختيار نوع الخدمة' : 'Please select service type',
          description: language === 'ar' ? 'يرجى اختيار نوع الخدمة المطلوبة' : 'Please select the required service type',
          variant: 'destructive',
        });
      }
      
      // إعادة تعيين السحب عند الفشل
      setIsSlideComplete(false);
      setSlidePosition(0);
      return;
    }
    
    // حفظ بيانات الطلب في localStorage للاستخدام في صفحة الحجز
    const requestData = {
      pickupLatitude: currentLocation.latitude,
      pickupLongitude: currentLocation.longitude,
      selectedPatients,
      serviceType,
      location: form.getValues('pickupLocation'),
    };
    
    console.log('Saving request data to localStorage:', requestData);
    localStorage.setItem('pendingRequest', JSON.stringify(requestData));
    
    // تأكد من حفظ البيانات
    const savedData = localStorage.getItem('pendingRequest');
    console.log('Verification - data saved in localStorage:', savedData);
    
    console.log('Request data saved, redirecting to booking page');
    
    toast({
      title: language === 'ar' ? 'تم تأكيد البيانات' : 'Data Confirmed',
      description: language === 'ar' ? 'يرجى اختيار موعد الحجز' : 'Please select appointment time',
    });
    
    // توجه لصفحة اختيار المواعيد
    setLocation('/vetsvan-booking');
  };

  const handleSlideComplete = async () => {
    console.log('handleSlideComplete called, isSlideComplete:', isSlideComplete);
    if (!isSlideComplete) {
      console.log('Not slide complete, returning');
      return;
    }
    
    console.log('Slide completed - executing ride request');
    console.log('Current location:', currentLocation);
    console.log('Selected patients:', selectedPatients);
    console.log('Service type:', serviceType);
    
    // التأكد من صحة البيانات قبل الإرسال
    if (!currentLocation || selectedPatients.length === 0 || !serviceType) {
      console.log('Missing required data for ride request');
      
      if (!currentLocation) {
        toast({
          title: language === 'ar' ? 'خطأ في الموقع' : 'Location Error',
          description: language === 'ar' ? 'لم يتم تحديد موقعك بعد' : 'Location not determined yet',
          variant: 'destructive',
        });
      } else if (selectedPatients.length === 0) {
        toast({
          title: language === 'ar' ? 'يرجى اختيار الحيوانات الأليفة' : 'Please select pets',
          description: language === 'ar' ? 'يرجى اختيار حيوان أليف واحد على الأقل' : 'Please select at least one pet',
          variant: 'destructive',
        });
      } else if (!serviceType) {
        toast({
          title: language === 'ar' ? 'يرجى اختيار نوع الخدمة' : 'Please select service type',
          description: language === 'ar' ? 'يرجى اختيار نوع الخدمة المطلوبة' : 'Please select the required service type',
          variant: 'destructive',
        });
      }
      
      // إعادة تعيين السحب عند الفشل
      setIsSlideComplete(false);
      setSlidePosition(0);
      return;
    }
    
    // تنفيذ الطلب
    const formData = form.getValues();
    console.log('Form data before submit:', formData);
    onSubmit(formData);
  };

  // إعادة تعيين السحب بعد الإرسال
  useEffect(() => {
    if (!isRequestingRide && isSlideComplete) {
      setTimeout(() => {
        setIsSlideComplete(false);
        setSlidePosition(0);
      }, 1000);
    }
  }, [isRequestingRide, isSlideComplete]);

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

  // تحميل بيانات المستخدم
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLocation('/');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setLocation('/');
      }
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={direction}>
      <div className="max-w-md mx-auto bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-white text-gray-800 px-3 py-2 h-10 border-b shadow-sm">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-2">
              <div className="h-8 bg-white rounded-lg border-2 border-purple-600 px-2 py-1 shadow-sm hover:shadow-md transition-all duration-300">
                <img 
                  src={logoImage} 
                  alt="VETS VAN Logo" 
                  className="h-full w-auto object-contain"
                  style={{ 
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    maxWidth: '120px'
                  }}
                />
              </div>
              <div className="text-lg font-bold text-gray-800">
                {user?.name || (language === 'ar' ? 'مرحباً' : 'Welcome')}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <LanguageSelector />
              <Bell className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-800" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="bg-purple-600 text-white hover:bg-purple-600 px-3 py-1 h-8 rounded-md font-medium transition-colors"
              >
                {language === 'ar' ? 'خروج' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 pb-20">
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
              <div className="space-y-4">
                {/* Multi-Select Pets using Clean Design */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2" style={{ flexDirection: language === 'ar' ? 'row-reverse' : 'row', textAlign }}>
                    <img 
                      src={selectPetsLogo} 
                      alt="Select Pets Logo" 
                      className="w-6 h-6 select-pets-logo object-cover"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'اختر الحيوانات الأليفة:' : 'Select Pets:'}
                    </label>
                  </div>
                  
                  {/* Pet Selection Dropdown */}
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value) {
                        const petId = parseInt(value);
                        if (!selectedPatients.includes(petId)) {
                          setSelectedPatients(prev => [...prev, petId]);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        language === 'ar' ? 'أضف حيوان أليف...' : 'Add pet...'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.filter(patient => !selectedPatients.includes(patient.id)).map((patient: Patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()} className="select-item-custom">
                          <div className="flex items-center gap-2">
                            <span>
                              {patient.type === 'Cat' ? '🐱' : patient.type === 'Dog' ? '🐶' : '🐦'}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-medium">{patient.name}</span>
                              <span className="text-xs text-gray-500">
                                {patient.type === 'Cat' ? (language === 'ar' ? 'قطة' : 'Cat') :
                                 patient.type === 'Dog' ? (language === 'ar' ? 'كلب' : 'Dog') :
                                 (language === 'ar' ? 'طائر' : 'Bird')}
                                {patient.ageYear && (
                                  <span> • {patient.ageYear} {language === 'ar' ? 'سنة' : 'years'}</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Display Selected Pets */}
                  <div className="min-h-[48px] border border-gray-300 rounded-md p-2 bg-white flex flex-wrap gap-2 items-center">
                    {selectedPatients.length === 0 ? (
                      <span className="text-gray-500 text-sm" style={{ textAlign }}>
                        {language === 'ar' ? 'لم يتم اختيار حيوانات بعد...' : 'No pets selected yet...'}
                      </span>
                    ) : (
                      selectedPatients.map(petId => {
                        const pet = patients.find(p => p.id === petId);
                        if (!pet) return null;
                        return (
                          <div
                            key={petId}
                            className="flex items-center gap-2 bg-purple-600 border border-purple-600 rounded-full px-3 py-1 text-sm"
                          >
                            <span>
                              {pet.type === 'Cat' ? '🐱' : pet.type === 'Dog' ? '🐶' : '🐦'}
                            </span>
                            <span className="font-medium">{pet.name}</span>
                            <button
                              onClick={() => setSelectedPatients(prev => prev.filter(id => id !== petId))}
                              className="text-purple-600 hover:text-purple-600 ml-1"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Quick Select All Button */}
                  {patients.length > 1 && selectedPatients.length < patients.length && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPatients(patients.map(p => p.id))}
                      className="text-purple-600 border-purple-600 hover:bg-purple-100"
                    >
                      {language === 'ar' ? 'اختيار الكل' : 'Select All'}
                    </Button>
                  )}
                </div>
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
                <SelectItem value="general-checkup" className="select-item-custom">
                  <div className="flex items-center gap-2">
                    <span>🩺</span>
                    <span>{t('generalCheckUp')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="grooming" className="select-item-custom">
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

                {/* Slide to Confirm Button */}
                <div className="relative w-full">
                  <div
                    className="relative w-full h-16 bg-gradient-to-r from-purple-600 to-purple-600 rounded-full overflow-hidden shadow-lg cursor-pointer select-none"
                    onMouseDown={handleSlideStart}
                    onMouseMove={handleSlideMove}
                    onMouseUp={handleSlideEnd}
                    onMouseLeave={handleSlideEnd}
                    onTouchStart={handleSlideStart}
                    onTouchMove={handleSlideMove}
                    onTouchEnd={handleSlideEnd}
                    onTouchCancel={handleSlideEnd}
                    style={{ touchAction: 'none' }}
                  >
                    {/* Background Track */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {isRequestingRide ? 
                          (language === 'ar' ? 'جاري إرسال الطلب...' : 'Sending request...') :
                          !currentLocation ? 
                          (language === 'ar' ? 'في انتظار تحديد الموقع...' : 'Waiting for location...') :
                          isSlideComplete ?
                          (language === 'ar' ? 'تم التأكيد!' : 'Confirmed!') :
                          (language === 'ar' ? 'اسحب للتأكيد' : 'Slide to Confirm')
                        }
                      </span>
                    </div>

                    {/* Progress Fill */}
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-600 to-purple-600"
                      style={{ 
                        width: `${Math.min(100, (slidePosition / (window.innerWidth - 100)) * 100)}%`,
                        transition: isSliding ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />

                    {/* Sliding Van */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing active:scale-105"
                      style={{ 
                        left: `${slidePosition}px`,
                        opacity: (!currentLocation || selectedPatients.length === 0 || !serviceType) ? 0.5 : 1,
                        pointerEvents: (!currentLocation || selectedPatients.length === 0 || !serviceType) ? 'none' : 'auto',
                        transform: `translateY(-50%) ${isSliding ? 'scale(1.05)' : 'scale(1)'}`,
                        transition: isSliding ? 'transform 0.1s ease-out' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseDown={handleSlideStart}
                      onTouchStart={handleSlideStart}
                    >
                      {isRequestingRide ? (
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                      ) : isSlideComplete ? (
                        <Check className="w-8 h-8 text-green-600" />
                      ) : (
                        <img 
                          src={vetVanImage} 
                          alt="Vet Van" 
                          className="w-12 h-12 object-contain"
                        />
                      )}
                    </div>
                  </div>

                  {/* Subtitle */}
                  {!isRequestingRide && currentLocation && (
                    <div className="text-center mt-2 text-sm text-gray-600">
                      {language === 'ar' ? 'عيادة بيطرية متنقلة' : 'Mobile Veterinary Clinic'}
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>


        </div>
      </div>
    </div>
  );
}
