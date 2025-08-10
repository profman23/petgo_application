import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { XCircle, ArrowLeft, RefreshCw, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentTransaction {
  id: number;
  invoiceId: number;
  bookingId: number;
  amount: string;
  currency: string;
  status: string;
  gatewayStatus: string;
  customerName: string;
}

export default function PaymentError() {
  const [location, navigate] = useLocation();
  const [match, params] = useRoute('/payment-error');
  const [transactionId, setTransactionId] = useState<string>('');
  const [errorType, setErrorType] = useState<string>('');
  const [errorStatus, setErrorStatus] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const txnId = urlParams.get('transaction');
    const error = urlParams.get('error');
    const status = urlParams.get('status');
    
    if (txnId) setTransactionId(txnId);
    if (error) setErrorType(error);
    if (status) setErrorStatus(status);
  }, [location]);

  const { data: transaction, isLoading } = useQuery<PaymentTransaction>({
    queryKey: ['/api/payments/status', transactionId],
    enabled: !!transactionId,
  });

  const getErrorMessage = (error: string, status: string) => {
    if (error === 'transaction_not_found') {
      return {
        title: 'معاملة غير موجودة',
        description: 'لم يتم العثور على تفاصيل هذه المعاملة. يرجى المحاولة مرة أخرى.',
      };
    }
    
    if (error === 'callback_failed') {
      return {
        title: 'خطأ في معالجة الدفع',
        description: 'حدث خطأ أثناء معالجة عملية الدفع. يرجى التحقق من حالة المعاملة أو المحاولة مرة أخرى.',
      };
    }

    if (status === 'Failed') {
      return {
        title: 'فشلت عملية الدفع',
        description: 'لم تتم عملية الدفع بنجاح. يرجى التحقق من معلومات الدفع والمحاولة مرة أخرى.',
      };
    }

    if (status === 'Cancelled') {
      return {
        title: 'تم إلغاء عملية الدفع',
        description: 'تم إلغاء عملية الدفع من قبل المستخدم أو انتهت صلاحية الجلسة.',
      };
    }

    return {
      title: 'حدث خطأ في عملية الدفع',
      description: 'نعتذر، حدث خطأ غير متوقع أثناء معالجة عملية الدفع. يرجى المحاولة مرة أخرى.',
    };
  };

  const formatAmount = (amount: string, currency: string) => {
    return `${parseFloat(amount).toFixed(2)} ${currency}`;
  };

  const errorInfo = getErrorMessage(errorType, errorStatus);

  const handleRetryPayment = () => {
    if (transaction?.invoiceId) {
      navigate(`/invoice/${transaction.invoiceId}`);
    } else {
      navigate('/activity');
    }
  };

  if (isLoading && transactionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من حالة الدفع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-4" dir="rtl">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Error Header */}
        <div className="text-center mb-8">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-lg text-gray-600">
            {errorInfo.description}
          </p>
        </div>

        {/* Error Alert */}
        <Alert className="mb-6 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            <strong>رمز الخطأ:</strong> {errorType || errorStatus || 'غير محدد'}
            {transactionId && (
              <>
                <br />
                <strong>رقم المعاملة:</strong> {transactionId}
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Transaction Details */}
        {transaction && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>تفاصيل المعاملة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">رقم المعاملة</label>
                  <p className="text-lg font-semibold">{transaction.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">المبلغ</label>
                  <p className="text-lg font-semibold">
                    {formatAmount(transaction.amount, transaction.currency)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">حالة الدفع</label>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    {transaction.status === 'failed' ? 'فشل' : 
                     transaction.status === 'cancelled' ? 'ملغي' : 
                     'غير مكتمل'}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">اسم العميل</label>
                  <p className="text-lg">{transaction.customerName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Solutions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ماذا يمكنك فعله؟</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">إعادة المحاولة</h4>
                  <p className="text-gray-600 text-sm">جرب عملية الدفع مرة أخرى باستخدام طريقة دفع مختلفة</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">التواصل مع الدعم الفني</h4>
                  <p className="text-gray-600 text-sm">اتصل بفريق الدعم للحصول على المساعدة</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">إرسال تقرير</h4>
                  <p className="text-gray-600 text-sm">أرسل تفاصيل المشكلة عبر البريد الإلكتروني</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleRetryPayment}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            إعادة المحاولة
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/activity')}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            عرض النشاط
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex-1"
          >
            العودة للرئيسية
          </Button>
        </div>

        {/* Support Contact */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">تحتاج مساعدة؟</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>هاتف الدعم الفني: <strong className="text-purple-600">920000123</strong></span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>البريد الإلكتروني: <strong className="text-purple-600">support@vetsvan.com</strong></span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              ساعات العمل: السبت - الخميس من 8:00 ص إلى 10:00 م
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}