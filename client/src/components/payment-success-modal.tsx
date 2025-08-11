import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Receipt, Download, Share, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentReference?: string;
  bookingId?: number;
  amount?: string;
}

export function PaymentSuccessModal({ 
  isOpen, 
  onClose, 
  paymentReference, 
  bookingId,
  amount = "1.00 SAR" 
}: PaymentSuccessModalProps) {
  const [, navigate] = useLocation();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && paymentReference) {
      fetchPaymentDetails();
    }
  }, [isOpen, paymentReference]);

  const fetchPaymentDetails = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(`/api/payments/verify/${paymentReference}`);
      if (response.success) {
        setPaymentDetails(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = () => {
    if (bookingId) {
      navigate(`/invoice/${bookingId}`);
    }
    onClose();
  };

  const handleGoToDashboard = () => {
    navigate('/admin-dashboard');
    onClose();
  };

  const handleNewBooking = () => {
    navigate('/vetsvan-booking');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-green-800">
            دفع ناجح!
            <br />
            Payment Successful!
          </DialogTitle>
          <DialogDescription className="text-lg">
            تم تأكيد دفعتك بنجاح
            <br />
            Your payment has been confirmed successfully
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment Summary */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-green-800">المبلغ المدفوع / Amount Paid</span>
                <span className="text-xl font-bold text-green-800">{amount}</span>
              </div>
              
              {paymentDetails && (
                <>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">الحالة / Status:</span>
                      <div className="font-medium text-green-600">{paymentDetails.status || 'مكتمل / Completed'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">الطريقة / Method:</span>
                      <div className="font-medium">{paymentDetails.paymentMethod || 'MyFatoorah'}</div>
                    </div>
                  </div>
                  
                  {paymentDetails.transactionId && (
                    <div className="mt-2 pt-2 border-t border-green-300">
                      <span className="text-xs text-gray-600">رقم المعاملة / Transaction ID:</span>
                      <div className="font-mono text-xs text-green-700">{paymentDetails.transactionId}</div>
                    </div>
                  )}
                </>
              )}
              
              {loading && (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                  <span className="ml-2 text-sm text-green-600">جاري التحقق... / Verifying...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Success Message */}
          <div className="text-center bg-blue-50 p-4 rounded-lg">
            <Receipt className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-800">
              تم إرسال تأكيد الدفع عبر البريد الإلكتروني
              <br />
              Payment confirmation sent via email
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            {bookingId && (
              <Button 
                onClick={handleViewInvoice}
                className="bg-purple-600 hover:bg-purple-700 w-full"
              >
                <Receipt className="w-4 h-4 ml-2" />
                عرض الفاتورة / View Invoice
              </Button>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleNewBooking}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                حجز جديد / New Booking
              </Button>
              
              <Button 
                onClick={handleGoToDashboard}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                لوحة التحكم / Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-center pt-2">
          <Button 
            onClick={onClose}
            variant="ghost"
            className="text-gray-500 hover:text-gray-700"
          >
            إغلاق / Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}