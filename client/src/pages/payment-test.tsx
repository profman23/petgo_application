import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLanguage } from '@/lib/i18n';
import { CreditCard, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PaymentTest() {
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const createRealPaymentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/payment/test-real', {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      setPaymentUrl(data.paymentUrl);
      toast({
        title: language === 'ar' ? 'تم إنشاء رابط الدفع' : 'Payment Link Created',
        description: language === 'ar' ? 'رابط الدفع الحقيقي جاهز' : 'Real payment link is ready',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في إنشاء الدفع' : 'Payment Creation Error',
        description: error.message || (language === 'ar' ? 'فشل في إنشاء رابط الدفع' : 'Failed to create payment link'),
        variant: 'destructive'
      });
    }
  });

  const handleCreatePayment = () => {
    createRealPaymentMutation.mutate();
  };

  const handleOpenPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${language === 'ar' ? 'text-right' : 'text-left'} text-gray-900 mb-2`}>
            {language === 'ar' ? 'اختبار الدفع الحقيقي' : 'Real Payment Test'}
          </h1>
          <p className={`text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'اختبار دفع حقيقي بقيمة 1 ريال سعودي' : 'Real payment test with 1 SAR'}
          </p>
        </div>

        {/* Warning Card */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              {language === 'ar' ? 'تحذير مهم' : 'Important Warning'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-700">
            <p className={language === 'ar' ? 'text-right' : 'text-left'}>
              {language === 'ar' 
                ? 'هذا دفع حقيقي بقيمة 1 ريال سعودي. سيتم خصم المبلغ من بطاقتك الائتمانية فعلياً. استخدم هذا الاختبار فقط للتأكد من عمل النظام.'
                : 'This is a real payment of 1 SAR. The amount will be actually charged to your credit card. Use this test only to verify the system is working.'
              }
            </p>
          </CardContent>
        </Card>

        {/* Main Payment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-purple-600" />
              {language === 'ar' ? 'اختبار الدفع الحقيقي' : 'Real Payment Test'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'إنشاء دفع حقيقي بقيمة 1 ريال سعودي عبر MyFatoorah'
                : 'Create a real payment of 1 SAR through MyFatoorah'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Payment Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">
                {language === 'ar' ? 'تفاصيل الدفع' : 'Payment Details'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{language === 'ar' ? 'المبلغ:' : 'Amount:'}</span>
                  <span className="font-bold text-green-600">1 ريال سعودي</span>
                </div>
                <div className="flex justify-between">
                  <span>{language === 'ar' ? 'نوع الدفع:' : 'Payment Type:'}</span>
                  <span>{language === 'ar' ? 'دفع حقيقي' : 'Real Payment'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{language === 'ar' ? 'المنصة:' : 'Platform:'}</span>
                  <span>MyFatoorah</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-4">
              {!paymentUrl ? (
                <Button 
                  onClick={handleCreatePayment}
                  disabled={createRealPaymentMutation.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {createRealPaymentMutation.isPending ? (
                    language === 'ar' ? 'جاري إنشاء رابط الدفع...' : 'Creating payment link...'
                  ) : (
                    language === 'ar' ? 'إنشاء رابط الدفع الحقيقي' : 'Create Real Payment Link'
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600 justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">
                      {language === 'ar' ? 'تم إنشاء رابط الدفع بنجاح' : 'Payment link created successfully'}
                    </span>
                  </div>
                  
                  <Button 
                    onClick={handleOpenPayment}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {language === 'ar' ? 'فتح صفحة الدفع (1 ريال)' : 'Open Payment Page (1 SAR)'}
                  </Button>
                  
                  <Button 
                    onClick={() => setPaymentUrl(null)}
                    variant="outline"
                    className="w-full"
                  >
                    {language === 'ar' ? 'إنشاء رابط جديد' : 'Create New Link'}
                  </Button>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">
                {language === 'ar' ? 'تعليمات الاختبار:' : 'Test Instructions:'}
              </h4>
              <ol className={`text-sm text-blue-700 space-y-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <li>{language === 'ar' ? '1. اضغط على "إنشاء رابط الدفع الحقيقي"' : '1. Click "Create Real Payment Link"'}</li>
                <li>{language === 'ar' ? '2. سيتم توجيهك لصفحة MyFatoorah' : '2. You will be redirected to MyFatoorah page'}</li>
                <li>{language === 'ar' ? '3. أدخل بيانات بطاقتك الائتمانية' : '3. Enter your credit card details'}</li>
                <li>{language === 'ar' ? '4. أكمل عملية الدفع' : '4. Complete the payment process'}</li>
                <li>{language === 'ar' ? '5. ستتلقى تأكيد الدفع في النظام' : '5. You will receive payment confirmation in the system'}</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}