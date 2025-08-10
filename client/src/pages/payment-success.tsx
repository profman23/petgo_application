import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ArrowLeft, Download, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentTransaction {
  id: number;
  invoiceId: number;
  bookingId: number;
  amount: string;
  currency: string;
  status: string;
  gatewayStatus: string;
  transactionId: string;
  referenceId: string;
  paidAt: string;
  customerName: string;
}

export default function PaymentSuccess() {
  const [location, navigate] = useLocation();
  const [match, params] = useRoute('/payment-success');
  const [transactionId, setTransactionId] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const txnId = urlParams.get('transaction');
    if (txnId) {
      setTransactionId(txnId);
    }
  }, [location]);

  const { data: transaction, isLoading } = useQuery<PaymentTransaction>({
    queryKey: ['/api/payments/status', transactionId],
    enabled: !!transactionId,
  });

  const formatAmount = (amount: string, currency: string) => {
    return `${parseFloat(amount).toFixed(2)} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من حالة الدفع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-4" dir="rtl">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            تم الدفع بنجاح!
          </h1>
          <p className="text-lg text-gray-600">
            شكراً لك، تم تأكيد عملية الدفع وسيتم معالجة طلبك قريباً
          </p>
        </div>

        {/* Transaction Details */}
        {transaction && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                تفاصيل المعاملة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">رقم المعاملة</label>
                  <p className="text-lg font-semibold">{transaction.transactionId || transaction.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">المبلغ المدفوع</label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatAmount(transaction.amount, transaction.currency)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">تاريخ ووقت الدفع</label>
                  <p className="text-lg">{formatDate(transaction.paidAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">حالة الدفع</label>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    مدفوع
                  </span>
                </div>
                {transaction.referenceId && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">رقم المرجع</label>
                    <p className="text-lg font-mono">{transaction.referenceId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>الخطوات التالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium">تأكيد الموعد</h4>
                  <p className="text-gray-600 text-sm">سيتم التواصل معك خلال 24 ساعة لتأكيد موعد الزيارة</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium">تتبع الزيارة</h4>
                  <p className="text-gray-600 text-sm">يمكنك متابعة حالة الزيارة من صفحة النشاط في التطبيق</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium">استلام الخدمة</h4>
                  <p className="text-gray-600 text-sm">فريق VetsVan سيصل إلى موقعك في الوقت المحدد</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => navigate('/activity')}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
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
          {transaction?.invoiceId && (
            <Button
              variant="outline"
              onClick={() => navigate(`/invoice/${transaction.invoiceId}`)}
              className="flex-1"
            >
              <Download className="w-4 h-4 ml-2" />
              تحميل الفاتورة
            </Button>
          )}
        </div>

        {/* Support Contact */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>في حالة وجود أي استفسار، يرجى التواصل معنا على:</p>
          <p className="font-medium text-purple-600 mt-1">
            📞 920000123 | 📧 support@vetsvan.com
          </p>
        </div>
      </div>
    </div>
  );
}