import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Stethoscope } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
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
  selectedPatients: number[];
  serviceType: string;
  location: string;
  pickupLatitude: number;
  pickupLongitude: number;
}

export default function VetsVanBooking() {
  // Selected date for booking (defaults to today)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<{
    vetsVanId: number;
    timeSlot: string;
    vetsVanCode: string;
  } | null>(null);

  // Track locally booked slots for immediate visual feedback
  const [locallyBookedSlots, setLocallyBookedSlots] = useState<Set<string>>(new Set());

  // Ride request data from localStorage
  const [rideRequestData, setRideRequestData] = useState<RideRequestData | null>(null);

  // Check if coming from successful payment
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [paymentCurrency, setPaymentCurrency] = useState<string>('SAR');

  // Parse URL parameters on component mount
  useEffect(() => {
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
      
      // Fetch actual payment amount immediately
      fetchPaymentDetails(paymentIdParam);
    }
  }, []);

  // Function to fetch payment details from MyFatoorah
  const fetchPaymentDetails = async (paymentId: string) => {
    try {
      console.log('🔍 Fetching payment details for:', paymentId);
      
      // Get authentication token from localStorage
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authentication header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Including authentication token for payment details fetch');
      } else {
        console.log('⚠️ No authentication token found for payment details fetch');
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
      } else {
        console.log('⚠️ Payment details not available yet');
        toast({
          title: "Payment Processing",
          description: "Payment details are being processed...",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch payment details:', error);
      toast({
        title: "Payment Details Error",
        description: "Unable to load payment amount details",
        variant: "destructive",
      });
    }
  };

  // Fetch user session data for real customer details
  const { data: userSession } = useQuery<{user?: {name?: string, phone?: string, email?: string}}>({
    queryKey: ['/api/auth/session'],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Note: Past time slots are automatically styled with faded colors and disabled from booking
  // while still showing their original status (Available/Booked) for auditing purposes

  // Load ride request data from localStorage on component mount
  useEffect(() => {
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
  }, []);

  // Fetch all patients for pet name lookup
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    queryFn: async () => {
      const customerToken = localStorage.getItem('token');
      if (!customerToken) throw new Error('Authentication required');
      
      const response = await fetch('/api/patients', {
        headers: { 'Authorization': `Bearer ${customerToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch patients');
      return await response.json();
    },
    retry: false,
  });

  // Fetch all active Vets Vans using customer-accessible endpoint
  const { data: vetsVans = [], isLoading: loadingVetsVans } = useQuery<VetsVan[]>({
    queryKey: ['/api/vetsvan/list'],
    queryFn: async () => {
      const customerToken = localStorage.getItem('token');
      
      if (!customerToken) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/vetsvan/list', {
        headers: {
          'Authorization': `Bearer ${customerToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch Vets Vans');
      return await response.json();
    },
    retry: false,
  });

  // Fetch shifts for the selected date using customer-accessible endpoint
  const { data: shifts = [], isLoading: loadingShifts } = useQuery<Shift[]>({
    queryKey: ['/api/vetsvan/shifts', selectedDate],
    queryFn: async () => {
      const customerToken = localStorage.getItem('token');
      
      if (!customerToken) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/vetsvan/shifts?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${customerToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch shifts');
      return await response.json();
    },
    retry: false,
  });

  // Fetch existing bookings for the selected date
  const { data: existingBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['/api/bookings/date', selectedDate],
    queryFn: async () => {
      const customerToken = localStorage.getItem('token');
      
      if (!customerToken) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/bookings/by-date?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${customerToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return await response.json();
    },
    retry: false,
  });

  // Generate time slots in chronological order from 12:00 AM to 11:00 PM
  const generateTimeSlots = () => {
    const slots = [];
    
    // Start from midnight and go through the entire 24-hour cycle
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

  // Filter only available Vets Vans
  const availableVetsVans = vetsVans.filter(van => van.isAvailable);

  // Helper function to get pet emoji based on type
  const getPetEmoji = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dog': return '🐶';
      case 'cat': return '🐱';
      case 'bird': return '🐦';
      default: return '🐾';
    }
  };

  // Helper function to get service type display name
  const getServiceTypeDisplay = (serviceType: string) => {
    const serviceMap: Record<string, string> = {
      'general-checkup': 'General Check Up',
      'grooming': 'Pet Grooming',
      'vaccination': 'Vaccination',
      'emergency': 'Emergency Care',
      // Add more service types as needed
    };
    return serviceMap[serviceType] || serviceType;
  };

  // Get selected patients data for display
  const getSelectedPetsDisplay = () => {
    if (!rideRequestData || !rideRequestData.selectedPatients || patients.length === 0) {
      return [];
    }

    return rideRequestData.selectedPatients
      .map(petId => patients.find(pet => pet.id === petId))
      .filter(Boolean) as Patient[];
  };

  const selectedPets = getSelectedPetsDisplay();

  // Create booking mutation
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
      const customerToken = localStorage.getItem('token');
      
      if (!customerToken) {
        throw new Error('Authentication required');
      }

      // Find the shift for this VetsVan and date
      const shift = shifts.find(s => s.vetsVanId === vetsVanId && s.date === selectedDate);
      if (!shift) {
        throw new Error('No shift found for selected date and VetsVan');
      }

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

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`,
        },
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
          selectedPets: rideRequestData?.selectedPatients ? 
            patients.filter(p => rideRequestData.selectedPatients.includes(p.id)) : [],
          serviceType: rideRequestData?.serviceType || 'general_checkup',
          paymentReference: paymentReference,
          paymentId: paymentId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create booking');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/vetsvan/shifts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vetsvan-requests'] });
      
      toast({
        title: "Booking Successful",
        description: `Your appointment has been booked for ${data.booking.appointmentTime} on ${data.booking.appointmentDate}`,
      });

      console.log('🔔 Booking created successfully:', data);
      
      // Redirect to customer activity page
      setLocation('/customer-activity');
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsBooking(false);
    }
  });

  // Handle confirmation dialog actions - PAYMENT FIRST APPROACH CORRECTED
  const handleConfirmBooking = async () => {
    if (pendingBooking) {
      setIsBooking(true);
      setShowConfirmDialog(false);
      
      try {
        // CHECK 0: Handle free services (bypass payment flow entirely)
        if (rideRequestData?.serviceType === 'free-deworming') {
          console.log('🆓 Free deworming service detected - creating booking without payment');
          
          // Create booking directly without any payment processing
          const freeBooking = {
            vetsVanId: pendingBooking.vetsVanId,
            timeSlot: pendingBooking.timeSlot,
            vetsVanCode: pendingBooking.vetsVanCode,
            paymentReference: null, // No payment for free service
            paymentId: null
          };
          
          console.log('🎯 Creating free booking:', freeBooking);
          
          // Directly create the booking using existing mutation
          createBookingMutation.mutate(freeBooking);
          
          // Show success message
          toast({
            title: "Free Service Booking",
            description: "Your free deworming appointment is being processed!",
          });
          
          return; // Exit here - free booking handled
        }
        
        // CHECK 1: If payment is already successful (coming from MyFatoorah redirect), finalize booking
        if (paymentSuccess && paymentReference && paymentId) {
          console.log('✅ Payment already completed, finalizing booking with payment:', {
            reference: paymentReference,
            paymentId: paymentId,
            vetsVanCode: pendingBooking.vetsVanCode,
            timeSlot: pendingBooking.timeSlot
          });
          
          // Add payment information to local booking data for reference
          const bookingWithPayment = {
            vetsVanId: pendingBooking.vetsVanId,
            timeSlot: pendingBooking.timeSlot,
            vetsVanCode: pendingBooking.vetsVanCode,
            paymentReference: paymentReference,
            paymentId: paymentId
          };
          
          console.log('🎯 Creating booking with payment data:', bookingWithPayment);
          
          // Directly finalize the booking using existing mutation
          createBookingMutation.mutate(bookingWithPayment);
          
          // Clear URL parameters to prevent confusion
          window.history.replaceState({}, document.title, window.location.pathname);
          setPaymentSuccess(false);
          setPaymentReference(null);
          setPaymentId(null);
          
          return; // Exit here - booking finalization handled by mutation
        }
        
        // CHECK 2: If no payment yet, create payment first (original flow)
        const petCount = rideRequestData?.selectedPatients?.length || 1;
        const serviceType = rideRequestData?.serviceType || 'General Check Up';
        
        // Calculate estimated cost (1 SAR per pet for Test Service)
        let estimatedCost = 1; // Default for Test Service
        if (serviceType === 'Test Service') {
          estimatedCost = petCount * 1; // 1 SAR per pet
        }
        
        // Get real customer details from user session
        const customerName = userSession?.user?.name || userSession?.user?.phone || 'Customer';
        const customerEmail = userSession?.user?.email || 'test@example.com';
        const customerPhone = userSession?.user?.phone || '+966000000000';
        
        console.log('💳 No payment detected, creating payment with real customer details:', {
          customerName,
          customerEmail,
          customerPhone: customerPhone?.substring(0, 8) + '...',
          amount: estimatedCost,
          serviceType,
          petCount
        });
        
        // Store booking details for after payment success
        const bookingDetails = {
          ...pendingBooking,
          estimatedCost,
          customerName,
          customerEmail,
          customerPhone,
          serviceType,
          selectedDate,
          rideRequestData
        };
        localStorage.setItem('pendingBookingDetails', JSON.stringify(bookingDetails));
        
        // Create payment with real customer details
        const response = await fetch('/api/public/payments/test-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            invoiceNumber: `VETSVAN-${Date.now()}`,
            amount: estimatedCost.toString(),
            customerName,
            customerEmail,
            customerPhone,
            description: `VetsVan Booking: ${serviceType} for ${petCount} pet(s) - ${pendingBooking.vetsVanCode}`,
            successUrl: `${window.location.origin}/payment-success?booking=true`,
            errorUrl: `${window.location.origin}/payment-error`
          })
        });

        const responseData = await response.json();

        if (responseData.success && responseData.data?.paymentUrl) {
          console.log('Payment link created successfully, redirecting to MyFatoorah...');
          
          toast({
            title: "Redirecting to Payment",
            description: "Please complete payment to confirm your booking.",
          });
          
          // Redirect to MyFatoorah payment page
          window.location.href = responseData.data.paymentUrl;
        } else {
          throw new Error(responseData.message || 'Failed to create payment link');
        }
        
      } catch (error: any) {
        console.error('Booking confirmation failed:', error);
        toast({
          title: "Booking Failed",
          description: error.message || "Failed to process booking. Please try again.",
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

  // Function to check if a time slot is available for a specific Vets Van
  const isTimeSlotAvailable = (vetsVanId: number, timeSlot: string): boolean => {
    // Find shift for this Vets Van on the selected date
    const shift = shifts.find(s => s.vetsVanId === vetsVanId && s.date === selectedDate);
    
    if (!shift || shift.status === 'cancelled') {
      return false; // No shift or cancelled shift means unavailable
    }
    
    // Convert time slot to 24-hour format for comparison
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
    
    const slotTime24 = convertTo24Hour(timeSlot);
    const shiftStart = shift.startTime;
    const shiftEnd = shift.endTime;
    
    // Check if the time slot falls within the shift time range
    // Handle cross-midnight shifts (e.g., 18:00 to 03:00)
    if (shiftEnd < shiftStart) {
      // Cross-midnight shift: time is available if it's after start OR before end
      return slotTime24 >= shiftStart || slotTime24 < shiftEnd;
    } else {
      // Normal shift: time is available if it's between start and end
      return slotTime24 >= shiftStart && slotTime24 < shiftEnd;
    }
  };

  // Function to check if a time slot is in the past
  const isTimeSlotInPast = (timeSlot: string, date: string): boolean => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    
    // If the selected date is before today, all slots are in the past
    if (date < currentDate) {
      return true;
    }
    
    // If the selected date is today, check if the time has passed
    if (date === currentDate) {
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
      
      const slotTime24 = convertTo24Hour(timeSlot);
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
      
      // Simple comparison - all slots on today's date follow normal time logic
      return slotTime24 <= currentTime;
    }
    
    // Future dates are not in the past
    return false;
  };

  // Function to check if a slot is already booked from server data
  const isSlotBooked = (vetsVanId: number, timeSlot: string): boolean => {
    // Convert time slot to 24-hour format for comparison
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

    const slotTime24 = convertTo24Hour(timeSlot);
    
    // Check if there's a booking for this VetsVan at this time
    return existingBookings.some((booking: any) => 
      booking.vetsVanId === vetsVanId && 
      booking.appointmentTime === slotTime24 &&
      booking.appointmentDate === selectedDate
    );
  };

  // Function to get availability status display
  const getAvailabilityStatus = (vetsVanId: number, timeSlot: string) => {
    const isAvailable = isTimeSlotAvailable(vetsVanId, timeSlot);
    const isPast = isTimeSlotInPast(timeSlot, selectedDate);
    const slotKey = `${vetsVanId}-${timeSlot}`;
    const isLocallyBooked = locallyBookedSlots.has(slotKey);
    const isServerBooked = isSlotBooked(vetsVanId, timeSlot);
    const isActuallyBooked = isLocallyBooked || isServerBooked;
    
    // Determine the display text based on availability and booking status
    let display = 'Available';
    if (isActuallyBooked) {
      display = 'Booked';
    } else if (!isAvailable) {
      display = '❌';
    }
    
    // Determine styling based on past status, availability, and booking status
    let className = '';
    let isClickable = false;
    
    if (isPast) {
      // Past slots: faded styling, not clickable
      if (isActuallyBooked) {
        className = 'text-gray-400 font-medium opacity-50 cursor-not-allowed bg-yellow-100';
      } else {
        className = isAvailable 
          ? 'text-gray-400 font-medium opacity-50 cursor-not-allowed bg-gray-50' 
          : 'text-gray-400 font-medium opacity-50 cursor-not-allowed bg-gray-100';
      }
    } else {
      // Current/future slots: normal styling
      if (isActuallyBooked) {
        className = 'text-yellow-700 font-medium cursor-not-allowed bg-yellow-200';
      } else if (isAvailable) {
        className = 'text-green-600 font-medium hover:text-green-700 hover:bg-green-50 cursor-pointer';
        isClickable = true;
      } else {
        className = 'text-red-500 font-bold cursor-not-allowed bg-red-50';
      }
    }
    
    return {
      isAvailable: isAvailable && !isActuallyBooked,
      isPast,
      isClickable: isClickable && !isActuallyBooked,
      display,
      className
    };
  };

  if (loadingVetsVans || loadingShifts || loadingBookings) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          {paymentSuccess ? (
            <div className="max-w-md mx-auto px-4">
              <p className="text-lg font-semibold text-green-600 mb-2">
                {language === 'ar' 
                  ? 'تم تأكيد الدفع بنجاح!' 
                  : 'Payment Confirmed Successfully!'}
              </p>
              <p className="text-gray-700 font-medium">
                {language === 'ar' 
                  ? 'لإتمام الحجز، يرجى الانتظار — سيتم متابعة الحجز قريباً' 
                  : 'To complete the booking, please wait — booking will continue shortly'}
              </p>
            </div>
          ) : (
            <p className="text-gray-600">
              {language === 'ar' ? 'جاري تحميل بيانات الحجز...' : 'Loading booking data...'}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="ltr">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Payment Success Banner */}
        {paymentSuccess && paymentReference && paymentId && (
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
                  Payment Reference: <span className="font-mono">{paymentReference}</span> | Payment ID: <span className="font-mono">{paymentId}</span>
                </p>
                {paymentAmount && paymentAmount > 0 && (
                  <p className="text-sm text-green-700 mt-1 font-semibold">
                    💰 Amount Paid: <span className="text-lg">{paymentAmount} {paymentCurrency}</span>
                  </p>
                )}
                <p className="text-sm text-green-600 mt-1">
                  Select your preferred time slot below and click "Confirm Booking" to complete your appointment.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vets Van Booking Schedule</h1>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                Available Vets Vans: {availableVetsVans.length} | Total: {vetsVans.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Shifts loaded: {shifts.length} for {selectedDate}
                {loadingShifts && <span className="ml-2 text-blue-600">(Loading shifts...)</span>}
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

        {/* Ride Request Summary */}
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
                {/* Selected Pets */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-sm font-medium text-gray-700 min-w-[100px]">
                    Selected Pets:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPets.map((pet, index) => (
                      <span key={pet.id} className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm font-medium text-purple-700 border border-purple-300">
                        <span>{pet.name}</span>
                        <span className="text-base">{getPetEmoji(pet.type)}</span>
                        {index < selectedPets.length - 1 && <span className="text-purple-400">,</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Service Type */}
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

                {/* Location */}
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
        
        {/* Table Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full table-auto min-w-max" style={{ direction: 'ltr' }}>
            <colgroup>
              <col style={{ width: '150px' }} />
              {availableVetsVans.map((van) => (
                <col key={van.id} style={{ width: '200px' }} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-r-2 border-gray-400 sticky left-0 bg-gray-50" style={{ textAlign: 'left' }}>
                  Time
                </th>
                {availableVetsVans.map((van, index) => (
                  <th 
                    key={van.id} 
                    className={`px-6 py-4 text-center text-sm font-semibold text-gray-900 ${
                      index < availableVetsVans.length - 1 ? 'border-r border-gray-300' : ''
                    }`}
                    style={{ textAlign: 'center' }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-purple-600 font-bold">{van.vetsvanCode}</span>
                      <span className="text-xs text-gray-500 mt-1">{van.vetsvanName}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot, index) => (
                <tr key={timeSlot} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4 text-left text-sm text-gray-900 font-medium border-r-2 border-gray-400 sticky left-0 bg-inherit" style={{ textAlign: 'left' }}>
                    {timeSlot}
                  </td>
                  {availableVetsVans.map((van, vanIndex) => {
                    const availability = getAvailabilityStatus(van.id, timeSlot);
                    return (
                      <td 
                        key={van.id} 
                        className={`px-6 py-4 text-center text-sm transition-colors ${
                          vanIndex < availableVetsVans.length - 1 ? 'border-r border-gray-300' : ''
                        } ${availability.isClickable ? 'hover:bg-purple-50' : ''}`}
                        style={{ textAlign: 'center' }}
                        onClick={() => {
                          if (availability.isClickable && !availability.isPast && !isBooking && !createBookingMutation.isPending) {
                            // Show confirmation dialog before booking
                            setPendingBooking({
                              vetsVanId: van.id,
                              timeSlot: timeSlot,
                              vetsVanCode: van.vetsvanCode
                            });
                            setShowConfirmDialog(true);
                          }
                        }}
                      >
                        <div className={`w-full h-full min-h-[40px] flex items-center justify-center ${availability.className} px-2 py-1 rounded`}>
                          {(isBooking || createBookingMutation.isPending) && availability.isClickable && !availability.isPast ? (
                            <div className="flex items-center gap-1">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
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

        {/* No Vets Vans Message */}
        {availableVetsVans.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🚐</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Available Vets Vans
            </h3>
            <p className="text-gray-600">
              {vetsVans.length === 0 
                ? 'No Vets Vans are configured in the system.'
                : 'All Vets Vans are currently unavailable. Please check back later.'}
            </p>
          </div>
        )}

      </div>

      {/* Booking Confirmation Dialog */}
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
                
                {/* Payment Amount Display */}
                {rideRequestData && rideRequestData.estimatedCost !== undefined && (
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
}