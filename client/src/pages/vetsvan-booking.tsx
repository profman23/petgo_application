import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';
import { FixedFooter } from '@/components/fixed-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, CheckCircle, User, MapPin, Loader2, Bell } from 'lucide-react';
import logoImage from "@assets/Screenshot 2025-07-21 115341_1753088187495.png";
import petsImage from "@assets/freepik__a-group-of-5-cheerful-cute-cartoonstyle-3d-pet-ani__58756_1753359168230.png";
import requestDetailsIcon from "@assets/freepik__a-3d-cartoonstyle-logo-with-a-green-circular-base-__69154_1753523660424.png";
import { VetsVanAvailabilityTable } from '@/components/vetsvan-availability-table';
import { useCustomerLocation } from '@/hooks/useCustomerLocation';

interface Booking {
  id: number;
  userId: number;
  shiftId: number;
  vetsVanId: number;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}

interface Shift {
  id: number;
  vetsVanId: number;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  isBooked?: boolean;
  bookingsCount?: number;
  bookings?: Booking[];
}

interface VetsVanWithShifts {
  id: number;
  vetsvanCode: string;
  vetsvanName: string;
  isAvailable: boolean;
  shifts: Shift[];
}

export default function VetsVanBooking() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const textAlign = getTextAlign(language);
  const direction = getDirection(language);
  
  // استخدام hook الموقع الحالي
  const { latitude, longitude, accuracy } = useCustomerLocation();

  const [requestData, setRequestData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedVetsVan, setSelectedVetsVan] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<number | null>(null);

  // دالة لتحويل النص إلى Title Case (أول حرف من كل كلمة كبير)
  const toTitleCase = (str: string) => {
    if (!str) return str;
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  // جلب بيانات الحيوانات الأليفة للعميل
  const { data: allPatients = [], isLoading: patientsLoading, error: patientsError } = useQuery({
    queryKey: ['/api/patients'],
    enabled: !!requestData
  });

  // تسجيل بيانات الحيوانات لتشخيص المشكلة
  useEffect(() => {
    console.log('🔍 VetsVan Booking Debug Info:');
    console.log('📦 Request data:', requestData);
    console.log('🐾 All patients from API:', allPatients);
    console.log('📋 Patients loading:', patientsLoading);
    console.log('❌ Patients error:', patientsError);
    console.log('📊 Selected patient IDs from localStorage:', requestData?.selectedPatients);
  }, [requestData, allPatients, patientsLoading, patientsError]);

  // تحميل بيانات الطلب من localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('pendingRequest');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setRequestData(parsed);
      console.log('Loaded request data:', parsed);
    } else {
      // إذا لم توجد بيانات، ارجع للصفحة السابقة
      setLocation('/ride-request');
    }
  }, [setLocation]);

  // تحديد التاريخ الحالي وتحديث التاريخ المحدد إذا كان في الماضي
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  // التحقق من صحة التاريخ المحدد (منع التواريخ السابقة)
  const isDateValid = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date >= today;
  };

  // التحقق من التاريخ المحدد وتصحيحه إذا لزم الأمر
  useEffect(() => {
    if (selectedDate && !isDateValid(selectedDate)) {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      toast({
        title: t('error'),
        description: language === 'ar' 
          ? 'لا يمكن حجز موعد في تاريخ سابق. تم تحديد اليوم الحالي تلقائياً.'
          : 'Cannot book appointment for past dates. Current date has been set automatically.',
        variant: 'destructive',
      });
    }
  }, [selectedDate, t, language, toast]);

  // استعلام جلب VetsVan المتاحة
  const { data: vetsVans = [], isLoading, error: vetsVanError } = useQuery({
    queryKey: ['/api/vetsvan/availability'],
    staleTime: 30 * 1000,
    retry: (failureCount, error: any) => {
      console.log('🔄 Query retry attempt:', failureCount, 'Error:', error);
      // إذا كان الخطأ 401 (غير مخول)، لا تعيد المحاولة
      if (error?.message?.includes('Unauthorized') || error?.status === 401) {
        console.log('🚫 Authentication error - redirecting to login');
        // إعادة توجيه للتسجيل
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => setLocation('/'), 100);
        return false;
      }
      // للأخطاء الأخرى، حاول 3 مرات
      return failureCount < 3;
    },
    onError: (error: any) => {
      console.error('❌ VetsVan availability error:', error);
      console.error('📍 Error type:', typeof error);
      console.error('📍 Error message:', error?.message);
      console.error('📍 Error status:', error?.status);
      
      if (error?.message?.includes('Unauthorized') || error?.status === 401) {
        toast({
          title: language === 'ar' ? 'انتهت جلسة العمل' : 'Session Expired',
          description: language === 'ar' ? 
            'يرجى تسجيل الدخول مرة أخرى' : 
            'Please login again',
          variant: 'destructive',
        });
      } else {
        toast({
          title: language === 'ar' ? 'خطأ في التحميل' : 'Loading Error',
          description: language === 'ar' ? 
            'فشل في تحميل المواعيد المتاحة. يرجى المحاولة لاحقاً' : 
            'Failed to load available appointments. Please try again later',
          variant: 'destructive',
        });
      }
    }
  });

  // جلب حجوزات العميل الحالية
  const { data: userBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/user/bookings'],
    retry: false,
    refetchInterval: 2000, // تحديث كل ثانيتين لرؤية تحديثات الحالة
  });

  // دالة لعرض نص الحالة
  const getStatusText = (status: string) => {
    if (language === 'ar') {
      switch (status) {
        case 'pending_review':
          return 'قيد المراجعة';
        case 'confirmed':
          return 'مؤكد';
        case 'in_progress':
          return 'جاري التنفيذ';
        case 'completed':
          return 'مكتمل';
        case 'cancelled':
          return 'ملغي';
        default:
          return status;
      }
    } else {
      switch (status) {
        case 'pending_review':
          return 'Pending Review';
        case 'confirmed':
          return 'Confirmed';
        case 'in_progress':
          return 'In Progress';
        case 'completed':
          return 'Completed';
        case 'cancelled':
          return 'Cancelled';
        default:
          return status;
      }
    }
  };

  // دالة لاختيار لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-purple-600 text-purple-600 border-purple-600';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // فلترة VetsVan حسب التاريخ المحدد
  const availableVetsVans = (vetsVans as VetsVanWithShifts[]).filter((vetsvan: VetsVanWithShifts) => 
    vetsvan.shifts.some((shift: Shift) => shift.date === selectedDate)
  );

  // جلب الأوقات المتاحة للـ VetsVan المحدد
  const getAvailableTimesForVetsVan = (vetsVanId: number) => {
    const vetsvan = (vetsVans as VetsVanWithShifts[]).find((v: VetsVanWithShifts) => v.id === vetsVanId);
    if (!vetsvan) return [];

    const dayShifts = vetsvan.shifts.filter((shift: Shift) => shift.date === selectedDate);
    const availableTimes: Array<{time: string, shiftId: number}> = [];

    dayShifts.forEach((shift: Shift) => {
      const startHour = parseInt(shift.startTime.split(':')[0]);
      const endHour = parseInt(shift.endTime.split(':')[0]);
      
      for (let hour = startHour; hour < endHour; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        
        // تحقق من عدم وجود حجز في هذا الوقت
        const isTimeBooked = shift.bookings?.some((booking: Booking) => 
          booking.appointmentTime === timeSlot && 
          booking.appointmentDate === selectedDate &&
          booking.status === 'booked'
        );

        if (!isTimeBooked) {
          availableTimes.push({ time: timeSlot, shiftId: shift.id });
        }
      }
    });

    return availableTimes;
  };

  // mutation لإنشاء الحجز
  // State for slide-to-confirm
  const [isSlideComplete, setIsSlideComplete] = useState(false);
  const [slidePosition, setSlidePosition] = useState(0);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  const createBooking = async () => {
    console.log('🔥 createBooking function called - starting booking process');
    console.log('🔍 Selected values:', { selectedVetsVan, selectedShift, selectedTime, selectedDate });
    
    if (!selectedVetsVan || !selectedShift || !selectedTime || !selectedDate) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار VetsVan والوقت' : 'Please select VetsVan and time',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingBooking(true);

    try {
      console.log('🎯 Starting location detection...');
      console.log('📍 GPS Values from hook:', { latitude, longitude, accuracy });
      console.log('📱 localStorage content:', localStorage.getItem('pendingRequest'));
      
      // Get customer location from currentLocation hook first, then fallback to pendingRequest
      let customerLocation = null;
      
      // أولاً نحاول الحصول على الموقع من localStorage 
      const pendingRequestData = localStorage.getItem('pendingRequest');
      console.log('📋 Checking localStorage first...');
      
      if (pendingRequestData) {
        try {
          const requestData = JSON.parse(pendingRequestData);
          console.log('📋 Full request data:', requestData);
          
          // البحث عن البيانات في المستوى الأول
          if (requestData.pickupLatitude && requestData.pickupLongitude) {
            customerLocation = {
              latitude: Number(requestData.pickupLatitude),
              longitude: Number(requestData.pickupLongitude),
              address: requestData.location || null
            };
            console.log('✅ Using localStorage location:', customerLocation);
          }
        } catch (e) {
          console.error('Error parsing pending request data:', e);
        }
      }

      // إذا لم نجد في localStorage، نحاول GPS
      if (!customerLocation && latitude && longitude) {
        customerLocation = {
          latitude: Number(latitude),
          longitude: Number(longitude),
          address: null
        };
        console.log('✅ Using GPS location from hook:', customerLocation);
      }

      // إذا لم نجد، نحاول GPS مباشرة مع تحديد العنوان
      if (!customerLocation) {
        try {
          console.log('🔍 Attempting to get current position directly...');
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error('Geolocation not supported'));
              return;
            }
            
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 30000
            });
          });
          
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // الحصول على العنوان باستخدام reverse geocoding
          let address = null;
          try {
            console.log('🔍 Getting address for coordinates:', lat, lng);
            const geocodingUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${language === 'ar' ? 'ar' : 'en'}`;
            const response = await fetch(geocodingUrl);
            const data = await response.json();
            
            if (data && data.display_name) {
              address = data.display_name;
              console.log('✅ Got address from geocoding:', address);
            }
          } catch (geocodingError) {
            console.log('⚠️ Reverse geocoding failed:', geocodingError);
          }
          
          customerLocation = {
            latitude: lat,
            longitude: lng,
            address: address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          };
          console.log('✅ Got fresh GPS location with address:', customerLocation);
        } catch (gpsError) {
          console.log('⚠️ Direct GPS failed:', gpsError);
        }
      }
      
      // إذا لم نجد موقع، استخدم الرياض كـ fallback
      if (!customerLocation) {
        customerLocation = {
          latitude: 24.7136,
          longitude: 46.6753,
          address: language === 'ar' ? 'الرياض - موقع افتراضي' : 'Riyadh - Default Location'
        };
        console.log('⚠️ Using default Riyadh location as fallback:', customerLocation);
      }
      
      // تحويل معرفات الحيوانات إلى تفاصيل كاملة
      const selectedPatientIds = requestData?.selectedPatients || [];
      const selectedPetsData = (allPatients as any[]).filter((pet: any) => 
        selectedPatientIds.includes(pet.id)
      );

      const bookingData = {
        shiftId: selectedShift,
        vetsVanId: selectedVetsVan,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        customerLocation,
        selectedPets: selectedPetsData,
        serviceType: requestData?.selectedService || 'General Check Up'
      };

      console.log('🔍 Final booking data before sending:', JSON.stringify(bookingData, null, 2));
      console.log('🐾 Selected patients IDs:', selectedPatientIds);
      console.log('🐾 Selected pets details:', selectedPetsData);
      console.log('🏥 Selected service data:', requestData?.selectedService);
      console.log('📦 Full request data object:', requestData);
      console.log('🌍 Customer location specifically:', {
        exists: !!customerLocation,
        latitude: customerLocation?.latitude,
        longitude: customerLocation?.longitude,
        fromSource: latitude && longitude ? 'GPS Hook' : 'Fallback'
      });
      
      const result = await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });

      console.log('Booking successful:', result);
      
      toast({
        title: language === 'ar' ? '✅ تم تأكيد الحجز' : '✅ Booking Confirmed',
        description: language === 'ar' ? 
          `تم حجز موعدك بنجاح في ${selectedTime} يوم ${selectedDate}` :
          `Your appointment has been booked successfully at ${selectedTime} on ${selectedDate}`,
      });
      
      // مسح البيانات المؤقتة
      localStorage.removeItem('pendingRequest');
      
      // تحديث الاستعلامات
      queryClient.invalidateQueries({ queryKey: ['/api/vetsvan/availability'] });

      // التوجيه لصفحة الحجوزات بدلاً من الدفع
      setTimeout(() => {
        setLocation('/customer-activity');
      }, 2000);
    } catch (error: any) {
      console.error('Booking failed:', error);
      toast({
        title: language === 'ar' ? '❌ فشل في الحجز' : '❌ Booking Failed',
        description: language === 'ar' ? 
          'حدث خطأ أثناء حجز الموعد. يرجى المحاولة مرة أخرى.' :
          'An error occurred while booking the appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBooking(false);
      setIsSlideComplete(false);
      setSlidePosition(0);
    }
  };

  const handleBack = () => {
    setLocation('/ride-request');
  };

  const handleVetsVanSelect = (vetsVanId: number) => {
    setSelectedVetsVan(vetsVanId);
    setSelectedTime('');
    setSelectedShift(null);
  };

  const handleTimeSelect = (time: string, shiftId: number) => {
    setSelectedTime(time);
    setSelectedShift(shiftId);
  };

  // دالة للتعامل مع اختيار الوقت من جدول التوافر
  const handleTimeSlotSelection = (vetsvanId: number, date: string, time: string) => {
    setSelectedVetsVan(vetsvanId);
    setSelectedDate(date);
    setSelectedTime(time);
    
    // البحث عن shiftId المناسب
    const vetsvan = (vetsVans as VetsVanWithShifts[]).find((v: VetsVanWithShifts) => v.id === vetsvanId);
    if (vetsvan) {
      const shift = vetsvan.shifts.find((s: any) => s.date === date);
      if (shift) {
        setSelectedShift(shift.id);
      }
    }
  };

  const [user, setUser] = useState<any>(null);

  // Load user data
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/');
  };

  // Handle slide-to-confirm
  const handleSlideComplete = () => {
    console.log('🚀 SLIDE COMPLETED - handleSlideComplete called');
    console.log('⚡ About to call createBooking...');
    createBooking();
  };

  if (!requestData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // عرض خطأ في حالة فشل تحميل VetsVan
  if (vetsVanError && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2" dir={direction}>
            {language === 'ar' ? 'خطأ في التحميل' : 'Loading Error'}
          </h3>
          <p className="text-gray-600 mb-4" dir={direction}>
            {language === 'ar' ? 
              'لا يمكن تحميل المواعيد المتاحة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.' :
              'Unable to load available appointments. Please check your internet connection and try again.'
            }
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full"
          >
            {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={direction} style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      <div className="max-w-md mx-auto bg-white shadow-sm overflow-hidden">
        {/* Header - Same as HOME */}
        <div className="bg-white text-gray-800 px-2 py-3 h-12 shadow-sm">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center">
              <img 
                src={logoImage} 
                alt="VETS VAN Logo" 
                className="h-8 w-auto object-contain logo-clean"
                style={{ 
                  maxWidth: '60px',
                  border: 'none !important',
                  outline: 'none !important',
                  boxShadow: 'none !important',
                  filter: 'none !important',
                  background: 'transparent !important'
                }}
              />
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="text-sm font-semibold text-gray-800" style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}>
                {language === 'ar' ? 'حجز موعد' : 'Book Appointment'}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <LanguageSelector />
              <Bell className="w-4 h-4 cursor-pointer text-gray-600 hover:text-gray-800" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="bg-purple-600 text-white hover:bg-purple-600 px-2 py-1 h-7 rounded text-xs"
              >
                {language === 'ar' ? 'خروج' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>

        {/* Purple Divider Line */}
        <div className="h-1 bg-purple-600 shadow-sm"></div>

        <div className="p-4 space-y-4 pb-24">
        {/* معلومات الطلب */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2" style={{ 
              textAlign,
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              <img 
                src={requestDetailsIcon} 
                alt="Request Details" 
                className="w-6 h-6"
              />
              {language === 'ar' ? 'تفاصيل الطلب' : 'Request Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm" style={{ fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive' }}>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{requestData.location}</span>
            </div>
            <div>
              <span className="text-gray-500">
                {language === 'ar' ? 'نوع الخدمة: ' : 'Service Type: '}
              </span>
              <span className="font-medium">{toTitleCase(requestData.serviceType)}</span>
            </div>
            <div>
              <span className="text-gray-500">
                {language === 'ar' ? 'عدد الحيوانات: ' : 'Number of Pets: '}
              </span>
              <span className="font-medium">{requestData.selectedPatients?.length || 0}</span>
            </div>
          </CardContent>
        </Card>





        {/* جدول التوافر مع الحجز الفوري */}
        <VetsVanAvailabilityTable 
          enableDirectBooking={true}
          onSelectTimeSlot={handleTimeSlotSelection} 
        />

        {/* Slide to Confirm */}
        {selectedVetsVan && selectedTime && (
          <Card className="border-2 border-purple-600">
            <CardContent className="p-4">
              <div className="mb-4 text-center">
                <h3 className="text-lg font-semibold text-purple-600 mb-2" style={{ 
                  textAlign,
                  fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                }}>
                  {language === 'ar' ? 'مراجعة الحجز' : 'Review Booking'}
                </h3>
                <div className="space-y-1 text-sm text-gray-600" style={{ 
                  fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                }}>
                  <p>{language === 'ar' ? `VetsVan: ${selectedVetsVan}` : `VetsVan: ${selectedVetsVan}`}</p>
                  <p>{language === 'ar' ? `الوقت: ${selectedTime}` : `Time: ${selectedTime}`}</p>
                  <p>{language === 'ar' ? `التاريخ: ${selectedDate}` : `Date: ${selectedDate}`}</p>
                </div>
              </div>

              {/* Slide to confirm button */}
              <div className="relative">
                <div className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-600 rounded-lg relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300 ease-out rounded-lg"
                    style={{ width: `${(slidePosition / 100) * 70 + 30}%` }}
                  />
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-medium" style={{
                      fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                    }}>
                      {isSlideComplete ? (
                        language === 'ar' ? '✓ تم التأكيد' : '✓ Confirmed'
                      ) : (
                        language === 'ar' ? 'اسحب لتأكيد الحجز' : 'Slide to Confirm Booking'
                      )}
                    </span>
                  </div>
                  
                  <div 
                    className="absolute top-1 bottom-1 left-1 w-12 bg-white rounded-md shadow-lg cursor-pointer flex items-center justify-center transition-transform duration-300"
                    style={{ 
                      transform: `translateX(${slidePosition * 2.5}px)`,
                      opacity: isCreatingBooking ? 0.5 : 1 
                    }}
                    onMouseDown={(e) => {
                      if (isCreatingBooking) return;
                      const startX = e.clientX;
                      const maxSlide = 100;
                      
                      const handleMouseMove = (e: MouseEvent) => {
                        const currentX = e.clientX;
                        const diff = currentX - startX;
                        const newPosition = Math.max(0, Math.min(maxSlide, (diff / 250) * 100));
                        setSlidePosition(newPosition);
                        
                        if (newPosition >= 30 && !isSlideComplete) {
                          setIsSlideComplete(true);
                          handleSlideComplete();
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        }
                      };
                      
                      const handleMouseUp = () => {
                        if (!isSlideComplete) {
                          setSlidePosition(0);
                        }
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                    onTouchStart={(e) => {
                      if (isCreatingBooking) return;
                      const startX = e.touches[0].clientX;
                      const maxSlide = 100;
                      
                      const handleTouchMove = (e: TouchEvent) => {
                        const currentX = e.touches[0].clientX;
                        const diff = currentX - startX;
                        const newPosition = Math.max(0, Math.min(maxSlide, (diff / 250) * 100));
                        setSlidePosition(newPosition);
                        
                        if (newPosition >= 30 && !isSlideComplete) {
                          setIsSlideComplete(true);
                          handleSlideComplete();
                          document.removeEventListener('touchmove', handleTouchMove);
                          document.removeEventListener('touchend', handleTouchEnd);
                        }
                      };
                      
                      const handleTouchEnd = () => {
                        if (!isSlideComplete) {
                          setSlidePosition(0);
                        }
                        document.removeEventListener('touchmove', handleTouchMove);
                        document.removeEventListener('touchend', handleTouchEnd);
                      };
                      
                      document.addEventListener('touchmove', handleTouchMove);
                      document.addEventListener('touchend', handleTouchEnd);
                    }}
                  >
                    {isCreatingBooking ? (
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    ) : (
                      <span className="text-purple-600 text-xl">→</span>
                    )}
                  </div>
                </div>
                
                {isCreatingBooking && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-purple-600" style={{
                      fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                    }}>
                      {language === 'ar' ? 'جاري إنشاء الحجز...' : 'Creating booking...'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {/* Footer Navigation */}
      <FixedFooter />
    </div>
  );
}