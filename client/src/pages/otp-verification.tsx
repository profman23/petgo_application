import { useState, useEffect } from "react";
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
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Check if this is password reset mode from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const isPasswordReset = urlParams.get('type') === 'reset';
  
  // Get email from localStorage (set during registration or reset)
  const email = localStorage.getItem('otpEmail') || '';
  const userName = localStorage.getItem('otpUserName') || '';

  // Check if email exists, if not redirect back to login
  useEffect(() => {
    if (!email) {
      setLocation('/login');
    }
  }, [email, setLocation]);
  
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
      if (isPasswordReset) {
        // For password reset, just verify OTP first
        return await apiRequest("/api/auth/verify-reset-otp", {
          method: "POST",
          body: JSON.stringify({
            email,
            otpCode: data.otpCode,
            preferredLanguage: language
          })
        });
      } else {
        // Regular registration OTP verification
        return await apiRequest("/api/auth/verify-otp", {
          method: "POST",
          body: JSON.stringify({
            email,
            otpCode: data.otpCode,
            preferredLanguage: language
          })
        });
      }
    },
    onSuccess: (data: any) => {
      if (isPasswordReset) {
        // For password reset, show password reset form
        setShowPasswordReset(true);
        toast({
          title: language === 'ar' ? 'تم التحقق من الرمز' : 'Code Verified',
          description: language === 'ar' ? 'يرجى إدخال كلمة المرور الجديدة' : 'Please enter your new password',
          variant: "default",
        });
      } else {
        // Clear OTP-related localStorage for regular registration
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
            setLocation('/home');
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
      return await apiRequest("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({
          email,
          preferredLanguage: language
        })
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
    setLocation("/login");
  };

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/auth/complete-password-reset", {
        method: "POST",
        body: JSON.stringify({
          email,
          newPassword,
          preferredLanguage: language
        })
      });
    },
    onSuccess: () => {
      // Clear localStorage
      localStorage.removeItem('otpEmail');
      localStorage.removeItem('otpUserName');
      
      toast({
        title: language === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password Reset Successfully',
        description: language === 'ar' ? 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة' : 'You can now login with your new password',
        variant: "default",
      });
      
      // Redirect to login
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: error.message || (language === 'ar' ? 'خطأ في تغيير كلمة المرور' : 'Password reset failed'),
        variant: "destructive",
      });
    },
  });

  const handlePasswordReset = () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: language === 'ar' ? 'كلمة المرور قصيرة جداً' : 'Password too short',
        description: language === 'ar' ? 'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل' : 'Password must be at least 6 characters',
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match',
        variant: "destructive",
      });
      return;
    }
    
    resetPasswordMutation.mutate();
  };

  // Don't render anything if no email (useEffect will handle redirect)
  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br #1E50C850 to-white dark:#1E50C8950 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative w-20 h-20 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-600 dark:border-purple-600 hover:border-purple-600 dark:hover:border-purple-600 group">
            <img
              src={logoPath}
              alt="PetGo Logo"
              className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-purple-600 dark:bg-purple-600 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {showPasswordReset 
                ? (language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password')
                : t.title
              }
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {showPasswordReset 
                ? (language === 'ar' ? 'يرجى إدخال كلمة المرور الجديدة' : 'Please enter your new password')
                : t.description
              }
            </CardDescription>
            {!showPasswordReset && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span>{t.sentTo}</span>
                <br />
                <span className="font-medium text-purple-600 dark:text-purple-600">{email}</span>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {!showPasswordReset ? (
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
                            className="text-center text-2xl tracking-widest border-gray-300 dark:border-gray-600 focus:border-purple-600 dark:focus:border-purple-600"
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
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-600 hover:to-purple-600 text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                      disabled={verifyOtpMutation.isPending}
                    >
                      {verifyOtpMutation.isPending ? t.verifyingText : t.verifyButton}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-purple-600 text-purple-600 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-600 dark:hover:bg-purple-600/20"
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
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                    </label>
                    <Input
                      type="password"
                      placeholder={language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="border-gray-300 dark:border-gray-600 focus:border-purple-600 dark:focus:border-purple-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                    </label>
                    <Input
                      type="password"
                      placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="border-gray-300 dark:border-gray-600 focus:border-purple-600 dark:focus:border-purple-600"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={handlePasswordReset}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-600 hover:to-purple-600 text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending 
                      ? (language === 'ar' ? 'جاري التغيير...' : 'Resetting...') 
                      : (language === 'ar' ? 'تغيير كلمة المرور' : 'Reset Password')
                    }
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}