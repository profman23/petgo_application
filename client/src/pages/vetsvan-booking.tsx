import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, CheckCircle, User, MapPin, Loader2 } from 'lucide-react';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { VetsVanAvailabilityTable } from '@/components/vetsvan-availability-table';

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

  const [requestData, setRequestData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedVetsVan, setSelectedVetsVan] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<number | null>(null);

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
  const { data: vetsVans = [], isLoading } = useQuery({
    queryKey: ['/api/vetsvan/availability'],
    staleTime: 30 * 1000,
  });

  // فلترة VetsVan حسب التاريخ المحدد
  const availableVetsVans = vetsVans.filter((vetsvan: VetsVanWithShifts) => 
    vetsvan.shifts.some(shift => shift.date === selectedDate)
  );

  // جلب الأوقات المتاحة للـ VetsVan المحدد
  const getAvailableTimesForVetsVan = (vetsVanId: number) => {
    const vetsvan = vetsVans.find((v: VetsVanWithShifts) => v.id === vetsVanId);
    if (!vetsvan) return [];

    const dayShifts = vetsvan.shifts.filter(shift => shift.date === selectedDate);
    const availableTimes: Array<{time: string, shiftId: number}> = [];

    dayShifts.forEach(shift => {
      const startHour = parseInt(shift.startTime.split(':')[0]);
      const endHour = parseInt(shift.endTime.split(':')[0]);
      
      for (let hour = startHour; hour < endHour; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        
        // تحقق من عدم وجود حجز في هذا الوقت
        const isTimeBooked = shift.bookings?.some(booking => 
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
      // Get customer location from pendingRequest data
      const pendingRequestData = localStorage.getItem('pendingRequest');
      let customerLocation = null;
      
      if (pendingRequestData) {
        try {
          const requestData = JSON.parse(pendingRequestData);
          if (requestData.pickupLatitude && requestData.pickupLongitude) {
            customerLocation = {
              latitude: requestData.pickupLatitude,
              longitude: requestData.pickupLongitude,
              address: requestData.location || null
            };
          }
        } catch (e) {
          console.error('Error parsing pending request data:', e);
        }
      }
      
      const bookingData = {
        shiftId: selectedShift,
        vetsVanId: selectedVetsVan,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        customerLocation
      };

      console.log('Creating booking with data:', bookingData);
      const result = await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
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
      
      // التوجه لصفحة تتبع الحجز أو الصفحة الرئيسية
      setLocation('/home');
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
    const vetsvan = vetsVans.find((v: VetsVanWithShifts) => v.id === vetsvanId);
    if (vetsvan) {
      const shift = vetsvan.shifts.find((s: any) => s.date === date);
      if (shift) {
        setSelectedShift(shift.id);
      }
    }
  };

  // Handle slide-to-confirm
  const handleSlideComplete = () => {
    console.log('Slide completed, creating booking...');
    createBooking();
  };

  if (!requestData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={direction} style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="VetsVan Logo" 
              className="w-10 h-10 rounded-lg object-cover border-2 border-purple-200"
            />
            <h1 className="text-lg font-semibold text-gray-800" style={{ textAlign }}>
              {language === 'ar' ? 'حجز موعد' : 'Book Appointment'}
            </h1>
          </div>
          
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* معلومات الطلب */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2" style={{ textAlign }}>
              <User className="w-4 h-4 text-purple-600" />
              {language === 'ar' ? 'تفاصيل الطلب' : 'Request Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{requestData.location}</span>
            </div>
            <div>
              <span className="text-gray-500">
                {language === 'ar' ? 'نوع الخدمة: ' : 'Service Type: '}
              </span>
              <span className="font-medium">{requestData.serviceType}</span>
            </div>
            <div>
              <span className="text-gray-500">
                {language === 'ar' ? 'عدد الحيوانات: ' : 'Number of Pets: '}
              </span>
              <span className="font-medium">{requestData.selectedPatients?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* اختيار التاريخ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2" style={{ textAlign }}>
              <Calendar className="w-4 h-4 text-purple-600" />
              {language === 'ar' ? 'التاريخ' : 'Date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <span className="text-purple-800 font-medium">
                {new Date(selectedDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
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
          <Card className="border-2 border-purple-200">
            <CardContent className="p-4">
              <div className="mb-4 text-center">
                <h3 className="text-lg font-semibold text-purple-800 mb-2" style={{ textAlign }}>
                  {language === 'ar' ? 'مراجعة الحجز' : 'Review Booking'}
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{language === 'ar' ? `VetsVan: ${selectedVetsVan}` : `VetsVan: ${selectedVetsVan}`}</p>
                  <p>{language === 'ar' ? `الوقت: ${selectedTime}` : `Time: ${selectedTime}`}</p>
                  <p>{language === 'ar' ? `التاريخ: ${selectedDate}` : `Date: ${selectedDate}`}</p>
                </div>
              </div>

              {/* Slide to confirm button */}
              <div className="relative">
                <div className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300 ease-out rounded-lg"
                    style={{ width: `${(slidePosition / 100) * 70 + 30}%` }}
                  />
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-medium">
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
                    <p className="text-sm text-purple-600">
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
  );
}