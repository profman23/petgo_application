import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Receipt, ArrowLeft, ExternalLink, Copy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PaymentSuccessModal } from "@/components/payment-success-modal";

export function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Parse URL parameters to get payment information
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('paymentId');
    const transactionId = urlParams.get('transactionId');
    const invoiceId = urlParams.get('invoiceId');
    const ref = urlParams.get('ref');
    const isBooking = urlParams.get('booking') === 'true'; // Check if this is a VetsVan booking payment
    
    console.log('Payment success callback received:', {
      paymentId,
      transactionId,
      invoiceId,
      ref,
      isBooking,
      fullUrl: window.location.href
    });

    // Auto-show modal for successful payments - enhanced logic
    const paymentRef = paymentId || transactionId || invoiceId || ref || 'test-payment';
    const source = urlParams.get('source');
    
    // Handle VetsVan booking after successful payment
    if (isBooking && source === 'myfatoorah') {
      console.log('🎯 VetsVan booking payment success detected! Creating booking...');
      createVetsVanBooking(paymentRef);
    }
    // Show modal immediately if coming from MyFatoorah
    else if (source === 'myfatoorah') {
      console.log('🎯 Payment success from MyFatoorah detected!');
      setPaymentData({
        success: true,
        message: 'Payment completed successfully via MyFatoorah',
        amount: '1.00 SAR',
        transactionId: paymentRef,
        paymentMethod: 'MyFatoorah'
      });
      setLoading(false);
      setShowModal(true); // Show immediately
      
      // Clean URL parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } else if (paymentRef) {
      // Regular verification flow
      verifyPayment(paymentRef);
      setTimeout(() => setShowModal(true), 500);
    } else {
      // Fallback success
      setPaymentData({
        success: true,
        message: 'Payment completed successfully',
        amount: '1.00 SAR'
      });
      setLoading(false);
      setTimeout(() => setShowModal(true), 500);
    }
  }, []);

  // Create VetsVan booking after successful payment
  const createVetsVanBooking = async (paymentRef: string) => {
    try {
      // Get stored booking details
      const storedBookingDetails = localStorage.getItem('pendingBookingDetails');
      if (!storedBookingDetails) {
        throw new Error('No booking details found');
      }

      const bookingDetails = JSON.parse(storedBookingDetails);
      console.log('Creating VetsVan booking with details:', bookingDetails);

      // Get authentication token
      const customerToken = localStorage.getItem('customer-token') || localStorage.getItem('authToken');
      if (!customerToken) {
        throw new Error('Authentication required');
      }

      // First, get the shifts to find the correct shiftId
      const shiftsResponse = await fetch('/api/vetsvan/shifts', {
        headers: {
          'Authorization': `Bearer ${customerToken}`,
        }
      });
      
      if (!shiftsResponse.ok) {
        throw new Error('Failed to fetch shifts');
      }
      
      const shifts = await shiftsResponse.json();
      
      // Find the shift for this VetsVan and date
      const shift = shifts.find((s: any) => 
        s.vetsVanId === bookingDetails.vetsVanId && 
        s.date === bookingDetails.selectedDate
      );
      
      if (!shift) {
        throw new Error('No shift found for selected date and VetsVan');
      }

      // Create the booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          shiftId: shift.id,
          vetsVanId: bookingDetails.vetsVanId,
          appointmentDate: bookingDetails.selectedDate,
          appointmentTime: convertTo24Hour(bookingDetails.timeSlot),
          customerLocation: bookingDetails.rideRequestData ? {
            latitude: bookingDetails.rideRequestData.pickupLatitude,
            longitude: bookingDetails.rideRequestData.pickupLongitude,
            address: bookingDetails.rideRequestData.location || null
          } : null,
          selectedPets: bookingDetails.rideRequestData?.selectedPatients || [],
          serviceType: bookingDetails.serviceType || 'general_checkup',
          paymentReference: paymentRef,
          amount: bookingDetails.estimatedCost
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create booking');
      }

      const bookingResult = await response.json();
      console.log('✅ VetsVan booking created successfully:', bookingResult);

      // Clear stored booking details
      localStorage.removeItem('pendingBookingDetails');

      // Set success data with booking information
      setPaymentData({
        success: true,
        message: 'Payment completed and booking confirmed!',
        amount: `${bookingDetails.estimatedCost}.00 SAR`,
        transactionId: paymentRef,
        paymentMethod: 'MyFatoorah',
        booking: bookingResult.booking
      });
      setLoading(false);
      setShowModal(true);

      // Clean URL parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // Show success toast
      toast({
        title: "Booking Confirmed!",
        description: `Your appointment has been booked for ${bookingDetails.timeSlot} on ${bookingDetails.selectedDate}`,
      });

    } catch (error: any) {
      console.error('Failed to create VetsVan booking:', error);
      
      // Still show payment success but with booking error
      setPaymentData({
        success: true,
        message: 'Payment completed but booking failed. Please contact support.',
        amount: '1.00 SAR',
        transactionId: paymentRef,
        paymentMethod: 'MyFatoorah',
        error: error.message
      });
      setLoading(false);
      setShowModal(true);

      toast({
        title: "Booking Error",
        description: error.message || "Payment successful but booking failed. Please contact support.",
        variant: "destructive"
      });
    }
  };

  // Helper function to convert 12-hour to 24-hour time
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

  const verifyPayment = async (paymentId: string) => {
    try {
      const response = await apiRequest(`/api/payments/verify/${paymentId}`);
      if (response.success) {
        setPaymentData(response.data);
      } else {
        setPaymentData({
          success: true,
          message: 'Payment verification pending',
          paymentId
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentData({
        success: true,
        message: 'Payment completed - verification pending',
        paymentId
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const copyTransactionId = () => {
    if (paymentData?.transactionId) {
      navigator.clipboard.writeText(paymentData.transactionId);
      toast({
        title: "تم النسخ / Copied",
        description: "Transaction ID copied to clipboard",
        variant: "default"
      });
    }
  };

  return (
    <>
      <PaymentSuccessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        paymentReference={paymentData?.transactionId || 'test-payment'}
        amount={paymentData?.amount || '1.00 SAR'}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-lg">
            Your MyFatoorah test payment has been completed
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {paymentData && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className="text-green-600 font-semibold">
                  {paymentData.status || 'Completed'}
                </span>
              </div>
              
              {paymentData.amount && (
                <div className="flex justify-between">
                  <span className="font-medium">Amount:</span>
                  <span className="font-semibold">{paymentData.amount}</span>
                </div>
              )}
              
              {paymentData.transactionId && (
                <div className="flex justify-between">
                  <span className="font-medium">Transaction ID:</span>
                  <span className="text-sm font-mono">
                    {paymentData.transactionId}
                  </span>
                </div>
              )}
              
              {paymentData.paymentId && (
                <div className="flex justify-between">
                  <span className="font-medium">Payment ID:</span>
                  <span className="text-sm font-mono">
                    {paymentData.paymentId}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className="text-center text-sm text-gray-600">
            <Receipt className="w-4 h-4 inline-block mr-1" />
            MyFatoorah Payment Gateway Integration Test
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/payment-test')} 
              variant="outline" 
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Test Again
            </Button>
            
            <Button 
              onClick={() => navigate('/admin-dashboard')} 
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}

export default PaymentSuccess;