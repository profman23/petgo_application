import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { PaymentTrigger } from '@/components/payment-trigger';

interface PaymentResponse {
  success: boolean;
  data?: {
    transactionId: number;
    paymentUrl: string;
    invoiceId: number;
    amount: number;
    message: string;
  };
  message?: string;
  error?: string;
}

interface PaymentStatus {
  success: boolean;
  data?: {
    transactionId: number;
    status: string;
    amount: number;
    paidAmount: number;
    paymentMethod: string | null;
    invoiceStatus: string;
    lastUpdated: string;
  };
}

export function PaymentTest() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentResponse['data'] | null>(null);
  const [statusData, setStatusData] = useState<PaymentStatus['data'] | null>(null);
  const { toast } = useToast();

  const createQuickTestPayment = async () => {
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/payments/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('sessionToken') || localStorage.getItem('sessionToken')}`
        },
        body: JSON.stringify({
          invoiceNumber: `TEST-${Date.now()}`,
          amount: '1.00',
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
          customerPhone: '+966548336693',
          description: 'Quick 1 SAR test payment with VetsVan redirect'
        })
      });

      const responseData = await response.json();

      if (responseData.success) {
        toast({
          title: "Payment Link Created",
          description: "Opening payment page... Complete payment to see success modal in VetsVan",
        });
        
        // Open payment URL in new tab
        window.open(responseData.data.paymentUrl, '_blank');
      } else {
        throw new Error(responseData.message || 'Payment creation failed');
      }
    } catch (error: any) {
      console.error('Payment creation error:', error);
      toast({
        title: "Error",
        description: `Failed to create payment: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateTestPayment = async () => {
    if (!email || !phone) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both email and phone number',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiRequest('/api/payments/test-payment', {
        method: 'POST',
        body: JSON.stringify({
          customerEmail: email,
          customerPhone: phone
        })
      });

      if (response.success && response.data) {
        setPaymentData(response.data);
        toast({
          title: 'Test Payment Created',
          description: response.data.message,
          variant: 'default'
        });
      } else {
        throw new Error(response.message || 'Failed to create test payment');
      }
    } catch (error: any) {
      console.error('Test payment creation failed:', error);
      toast({
        title: 'Payment Creation Failed',
        description: error.message || 'Unable to create test payment',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!paymentData) return;

    setIsChecking(true);
    try {
      const response = await apiRequest(`/api/payments/status/${paymentData.transactionId}`);

      if (response.success && response.data) {
        setStatusData(response.data);
        
        if (response.data.status === 'completed') {
          toast({
            title: 'Payment Successful!',
            description: `Payment of ${response.data.paidAmount} SAR completed successfully`,
            variant: 'default'
          });
        } else if (response.data.status === 'failed') {
          toast({
            title: 'Payment Failed',
            description: 'The payment was not completed',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Payment Status',
            description: `Current status: ${response.data.status}`,
            variant: 'default'
          });
        }
      } else {
        throw new Error(response.message || 'Failed to check payment status');
      }
    } catch (error: any) {
      console.error('Status check failed:', error);
      toast({
        title: 'Status Check Failed',
        description: error.message || 'Unable to check payment status',
        variant: 'destructive'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleOpenPaymentUrl = () => {
    if (paymentData?.paymentUrl) {
      window.open(paymentData.paymentUrl, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-purple-800 mb-2">MyFatoorah Payment Test</h1>
        <p className="text-gray-600">Test the payment gateway integration with 1 SAR</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Create Test Payment
          </CardTitle>
          <CardDescription>
            Generate a 1 SAR test payment to verify MyFatoorah integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Live Payment Test Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Live MyFatoorah Test Payment
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Test the complete payment flow with a real 1 SAR payment link:
            </p>
            <Button 
              onClick={createQuickTestPayment}
              disabled={isCreating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Create 1 SAR Test Payment (with VetsVan redirect)
                </>
              )}
            </Button>
            <p className="text-xs text-blue-600 mt-2 text-center">
              This will create a new payment that redirects back to VetsVan with success modal
            </p>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">In-App Payment Success Demo</span>
            </div>
          </div>
          
          {/* Payment Success Simulator */}
          <PaymentTrigger 
            amount="1.00 SAR" 
            bookingId={123} 
            onPaymentSuccess={(data) => console.log('Payment success:', data)}
          />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or create new test payment</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Customer Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="05XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isCreating}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleCreateTestPayment}
            disabled={isCreating || !email || !phone}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Create 1 SAR Test Payment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {paymentData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Payment Created Successfully
            </CardTitle>
            <CardDescription>
              Transaction ID: {paymentData.transactionId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Amount:</span>
                  <span className="ml-2">{paymentData.amount} SAR</span>
                </div>
                <div>
                  <span className="font-semibold">Invoice ID:</span>
                  <span className="ml-2">{paymentData.invoiceId}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleOpenPaymentUrl}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Complete Payment
              </Button>
              <Button
                onClick={handleCheckStatus}
                disabled={isChecking}
                variant="outline"
                className="flex-1"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check Status'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {statusData && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Real-time payment status from MyFatoorah</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Status:</span>
                <span className={`font-bold capitalize ${getStatusColor(statusData.status)}`}>
                  {statusData.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-semibold">Invoice Status:</span>
                <span className="font-medium">{statusData.invoiceStatus}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-semibold">Amount:</span>
                <span>{statusData.amount} SAR</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-semibold">Paid Amount:</span>
                <span className="text-green-600 font-bold">{statusData.paidAmount} SAR</span>
              </div>
              
              {statusData.paymentMethod && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Payment Method:</span>
                  <span>{statusData.paymentMethod}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Last Updated:</span>
                <span>{new Date(statusData.lastUpdated).toLocaleString()}</span>
              </div>
            </div>

            {statusData.status === 'completed' && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Payment Integration Successful!</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  MyFatoorah integration is working correctly. The payment has been processed successfully.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}