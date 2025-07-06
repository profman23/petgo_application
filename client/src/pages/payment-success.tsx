import { useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';

export default function PaymentSuccessPage() {
  const [, params] = useRoute('/payment-success');
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);

  // Get bookingId from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('bookingId');

  // Get payment status
  const { data: paymentStatus } = useQuery({
    queryKey: [`/api/payment/status/${bookingId}`],
    queryFn: () => apiRequest(`/api/payment/status/${bookingId}`),
    enabled: !!bookingId
  });

  useEffect(() => {
    // Auto redirect to home after 10 seconds
    const timer = setTimeout(() => {
      setLocation('/home');
    }, 10000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4"
      dir={direction}
      style={{ textAlign }}
    >
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-600 mb-2">
              {t('payment.success.title')}
            </h1>
            <p className="text-gray-600">
              {t('payment.success.message')}
            </p>
          </div>

          {/* Payment Details */}
          {paymentStatus && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left rtl:text-right">
              <h3 className="font-medium text-gray-900 mb-3">
                {t('payment.success.details')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('payment.success.bookingId')}:</span>
                  <span className="font-medium">#{paymentStatus.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('payment.success.amount')}:</span>
                  <span className="font-medium">{paymentStatus.paymentAmount} {t('payment.sar')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('payment.success.method')}:</span>
                  <span className="font-medium">{paymentStatus.paymentMethod || t('payment.success.card')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('payment.success.status')}:</span>
                  <span className="font-medium text-green-600">{t('payment.success.paid')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              {t('payment.success.confirmation')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => setLocation('/customer-activity')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t('payment.success.viewBookings')}
            </Button>
            
            <Button
              onClick={() => setLocation('/home')}
              variant="outline"
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              {t('payment.success.goHome')}
            </Button>
          </div>

          {/* Auto redirect notice */}
          <p className="text-xs text-gray-500 mt-4">
            {t('payment.success.autoRedirect')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}