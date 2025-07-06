import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Home, RotateCcw, AlertTriangle } from 'lucide-react';
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';

export default function PaymentErrorPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);

  // Get error reason from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const errorReason = urlParams.get('reason') || 'unknown';

  const getErrorMessage = (reason: string) => {
    switch (reason) {
      case 'payment_failed':
        return {
          title: t('payment.error.failed.title'),
          message: t('payment.error.failed.message'),
          icon: XCircle,
          color: 'text-red-500'
        };
      case 'payment_cancelled':
        return {
          title: t('payment.error.cancelled.title'),
          message: t('payment.error.cancelled.message'),
          icon: AlertTriangle,
          color: 'text-yellow-500'
        };
      case 'missing_payment_id':
        return {
          title: t('payment.error.missing.title'),
          message: t('payment.error.missing.message'),
          icon: XCircle,
          color: 'text-red-500'
        };
      case 'callback_error':
        return {
          title: t('payment.error.callback.title'),
          message: t('payment.error.callback.message'),
          icon: XCircle,
          color: 'text-red-500'
        };
      default:
        return {
          title: t('payment.error.unknown.title'),
          message: t('payment.error.unknown.message'),
          icon: XCircle,
          color: 'text-red-500'
        };
    }
  };

  const errorInfo = getErrorMessage(errorReason);
  const IconComponent = errorInfo.icon;

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 flex items-center justify-center p-4"
      dir={direction}
      style={{ textAlign }}
    >
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {/* Error Icon */}
          <div className="mb-6">
            <IconComponent className={`w-20 h-20 ${errorInfo.color} mx-auto mb-4`} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {errorInfo.title}
            </h1>
            <p className="text-gray-600">
              {errorInfo.message}
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">
              {t('payment.error.whatHappened')}
            </h3>
            <div className="text-sm text-gray-600 text-left rtl:text-right">
              {errorReason === 'payment_failed' && (
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('payment.error.reasons.insufficientFunds')}</li>
                  <li>{t('payment.error.reasons.invalidCard')}</li>
                  <li>{t('payment.error.reasons.networkIssue')}</li>
                  <li>{t('payment.error.reasons.bankDecline')}</li>
                </ul>
              )}
              {errorReason === 'payment_cancelled' && (
                <p>{t('payment.error.reasons.userCancelled')}</p>
              )}
              {errorReason === 'missing_payment_id' && (
                <p>{t('payment.error.reasons.technicalIssue')}</p>
              )}
              {errorReason === 'callback_error' && (
                <p>{t('payment.error.reasons.callbackError')}</p>
              )}
              {errorReason === 'unknown' && (
                <p>{t('payment.error.reasons.unknownError')}</p>
              )}
            </div>
          </div>

          {/* Support Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              {t('payment.error.support')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {errorReason === 'payment_cancelled' || errorReason === 'payment_failed' ? (
              <Button
                onClick={() => setLocation('/customer-activity')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('payment.error.tryAgain')}
              </Button>
            ) : null}
            
            <Button
              onClick={() => setLocation('/home')}
              variant="outline"
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              {t('payment.error.goHome')}
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-4">
            {t('payment.error.helpText')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}