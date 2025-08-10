import { CreditCard, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function PaymentTest() {
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<{
    status: 'idle' | 'success' | 'error';
    data?: any;
    message?: string;
  }>({ status: 'idle' });

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        throw new Error('Admin authentication required');
      }
      
      const response = await fetch('/api/payments/test-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          amount: 1.00,
          currency: 'SAR',
          description: 'Payment Test - 1 SAR'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.paymentUrl) {
        // Redirect to MyFatoorah payment page
        window.location.href = data.paymentUrl;
      } else {
        setPaymentStatus({
          status: 'error',
          message: 'Failed to create payment session'
        });
        toast({
          title: "خطأ في الدفع / Payment Error",
          description: "فشل في إنشاء جلسة الدفع / Failed to create payment session",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      setPaymentStatus({
        status: 'error',
        message: error.message || 'Payment creation failed'
      });
      toast({
        title: "خطأ في الدفع / Payment Error",
        description: "فشل في إنشاء طلب الدفع / Failed to create payment request",
        variant: "destructive"
      });
    }
  });

  const handleTestPayment = () => {
    setPaymentStatus({ status: 'idle' });
    createPaymentMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/vetsvan-logo.png" 
                alt="VetsVan" 
                className="h-8 w-auto"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  const nextElement = target.nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = 'block';
                  }
                }}
              />
              <div className="text-xl font-bold text-purple-600 hidden">
                VetsVan Admin
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-sm text-gray-600">
                لوحة إدارة اختبار الدفع
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                اختبار الدفع
              </h1>
            </div>
            <p className="text-gray-600">
              وحدة اختبار نظام المدفوعات - قيد التطوير
            </p>
          </div>

          {/* Payment Test Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-purple-600" />
                اختبار الدفع المباشر - MyFatoorah / Live Payment Test - MyFatoorah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    معلومات الاختبار / Test Information
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>• المبلغ: 1.00 ريال سعودي / Amount: 1.00 SAR</p>
                    <p>• البوابة: MyFatoorah Live API / Gateway: MyFatoorah Live API</p>
                    <p>• طرق الدفع: جميع الطرق المتاحة (مدى، فيزا، ماستركارد، سداد) / Payment Methods: All available (Mada, Visa, MasterCard, Sadad)</p>
                    <p>• البيئة: بيئة الإنتاج المباشرة / Environment: Live Production</p>
                  </div>
                </div>

                {paymentStatus.status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <XCircle className="w-5 h-5" />
                      <span className="font-semibold">
                        فشل في عملية الدفع / Payment Failed
                      </span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">{paymentStatus.message}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      onClick={handleTestPayment}
                      disabled={createPaymentMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      size="lg"
                    >
                      {createPaymentMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                          جاري إنشاء الدفع... / Creating Payment...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 ml-2" />
                          دفع 1 ريال سعودي / Pay 1 SAR
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 mb-2">
                      خطوات الاختبار / Test Steps:
                    </h5>
                    <ol className="text-sm text-gray-600 space-y-1">
                      <li>1. اضغط على زر "دفع 1 ريال سعودي" / Click "Pay 1 SAR" button</li>
                      <li>2. سيتم توجيهك إلى صفحة MyFatoorah / You'll be redirected to MyFatoorah page</li>
                      <li>3. اختر طريقة الدفع المفضلة / Choose your preferred payment method</li>
                      <li>4. أكمل عملية الدفع / Complete the payment process</li>
                      <li>5. سيتم إعادة توجيهك لصفحة النتيجة / You'll be redirected to result page</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Placeholder Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  حالة الوحدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">الحالة:</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      قيد التطوير
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">النوع:</span>
                    <span className="font-medium">وحدة اختبار</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">المرحلة:</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planned Features Card */}
            <Card>
              <CardHeader>
                <CardTitle>المميزات المخططة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>اختبار طرق الدفع</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>محاكاة المعاملات</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>اختبار الـ Webhooks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>تتبع حالة المدفوعات</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Development Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات التطوير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">المطور:</span>
                    <span className="block font-medium">فريق VetsVan التقني</span>
                  </div>
                  <div>
                    <span className="text-gray-600">آخر تحديث:</span>
                    <span className="block font-medium">10 أغسطس 2025</span>
                  </div>
                  <div>
                    <span className="text-gray-600">البيئة:</span>
                    <span className="block font-medium">تطوير / اختبار</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder Message */}
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Payment Test Module Placeholder
              </h3>
              <p className="text-gray-600 mb-4">
                هذه الوحدة قيد التطوير وستحتوي على أدوات اختبار نظام المدفوعات.
                سيتم إضافة الوظائف تدريجياً في التحديثات القادمة.
              </p>
              <div className="text-sm text-gray-500">
                <p>المميزات المتوقعة:</p>
                <p>• اختبار تكامل MyFatoorah</p>
                <p>• محاكاة عمليات الدفع</p>
                <p>• مراقبة حالة المعاملات</p>
                <p>• اختبار الـ Webhooks والإشعارات</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}