import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';

interface PaymentMethod {
  PaymentMethodId: number;
  PaymentMethodAr: string;
  PaymentMethodEn: string;
  PaymentMethodCode: string;
  IsDirectPayment: boolean;
  ServiceCharge: number;
  TotalAmount: number;
  CurrencyIso: string;
  ImageUrl: string;
}

export default function PaymentPage() {
  const [, params] = useRoute('/payment/:bookingId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [paymentAmount] = useState(150); // Service price in SAR
  
  const bookingId = params?.bookingId ? parseInt(params.bookingId) : null;

  // Get payment methods
  const { data: paymentMethods, isLoading: loadingMethods } = useQuery({
    queryKey: ['/api/payment/initiate'],
    queryFn: () => apiRequest('/api/payment/initiate', {
      method: 'POST',
      body: JSON.stringify({ amount: paymentAmount })
    }),
    enabled: !!bookingId
  });

  // Execute payment mutation
  const executePaymentMutation = useMutation({
    mutationFn: async (data: { bookingId: number; paymentMethodId: number; amount: number }) => {
      return apiRequest('/api/payment/execute', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        // Redirect to MyFatoorah payment page
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: t('payment.error'),
        description: error.message || t('payment.failed'),
        variant: 'destructive'
      });
    }
  });

  const handlePayment = () => {
    if (!selectedPaymentMethod || !bookingId) {
      toast({
        title: t('payment.selectMethod'),
        description: t('payment.selectMethodDesc'),
        variant: 'destructive'
      });
      return;
    }

    executePaymentMutation.mutate({
      bookingId,
      paymentMethodId: selectedPaymentMethod,
      amount: paymentAmount
    });
  };

  const getPaymentMethodIcon = (code: string) => {
    if (code.toLowerCase().includes('visa') || code.toLowerCase().includes('card')) {
      return <CreditCard className="w-6 h-6" />;
    }
    if (code.toLowerCase().includes('mada') || code.toLowerCase().includes('debit')) {
      return <CreditCard className="w-6 h-6" />;
    }
    if (code.toLowerCase().includes('stc') || code.toLowerCase().includes('mobile')) {
      return <Smartphone className="w-6 h-6" />;
    }
    return <Building2 className="w-6 h-6" />;
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">{t('payment.invalidBooking')}</h2>
            <Button onClick={() => setLocation('/home')} className="w-full">
              {t('common.goHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4"
      dir={direction}
      style={{ textAlign }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('payment.title')}
          </h1>
          <p className="text-gray-600">
            {t('payment.subtitle')}
          </p>
        </div>

        {/* Payment Amount Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">
              {t('payment.orderSummary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">{t('payment.service')}</span>
                <span className="font-medium">{t('payment.vetService')}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>{t('payment.total')}</span>
                <span className="text-purple-600">{paymentAmount} {t('payment.sar')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('payment.selectPaymentMethod')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMethods ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">{t('payment.loadingMethods')}</span>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods?.paymentMethods?.map((method: PaymentMethod) => (
                  <div
                    key={method.PaymentMethodId}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedPaymentMethod === method.PaymentMethodId
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.PaymentMethodId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        {method.ImageUrl ? (
                          <img 
                            src={method.ImageUrl} 
                            alt={language === 'ar' ? method.PaymentMethodAr : method.PaymentMethodEn}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          getPaymentMethodIcon(method.PaymentMethodCode)
                        )}
                        <div>
                          <div className="font-medium">
                            {language === 'ar' ? method.PaymentMethodAr : method.PaymentMethodEn}
                          </div>
                          {method.ServiceCharge > 0 && (
                            <div className="text-sm text-gray-500">
                              {t('payment.serviceCharge')}: {method.ServiceCharge} {method.CurrencyIso}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right rtl:text-left">
                        <div className="font-bold text-lg">
                          {method.TotalAmount} {method.CurrencyIso}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Button */}
        <Card>
          <CardContent className="p-6">
            <Button
              onClick={handlePayment}
              disabled={!selectedPaymentMethod || executePaymentMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-medium"
            >
              {executePaymentMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {t('payment.processing')}
                </>
              ) : (
                t('payment.payNow')
              )}
            </Button>
            
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => setLocation('/home')}
                className="text-gray-600 hover:text-gray-800"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center mt-6 text-sm text-gray-500">
          🔒 {t('payment.securityNotice')}
        </div>
      </div>
    </div>
  );
}