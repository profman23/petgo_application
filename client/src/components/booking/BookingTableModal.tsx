import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Stethoscope } from "lucide-react";

interface VetsVan {
  id: number;
  name: string;
  vetsvanCode: string;
  vetsvanName: string;
  isAvailable: boolean;
  username: string;
}

interface Shift {
  id: number;
  vetsVanId: number;
  date: string;
  startTime: string;
  endTime: string;
  duration: 'day' | 'week' | 'month';
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

interface BookingData {
  userId?: number;
  userName?: string;
  userPhone?: string;
  selectedPatients: number[];
  serviceType: string;
  location: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  estimatedCost?: number;
  isAdminBooking?: boolean;
}

interface BookingTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingData: BookingData;
  onBookingComplete?: () => void;
}

export function BookingTableModal({
  open,
  onOpenChange,
  bookingData,
  onBookingComplete
}: BookingTableModalProps) {
  const { language, t } = useTranslation();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<{
    vetsVanId: number;
    timeSlot: string;
    vetsVanCode: string;
  } | null>(null);
  const [locallyBookedSlots, setLocallyBookedSlots] = useState<Set<string>>(new Set());

  const isAdminBooking = bookingData.isAdminBooking || false;

  // Reset state when bookingData changes (e.g., different customer selected)
  useEffect(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setShowConfirmDialog(false);
    setPendingBooking(null);
    setLocallyBookedSlots(new Set());
  }, [bookingData.userId, bookingData.selectedPatients]);

  // Get appropriate auth headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {};
    
    if (isAdminBooking) {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
    } else {
      const customerToken = localStorage.getItem('token');
      if (customerToken) {
        headers['Authorization'] = `Bearer ${customerToken}`;
      }
    }
    
    return headers;
  };

  // Fetch all active Vets Vans
  const { data: vetsVans = [], isLoading: loadingVetsVans } = useQuery<VetsVan[]>({
    queryKey: ['/api/vetsvan/list'],
    queryFn: async () => {
      const response = await fetch('/api/vetsvan/list', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch Vets Vans');
      return await response.json();
    },
    enabled: open,
    retry: false,
  });

  // Fetch shifts for the selected date
  const { data: shifts = [], isLoading: loadingShifts } = useQuery<Shift[]>({
    queryKey: ['/api/vetsvan/shifts', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/vetsvan/shifts?date=${selectedDate}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch shifts');
      return await response.json();
    },
    enabled: open,
    retry: false,
  });

  // Fetch existing bookings for the selected date
  const { data: existingBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['/api/bookings/date', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/by-date?date=${selectedDate}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return await response.json();
    },
    enabled: open,
    retry: false,
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async ({ 
      vetsVanId, 
      timeSlot, 
      vetsVanCode 
    }: { 
      vetsVanId: number; 
      timeSlot: string; 
      vetsVanCode: string;
    }) => {
      const shift = shifts.find(s => s.vetsVanId === vetsVanId && s.date === selectedDate);
      if (!shift) throw new Error('No shift found for selected date and VetsVan');

      // Convert time slot to 24-hour format
      const convertTo24Hour = (time12: string): string => {
        const [time, period] = time12.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };

      const appointmentTime24 = convertTo24Hour(timeSlot);

      // Prepare selected pets data
      const selectedPetsData = bookingData.selectedPatients.map(id => ({ id }));

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({
          shiftId: shift.id,
          vetsVanId: vetsVanId,
          appointmentDate: selectedDate,
          appointmentTime: appointmentTime24,
          customerLocation: {
            latitude: bookingData.pickupLatitude,
            longitude: bookingData.pickupLongitude,
            address: bookingData.location || null
          },
          selectedPets: selectedPetsData,
          serviceType: bookingData.serviceType || 'general_checkup',
          isAdminBooking: isAdminBooking,
          adminCustomerId: isAdminBooking ? bookingData.userId : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create booking');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vetsvan/shifts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vetsvan-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/date'] });
      
      toast({
        title: language === 'ar' ? 'تم تأكيد الحجز بنجاح!' : 'Booking Successfully Confirmed!',
        description: language === 'ar' 
          ? `تم حجز موعدك في ${data.booking.appointmentTime} بتاريخ ${data.booking.appointmentDate}`
          : `Your appointment has been booked for ${data.booking.appointmentTime} on ${data.booking.appointmentDate}`,
      });

      // Close modal and call completion callback
      onOpenChange(false);
      if (onBookingComplete) {
        onBookingComplete();
      }
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'فشل الحجز' : 'Booking Failed',
        description: error.message || (language === 'ar' 
          ? 'فشل في إنشاء الحجز. يرجى المحاولة مرة أخرى.'
          : 'Failed to create booking. Please try again.'),
        variant: "destructive",
      });
    },
  });

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      let time12hour;
      if (hour === 0) {
        time12hour = '12:00 AM';
      } else if (hour < 12) {
        time12hour = `${hour}:00 AM`;
      } else if (hour === 12) {
        time12hour = '12:00 PM';
      } else {
        time12hour = `${hour - 12}:00 PM`;
      }
      slots.push(time12hour);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Check if a slot is booked
  const isSlotBooked = (vetsVanId: number, timeSlot: string) => {
    const slotKey = `${vetsVanId}-${timeSlot}`;
    if (locallyBookedSlots.has(slotKey)) return true;
    
    return existingBookings.some((booking: any) => {
      if (booking.vetsVanId !== vetsVanId) return false;
      if (booking.appointmentDate !== selectedDate) return false;
      
      const bookingTime = booking.appointmentTime;
      const [hours24, minutes] = bookingTime.split(':').map(Number);
      let hours12 = hours24;
      const period = hours24 >= 12 ? 'PM' : 'AM';
      if (hours24 === 0) hours12 = 12;
      else if (hours24 > 12) hours12 = hours24 - 12;
      
      const formattedTime = `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
      return formattedTime === timeSlot;
    });
  };

  // Check if slot is in the past
  const isSlotInPast = (timeSlot: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (selectedDate > today) return false;
    if (selectedDate < today) return true;
    
    const [time, period] = timeSlot.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;
    
    const slotDate = new Date(now);
    slotDate.setHours(hours, minutes, 0, 0);
    
    return slotDate < now;
  };

  // Handle time slot click
  const handleTimeSlotClick = (vetsVanId: number, timeSlot: string, vetsVanCode: string) => {
    if (isSlotBooked(vetsVanId, timeSlot) || isSlotInPast(timeSlot)) return;
    
    setPendingBooking({ vetsVanId, timeSlot, vetsVanCode });
    setShowConfirmDialog(true);
  };

  // Confirm booking
  const handleConfirmBooking = () => {
    if (!pendingBooking) return;
    
    setShowConfirmDialog(false);
    setLocallyBookedSlots(prev => new Set(prev).add(`${pendingBooking.vetsVanId}-${pendingBooking.timeSlot}`));
    
    createBookingMutation.mutate({
      vetsVanId: pendingBooking.vetsVanId,
      timeSlot: pendingBooking.timeSlot,
      vetsVanCode: pendingBooking.vetsVanCode
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto" dir={direction}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive' }}>
              {language === 'ar' ? 'جدول الحجز' : 'Booking Table'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Booking Summary */}
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">
                    {language === 'ar' ? 'ملخص الحجز' : 'Booking Summary'}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-purple-700 font-medium">{language === 'ar' ? 'نوع الخدمة:' : 'Service Type:'}</span> {bookingData.serviceType}
                  </div>
                  <div>
                    <span className="text-purple-700 font-medium">{language === 'ar' ? 'عدد الحيوانات:' : 'Number of Pets:'}</span> {bookingData.selectedPatients.length}
                  </div>
                  {bookingData.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-700 font-medium">{language === 'ar' ? 'الموقع:' : 'Location:'}</span> {bookingData.location}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Date Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'اختر التاريخ' : 'Select Date'}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            {/* Time Slots Grid */}
            {loadingVetsVans || loadingShifts || loadingBookings ? (
              <div className="text-center py-8 text-gray-500">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-purple-100 font-semibold">
                        {language === 'ar' ? 'الوقت' : 'Time'}
                      </th>
                      {vetsVans.map(van => (
                        <th key={van.id} className="border p-2 bg-purple-100 font-semibold">
                          {van.vetsvanCode}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(timeSlot => (
                      <tr key={timeSlot}>
                        <td className="border p-2 font-medium text-sm">{timeSlot}</td>
                        {vetsVans.map(van => {
                          const isBooked = isSlotBooked(van.id, timeSlot);
                          const isPast = isSlotInPast(timeSlot);
                          const isDisabled = isBooked || isPast;
                          
                          return (
                            <td
                              key={van.id}
                              onClick={() => !isDisabled && handleTimeSlotClick(van.id, timeSlot, van.vetsvanCode)}
                              className={`border p-2 text-center text-sm cursor-pointer transition-colors ${
                                isBooked ? 'bg-red-100 text-red-700' :
                                isPast ? 'bg-gray-100 text-gray-400' :
                                'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {isBooked ? (language === 'ar' ? 'محجوز' : 'Booked') : 
                               isPast ? (language === 'ar' ? 'منتهي' : 'Past') :
                               (language === 'ar' ? 'متاح' : 'Available')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent dir={direction}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? `هل تريد حجز موعد في ${pendingBooking?.timeSlot} مع ${pendingBooking?.vetsVanCode}؟`
                : `Do you want to book an appointment at ${pendingBooking?.timeSlot} with ${pendingBooking?.vetsVanCode}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBooking}>
              {language === 'ar' ? 'تأكيد' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
