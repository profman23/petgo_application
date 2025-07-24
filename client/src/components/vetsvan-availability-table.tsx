import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { Loader2, Clock, CheckCircle, ChevronLeft, ChevronRight, Calendar, X, Navigation } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCustomerLocation } from "@/hooks/useCustomerLocation";
import tableHeaderImage from "@assets/Screenshot 2025-07-23 185916_1753286443154.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  
  // Get customer location
  const { latitude, longitude } = useCustomerLocation();
  
  // حالة التاريخ المختار
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // حالة dialog التأكيد
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    vetsvan: VetsVanWithShifts | null;
    timeSlot: string;
  }>({
    isOpen: false,
    vetsvan: null,
    timeSlot: ''
  });

  // إنشاء mutation للحجز الفوري
  const directBookingMutation = useMutation({
    mutationFn: async (bookingData: { shiftId: number; vetsVanId: number; appointmentDate: string; appointmentTime: string }) => {
      // Get customer location and pet/service data for the booking
      let customerLocation = null;
      let selectedPets: any[] = [];
      let serviceType = 'General Check Up';
      
      // First try to get data from localStorage (from ride request)
      const pendingRequestData = localStorage.getItem('pendingRequest');
      if (pendingRequestData) {
        try {
          const requestData = JSON.parse(pendingRequestData);
          
          // Get location data
          if (requestData.pickupLatitude && requestData.pickupLongitude) {
            customerLocation = {
              latitude: Number(requestData.pickupLatitude),
              longitude: Number(requestData.pickupLongitude),
              address: requestData.location || null
            };
            console.log('📍 VetsVanAvailabilityTable: Using localStorage location:', customerLocation);
          }
          
          // Get selected pets and service type
          if (requestData.selectedPatients && Array.isArray(requestData.selectedPatients)) {
            console.log('🐾 VetsVanAvailabilityTable: Found selectedPatients in localStorage:', requestData.selectedPatients);
            
            // Fetch all patients to get full details for selected IDs
            try {
              const patientsResponse = await apiRequest('/api/patients');
              const allPatients = patientsResponse || [];
              selectedPets = allPatients.filter((pet: any) => 
                requestData.selectedPatients.includes(pet.id)
              );
              console.log('🐾 VetsVanAvailabilityTable: Converted pets data:', selectedPets);
            } catch (error) {
              console.error('Error fetching patients data:', error);
            }
          }
          
          if (requestData.selectedService) {
            serviceType = requestData.selectedService;
            console.log('🏥 VetsVanAvailabilityTable: Found service type:', serviceType);
          }
        } catch (e) {
          console.error('Error parsing pending request data:', e);
        }
      }
      
      // Fallback to GPS hook values for location
      if (!customerLocation && latitude && longitude) {
        customerLocation = {
          latitude: Number(latitude),
          longitude: Number(longitude),
          address: null
        };
        console.log('📍 VetsVanAvailabilityTable: Using GPS location:', customerLocation);
      }
      
      // Add all required data to booking
      const completeBookingData = {
        ...bookingData,
        customerLocation,
        selectedPets,
        serviceType
      };
      
      console.log('📍 VetsVanAvailabilityTable: Sending complete booking data:', completeBookingData);
      
      return await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(completeBookingData),
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

      // التوجيه لصفحة النشاطات بدلاً من الدفع
      setTimeout(() => {
        window.location.href = '/customer-activity';
      }, 2000);
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

  // جلب حجوزات العميل الحالية
  const { data: userBookings = [] } = useQuery({
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

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span style={{ fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive' }}>
            {language === 'ar' ? 'جاري تحميل المواعيد...' : 'Loading appointments...'}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-center" style={{ fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive' }}>
          {t('error')}
        </p>
      </div>
    );
  }

  if (!vetsvanData || !Array.isArray(vetsvanData) || vetsvanData.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 text-center" style={{ fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive' }}>
          {language === 'ar' ? 'لا توجد VetsVan متاحة حالياً' : 'No VetsVan available currently'}
        </p>
      </div>
    );
  }

  // Generate time slots from 9 AM to 9 PM (every hour)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 21; hour++) {
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

  // Function to check if time slot is in the past
  const isTimeSlotInPast = (date: string, time: string) => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    // If selected date is before today, it's in the past
    if (date < currentDate) return true;
    
    // If selected date is today, check if time is before current time
    if (date === currentDate && time < currentTime) return true;
    
    return false;
  };

  const getTimeSlotStatus = (vetsvan: VetsVanWithShifts, time: string) => {
    if (!vetsvan.isAvailable) return 'unavailable';
    
    // Check if the time slot is in the past
    if (isTimeSlotInPast(selectedDate, time)) {
      return 'past_time';
    }
    
    // First check if user has a booking at this time and VetsVan
    const userBooking = userBookings.find((booking: any) => 
      booking.appointmentTime === time && 
      booking.appointmentDate === selectedDate &&
      booking.vetsVanId === vetsvan.id
    );
    
    if (userBooking) {
      return { type: 'user_booking', booking: userBooking };
    }
    
    const shift = vetsvan.shifts.find(shift => {
      return shift.date === selectedDate && 
             shift.startTime <= time && 
             shift.endTime > time &&
             shift.status === 'scheduled';
    });
    
    if (!shift) return 'unavailable';
    
    // Check if this specific time slot is booked by others
    const otherBooking = shift.bookings?.find(booking => 
      booking.appointmentTime === time && 
      booking.appointmentDate === selectedDate
    );
    
    if (otherBooking) {
      // If booking is cancelled, show as available
      if (otherBooking.status === 'cancelled') {
        return 'available';
      }
      // If booking is confirmed, in_progress, completed, or pending_review, show as booked
      if (['confirmed', 'in_progress', 'completed', 'pending_review'].includes(otherBooking.status)) {
        return 'booked';
      }
    }
    
    return 'available';
  };

  const handleTimeSlotClick = (vetsvan: VetsVanWithShifts, time: string) => {
    const status = getTimeSlotStatus(vetsvan, time);
    
    // منع النقر على الأوقات الماضية
    if (status === 'past_time') {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' 
          ? 'لا يمكن حجز موعد في وقت سابق للوقت الحالي'
          : 'Cannot book appointment for past time',
        variant: 'destructive',
      });
      return;
    }
    
    if (status === 'available') {
      const shift = vetsvan.shifts.find(shift => {
        return shift.date === selectedDate && 
               shift.startTime <= time && 
               shift.endTime > time &&
               shift.status === 'scheduled';
      });
      
      if (shift) {
        // إظهار dialog التأكيد
        setConfirmationDialog({
          isOpen: true,
          vetsvan: vetsvan,
          timeSlot: time
        });
      }
    }
  };

  // تأكيد الحجز
  const confirmBooking = () => {
    if (!confirmationDialog.vetsvan) return;

    const vetsvan = confirmationDialog.vetsvan;
    const time = confirmationDialog.timeSlot;
    
    const shift = vetsvan.shifts.find(shift => {
      return shift.date === selectedDate && 
             shift.startTime <= time && 
             shift.endTime > time &&
             shift.status === 'scheduled';
    });
    
    if (shift) {
      const bookingData = {
        shiftId: shift.id,
        vetsVanId: vetsvan.id,
        appointmentDate: selectedDate,
        appointmentTime: time,
        customerLocation: { latitude, longitude }
      };
      
      if (!latitude || !longitude) {
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: language === 'ar' 
            ? 'لم يتم العثور على موقعك. يرجى المحاولة مرة أخرى.'
            : 'Could not find your location. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      directBookingMutation.mutate(bookingData);
      
      // إغلاق dialog
      setConfirmationDialog({
        isOpen: false,
        vetsvan: null,
        timeSlot: ''
      });
    }
  };

  // إلغاء dialog التأكيد
  const cancelConfirmation = () => {
    setConfirmationDialog({
      isOpen: false,
      vetsvan: null,
      timeSlot: ''
    });
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-lg p-4 mb-6"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header with Date Navigation */}
      <div className="mb-4">
        <h3 className={`text-lg font-semibold text-gray-800 ${textAlign === 'right' ? 'text-right' : 'text-left'}`} style={{
          fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
        }}>
          {language === 'ar' ? 'المواعيد المتاحة - VetsVan' : 'Available Appointments - VetsVan'}
        </h3>
        
        {/* Date Navigation */}
        <div className="flex items-center justify-between mt-4 mb-2">
          <button
            onClick={goToPreviousDay}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span className="text-sm font-medium" style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {language === 'ar' ? 'السابق' : 'Previous'}
            </span>
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 #85208550 border border-purple-600 rounded-lg">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-600" style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {formatDate(selectedDate)}
            </span>
          </div>
          
          <button
            onClick={goToNextDay}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium" style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {language === 'ar' ? 'التالي' : 'Next'}
            </span>
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
        
        <p className={`text-sm text-gray-600 mt-6 ${textAlign === 'right' ? 'text-right' : 'text-left'}`} style={{
          fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
        }}>
          {language === 'ar' ? 'اختر الوقت المناسب لك' : 'Select a suitable time for you'}
        </p>
      </div>



      {/* Available Appointments Table */}
      {/* صورة الحيوانات الأليفة أعلى الجدول - ثابتة */}
      <div className="w-full relative -mt-4 -mx-12" style={{ marginBottom: '-20px', paddingBottom: 0 }}>
        <img 
          src={tableHeaderImage} 
          alt="Pets Header" 
          className="h-auto block"
          style={{ 
            display: 'block',
            marginBottom: '-20px',
            paddingBottom: 0,
            borderRadius: '8px 8px 0 0',
            verticalAlign: 'bottom',
            width: 'calc(100% + 96px)'
          }}
        />
      </div>
      
      <div className="overflow-x-auto -mx-6">
        <table className="border-collapse border border-gray-300 mt-20" style={{ marginTop: '18px', borderTop: 'none', width: 'calc(100% + 48px)' }}>
          {/* VetsVan Header Row */}
          <thead>
            <tr className="bg-white">
              <th className="border border-gray-300 p-2 text-sm font-medium" style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive',
                color: '#852085'
              }}>
                {language === 'ar' ? 'الوقت' : 'Time'}
              </th>
              {(vetsvanData as VetsVanWithShifts[]).map((vetsvan) => (
                <th 
                  key={vetsvan.id} 
                  className="border border-gray-300 p-2 text-sm font-medium min-w-[120px]"
                  style={{ color: '#852085' }}
                >
                  <div className="flex flex-col items-center" style={{
                    fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                  }}>
                    <span className="font-semibold">{vetsvan.vetsvanName}</span>
                    <span className="text-xs opacity-80" style={{ color: '#852085' }}>({vetsvan.vetsvanCode})</span>
                    
                    {/* Distance and closest indicator */}
                    {vetsvan.distanceFromCustomer && (
                      <div className="mt-1 text-center">
                        <span className="text-xs font-medium" style={{ color: '#852085' }}>
                          {vetsvan.distanceFromCustomer} {language === 'ar' ? 'كم' : 'km'}
                        </span>
                        {vetsvan.isClosest && (
                          <div className="flex items-center justify-center mt-1">
                            <Navigation className="h-3 w-3 mr-1" style={{ color: '#852085' }} />
                            <span className="text-xs font-bold" style={{
                              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive',
                              color: '#852085'
                            }}>
                              {language === 'ar' ? 'الأقرب إليك' : 'Closest to you'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {vetsvan.isAvailable ? (
                      <CheckCircle className="h-4 w-4 mt-1" style={{ color: '#852085' }} />
                    ) : (
                      <Clock className="h-4 w-4 mt-1" style={{ color: '#852085' }} />
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
                <td className="border border-gray-300 p-2 text-sm font-medium text-gray-700 bg-gray-50" style={{
                  fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                }}>
                  {timeSlot}
                </td>
                {(vetsvanData as VetsVanWithShifts[]).map((vetsvan) => {
                  const status = getTimeSlotStatus(vetsvan, timeSlot);
                  const isLoading = false;
                  
                  // Check if this is a user booking
                  const isUserBooking = status && typeof status === 'object' && status.type === 'user_booking';
                  const userBooking = isUserBooking ? status.booking : null;
                  
                  return (
                    <td key={`${vetsvan.id}-${timeSlot}`} className="border border-gray-300 p-2">
                      <div className="flex justify-center">
                        {isUserBooking ? (
                          // Show user booking status
                          <div className={`
                            w-full text-xs px-2 py-1 rounded border text-center
                            ${getStatusColor(userBooking.status)}
                          `} style={{
                            fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                          }}>
                            {getStatusText(userBooking.status)}
                          </div>
                        ) : (
                          // Show normal booking button
                          <button
                            onClick={() => handleTimeSlotClick(vetsvan, timeSlot)}
                            disabled={status !== 'available' || isLoading}
                            className={`
                              w-full text-xs px-2 py-1 rounded transition-colors
                              ${status === 'available'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                                : status === 'booked'
                                ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                                : status === 'past_time'
                                ? 'bg-red-100 text-red-600 cursor-not-allowed opacity-60'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }
                              ${isLoading ? 'opacity-50' : ''}
                            `}
                            style={{
                              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                            }}
                          >
                            {isLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                            ) : (
                              status === 'available' ? '✓' : 
                              status === 'booked' ? (language === 'ar' ? 'محجوز' : 'Booked') :
                              status === 'past_time' ? (language === 'ar' ? 'منتهي' : 'Past') : '✗'
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog التأكيد */}
      <AlertDialog open={confirmationDialog.isOpen} onOpenChange={cancelConfirmation}>
        <AlertDialogContent 
          className="max-w-md mx-auto"
          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className={`text-lg font-semibold ${textAlign === 'right' ? 'text-right' : 'text-left'}`} style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {language === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking'}
            </AlertDialogTitle>
            <AlertDialogDescription className={`${textAlign === 'right' ? 'text-right' : 'text-left'}`} style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {confirmationDialog.vetsvan && (
                <>
                  <div className="mb-2">
                    <strong>{language === 'ar' ? 'VetsVan:' : 'VetsVan:'}</strong> {confirmationDialog.vetsvan.vetsvanName}
                  </div>
                  <div className="mb-2">
                    <strong>{language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> {formatDate(selectedDate)}
                  </div>
                  <div className="mb-2">
                    <strong>{language === 'ar' ? 'الوقت:' : 'Time:'}</strong> {confirmationDialog.timeSlot}
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    {language === 'ar' 
                      ? 'هل أنت متأكد من رغبتك في حجز هذا الموعد؟'
                      : 'Are you sure you want to book this appointment?'
                    }
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2">
            <AlertDialogCancel 
              onClick={cancelConfirmation}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
              style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBooking}
              disabled={directBookingMutation.isPending}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50"
              style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}
            >
              {directBookingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {language === 'ar' ? 'جاري الحجز...' : 'Booking...'}
                </>
              ) : (
                language === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* مساحة إضافية لمنع التداخل مع العناصر التالية */}
      <div className="mt-8"></div>
    </div>
  );
}