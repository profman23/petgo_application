import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { Loader2, Clock, CheckCircle, ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
}

interface VetsVanWithShifts {
  id: number;
  vetsvanCode: string;
  vetsvanName: string;
  isAvailable: boolean;
  shifts: Shift[];
}

interface VetsVanAvailabilityTableProps {
  onSelectTimeSlot?: (vetsvanId: number, date: string, time: string) => void;
}

export function VetsVanAvailabilityTable({ onSelectTimeSlot }: VetsVanAvailabilityTableProps) {
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

  // وظيفة الحجز
  const bookingMutation = useMutation({
    mutationFn: async ({ shiftId, vetsVanId, appointmentDate, appointmentTime }: {
      shiftId: number;
      vetsVanId: number;
      appointmentDate: string;
      appointmentTime: string;
    }) => {
      return await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          shiftId,
          vetsVanId,
          appointmentDate,
          appointmentTime
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vetsvan/availability'] });
      toast({
        title: t('success'),
        description: language === 'ar' ? 'تم حجز الموعد بنجاح' : 'Appointment booked successfully',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      console.error('Booking error:', error);
      toast({
        title: t('error'),
        description: language === 'ar' ? 'فشل في حجز الموعد' : 'Failed to book appointment',
        variant: 'destructive',
      });
    },
  });

  // دوال التنقل بين التواريخ
  const goToPreviousDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

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

  const { data: vetsvanData, isLoading, error } = useQuery({
    queryKey: ['/api/vetsvan/availability'],
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

  // Generate time slots from 8 AM to 8 PM (every hour)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
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
    if (shift.isBooked) return 'booked';
    return 'available';
  };

  const handleTimeSlotClick = (vetsvan: VetsVanWithShifts, time: string) => {
    const status = getTimeSlotStatus(vetsvan, time);
    
    if (status === 'available') {
      const shift = vetsvan.shifts.find(shift => {
        return shift.date === selectedDate && 
               shift.startTime <= time && 
               shift.endTime > time &&
               shift.status === 'scheduled';
      });
      
      if (shift && !bookingMutation.isPending) {
        bookingMutation.mutate({
          shiftId: shift.id,
          vetsVanId: vetsvan.id,
          appointmentDate: selectedDate,
          appointmentTime: time
        });
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
                  const isLoading = bookingMutation.isPending;
                  
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