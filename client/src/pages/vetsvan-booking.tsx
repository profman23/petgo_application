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

  // تحديد التاريخ الحالي
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

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
  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVetsVan || !selectedShift || !selectedTime || !selectedDate) {
        throw new Error('Missing booking data');
      }

      const bookingData = {
        shiftId: selectedShift,
        vetsVanId: selectedVetsVan,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
      };

      console.log('Creating booking with data:', bookingData);
      return await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
    },
    onSuccess: (result) => {
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
    },
    onError: (error: Error) => {
      console.error('Booking failed:', error);
      toast({
        title: language === 'ar' ? '❌ فشل في الحجز' : '❌ Booking Failed',
        description: language === 'ar' ? 
          'حدث خطأ أثناء حجز الموعد. يرجى المحاولة مرة أخرى.' :
          'An error occurred while booking the appointment. Please try again.',
        variant: 'destructive',
      });
    },
  });

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

  const handleConfirmBooking = () => {
    bookingMutation.mutate();
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

        {/* اختيار VetsVan */}
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
              <p className="text-gray-500 mt-2">
                {language === 'ar' ? 'جاري تحميل العيادات المتاحة...' : 'Loading available clinics...'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base" style={{ textAlign }}>
                {language === 'ar' ? 'اختر العيادة المتنقلة' : 'Select Mobile Clinic'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableVetsVans.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  {language === 'ar' ? 'لا توجد عيادات متاحة في هذا التاريخ' : 'No clinics available on this date'}
                </p>
              ) : (
                availableVetsVans.map((vetsvan: VetsVanWithShifts) => (
                  <div
                    key={vetsvan.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedVetsVan === vetsvan.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => handleVetsVanSelect(vetsvan.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{vetsvan.vetsvanName}</h3>
                        <p className="text-sm text-gray-500">{vetsvan.vetsvanCode}</p>
                      </div>
                      {selectedVetsVan === vetsvan.id && (
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* اختيار الوقت */}
        {selectedVetsVan && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2" style={{ textAlign }}>
                <Clock className="w-4 h-4 text-purple-600" />
                {language === 'ar' ? 'اختر الوقت' : 'Select Time'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {getAvailableTimesForVetsVan(selectedVetsVan).map(({ time, shiftId }) => (
                  <button
                    key={`${time}-${shiftId}`}
                    className={`p-2 text-sm border rounded-lg transition-all ${
                      selectedTime === time
                        ? 'border-purple-500 bg-purple-500 text-white'
                        : 'border-gray-200 hover:border-purple-300 text-gray-700'
                    }`}
                    onClick={() => handleTimeSelect(time, shiftId)}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {getAvailableTimesForVetsVan(selectedVetsVan).length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  {language === 'ar' ? 'لا توجد أوقات متاحة' : 'No available times'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* زر التأكيد */}
        {selectedVetsVan && selectedTime && (
          <Button
            onClick={handleConfirmBooking}
            disabled={bookingMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
          >
            {bookingMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {language === 'ar' ? 'جاري الحجز...' : 'Booking...'}
              </>
            ) : (
              language === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}