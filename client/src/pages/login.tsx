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
import { loginSchema, registerSchema, type RegisterUser } from '@shared/schema';
import { User, Phone, Lock, ArrowLeft, UserPlus, RefreshCw, Heart, Mail } from 'lucide-react';
import { useLocation } from 'wouter';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';

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
  const [captcha, setCaptcha] = useState({ question: '', answer: 0 });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    captcha: '',
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useTranslation();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operation = Math.random() > 0.5 ? '+' : '-';
    
    let question, answer;
    if (operation === '+') {
      question = `${num1} + ${num2} = ؟`;
      answer = num1 + num2;
    } else {
      const larger = Math.max(num1, num2);
      const smaller = Math.min(num1, num2);
      question = `${larger} - ${smaller} = ؟`;
      answer = larger - smaller;
    }
    
    setCaptcha({ question, answer });
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

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
      toast({
        title: t('loginSuccess'),
        description: `${t('welcomeNewUser')} ${data.user.name}`,
        variant: "default",
      });
      setLocation('/home');
    },
    onError: (error: Error) => {
      toast({
        title: t('errorOccurred'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      // Validate captcha first
      if (parseInt(data.captcha) !== captcha.answer) {
        throw new Error(language === 'ar' ? 'رمز التحقق غير صحيح' : 'Invalid verification code');
      }
      
      // Add language to registration data
      const dataWithLanguage = {
        ...data,
        preferredLanguage: language
      };
      
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(dataWithLanguage)
      });
      return response;
    },
    onSuccess: (data) => {
      // Store email for OTP verification
      localStorage.setItem('otpEmail', formData.email);
      localStorage.setItem('otpUserName', formData.firstName);
      
      toast({
        title: language === 'ar' ? 'تم إرسال رمز التحقق' : 'Verification Code Sent',
        description: language === 'ar' ? 
          `تم إرسال رمز التحقق إلى ${formData.email}. يرجى التحقق من بريدك الإلكتروني.` :
          `Verification code sent to ${formData.email}. Please check your email.`,
        variant: "default",
      });
      
      // Redirect to OTP verification page
      setLocation('/otp-verification');
    },
    onError: (error: Error) => {
      toast({
        title: t('errorOccurred'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4" dir={getDirection(language)}>
      <div className="w-full max-w-lg">
        <Card className="shadow-xl border-2" style={{ borderColor: 'var(--purple-primary)', boxShadow: '0 15px 35px rgba(139, 47, 139, 0.15)' }}>
          {/* Header with back button and improved logo design */}
          <div className="bg-white px-6 py-6 text-center relative rounded-t-lg">
            
            {/* Logo Container - Seamless White Background */}
            <div className="mb-6 flex justify-center">
              <img 
                src={logoImage} 
                alt="Vets Van - Mobile Veterinary Clinic" 
                className="h-24 w-auto max-w-[280px] object-contain mx-auto transition-all duration-300 hover:scale-105"
                style={{ 
                  filter: 'contrast(1.05)',
                }}
              />
            </div>

          </div>

        <CardContent className="p-8 bg-white/95 backdrop-blur-sm">

          {!isRegistering ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        {language === 'ar' ? 'رقم الهاتف أو الإيميل' : 'Phone Number or Email'}
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
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
                              fontSize: '16px'
                            } as any}
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                            <Phone className="text-purple-600 w-4 h-4 transition-colors duration-300 group-focus-within:text-purple-600" />
                            <div className="w-px h-4 bg-gray-300"></div>
                            <Mail className="text-purple-600 w-4 h-4 transition-colors duration-300 group-focus-within:text-purple-600" />
                          </div>
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/5 to-pink-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
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
                      <FormLabel className="text-gray-700 font-semibold">{t('password')}</FormLabel>
                      <FormControl>
                        <div className="relative group">
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
                              fontSize: '16px'
                            } as any}
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600 w-4 h-4 transition-colors duration-300 group-focus-within:text-purple-600" />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/5 to-pink-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full text-white py-3 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 
                    hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed
                    bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-600 hover:#852085950" 
                  disabled={loginMutation.isPending}
                  style={{ 
                    background: loginMutation.isPending ? '#6B21A8' : undefined,
                    boxShadow: '0 8px 25px rgba(107, 33, 168, 0.4)'
                  }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {loginMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{loginMutation.isPending ? t('loading') : t('login')}</span>
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
                      <span>Create New Account</span>
                    </div>
                  </Button>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 font-medium tracking-wide">
                      Powered By Ghazala Software
                    </p>
                  </div>
                </div>
              </form>
            </Form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ textAlign: getTextAlign(language) }}>
                    {language === 'ar' ? 'الاسم الأول' : 'First Name'} *
                  </label>
                  <Input
                    type="text"
                    placeholder={language === 'ar' ? 'أدخل الاسم الأول' : 'Enter first name'}
                    className={`h-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3" style={{ textAlign: getTextAlign(language) }}>
                    {language === 'ar' ? 'الاسم الأخير' : 'Last Name'} *
                  </label>
                  <Input
                    type="text"
                    placeholder={language === 'ar' ? 'أدخل الاسم الأخير' : 'Enter last name'}
                    className={`h-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3" style={{ textAlign: getTextAlign(language) }}>
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter your email address'}
                    className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                    value={formData.email || ''}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    required
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3" style={{ textAlign: getTextAlign(language) }}>
                  {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} *
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter your phone number'}
                    className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    required
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3" style={{ textAlign: getTextAlign(language) }}>
                  {language === 'ar' ? 'كلمة المرور' : 'Password'} *
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder={language === 'ar' ? 'أدخل كلمة المرور (6 أحرف على الأقل)' : 'Enter password (minimum 6 characters)'}
                    className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    required
                    minLength={6}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 #85208550 p-6 rounded-xl border-2 border-blue-200">
                <h3 className="text-center text-lg font-semibold text-blue-800 mb-4" style={{ textAlign: getTextAlign(language) }}>
                  {language === 'ar' ? 'التحقق الأمني' : 'Security Verification'} *
                </h3>
                <div className="flex justify-center mb-4">
                  <div className="inline-block bg-white border-3 border-blue-300 px-6 py-3 rounded-xl text-2xl font-bold text-blue-900 shadow-lg">
                    {captcha.question}
                  </div>
                </div>
                <Input
                  type="number"
                  placeholder={language === 'ar' ? 'أدخل الإجابة' : 'Enter your answer'}
                  className="text-center text-xl mb-4 h-12 border-2 border-blue-300"
                  value={formData.captcha}
                  onChange={(e) => updateFormData('captcha', e.target.value)}
                  required
                />
                <div className="flex justify-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="lg" 
                    onClick={generateCaptcha}
                    className="flex items-center gap-3 border-2 border-blue-300 hover:bg-blue-100"
                  >
                    <RefreshCw className="w-5 h-5" />
                    {language === 'ar' ? 'تجديد السؤال' : 'Refresh Question'}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {language === 'ar' ? 'جاري إنشاء الحساب...' : 'Creating Account...'}
                  </div>
                ) : (
                  language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'
                )}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsRegistering(false)}
                className="w-full h-12 border-2 border-gray-300 hover:border-purple-600 hover:bg-purple-100 text-gray-700 hover:text-purple-600 font-medium rounded-xl transition-all duration-300"
              >
                <ArrowLeft className={`w-5 h-5 ${language === 'ar' ? 'ml-3 rotate-180' : 'mr-3'}`} />
                {language === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to Login'}
              </Button>
            </form>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}