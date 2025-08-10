import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CreditCard, Shield, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethod {
  id: number;
  myfatoorahId: number;
  nameEn: string;
  nameAr: string;
  code: string;
  imageUrl?: string;
  isDirectPayment: boolean;
  serviceCharge: string;
  currencyIso: string;
}

interface PaymentGatewayProps {
  invoiceId: number;
  amount: number;
  currency?: string;
  customerName: string;
  onPaymentSuccess?: (transactionId: number) => void;
  onPaymentError?: (error: string) => void;
}

export default function PaymentGateway({
  invoiceId,
  amount,
  currency = 'SAR',
  customerName,
  onPaymentSuccess,
  onPaymentError
}: PaymentGatewayProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const { toast } = useToast();

  // Fetch available payment methods
  const { data: paymentMethods, isLoading: isLoadingMethods } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payments/methods'],
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: { invoiceId: number; paymentMethodId: number; returnUrl?: string }) => {
      const response = await fetch('/api/payments/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment');
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.paymentUrl) {
        // Redirect to MyFatoorah payment page
        window.location.href = data.paymentUrl;
      } else {
        toast({
          title: "خطأ في الدفع",
          description: "فشل في إنشاء رابط الدفع",
          variant: "destructive",
        });
        onPaymentError?.('Failed to create payment link');
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الدفع",
        description: error.message || "حدث خطأ أثناء معالجة الدفع",
        variant: "destructive",
      });
      onPaymentError?.(error.message);
    },
  });

  const handlePayment = () => {
    if (!selectedPaymentMethod) {
      toast({
        title: "تحديد طريقة الدفع",
        description: "يرجى اختيار طريقة دفع أولاً",
        variant: "destructive",
      });
      return;
    }

    const paymentMethodId = parseInt(selectedPaymentMethod);
    const returnUrl = `${window.location.origin}/payment-success`;

    createPaymentMutation.mutate({
      invoiceId,
      paymentMethodId,
      returnUrl,
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  const getPaymentMethodName = (method: PaymentMethod) => {
    return method.nameAr || method.nameEn;
  };

  if (isLoadingMethods) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin ml-2" />
            <span>جاري تحميل طرق الدفع...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            ملخص الدفع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">رقم الفاتورة:</span>
              <span className="font-semibold">#{invoiceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">العميل:</span>
              <span className="font-semibold">{customerName}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">إجمالي المبلغ:</span>
              <span className="font-bold text-purple-600">
                {formatAmount(amount, currency)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>اختر طريقة الدفع</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentMethods && paymentMethods.length > 0 ? (
            <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value={method.myfatoorahId.toString()} id={`method-${method.id}`} />
                    <Label
                      htmlFor={`method-${method.id}`}
                      className="flex items-center gap-3 flex-1 cursor-pointer p-3 rounded-lg border hover:bg-gray-50"
                    >
                      {method.imageUrl && (
                        <img
                          src={method.imageUrl}
                          alt={getPaymentMethodName(method)}
                          className="w-8 h-8 object-contain"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{getPaymentMethodName(method)}</div>
                        <div className="text-sm text-gray-500">
                          {method.code}
                          {parseFloat(method.serviceCharge) > 0 && (
                            <span className="mr-2">
                              (رسوم: {method.serviceCharge}%)
                            </span>
                          )}
                        </div>
                      </div>
                      {method.isDirectPayment && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          مباشر
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          ) : (
            <Alert>
              <AlertDescription>
                لا توجد طرق دفع متاحة حالياً. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <Shield className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">دفع آمن ومضمون</div>
              <div>
                جميع المعاملات المالية محمية بأعلى معايير الأمان عبر منصة MyFatoorah.
                لن نحتفظ بأي من بيانات البطاقة الائتمانية.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Button */}
      <Button
        onClick={handlePayment}
        disabled={!selectedPaymentMethod || createPaymentMutation.isPending}
        className="w-full bg-purple-600 hover:bg-purple-700 py-3 text-lg"
      >
        {createPaymentMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin ml-2" />
            جاري معالجة الدفع...
          </>
        ) : (
          <>
            <ExternalLink className="w-5 h-5 ml-2" />
            ادفع الآن {formatAmount(amount, currency)}
          </>
        )}
      </Button>

      {/* Terms */}
      <div className="text-center text-xs text-gray-500">
        بالضغط على "ادفع الآن"، أنت توافق على{' '}
        <a href="#" className="text-purple-600 hover:underline">شروط الخدمة</a>
        {' '}و{' '}
        <a href="#" className="text-purple-600 hover:underline">سياسة الخصوصية</a>
      </div>
    </div>
  );
}