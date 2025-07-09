import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';
import { registerSchema, type RegisterUser } from '@shared/schema';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Loader2, Eye, EyeOff, User, Phone, Lock, Mail, MapPin } from 'lucide-react';
import { OtpVerification } from '@/components/OtpVerification';
import logoPath from '@assets/IMG-20250415-WA0047_1751986059751.jpg';

// Removed petTypeOptions as we'll use simple form

export default function Register() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState<number>(0);
  const [captchaProblem, setCaptchaProblem] = useState<string>('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [userEmail, setUserEmail] = useState('');

  const translations = {
    ar: {
      title: 'إنشاء حساب جديد',
      subtitle: 'انضم إلى عائلة VETS VAN',
      name: 'الاسم',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      captcha: 'حل المسألة',
      register: 'إنشاء الحساب',
      backToLogin: 'العودة لتسجيل الدخول',
      registering: 'جاري إنشاء الحساب...',
      accountCreated: 'تم إنشاء الحساب بنجاح!',
      phonePlaceholder: '05xxxxxxxx',
      emailPlaceholder: 'your@email.com',
      namePlaceholder: 'الاسم الكامل',
      passwordPlaceholder: 'كلمة المرور',
      confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
      captchaPlaceholder: 'أدخل الإجابة',
      sendingOtp: 'جاري إرسال رمز التحقق...'
    },
    en: {
      title: 'Create New Account',
      subtitle: 'Join the VETS VAN family',
      name: 'Name',
      phone: 'Phone Number',
      email: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      captcha: 'Solve the problem',
      register: 'Create Account',
      backToLogin: 'Back to Login',
      registering: 'Creating account...',
      accountCreated: 'Account created successfully!',
      phonePlaceholder: '05xxxxxxxx',
      emailPlaceholder: 'your@email.com',
      namePlaceholder: 'Full Name',
      passwordPlaceholder: 'Password',
      confirmPasswordPlaceholder: 'Confirm password',
      captchaPlaceholder: 'Enter answer',
      sendingOtp: 'Sending verification code...'
    }
  };

  const texts = translations[language];

  const form = useForm<RegisterUser>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      captcha: 0
    }
  });

  // Generate random captcha
  useEffect(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaProblem(`${num1} + ${num2}`);
    setCaptchaAnswer(num1 + num2);
  }, []);

  const sendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest('/api/auth/send-otp', {
        method: 'POST',
        body: { email, preferredLanguage: language }
      });
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم الإرسال' : 'Sent',
        description: language === 'ar' ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' : 'Verification code sent to your email',
      });
      setStep('otp');
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل في إرسال رمز التحقق' : 'Failed to send verification code'),
        variant: 'destructive',
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterUser) => {
      return await apiRequest('/api/auth/register', {
        method: 'POST',
        body: { ...data, preferredLanguage: language }
      });
    },
    onSuccess: (data) => {
      toast({
        title: language === 'ar' ? 'نجح' : 'Success',
        description: texts.accountCreated,
      });
      
      // Store token and redirect
      localStorage.setItem('token', data.token);
      setLocation('/home');
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل في إنشاء الحساب' : 'Failed to create account'),
        variant: 'destructive',
      });
    }
  });

  const onSubmit = async (data: RegisterUser) => {
    // Validate captcha
    if (data.captcha !== captchaAnswer) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'إجابة المسألة غير صحيحة' : 'Incorrect captcha answer',
        variant: 'destructive',
      });
      return;
    }

    // First send OTP for email verification
    setUserEmail(data.email);
    sendOtpMutation.mutate(data.email);
  };

  const handleOtpVerificationComplete = () => {
    // OTP verified, now create account
    const formData = form.getValues();
    registerMutation.mutate(formData);
  };

  const handleBackToForm = () => {
    setStep('form');
    setUserEmail('');
  };

  if (step === 'otp') {
    return (
      <OtpVerification
        email={userEmail}
        onVerificationComplete={handleOtpVerificationComplete}
        onBack={handleBackToForm}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src={logoPath} 
                alt="VETS VAN Logo" 
                className="w-24 h-24 mx-auto rounded-lg shadow-md border-2 border-purple-200"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {texts.title}
            </h1>
            <p className="text-gray-600">
              {texts.subtitle}
            </p>
          </div>

          {/* Registration Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Field - Combined */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {texts.name}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={texts.namePlaceholder}
                          {...field}
                          className="text-right"
                          dir={language === 'ar' ? 'rtl' : 'ltr'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {texts.phone}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={texts.phonePlaceholder}
                          {...field}
                          dir="ltr"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {texts.email}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={texts.emailPlaceholder}
                        {...field}
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        {texts.password}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder={texts.passwordPlaceholder}
                            {...field}
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        {texts.confirmPassword}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder={texts.confirmPasswordPlaceholder}
                            {...field}
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Captcha */}
              <FormField
                control={form.control}
                name="captcha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{texts.captcha}: {captchaProblem} = ?</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={texts.captchaPlaceholder}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg"
                disabled={sendOtpMutation.isPending || registerMutation.isPending}
              >
                {sendOtpMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {texts.sendingOtp}
                  </>
                ) : registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {texts.registering}
                  </>
                ) : (
                  texts.register
                )}
              </Button>

              {/* Back to Login */}
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setLocation('/login')}
              >
                {texts.backToLogin}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}