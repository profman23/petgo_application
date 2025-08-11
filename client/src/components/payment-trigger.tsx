import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle } from "lucide-react";
import { PaymentSuccessModal } from "./payment-success-modal";

interface PaymentTriggerProps {
  amount?: string;
  bookingId?: number;
  onPaymentSuccess?: (paymentData: any) => void;
}

export function PaymentTrigger({ 
  amount = "1.00 SAR", 
  bookingId,
  onPaymentSuccess 
}: PaymentTriggerProps) {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const simulatePaymentSuccess = () => {
    setIsProcessing(true);
    
    // Simulate payment processing time
    setTimeout(() => {
      setIsProcessing(false);
      
      // Simulate successful payment data
      const paymentData = {
        transactionId: `TXN-${Date.now()}`,
        amount: amount,
        status: 'completed',
        paymentMethod: 'MyFatoorah Gateway',
        paidAt: new Date().toISOString()
      };
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Callback for parent component
      if (onPaymentSuccess) {
        onPaymentSuccess(paymentData);
      }
    }, 2000);
  };

  return (
    <>
      <Card className="mb-6 bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            محاكي نجاح الدفع / Payment Success Simulator
          </CardTitle>
          <CardDescription className="text-green-700">
            اختبر تجربة نجاح الدفع داخل التطبيق
            <br />
            Test the in-app payment success experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm text-gray-600">المبلغ / Amount:</span>
              <div className="text-lg font-bold text-green-800">{amount}</div>
            </div>
            {bookingId && (
              <div>
                <span className="text-sm text-gray-600">رقم الحجز / Booking ID:</span>
                <div className="text-sm font-mono text-gray-800">{bookingId}</div>
              </div>
            )}
          </div>
          
          <Button 
            onClick={simulatePaymentSuccess}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                معالجة... / Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                محاكاة نجاح الدفع / Simulate Payment Success
              </>
            )}
          </Button>
          
          <p className="text-xs text-green-600 mt-2 text-center">
            سيعرض نافذة تأكيد نجاح الدفع داخل التطبيق
            <br />
            Will show in-app payment success confirmation
          </p>
        </CardContent>
      </Card>

      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        paymentReference={`test-${Date.now()}`}
        bookingId={bookingId}
        amount={amount}
      />
    </>
  );
}