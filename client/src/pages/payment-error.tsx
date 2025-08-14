import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2 } from "lucide-react";
import { useLanguage, getDirection, getTextAlign } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function PaymentError() {
  const [, navigate] = useLocation();
  const [isRetrying, setIsRetrying] = useState(false);
  const { language } = useLanguage();
  const { toast } = useToast();

  // جلب بيانات المستخدم للدفع
  const { data: userSession } = useQuery<{user?: {name?: string, phone?: string, email?: string}}>({
    queryKey: ['/api/auth/session'],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleTryAgain = async () => {
    setIsRetrying(true);
    
    try {
      // استرجاع بيانات الطلب المحفوظة من localStorage
      const pendingRequestData = localStorage.getItem('pendingRequest');
      
      if (!pendingRequestData) {
        throw new Error(language === 'ar' ? 
          'لا توجد بيانات طلب محفوظة' : 
          'No stored request data found');
      }

      const requestData = JSON.parse(pendingRequestData);
      const { estimatedCost, serviceType, selectedPatients } = requestData;

      if (!estimatedCost || estimatedCost <= 0) {
        throw new Error(language === 'ar' ? 
          'لا يمكن تحديد تكلفة الخدمة' : 
          'Cannot determine service cost');
      }

      // إعداد بيانات المستخدم للدفع
      const customerName = userSession?.user?.name || userSession?.user?.phone || 'Customer';
      const customerEmail = userSession?.user?.email || 'test@example.com';
      const customerPhone = userSession?.user?.phone || '+966000000000';
      
      console.log('Recreating payment with cost:', estimatedCost);
      
      // إعادة إنشاء رابط الدفع
      const response = await fetch('/api/public/payments/test-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceNumber: `RIDE-RETRY-${Date.now()}`,
          amount: estimatedCost.toString(),
          customerName,
          customerEmail,
          customerPhone,
          description: `VetsVan Service Retry: ${serviceType} for ${selectedPatients?.length || 1} pet(s)`,
          successUrl: `${window.location.origin}/vetsvan-booking?payment=success`,
          errorUrl: `${window.location.origin}/payment-error`
        })
      });

      const responseData = await response.json();

      if (responseData.success && responseData.data?.paymentUrl) {
        console.log('Payment link recreated successfully:', responseData.data.paymentUrl);
        
        toast({
          title: language === 'ar' ? 'جاري إعادة التوجه للدفع' : 'Redirecting to Payment',
          description: language === 'ar' ? 
            `تكلفة الخدمة: ${estimatedCost} ريال` : 
            `Service cost: ${estimatedCost} SAR`,
        });
        
        // التوجه مباشرة لصفحة الدفع
        window.location.href = responseData.data.paymentUrl;
      } else {
        throw new Error(responseData.message || 'Payment link recreation failed');
      }
    } catch (error: any) {
      console.error('Payment recreation error:', error);
      toast({
        title: language === 'ar' ? 'خطأ في إعادة الدفع' : 'Payment Recreation Error',
        description: language === 'ar' ? 
          'لا يمكن إعادة إنشاء رابط الدفع' : 
          "Couldn't recreate payment link",
        variant: 'destructive'
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const direction = getDirection(language);
  const textAlign = getTextAlign(language);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4" dir={direction}>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800" style={{
            fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive',
            textAlign
          }}>
            {language === 'ar' ? 'فشل الدفع' : 'Payment Failed'}
          </CardTitle>
          <CardDescription className="text-lg" style={{ textAlign }}>
            {language === 'ar' ? 
              'حدثت مشكلة أثناء معالجة الدفع' : 
              'There was an issue processing your payment'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-gray-600" style={{ textAlign }}>
            {language === 'ar' ? 
              'يمكنك المحاولة مرة أخرى بنفس المبلغ' : 
              'You can try again with the same amount'}
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={handleTryAgain}
              disabled={isRetrying}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 min-w-[200px] flex items-center justify-center gap-2"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {language === 'ar' ? 'جاري إعادة الإنشاء...' : 'Creating...'}
                  </span>
                </>
              ) : (
                <span style={{
                  fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                }}>
                  {language === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentError;