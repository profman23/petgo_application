import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { Loader2, Clock, CheckCircle, ChevronLeft, ChevronRight, Calendar, X, Navigation } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  distanceFromCustomer?: string;
  isClosest?: boolean;
}

interface VetsVanAvailabilityTableProps {
  onSelectTimeSlot?: (vetsvanId: number, date: string, time: string) => void;
  enableDirectBooking?: boolean;
}

export function VetsVanAvailabilityTable({ onSelectTimeSlot, enableDirectBooking = false }: VetsVanAvailabilityTableProps) {
  const { t, language } = useTranslation();
  const isRTL = getDirection(language) === 'rtl';
  const textAlign = getTextAlign(language);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // حالة التاريخ المختار
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // إنشاء mutation للحجز الفوري
  const directBookingMutation = useMutation({
    mutationFn: async (bookingData: { shiftId: number; vetsVanId: number; appointmentDate: string; appointmentTime: string }) => {
      return await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
    },
    onSuccess: (result, variables) => {
      toast({
        title: language === 'ar' ? '✅ تم تأكيد الحجز' : '✅ Booking Confirmed',
        description: language === 'ar' ? 
          `تم حجز موعدك بنجاح في ${variables.appointmentTime} يوم ${variables.appointmentDate}. تم إرسال إشعار للطبيب.` :
          `Your appointment has been booked successfully at ${variables.appointmentTime} on ${variables.appointmentDate}. Doctor has been notified.`,
      });
      // تحديث البيانات
      queryClient.invalidateQueries({ queryKey: ['/api/vetsvan/availability'] });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? '❌ فشل في الحجز' : '❌ Booking Failed',
        description: language === 'ar' ? 
          'حدث خطأ أثناء حجز الموعد. يرجى المحاولة مرة أخرى.' :
          'An error occurred while booking the appointment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // التحقق من صحة التاريخ (منع التواريخ السابقة)
  const isDateValid = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date >= today;
  };

  // دوال التنقل بين التواريخ
  const goToPreviousDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    const newDate = currentDate.toISOString().split('T')[0];
    
    // التحقق من أن التاريخ الجديد ليس في الماضي
    if (!isDateValid(newDate)) {
      toast({
        title: language === 'ar' ? 'تاريخ غير صالح' : 'Invalid Date',
        description: language === 'ar' ? 
          'لا يمكن حجز موعد في تاريخ سابق' :
          'Cannot book appointment for past dates',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  // التحقق من التاريخ المحدد عند التغيير وتصحيحه إذا لزم الأمر
  useEffect(() => {
    if (selectedDate && !isDateValid(selectedDate)) {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      toast({
        title: language === 'ar' ? 'تم تصحيح التاريخ' : 'Date Corrected',
        description: language === 'ar' ? 
          'لا يمكن حجز موعد في تاريخ سابق. تم تحديد اليوم الحالي تلقائياً.' :
          'Cannot book appointment for past dates. Current date has been set automatically.',
        variant: 'destructive',
      });
    }
  }, [selectedDate, language, toast]);

  // دالة لتنسيق التاريخ بالعربية والإنجليزية
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // تحقق من كونه اليوم أو الغد
    if (date.toDateString() === today.toDateString()) {
      return language === 'ar' ? 'اليوم' : 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return language === 'ar' ? 'غدا' : 'Tomorrow';
    }

    // تنسيق التاريخ العادي
    if (language === 'ar') {
      return date.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // For demo/testing purposes, always use Riyadh location to show realistic distances
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>({
    lat: 24.7136,
    lon: 46.6753 // Default Riyadh location for testing realistic distances
  });

  const { data: vetsvanData, isLoading, error } = useQuery({
    queryKey: ['/api/vetsvan/availability', userLocation],
    queryFn: () => {
      const params = new URLSearchParams();
      if (userLocation) {
        params.append('lat', userLocation.lat.toString());
        params.append('lon', userLocation.lon.toString());
      }
      const url = `/api/vetsvan/availability${params.toString() ? '?' + params.toString() : ''}`;
      return fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json());
    },
    enabled: !!userLocation,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>{language === 'ar' ? 'جاري تحميل المواعيد...' : 'Loading appointments...'}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-center">{t('error')}</p>
      </div>
    );
  }

  if (!vetsvanData || !Array.isArray(vetsvanData) || vetsvanData.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 text-center">
          {language === 'ar' ? 'لا توجد VetsVan متاحة حالياً' : 'No VetsVan available currently'}
        </p>
      </div>
    );
  }

  // Generate time slots from 9 AM to 8 PM (every hour)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Check if a time slot is available for a specific VetsVan on selected date
  const isTimeSlotAvailable = (vetsvan: VetsVanWithShifts, time: string) => {
    if (!vetsvan.isAvailable) return false;
    
    // Check if there's a shift that covers this time slot on selected date
    const shift = vetsvan.shifts.find(shift => {
      return shift.date === selectedDate && 
             shift.startTime <= time && 
             shift.endTime > time &&
             shift.status === 'scheduled';
    });
    
    return shift && !shift.isBooked;
  };

  const getTimeSlotStatus = (vetsvan: VetsVanWithShifts, time: string) => {
    if (!vetsvan.isAvailable) return 'unavailable';
    
    const shift = vetsvan.shifts.find(shift => {
      return shift.date === selectedDate && 
             shift.startTime <= time && 
             shift.endTime > time &&
             shift.status === 'scheduled';
    });
    
    if (!shift) return 'unavailable';
    
    // Check if this specific time slot is booked
    const isTimeSlotBooked = shift.bookings?.some(booking => 
      booking.appointmentTime === time && 
      booking.appointmentDate === selectedDate &&
      booking.status === 'booked'
    );
    
    if (isTimeSlotBooked) return 'booked';
    return 'available';
  };

  const handleTimeSlotClick = (vetsvan: VetsVanWithShifts, time: string) => {
    // التحقق من أن التاريخ المحدد ليس في الماضي
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate < today) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' 
          ? 'لا يمكن حجز موعد في تاريخ سابق'
          : 'Cannot book appointment for past dates',
        variant: 'destructive',
      });
      return;
    }

    const status = getTimeSlotStatus(vetsvan, time);
    
    if (status === 'available') {
      const shift = vetsvan.shifts.find(shift => {
        return shift.date === selectedDate && 
               shift.startTime <= time && 
               shift.endTime > time &&
               shift.status === 'scheduled';
      });
      
      if (shift) {
        if (enableDirectBooking) {
          // الحجز الفوري
          const bookingData = {
            shiftId: shift.id,
            vetsVanId: vetsvan.id,
            appointmentDate: selectedDate,
            appointmentTime: time,
          };
          
          directBookingMutation.mutate(bookingData);
        } else if (onSelectTimeSlot) {
          // التوجيه لصفحة التأكيد
          onSelectTimeSlot(vetsvan.id, selectedDate, time);
        }
      }
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-lg p-4 mb-6"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header with Date Navigation */}
      <div className="mb-4">
        <h3 className={`text-lg font-semibold text-gray-800 ${textAlign === 'right' ? 'text-right' : 'text-left'}`}>
          {language === 'ar' ? 'المواعيد المتاحة - VetsVan' : 'Available Appointments - VetsVan'}
        </h3>
        
        {/* Date Navigation */}
        <div className="flex items-center justify-between mt-4 mb-2">
          <button
            onClick={goToPreviousDay}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {language === 'ar' ? 'السابق' : 'Previous'}
            </span>
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-800">
              {formatDate(selectedDate)}
            </span>
          </div>
          
          <button
            onClick={goToNextDay}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium">
              {language === 'ar' ? 'التالي' : 'Next'}
            </span>
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
        
        <p className={`text-sm text-gray-600 mt-2 ${textAlign === 'right' ? 'text-right' : 'text-left'}`}>
          {language === 'ar' ? 'اختر الوقت المناسب لك' : 'Select a suitable time for you'}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          {/* VetsVan Header Row */}
          <thead>
            <tr className="bg-purple-100">
              <th className="border border-gray-300 p-2 text-sm font-medium text-gray-700">
                {language === 'ar' ? 'الوقت' : 'Time'}
              </th>
              {(vetsvanData as VetsVanWithShifts[]).map((vetsvan) => (
                <th 
                  key={vetsvan.id} 
                  className="border border-gray-300 p-2 text-sm font-medium text-gray-700 min-w-[120px]"
                >
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">{vetsvan.vetsvanName}</span>
                    <span className="text-xs text-gray-500">({vetsvan.vetsvanCode})</span>
                    
                    {/* Distance and closest indicator */}
                    {vetsvan.distanceFromCustomer && (
                      <div className="mt-1 text-center">
                        <span className="text-xs text-blue-600 font-medium">
                          {vetsvan.distanceFromCustomer} {language === 'ar' ? 'كم' : 'km'}
                        </span>
                        {vetsvan.isClosest && (
                          <div className="flex items-center justify-center mt-1">
                            <Navigation className="h-3 w-3 text-green-600 mr-1" />
                            <span className="text-xs text-green-600 font-bold">
                              {language === 'ar' ? 'الأقرب إليك' : 'Closest to you'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {vetsvan.isAvailable ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                    ) : (
                      <Clock className="h-4 w-4 text-red-500 mt-1" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Time Slots Body */}
          <tbody>
            {timeSlots.map((timeSlot) => (
              <tr key={timeSlot} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2 text-sm font-medium text-gray-700 bg-gray-50">
                  {timeSlot}
                </td>
                {(vetsvanData as VetsVanWithShifts[]).map((vetsvan) => {
                  const status = getTimeSlotStatus(vetsvan, timeSlot);
                  const isLoading = false;
                  
                  return (
                    <td key={`${vetsvan.id}-${timeSlot}`} className="border border-gray-300 p-2">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleTimeSlotClick(vetsvan, timeSlot)}
                          disabled={status !== 'available' || isLoading}
                          className={`
                            w-full text-xs px-2 py-1 rounded transition-colors
                            ${status === 'available'
                              ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                              : status === 'booked'
                              ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }
                            ${isLoading ? 'opacity-50' : ''}
                          `}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                          ) : (
                            status === 'available' ? '✓' : 
                            status === 'booked' ? (language === 'ar' ? 'محجوز' : 'Booked') : '✗'
                          )}
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}