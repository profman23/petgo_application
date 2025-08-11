import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PaymentSuccessModal } from "./payment-success-modal";

interface PaymentStatusTrackerProps {
  children: React.ReactNode;
}

export function PaymentStatusTracker({ children }: PaymentStatusTrackerProps) {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for payment success from URL parameters
    const checkPaymentSuccess = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const source = urlParams.get('source');
      const ref = urlParams.get('ref');
      const paymentId = urlParams.get('paymentId');
      const transactionId = urlParams.get('transactionId');
      
      // Only trigger if coming from MyFatoorah
      if (source === 'myfatoorah' && (ref || paymentId || transactionId)) {
        const paymentRef = paymentId || transactionId || ref;
        
        setPaymentData({
          transactionId: paymentRef,
          amount: '1.00 SAR', // This would be parsed from URL or fetched from API
          status: 'completed',
          paymentMethod: 'MyFatoorah'
        });
        
        setShowSuccessModal(true);
        
        // Clean URL parameters after showing modal
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Show toast notification
        toast({
          title: "دفع ناجح / Payment Successful",
          description: "Payment has been processed successfully",
          variant: "default"
        });
      }
    };

    checkPaymentSuccess();
  }, [toast]);

  return (
    <>
      {children}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        paymentReference={paymentData?.transactionId || 'payment-success'}
        amount={paymentData?.amount || '1.00 SAR'}
      />
    </>
  );
}