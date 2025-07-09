import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';
import { Loader2, Mail, Shield } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface OtpVerificationProps {
  email: string;
  onVerificationComplete: () => void;
  onBack: () => void;
}

export function OtpVerification({ email, onVerificationComplete, onBack }: OtpVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const translations = {
    ar: {
      title: 'تأكيد البريد الإلكتروني',
      description: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
      otpLabel: 'رمز التحقق',
      otpPlaceholder: 'أدخل الرمز المكون من 6 أرقام',
      verify: 'تأكيد',
      resend: 'إعادة الإرسال',
      back: 'رجوع',
      verifying: 'جاري التحقق...',
      sending: 'جاري الإرسال...',
      success: 'تم التحقق من البريد الإلكتروني بنجاح',
      error: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
      resendSuccess: 'تم إرسال رمز جديد',
      resendError: 'فشل في إرسال رمز جديد'
    },
    en: {
      title: 'Email Verification',
      description: 'Verification code sent to your email',
      otpLabel: 'Verification Code',
      otpPlaceholder: 'Enter 6-digit code',
      verify: 'Verify',
      resend: 'Resend',
      back: 'Back',
      verifying: 'Verifying...',
      sending: 'Sending...',
      success: 'Email verified successfully',
      error: 'Invalid or expired verification code',
      resendSuccess: 'New code sent',
      resendError: 'Failed to send new code'
    }
  };

  const texts = translations[language];

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز مكون من 6 أرقام",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: { email, otp }
      });

      if (response.success) {
        toast({
          title: "نجح",
          description: texts.success,
        });
        onVerificationComplete();
      } else {
        toast({
          title: "خطأ",
          description: texts.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast({
        title: "خطأ",
        description: texts.error,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsSending(true);
    try {
      const response = await apiRequest('/api/auth/send-otp', {
        method: 'POST',
        body: { email }
      });

      if (response.success) {
        toast({
          title: "نجح",
          description: texts.resendSuccess,
        });
        setOtp(''); // Clear current OTP
      } else {
        toast({
          title: "خطأ",
          description: texts.resendError,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast({
        title: "خطأ",
        description: texts.resendError,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {texts.title}
            </h1>
            <p className="text-gray-600 text-sm">
              {texts.description}
            </p>
          </div>

          {/* Email Display */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg flex items-center">
            <Mail className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700 truncate">{email}</span>
          </div>

          {/* OTP Input */}
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                {texts.otpLabel}
              </Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                }}
                placeholder={texts.otpPlaceholder}
                className="mt-1 text-center text-lg tracking-widest"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleVerify}
              disabled={isVerifying || otp.length !== 6}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {texts.verifying}
                </>
              ) : (
                texts.verify
              )}
            </Button>

            <Button
              onClick={handleResendOtp}
              disabled={isSending}
              variant="outline"
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {texts.sending}
                </>
              ) : (
                texts.resend
              )}
            </Button>

            <Button
              onClick={onBack}
              variant="ghost"
              className="w-full"
            >
              {texts.back}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}