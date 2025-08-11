import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, AlertTriangle, ArrowLeft } from "lucide-react";

export function PaymentError() {
  const [, navigate] = useLocation();
  const [errorData, setErrorData] = useState<any>(null);

  useEffect(() => {
    // Parse URL parameters to get error information
    const urlParams = new URLSearchParams(window.location.search);
    const errorCode = urlParams.get('errorCode');
    const errorMessage = urlParams.get('errorMessage');
    const paymentId = urlParams.get('paymentId');
    
    console.log('Payment error callback received:', {
      errorCode,
      errorMessage,
      paymentId,
      fullUrl: window.location.href
    });

    setErrorData({
      errorCode: errorCode || 'PAYMENT_FAILED',
      errorMessage: errorMessage || 'Payment could not be processed',
      paymentId: paymentId || null
    });
  }, []);

  const getErrorMessage = () => {
    if (errorData?.errorMessage) {
      return errorData.errorMessage;
    }
    
    switch (errorData?.errorCode) {
      case 'CANCELLED':
        return 'Payment was cancelled by user';
      case 'TIMEOUT':
        return 'Payment session expired';
      case 'INSUFFICIENT_FUNDS':
        return 'Insufficient funds in account';
      case 'INVALID_CARD':
        return 'Invalid card information';
      default:
        return 'Payment could not be processed';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">
            Payment Failed
          </CardTitle>
          <CardDescription className="text-lg">
            There was an issue processing your payment
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {errorData && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-red-800 mb-1">
                    Error Details
                  </div>
                  <p className="text-red-700 text-sm">
                    {getErrorMessage()}
                  </p>
                  
                  {errorData.errorCode && (
                    <p className="text-red-600 text-xs mt-2 font-mono">
                      Code: {errorData.errorCode}
                    </p>
                  )}
                  
                  {errorData.paymentId && (
                    <p className="text-red-600 text-xs mt-1 font-mono">
                      Reference: {errorData.paymentId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-600">
            You can try again or contact support if the issue persists
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/payment-test')} 
              variant="outline" 
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Try Again
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
  );
}

export default PaymentError;