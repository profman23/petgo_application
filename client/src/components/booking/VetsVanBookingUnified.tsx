import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Stethoscope } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
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

interface Patient {
  id: number;
  name: string;
  type: string;
}

interface RideRequestData {
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

interface VetsVanBookingUnifiedProps {
  isModal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  bookingData?: RideRequestData;
  onBookingComplete?: () => void;
}

export function VetsVanBookingUnified({
  isModal = false,
  open = true,
  onOpenChange,
  bookingData: propBookingData,
  onBookingComplete
}: VetsVanBookingUnifiedProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<{
    vetsVanId: number;
    timeSlot: string;
    vetsVanCode: string;
  } | null>(null);

  const [locallyBookedSlots, setLocallyBookedSlots] = useState<Set<string>>(new Set());
  const [rideRequestData, setRideRequestData] = useState<RideRequestData | null>(null);
  
  // Check if this is an admin booking - prioritize props, then state
  const isAdminBooking = propBookingData?.isAdminBooking === true || rideRequestData?.isAdminBooking === true;

  // Payment-related state (only for customer bookings)
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [paymentCurrency, setPaymentCurrency] = useState<string>('SAR');

  // Reset state when bookingData changes (for admin modal mode)
  useEffect(() => {
    if (propBookingData) {
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setShowConfirmDialog(false);
      setPendingBooking(null);
      setLocallyBookedSlots(new Set());
    }
  }, [propBookingData?.userId, propBookingData?.selectedPatients]);

  // Load ride request data from props (admin mode) or localStorage (customer mode)
  useEffect(() => {
    if (propBookingData) {
      setRideRequestData(propBookingData);
    } else {
      const savedRequestData = localStorage.getItem('pendingRequest');
      if (savedRequestData) {
        try {
          const parsedData = JSON.parse(savedRequestData);
          console.log('Loaded ride request data:', parsedData);
          setRideRequestData(parsedData);
        } catch (error) {
          console.error('Error parsing ride request data:', error);
        }
      }
    }
  }, [propBookingData]);

  // Parse URL parameters for payment success (customer mode only)
  useEffect(() => {
    if (!isModal && !isAdminBooking) {
      const urlParams = new URLSearchParams(window.location.search);
      const payment = urlParams.get('payment');
      const ref = urlParams.get('ref');
      const paymentIdParam = urlParams.get('paymentId') || urlParams.get('Id');
      
      if (payment === 'success' && ref && paymentIdParam) {
        console.log('🎉 Payment successful! Ready to finalize booking:', {
          reference: ref,
          paymentId: paymentIdParam
        });
        setPaymentSuccess(true);
        setPaymentReference(ref);
        setPaymentId(paymentIdParam);
        fetchPaymentDetails(paymentIdParam);
      }
    }
  }, [isModal, isAdminBooking]);

  const fetchPaymentDetails = async (paymentId: string) => {
    try {
      console.log('🔍 Fetching payment details for:', paymentId);
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/public/payment-details/${paymentId}`, {
        method: 'GET',
        headers
      });
      const data = await response.json();
      
      if (data.success && data.payment) {
        console.log('💰 Payment details received:', data.payment);
        setPaymentAmount(data.payment.amount);
        setPaymentCurrency(data.payment.currency);
        
        toast({
          title: "Payment Details Loaded",
          description: `Amount: ${data.payment.amount} ${data.payment.currency}`,
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch payment details:', error);
    }
  };

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

  const { data: userSession } = useQuery<{user?: {name?: string, phone?: string, email?: string}}>({
    queryKey: ['/api/auth/session'],
    // For admin bookings, check propBookingData first to avoid timing issues
    enabled: propBookingData?.isAdminBooking !== true && !isAdminBooking && (isModal ? open : true),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    queryFn: async () => {
      const response = await fetch('/api/patients', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch patients');
      return await response.json();
    },
    enabled: !isAdminBooking && (isModal ? open : true),
    retry: false,
  });

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
    enabled: isModal ? open : true,
    retry: false,
  });

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
    enabled: isModal ? open : true,
    retry: false,
  });

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
    enabled: isModal ? open : true,
    retry: false,
  });

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

  // Filter VetsVans that have active shifts for the selected date
  const availableVetsVans = vetsVans.filter(van => {
    const hasActiveShift = shifts.some(shift => 
      shift.vetsVanId === van.id && 
      shift.date === selectedDate &&
      (shift.status === 'scheduled' || shift.status === 'active')
    );
    return van.isAvailable && hasActiveShift;
  });

  const getPetEmoji = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dog': return '🐶';
      case 'cat': return '🐱';
      case 'bird': return '🐦';
      default: return '🐾';
    }
  };

  const getServiceTypeDisplay = (serviceType: string) => {
    const serviceMap: Record<string, string> = {
      'general-checkup': 'General Check Up',
      'grooming': 'Pet Grooming',
      'vaccination': 'Vaccination',
      'emergency': 'Emergency Care',
    };
    return serviceMap[serviceType] || serviceType;
  };

  const getSelectedPetsDisplay = () => {
    if (!rideRequestData || !rideRequestData.selectedPatients || patients.length === 0) {
      return [];
    }
    return rideRequestData.selectedPatients
      .map(petId => patients.find(pet => pet.id === petId))
      .filter(Boolean) as Patient[];
  };

  const selectedPets = getSelectedPetsDisplay();

  const createBookingMutation = useMutation({
    mutationFn: async ({ 
      vetsVanId, 
      timeSlot, 
      vetsVanCode, 
      paymentReference = null, 
      paymentId = null 
    }: { 
      vetsVanId: number; 
      timeSlot: string; 
      vetsVanCode: string;
      paymentReference?: string | null; 
      paymentId?: string | null; 
    }) => {
      const shift = shifts.find(s => s.vetsVanId === vetsVanId && s.date === selectedDate);
      if (!shift) throw new Error('No shift found for selected date and VetsVan');

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

      let selectedPetsData;
      if (isAdminBooking && rideRequestData?.selectedPatients) {
        selectedPetsData = rideRequestData.selectedPatients.map(id => ({ id }));
      } else {
        selectedPetsData = rideRequestData?.selectedPatients ? 
          patients.filter(p => rideRequestData.selectedPatients.includes(p.id)) : [];
      }

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
          customerLocation: rideRequestData ? {
            latitude: rideRequestData.pickupLatitude,
            longitude: rideRequestData.pickupLongitude,
            address: rideRequestData.location || null
          } : null,
          selectedPets: selectedPetsData,
          serviceType: rideRequestData?.serviceType || 'general_checkup',
          paymentReference: paymentReference,
          paymentId: paymentId,
          isAdminBooking: isAdminBooking,
          adminCustomerId: isAdminBooking && rideRequestData ? rideRequestData.userId : undefined
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
      
      localStorage.removeItem('pendingBookingDetails');
      
      toast({
        title: language === 'ar' ? 'تم تأكيد الحجز بنجاح!' : 'Booking Successfully Confirmed!',
        description: language === 'ar' 
          ? `تم حجز موعدك في ${data.booking.appointmentTime} بتاريخ ${data.booking.appointmentDate}`
          : `Your appointment has been booked for ${data.booking.appointmentTime} on ${data.booking.appointmentDate}`,
      });

      console.log('🔔 Booking created successfully:', data);
      
      // Admin modal mode: close modal and call completion callback
      if (isModal && isAdminBooking) {
        if (onOpenChange) {
          onOpenChange(false);
        }
        if (onBookingComplete) {
          onBookingComplete();
        }
      } else if (isModal && onOpenChange) {
        // Customer modal mode (shouldn't happen, but handle it)
        onOpenChange(false);
        if (onBookingComplete) {
          onBookingComplete();
        }
      } else {
        // Customer page mode: redirect to customer activity immediately
        setLocation('/customer-activity');
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
    onSettled: () => {
      setIsBooking(false);
    }
  });

  // Auto-trigger booking creation after payment success
  useEffect(() => {
    if (paymentSuccess && paymentReference && paymentId && !isBooking && !isModal && !isAdminBooking) {
      const savedBookingDetails = localStorage.getItem('pendingBookingDetails');
      
      if (savedBookingDetails) {
        try {
          const bookingDetails = JSON.parse(savedBookingDetails);
          console.log('🔄 Auto-creating booking after payment success:', {
            paymentId,
            paymentReference,
            bookingDetails
          });
          
          // Auto-trigger booking creation
          setPendingBooking({
            vetsVanId: bookingDetails.vetsVanId,
            timeSlot: bookingDetails.timeSlot,
            vetsVanCode: bookingDetails.vetsVanCode
          });
          
          setIsBooking(true);
          
          createBookingMutation.mutate({
            vetsVanId: bookingDetails.vetsVanId,
            timeSlot: bookingDetails.timeSlot,
            vetsVanCode: bookingDetails.vetsVanCode,
            paymentReference: paymentReference,
            paymentId: paymentId
          });
          
          // Clean up URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          setPaymentSuccess(false);
          setPaymentReference(null);
          setPaymentId(null);
        } catch (error) {
          console.error('❌ Failed to parse pending booking details:', error);
        }
      } else {
        console.log('⚠️ No pending booking details found in localStorage after payment');
      }
    }
  }, [paymentSuccess, paymentReference, paymentId, isBooking, isModal, isAdminBooking]);

  const handleConfirmBooking = async () => {
    if (pendingBooking) {
      setIsBooking(true);
      setShowConfirmDialog(false);
      
      try {
        // Admin bookings: skip payment flow entirely
        if (isAdminBooking) {
          console.log('🔧 Admin booking - creating booking without payment');
          createBookingMutation.mutate({
            vetsVanId: pendingBooking.vetsVanId,
            timeSlot: pendingBooking.timeSlot,
            vetsVanCode: pendingBooking.vetsVanCode,
            paymentReference: null,
            paymentId: null
          });
          return;
        }

        // Free services: skip payment flow
        if (rideRequestData?.serviceType === 'free-deworming') {
          console.log('🆓 Free deworming service detected - creating booking without payment');
          createBookingMutation.mutate({
            vetsVanId: pendingBooking.vetsVanId,
            timeSlot: pendingBooking.timeSlot,
            vetsVanCode: pendingBooking.vetsVanCode,
            paymentReference: null,
            paymentId: null
          });
          
          toast({
            title: language === 'ar' ? 'حجز خدمة مجانية' : 'Free Service Booking',
            description: language === 'ar' 
              ? 'جاري معالجة موعد التطعيم المجاني الخاص بك!'
              : 'Your free deworming appointment is being processed!',
          });
          return;
        }
        
        // Payment already completed
        if (paymentSuccess && paymentReference && paymentId) {
          console.log('✅ Payment already completed, finalizing booking');
          createBookingMutation.mutate({
            vetsVanId: pendingBooking.vetsVanId,
            timeSlot: pendingBooking.timeSlot,
            vetsVanCode: pendingBooking.vetsVanCode,
            paymentReference: paymentReference,
            paymentId: paymentId
          });
          
          window.history.replaceState({}, document.title, window.location.pathname);
          setPaymentSuccess(false);
          setPaymentReference(null);
          setPaymentId(null);
          return;
        }
        
        // Create payment for customer bookings
        const petCount = rideRequestData?.selectedPatients?.length || 1;
        const serviceType = rideRequestData?.serviceType || 'General Check Up';
        const estimatedCost = rideRequestData?.estimatedCost || 1;
        
        const token = getAuthHeaders()['Authorization']?.replace('Bearer ', '');
        if (!token) {
          toast({
            title: language === 'ar' ? 'خطأ في المصادقة' : 'Authentication Error',
            description: language === 'ar' ? 'يرجى تسجيل الدخول مرة أخرى' : 'Please log in again',
            variant: 'destructive',
          });
          setLocation('/login');
          return;
        }
        
        const customerName = userSession?.user?.name || userSession?.user?.phone || 'Customer';
        const customerEmail = userSession?.user?.email || 'test@example.com';
        const customerPhone = userSession?.user?.phone || '+966000000000';
        
        const shift = shifts.find(s => s.vetsVanId === pendingBooking.vetsVanId && s.date === selectedDate);
        if (!shift) throw new Error('No shift found');
        
        const bookingDetails = {
          ...pendingBooking,
          shiftId: shift.id,
          estimatedCost,
          customerName,
          customerEmail,
          customerPhone,
          serviceType,
          selectedDate,
          rideRequestData
        };
        localStorage.setItem('pendingBookingDetails', JSON.stringify(bookingDetails));
        
        const response = await fetch('/api/public/payments/test-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            invoiceNumber: `RIDE-${Date.now()}`,
            amount: estimatedCost.toString(),
            description: `VetsVan Booking: ${serviceType} for ${petCount} pet(s) - ${pendingBooking.vetsVanCode} at ${pendingBooking.timeSlot}`,
            successUrl: `${window.location.origin}/vetsvan-booking?payment=success`,
            errorUrl: `${window.location.origin}/vetsvan-booking?payment=failed`
          })
        });

        const responseData = await response.json();

        if (responseData.success && responseData.data?.paymentUrl) {
          toast({
            title: language === 'ar' ? 'جاري التوجه للدفع' : 'Redirecting to Payment',
            description: language === 'ar' 
              ? `المبلغ: ${estimatedCost} ريال` 
              : `Amount: ${estimatedCost} SAR`,
          });
          
          window.location.href = responseData.data.paymentUrl;
        } else {
          throw new Error(responseData.message || 'Failed to create payment link');
        }
        
      } catch (error: any) {
        console.error('Booking confirmation failed:', error);
        toast({
          title: language === 'ar' ? 'فشل الحجز' : 'Booking Failed',
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsBooking(false);
        setPendingBooking(null);
      }
    }
  };

  const handleCancelBooking = () => {
    setShowConfirmDialog(false);
    setPendingBooking(null);
  };

  const isTimeSlotAvailable = (vetsVanId: number, timeSlot: string): boolean => {
    const shift = shifts.find(s => s.vetsVanId === vetsVanId && s.date === selectedDate);
    if (!shift || shift.status === 'cancelled') return false;
    
    const convertTo24Hour = (time12: string): string => {
      const [time, period] = time12.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      else if (period === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };
    
    const slotTime24 = convertTo24Hour(timeSlot);
    const shiftStart = shift.startTime;
    const shiftEnd = shift.endTime;
    
    if (shiftEnd < shiftStart) {
      return slotTime24 >= shiftStart || slotTime24 < shiftEnd;
    } else {
      return slotTime24 >= shiftStart && slotTime24 < shiftEnd;
    }
  };

  const isTimeSlotInPast = (timeSlot: string, date: string): boolean => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    if (date < currentDate) return true;
    if (date === currentDate) {
      const convertTo24Hour = (time12: string): string => {
        const [time, period] = time12.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        else if (period === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };
      const slotTime24 = convertTo24Hour(timeSlot);
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
      return slotTime24 <= currentTime;
    }
    return false;
  };

  const isSlotBooked = (vetsVanId: number, timeSlot: string): boolean => {
    const convertTo24Hour = (time12: string): string => {
      const [time, period] = time12.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      else if (period === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const slotTime24 = convertTo24Hour(timeSlot);
    return existingBookings.some((booking: any) => 
      booking.vetsVanId === vetsVanId && 
      booking.appointmentTime === slotTime24 &&
      booking.appointmentDate === selectedDate
    );
  };

  const getAvailabilityStatus = (vetsVanId: number, timeSlot: string) => {
    const isAvailable = isTimeSlotAvailable(vetsVanId, timeSlot);
    const isPast = isTimeSlotInPast(timeSlot, selectedDate);
    const slotKey = `${vetsVanId}-${timeSlot}`;
    const isLocallyBooked = locallyBookedSlots.has(slotKey);
    const isServerBooked = isSlotBooked(vetsVanId, timeSlot);
    const isActuallyBooked = isLocallyBooked || isServerBooked;
    
    let display = 'Available';
    if (isActuallyBooked) {
      display = 'Booked';
    } else if (!isAvailable) {
      display = '❌';
    }
    
    let className = '';
    let isClickable = false;
    
    if (isPast) {
      if (isActuallyBooked) {
        className = 'text-gray-400 font-medium opacity-50 cursor-not-allowed bg-yellow-100';
      } else {
        className = isAvailable 
          ? 'text-gray-400 font-medium opacity-50 cursor-not-allowed bg-gray-50' 
          : 'text-gray-400 font-medium opacity-50 cursor-not-allowed bg-gray-100';
      }
    } else {
      if (isActuallyBooked) {
        className = 'text-yellow-700 font-medium cursor-not-allowed bg-yellow-200';
      } else if (isAvailable) {
        className = 'text-green-600 font-medium hover:text-green-700 hover:bg-green-50 cursor-pointer';
        isClickable = true;
      } else {
        className = 'text-red-500 font-bold cursor-not-allowed bg-red-50';
      }
    }
    
    return { isAvailable: isAvailable && !isActuallyBooked, isPast, isClickable: isClickable && !isActuallyBooked, display, className };
  };

  const BookingContent = () => {
    if (loadingVetsVans || loadingShifts || loadingBookings) {
      return (
        <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {language === 'ar' ? 'جاري تحميل بيانات الحجز...' : 'Loading booking data...'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={`${isModal ? '' : 'min-h-screen'} bg-gray-50 py-8`} dir="ltr">
        <div className={`${isModal ? '' : 'max-w-7xl mx-auto px-4'}`}>
          
          {!isModal && paymentSuccess && paymentReference && paymentId && (
            <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Payment Successful!</h3>
                  <p className="text-sm text-green-700">
                    Payment Reference: <span className="font-mono">{paymentReference}</span>
                  </p>
                  {paymentAmount && paymentAmount > 0 && (
                    <p className="text-sm text-green-700 mt-1 font-semibold">
                      💰 Amount Paid: <span className="text-lg">{paymentAmount} {paymentCurrency}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Vets Van Booking Schedule</h1>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">
                  Available Vets Vans: {availableVetsVans.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Shifts loaded: {shifts.length} for {selectedDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="booking-date" className="text-sm font-medium text-gray-700">
                  Select Date:
                </label>
                <input
                  id="booking-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {rideRequestData && selectedPets.length > 0 && (
            <Card className="mb-6 border-2 border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-purple-800">Request Summary</h2>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-sm font-medium text-gray-700 min-w-[100px]">
                      Selected Pets:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedPets.map((pet) => (
                        <span key={pet.id} className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm font-medium text-purple-700 border border-purple-300">
                          <span>{pet.name}</span>
                          <span className="text-base">{getPetEmoji(pet.type)}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {rideRequestData.serviceType && (
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 text-sm font-medium text-gray-700 min-w-[100px]">
                        Service Type:
                      </div>
                      <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm font-medium text-purple-700 border border-purple-300">
                        <Stethoscope className="w-3 h-3" />
                        {getServiceTypeDisplay(rideRequestData.serviceType)}
                      </span>
                    </div>
                  )}

                  {rideRequestData.location && (
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 text-sm font-medium text-gray-700 min-w-[100px]">
                        Service Location:
                      </div>
                      <span className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm font-medium text-purple-700 border border-purple-300">
                        <MapPin className="w-3 h-3" />
                        {rideRequestData.location}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-purple-200">
                  <p className="text-sm text-purple-600 font-medium">
                    Please select your preferred appointment time from the schedule below.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full table-auto min-w-max" style={{ direction: 'ltr' }}>
              <colgroup>
                <col style={{ width: '100px' }} />
                {availableVetsVans.map((van) => (
                  <col key={van.id} style={{ width: '120px' }} />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r-2 border-gray-400 sticky left-0 bg-gray-50" style={{ textAlign: 'left' }}>
                    Time
                  </th>
                  {availableVetsVans.map((van, index) => (
                    <th 
                      key={van.id} 
                      className={`px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50 ${
                        index < availableVetsVans.length - 1 ? 'border-r border-gray-300' : ''
                      }`}
                      style={{ textAlign: 'center' }}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-purple-600 font-bold text-xs">{van.vetsvanCode}</span>
                        <span className="text-xs text-gray-500 mt-1">{van.vetsvanName}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.filter(timeSlot => !isTimeSlotInPast(timeSlot, selectedDate)).map((timeSlot, index) => (
                  <tr key={timeSlot} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 text-left text-xs text-gray-900 font-medium border-r-2 border-gray-400 sticky left-0 bg-inherit" style={{ textAlign: 'left' }}>
                      {timeSlot}
                    </td>
                    {availableVetsVans.map((van, vanIndex) => {
                      const availability = getAvailabilityStatus(van.id, timeSlot);
                      return (
                        <td 
                          key={van.id} 
                          className={`px-3 py-3 text-center text-xs transition-colors ${
                            vanIndex < availableVetsVans.length - 1 ? 'border-r border-gray-300' : ''
                          } ${availability.isClickable ? 'hover:bg-purple-50' : ''}`}
                          style={{ textAlign: 'center' }}
                          onClick={() => {
                            if (availability.isClickable && !availability.isPast && !isBooking && !createBookingMutation.isPending) {
                              setPendingBooking({
                                vetsVanId: van.id,
                                timeSlot: timeSlot,
                                vetsVanCode: van.vetsvanCode
                              });
                              setShowConfirmDialog(true);
                            }
                          }}
                        >
                          <div className={`w-full h-full min-h-[32px] flex items-center justify-center ${availability.className} px-2 py-1 rounded text-xs`}>
                            {(isBooking || createBookingMutation.isPending) && availability.isClickable && !availability.isPast ? (
                              <div className="flex items-center gap-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                                <span className="text-xs">Booking...</span>
                              </div>
                            ) : (
                              availability.display
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

          {availableVetsVans.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🚐</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Available Vets Vans
              </h3>
              <p className="text-gray-600">
                No Vets Vans with active shifts found for this date.
              </p>
            </div>
          )}

        </div>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === 'ar' 
                  ? 'هل أنت متأكد من رغبتك في حجز هذا الموعد؟' 
                  : 'Are you sure you want to book this time slot?'}
              </AlertDialogDescription>
              {pendingBooking && (
                <>
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex flex-col gap-2 text-sm text-purple-800">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {language === 'ar' ? 'عربة الطبيب:' : 'VetsVan:'}
                        </span>
                        <span>{pendingBooking.vetsVanCode}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {language === 'ar' ? 'الوقت:' : 'Time:'}
                        </span>
                        <span>{pendingBooking.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {language === 'ar' ? 'التاريخ:' : 'Date:'}
                        </span>
                        <span>{selectedDate}</span>
                      </div>
                    </div>
                  </div>
                  
                  {!isAdminBooking && rideRequestData && rideRequestData.estimatedCost !== undefined && (
                    <div className="mt-3 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {language === 'ar' ? 'المبلغ المستحق:' : 'Amount to Pay:'}
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          {rideRequestData.estimatedCost === 0 
                            ? (language === 'ar' ? 'مجاني' : 'Free')
                            : `${rideRequestData.estimatedCost} ${language === 'ar' ? 'ريال' : 'SAR'}`
                          }
                        </span>
                      </div>
                      {rideRequestData.estimatedCost > 0 && rideRequestData.selectedPatients && (
                        <p className="text-xs text-gray-600 mt-2">
                          {language === 'ar' 
                            ? `للخدمة: ${rideRequestData.serviceType} - ${rideRequestData.selectedPatients.length} حيوان أليف`
                            : `For service: ${rideRequestData.serviceType} - ${rideRequestData.selectedPatients.length} pet(s)`
                          }
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter className={language === 'ar' ? 'flex-row-reverse' : ''}>
              <AlertDialogCancel onClick={handleCancelBooking}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmBooking}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {language === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  if (isModal) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <div className="p-6 pb-2 flex-shrink-0">
            <DialogHeader>
              <DialogTitle>Vets Van Booking Schedule</DialogTitle>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <BookingContent />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return <BookingContent />;
}
