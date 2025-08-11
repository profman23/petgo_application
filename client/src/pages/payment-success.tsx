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
    
    console.log('Payment success callback received:', {
      paymentId,
      transactionId,
      invoiceId,
      ref,
      fullUrl: window.location.href
    });

    // Auto-show modal for successful payments
    const paymentRef = paymentId || transactionId || invoiceId || ref || 'test-payment';
    
    if (paymentRef) {
      // Verify payment status with backend
      verifyPayment(paymentRef);
      // Show success modal automatically
      setTimeout(() => setShowModal(true), 500);
    } else {
      // No payment ID found, show generic success
      setPaymentData({
        success: true,
        message: 'Payment completed successfully',
        amount: '1.00 SAR'
      });
      setLoading(false);
      setTimeout(() => setShowModal(true), 500);
    }
  }, []);

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