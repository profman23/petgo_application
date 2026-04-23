import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { createLoginSchema } from '@shared/schema';
import { User, Phone, Lock, UserPlus, Heart, Mail, RefreshCw } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import logoImage from "@assets/Screenshot 2025-07-10 182605_1752161515777.png";
import welcomeHandImage from "@assets/freepik__background__61417_1753095390676.png";
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { YouTubeTutorialModal } from '@/components/YouTubeTutorialModal';
import { shouldShowTutorialVideo } from '@/lib/deviceDetection';
import { CustomerRegistrationForm } from '@/components/CustomerRegistrationForm';

interface LoginFormData {
  identifier: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: number;
    phone: string;
    name: string;
    membershipType: string;
  };
}

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showTutorialVideo, setShowTutorialVideo] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useTranslation();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema(language)),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response as AuthResponse;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // إظهار الإشعار مع اختفاء تلقائي بعد ثانية واحدة
      const { dismiss } = toast({
        title: language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login Successful',
        description: language === 'ar' ? `مرحباً ${data.user.name}` : `Welcome ${data.user.name}`,
        variant: "default",
      });
      
      // إخفاء الإشعار تلقائياً بعد 1000ms (ثانية واحدة)
      setTimeout(() => {
        dismiss();
      }, 1000);
      
      // Check if tutorial video should be shown
      if (shouldShowTutorialVideo()) {
        setShowTutorialVideo(true);
      } else {
        setLocation('/home');
      }
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleRegistrationSuccess = () => {
    // Redirect to OTP verification page
    setLocation('/otp-verification');
  };

  const handleTutorialVideoClose = () => {
    setShowTutorialVideo(false);
    setLocation('/home');
  };

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return response;
    },
    onSuccess: () => {
      // Store email in localStorage for OTP verification
      localStorage.setItem('otpEmail', resetEmail);
      
      toast({
        title: language === 'ar' ? 'تم إرسال رمز إعادة التعيين' : 'Reset Code Sent',
        description: language === 'ar' 
          ? 'تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' 
          : 'Password reset code has been sent to your email',
        variant: "default",
      });
      setShowResetPassword(false);
      setResetEmail('');
      // Redirect to OTP verification page for password reset
      setLocation('/otp-verification?type=reset');
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleResetPassword = () => {
    if (!resetEmail) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email address',
        variant: "destructive",
      });
      return;
    }
    resetPasswordMutation.mutate(resetEmail);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4" dir={getDirection(language)}>
      <div className="w-full max-w-lg">
        <Card className="border-0">
          {/* Header with back button and improved logo design */}
          <div className="bg-white px-6 pt-4 pb-2 text-center relative rounded-t-lg">

            {/* Logo Container - PetGo في الأعلى */}
            <div className="mb-4 flex justify-center">
              <img
                src={logoImage}
                alt="PetGo - Mobile Veterinary Clinic"
                className="h-48 md:h-56 w-auto max-w-[640px] object-contain mx-auto transition-all duration-300 hover:scale-105"
                style={{
                  filter: 'brightness(1.02) contrast(1.1)',
                }}
              />
            </div>

            {/* Hand Logo في المنتصف */}
            <div className="mb-2 flex justify-center">
              <img
                src={welcomeHandImage}
                alt="Welcome Hand"
                className="w-20 h-20 object-contain mx-auto transition-all duration-300 hover:scale-110"
              />
            </div>

            {/* Welcome Message في الأسفل */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-purple-600 mb-1" style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}>
                {language === 'ar' ? 'أهلاً وسهلاً بك' : 'Welcome'}
              </h2>
              <p className="text-sm text-gray-600" style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}>
                {language === 'ar' ? 'سعداء بوجودك معنا' : 'Happy to have you with us'}
              </p>
            </div>

          </div>

        <CardContent className="px-8 pt-2 pb-8 bg-white/95 backdrop-blur-sm">

          {!isRegistering ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold" style={{ 
                        fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                      }}>
                        {language === 'ar' ? 'رقم الهاتف أو الإيميل' : 'Phone Number or Email'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder={language === 'ar' ? 'أدخل رقم الهاتف أو الإيميل' : 'Enter phone number or email'}
                          className={`pr-4 pl-16 py-3 border-2 rounded-xl bg-white shadow-sm transition-all duration-300 
                            focus:ring-4 focus:ring-opacity-20 focus:shadow-lg hover:shadow-md
                            ${language === 'ar' ? 'text-right' : 'text-left'}`}
                          style={{ 
                            borderColor: 'var(--purple-primary)', 
                            '--tw-ring-color': 'var(--purple-primary)',
                            fontSize: '16px',
                            fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                          } as any}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold" style={{ 
                        fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                      }}>{t('password')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder={t('enterPassword')}
                          className={`pr-4 pl-12 py-3 border-2 rounded-xl bg-white shadow-sm transition-all duration-300 
                            focus:ring-4 focus:ring-opacity-20 focus:shadow-lg hover:shadow-md
                            ${language === 'ar' ? 'text-right' : 'text-left'}`}
                          style={{ 
                            borderColor: 'var(--purple-primary)', 
                            '--tw-ring-color': 'var(--purple-primary)',
                            fontSize: '16px',
                            fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                          } as any}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full text-white py-3 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 
                    hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed
                    bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-600 hover:#1E50C8950" 
                  disabled={loginMutation.isPending}
                  style={{ 
                    background: loginMutation.isPending ? '#6B21A8' : undefined,
                    boxShadow: '0 8px 25px rgba(107, 33, 168, 0.4)'
                  }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {loginMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span style={{ 
                      fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                    }}>{loginMutation.isPending ? t('loading') : t('login')}</span>
                  </div>
                </Button>

                <div className="text-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsRegistering(true)}
                    className="w-full py-3 rounded-xl font-semibold border-2 transition-all duration-300 
                      hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                      bg-white hover:bg-purple-100 text-purple-600 border-purple-600 hover:border-purple-600"
                  >
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                      <UserPlus className="w-5 h-5" />
                      <span style={{ 
                        fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                      }}>Create New Account</span>
                    </div>
                  </Button>
                  
                  {/* Reset Password Button */}
                  <div className="mt-4">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="w-full py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-all duration-300"
                    >
                      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                        <RefreshCw className="w-4 h-4" />
                        <span style={{ 
                          fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                        }}>
                          {language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Account Password'}
                        </span>
                      </div>
                    </Button>
                  </div>

                  {/* Reset Password Form */}
                  {showResetPassword && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200 transition-all duration-300">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="reset-email-input" className="block text-sm font-medium text-gray-700 mb-2" style={{ 
                            fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive',
                            textAlign: getTextAlign(language)
                          }}>
                            {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                          </label>
                          <div className="relative group">
                            <Input
                              id="reset-email-input"
                              type="email"
                              placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'}
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              className={`pr-4 pl-12 py-3 border-2 rounded-xl bg-white shadow-sm transition-all duration-300 
                                focus:ring-4 focus:ring-opacity-20 focus:shadow-lg hover:shadow-md
                                ${language === 'ar' ? 'text-right' : 'text-left'}`}
                              style={{ 
                                borderColor: 'var(--purple-primary)', 
                                '--tw-ring-color': 'var(--purple-primary)',
                                fontSize: '16px',
                                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                              } as any}
                            />
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600 w-4 h-4 transition-colors duration-300 group-focus-within:text-purple-600" />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/5 to-pink-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                          </div>
                        </div>
                        
                        <Button 
                          type="button" 
                          onClick={handleResetPassword}
                          disabled={resetPasswordMutation.isPending || !resetEmail}
                          className="w-full text-white py-3 rounded-xl font-semibold text-sm shadow-lg transition-all duration-300 
                            hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed
                            bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-600 hover:to-purple-700" 
                          style={{ 
                            background: resetPasswordMutation.isPending ? '#6B21A8' : undefined,
                            boxShadow: '0 6px 20px rgba(107, 33, 168, 0.3)'
                          }}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            {resetPasswordMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                            <span style={{ 
                              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                            }}>
                              {resetPasswordMutation.isPending 
                                ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...') 
                                : (language === 'ar' ? 'إرسال رمز إعادة التعيين' : 'Send Reset Code')
                              }
                            </span>
                          </div>
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                    <p className="text-sm text-gray-500 font-medium tracking-wide" style={{ 
                      fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                    }}>
                      Powered By DotVets Software
                    </p>
                    <div className="text-center">
                      <Link href="/en/privacy-policy">
                        <span className="text-sm text-purple-600 hover:text-purple-700 cursor-pointer underline" style={{ 
                          fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                        }}>
                          Privacy & Policy
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          ) : (
            <div>
              <CustomerRegistrationForm
                sendOTP={true}
                onSuccess={handleRegistrationSuccess}
                onCancel={() => setIsRegistering(false)}
                showBackButton={true}
              />
              
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                <p className="text-sm text-gray-500 font-medium tracking-wide text-center" style={{ 
                  fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                }}>
                  Powered By DotVets Software
                </p>
                <div className="text-center">
                  <Link href="/en/privacy-policy">
                    <span className="text-sm text-purple-600 hover:text-purple-700 cursor-pointer underline" style={{ 
                      fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                    }}>
                      Privacy & Policy
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      </div>

      {/* YouTube Tutorial Modal */}
      <YouTubeTutorialModal 
        isOpen={showTutorialVideo}
        onClose={handleTutorialVideoClose}
      />
    </div>
  );
}