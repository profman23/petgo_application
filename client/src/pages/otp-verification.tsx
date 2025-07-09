import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import logoPath from "@assets/generated-icon.png";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";

const otpSchema = z.object({
  otpCode: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
});

type OtpForm = z.infer<typeof otpSchema>;

interface LocationState {
  email: string;
  registrationData?: any;
}

export default function OtpVerification() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useTranslation();
  const [isResending, setIsResending] = useState(false);
  
  // Get email from localStorage (set during registration)
  const email = localStorage.getItem('otpEmail') || '';
  const userName = localStorage.getItem('otpUserName') || '';
  
  const translations = {
    ar: {
      title: "تحقق من البريد الإلكتروني",
      description: "أدخل رمز التحقق المرسل إلى بريدك الإلكتروني",
      otpLabel: "رمز التحقق",
      otpPlaceholder: "123456",
      verifyButton: "تحقق",
      resendButton: "إعادة إرسال الرمز",
      backButton: "العودة",
      sentTo: "تم الإرسال إلى:",
      verifyingText: "جاري التحقق...",
      resendingText: "جاري الإرسال...",
      otpSentSuccess: "تم إرسال رمز التحقق بنجاح",
      otpVerifiedSuccess: "تم التحقق من الإيميل بنجاح! سيتم تحويلك إلى صفحة تسجيل الدخول",
      invalidOtp: "رمز التحقق غير صحيح أو منتهي الصلاحية",
      resendSuccess: "تم إعادة إرسال رمز التحقق",
      errorOccurred: "حدث خطأ، يرجى المحاولة مرة أخرى"
    },
    en: {
      title: "Email Verification",
      description: "Enter the verification code sent to your email",
      otpLabel: "Verification Code",
      otpPlaceholder: "123456",
      verifyButton: "Verify",
      resendButton: "Resend Code",
      backButton: "Back",
      sentTo: "Sent to:",
      verifyingText: "Verifying...",
      resendingText: "Sending...",
      otpSentSuccess: "Verification code sent successfully",
      otpVerifiedSuccess: "Email verified successfully! Redirecting to login page",
      invalidOtp: "Invalid or expired verification code",
      resendSuccess: "Verification code resent successfully",
      errorOccurred: "An error occurred, please try again"
    }
  };

  const t = translations[language];

  const form = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otpCode: "",
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpForm) => {
      return await apiRequest("/api/auth/verify-otp", "POST", {
        email,
        otpCode: data.otpCode,
        preferredLanguage: language
      });
    },
    onSuccess: (data: any) => {
      // Clear OTP-related localStorage
      localStorage.removeItem('otpEmail');
      localStorage.removeItem('otpUserName');
      
      if (data.token && data.user) {
        // Account created successfully - auto login
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast({
          title: language === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!',
          description: language === 'ar' ? 
            `مرحباً ${data.user.name}، تم تسجيل دخولك بنجاح` :
            `Welcome ${data.user.name}, you are now logged in`,
          variant: "default",
        });
        
        // Redirect to home page
        setTimeout(() => {
          window.location.href = '/home';
        }, 1500);
      } else {
        // Just verification without account creation
        toast({
          title: t.otpVerifiedSuccess,
          variant: "default",
        });
        
        // Wait 2 seconds then redirect to login
        setTimeout(() => {
          setLocation("/login");
        }, 2000);
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || t.invalidOtp;
      toast({
        title: errorMessage,
        variant: "destructive",
      });
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/auth/send-otp", "POST", {
        email,
        preferredLanguage: language
      });
    },
    onSuccess: () => {
      toast({
        title: t.resendSuccess,
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: error.message || t.errorOccurred,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OtpForm) => {
    verifyOtpMutation.mutate(data);
  };

  const handleResendOtp = () => {
    setIsResending(true);
    resendOtpMutation.mutate();
    setTimeout(() => setIsResending(false), 3000);
  };

  const handleBack = () => {
    setLocation("/register");
  };

  if (!email) {
    // Redirect to register if no email provided
    setLocation("/register");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative w-20 h-20 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 group">
            <img
              src={logoPath}
              alt="VetsVan Logo"
              className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t.title}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {t.description}
            </CardDescription>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span>{t.sentTo}</span>
              <br />
              <span className="font-medium text-purple-600 dark:text-purple-400">{email}</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="otpCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">
                        {t.otpLabel}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder={t.otpPlaceholder}
                          maxLength={6}
                          className="text-center text-2xl tracking-widest border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400"
                          dir="ltr"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                    disabled={verifyOtpMutation.isPending}
                  >
                    {verifyOtpMutation.isPending ? t.verifyingText : t.verifyButton}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-900/20"
                    onClick={handleResendOtp}
                    disabled={isResending || resendOtpMutation.isPending}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
                    {isResending || resendOtpMutation.isPending ? t.resendingText : t.resendButton}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t.backButton}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}