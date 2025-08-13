import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Stethoscope } from "lucide-react";
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

  // Check for payment success/error on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      // Payment successful - complete the booking
      handlePaymentSuccess();
    } else if (paymentStatus === 'error') {
      // Payment failed
      toast({
        title: "Payment Failed",
        description: "Your payment could not be processed. Please try again.",
        variant: "destructive",
      });
      
      // Clear pending booking data
      localStorage.removeItem('pendingVetsVanBooking');
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle successful payment and create booking
  const handlePaymentSuccess = async () => {
    try {
      const pendingBookingStr = localStorage.getItem('pendingVetsVanBooking');
      if (!pendingBookingStr) {
        throw new Error('No pending booking found');
      }

      const bookingDraft = JSON.parse(pendingBookingStr);
      const customerToken = localStorage.getItem('token');
      
      if (!customerToken) {
        throw new Error('Authentication required');
      }

      // Create the actual booking now that payment is complete
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          shiftId: bookingDraft.shiftId,
          vetsVanId: bookingDraft.vetsVanId,
          appointmentDate: bookingDraft.appointmentDate,
          appointmentTime: bookingDraft.appointmentTime,
          customerLocation: bookingDraft.rideRequestData ? {
            latitude: bookingDraft.rideRequestData.pickupLatitude,
            longitude: bookingDraft.rideRequestData.pickupLongitude,
            address: bookingDraft.rideRequestData.location || null
          } : null,
          selectedPets: bookingDraft.rideRequestData?.selectedPatients ? 
            patients.filter(p => bookingDraft.rideRequestData.selectedPatients.includes(p.id)) : [],
          serviceType: bookingDraft.rideRequestData?.serviceType || 'general_checkup',
          paymentStatus: 'paid',
          paymentAmount: bookingDraft.estimatedCost,
          invoiceId: bookingDraft.invoiceId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create booking after payment');
      }

      const bookingResult = await response.json();

      // Success - show message and refresh data
      toast({
        title: "Payment Successful!",
        description: `Your appointment has been booked for ${bookingDraft.timeSlot} on ${bookingDraft.appointmentDate}. VetsVan ${bookingDraft.vetsVanCode} will visit you.`,
      });

      // Clear pending booking data
      localStorage.removeItem('pendingVetsVanBooking');
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/vetsvan/shifts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/date'] });
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      console.log('✅ Booking completed after payment:', bookingResult);
      
    } catch (error: any) {
      console.error('❌ Failed to complete booking after payment:', error);
      toast({
        title: "Booking Error",
        description: error.message || "Payment was successful but booking creation failed. Please contact support.",
        variant: "destructive",
      });
      
      // Clean URL but keep pending booking for retry
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

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

  // Generate time slots from 9:00 AM to 9:00 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 21; hour++) {
      const time12hour = hour > 12 ? `${hour - 12}:00 PM` : 
                        hour === 12 ? `${hour}:00 PM` : 
                        `${hour}:00 AM`;
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

  // Helper function to calculate estimated cost based on pet count and service type
  const getEstimatedCost = (petCount: number, serviceType?: string): number => {
    if (serviceType === 'test') {
      if (petCount === 1) return 1;
      if (petCount <= 3) return 3;
      if (petCount === 4) return 4;
      return 5; // 5+ pets
    }
    
    // Default pricing for first-visit, general-checkup, home-consultation
    if (petCount <= 2) return 172.5;
    if (petCount <= 4) return 345;
    return 517.5; // 5+ pets
  };

  // Get estimated cost from ride request data
  const getBookingEstimatedCost = (): number | null => {
    if (!rideRequestData || !rideRequestData.selectedPatients) {
      return null;
    }
    
    const supportedServices = ['first-visit', 'general-checkup', 'home-consultation', 'test'];
    if (!supportedServices.includes(rideRequestData.serviceType)) {
      return null;
    }
    
    return getEstimatedCost(rideRequestData.selectedPatients.length, rideRequestData.serviceType);
  };

  // Create payment and booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async ({ vetsVanId, timeSlot, vetsVanCode }: { vetsVanId: number; timeSlot: string; vetsVanCode: string }) => {
      const customerToken = localStorage.getItem('token');
      
      if (!customerToken) {
        throw new Error('Authentication required');
      }

      // Validate estimated cost exists
      const estimatedCost = getBookingEstimatedCost();
      if (!estimatedCost) {
        throw new Error('Unable to determine cost. Please go back to the ride request page and select a supported service type.');
      }

      // Get user info for payment
      const userResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to get user information');
      }
      
      const user = await userResponse.json();

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

      // Create payment with MyFatoorah
      const paymentData = {
        amount: estimatedCost,
        customerName: user.name || user.username || 'VetsVan Customer',
        customerMobile: user.phone || '',
        customerEmail: user.email || '',
        callBackUrl: `${window.location.origin}/vetsvan-booking?payment=success`,
        errorUrl: `${window.location.origin}/vetsvan-booking?payment=error`,
        metadata: {
          vetsVanId: vetsVanId,
          vetsVanCode: vetsVanCode,
          timeSlot: timeSlot,
          appointmentTime: appointmentTime24,
          appointmentDate: selectedDate,
          serviceType: rideRequestData?.serviceType,
          petsCount: rideRequestData?.selectedPatients?.length || 0,
          shiftId: shift.id,
          customerLocation: rideRequestData ? {
            latitude: rideRequestData.pickupLatitude,
            longitude: rideRequestData.pickupLongitude,
            address: rideRequestData.location || null
          } : null,
          selectedPets: rideRequestData?.selectedPatients ? 
            patients.filter(p => rideRequestData.selectedPatients.includes(p.id)) : []
        }
      };

      const paymentResponse = await fetch('/api/public/payments/test-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceNumber: `VB-${Date.now()}-${vetsVanCode}`,
          amount: estimatedCost.toString(),
          customerName: paymentData.customerName,
          customerEmail: paymentData.customerEmail || `customer-${user.id}@vetsvan.app`,
          customerPhone: paymentData.customerMobile || '966500000000',
          description: `VetsVan Booking - ${vetsVanCode} on ${selectedDate} at ${timeSlot}`,
          callBackUrl: `${window.location.origin}/vetsvan-booking?payment=success`,
          errorUrl: `${window.location.origin}/vetsvan-booking?payment=error`
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create payment');
      }

      const paymentResult = await paymentResponse.json();
      
      if (!paymentResult.success || !paymentResult.data?.paymentUrl) {
        throw new Error('Failed to create payment URL');
      }

      // Store booking details in localStorage for later completion after payment
      const bookingDraft = {
        vetsVanId,
        vetsVanCode,
        timeSlot,
        appointmentTime: appointmentTime24,
        appointmentDate: selectedDate,
        shiftId: shift.id,
        estimatedCost,
        paymentUrl: paymentResult.data.paymentUrl,
        invoiceId: paymentResult.data.invoiceId,
        rideRequestData
      };
      
      localStorage.setItem('pendingVetsVanBooking', JSON.stringify(bookingDraft));
      
      return { 
        paymentUrl: paymentResult.data.paymentUrl,
        invoiceId: paymentResult.data.invoiceId 
      };
    },
    onSuccess: (data) => {
      console.log('✅ Payment URL created:', data.paymentUrl);
      
      // Redirect to MyFatoorah payment page
      window.location.href = data.paymentUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to create payment. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsBooking(false);
    }
  });

  // Handle confirmation dialog actions
  const handleConfirmBooking = () => {
    if (pendingBooking) {
      setIsBooking(true);
      setShowConfirmDialog(false);
      
      // Add to locally booked slots immediately for visual feedback
      const slotKey = `${pendingBooking.vetsVanId}-${pendingBooking.timeSlot}`;
      setLocallyBookedSlots(prev => {
        const newSet = new Set(prev);
        newSet.add(slotKey);
        return newSet;
      });
      
      // Create booking for the selected time slot
      createBookingMutation.mutate(pendingBooking);
      
      // Clear pending booking
      setPendingBooking(null);
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
    return slotTime24 >= shiftStart && slotTime24 < shiftEnd;
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
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center" dir="ltr">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="ltr">
      <div className="max-w-7xl mx-auto px-4">
        
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
                <div className="flex items-center justify-between">
                  <p className="text-sm text-purple-600 font-medium">
                    Please select your preferred appointment time from the schedule below.
                  </p>
                  {getBookingEstimatedCost() && (
                    <span className="inline-flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full text-sm font-bold text-purple-800">
                      💰 {getBookingEstimatedCost()} SAR
                    </span>
                  )}
                </div>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingBooking && getBookingEstimatedCost() ? (
                <div className="space-y-3">
                  <p>You are about to book:</p>
                  <div className="bg-purple-50 p-3 rounded-lg space-y-2 text-sm">
                    <div><strong>VetsVan:</strong> {pendingBooking.vetsVanCode}</div>
                    <div><strong>Date & Time:</strong> {selectedDate} at {pendingBooking.timeSlot}</div>
                    <div><strong>Service:</strong> {getServiceTypeDisplay(rideRequestData?.serviceType || '')}</div>
                    <div><strong>Pets:</strong> {rideRequestData?.selectedPatients?.length || 0} pet(s)</div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <strong>Total Amount:</strong>
                      <span className="text-lg font-bold text-purple-800">{getBookingEstimatedCost()} SAR</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">You will be redirected to MyFatoorah to complete the payment.</p>
                </div>
              ) : (
                "Are you sure you want to book this time slot?"
              )}
              {pendingBooking && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 text-sm text-purple-800">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">VetsVan:</span>
                      <span>{pendingBooking.vetsVanCode}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Time:</span>
                      <span>{pendingBooking.timeSlot}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Date:</span>
                      <span>{selectedDate}</span>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelBooking}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmBooking}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Confirm Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}