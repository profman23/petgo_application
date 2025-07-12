import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Mail, Phone, ArrowLeft, RefreshCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import logoImage from "@assets/IMG-20250415-WA0047_1751986059751.jpg";
import { useLanguage, getDirection, getTextAlign } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';

interface LoginFormData {
  identifier: string;
  password: string;
}

interface RegisterFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  captcha: string;
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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginData, setLoginData] = useState<LoginFormData>({ identifier: '', password: '' });
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    captcha: ''
  });

  const [captcha, setCaptcha] = useState({ question: '', answer: 0 });

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({
      question: `${num1} + ${num2} = ?`,
      answer: num1 + num2
    });
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const updateFormData = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      return response.json() as Promise<AuthResponse>;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast({
        title: language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login Successful',
        description: language === 'ar' ? 'مرحباً بك في التطبيق' : 'Welcome to the app'
      });
      setLocation('/home');
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ar' ? 'خطأ في تسجيل الدخول' : 'Login Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      if (parseInt(data.captcha) !== captcha.answer) {
        throw new Error(language === 'ar' ? 'إجابة خاطئة للسؤال الأمني' : 'Incorrect security answer');
      }

      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account Created Successfully',
        description: language === 'ar' ? 'يرجى تسجيل الدخول الآن' : 'Please login now'
      });
      setIsRegistering(false);
      generateCaptcha();
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: '',
        captcha: ''
      });
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      if (errorMessage.includes(':400')) {
        errorMessage = errorMessage.replace(':400', '');
      }
      
      toast({
        title: language === 'ar' ? 'خطأ في إنشاء الحساب' : 'Registration Error',
        description: errorMessage,
        variant: 'destructive'
      });
      generateCaptcha();
    }
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  const textAlign = getTextAlign(language);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-white/90 backdrop-blur-sm rounded-3xl p-4 shadow-2xl border border-white/20">
              <img 
                src={logoImage}
                alt="VetsVan Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ textAlign }}>
            {language === 'ar' ? 'مرحباً بك' : 'Welcome'}
          </h1>
          <p className="text-white/80 text-lg" style={{ textAlign }}>
            {isRegistering 
              ? (language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account')
              : (language === 'ar' ? 'تسجيل دخول العملاء' : 'Customer Login')
            }
          </p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex justify-center mb-6">
              <LanguageSelector />
            </div>

            {!isRegistering ? (
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ textAlign }}>
                    {language === 'ar' ? 'رقم الهاتف أو البريد الإلكتروني' : 'Phone or Email'} *
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder={language === 'ar' ? '0501234567 أو user@example.com' : '0501234567 or user@example.com'}
                      className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                      value={loginData.identifier}
                      onChange={(e) => setLoginData({...loginData, identifier: e.target.value})}
                      required
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3" style={{ textAlign }}>
                    {language === 'ar' ? 'كلمة المرور' : 'Password'} *
                  </label>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
                      className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {language === 'ar' ? 'جاري تسجيل الدخول...' : 'Logging in...'}
                    </div>
                  ) : (
                    language === 'ar' ? 'تسجيل الدخول' : 'Login'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className="text-purple-600 hover:text-purple-700 font-medium underline"
                  >
                    {language === 'ar' ? 'ليس لديك حساب؟ إنشاء حساب جديد' : "Don't have an account? Create one"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ textAlign }}>
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
                    <label className="block text-sm font-medium mb-3" style={{ textAlign }}>
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
                  <label className="block text-sm font-medium mb-3" style={{ textAlign }}>
                    {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} *
                  </label>
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder={language === 'ar' ? '0501234567' : '0501234567'}
                      className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      required
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3" style={{ textAlign }}>
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder={language === 'ar' ? 'user@example.com' : 'user@example.com'}
                      className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3" style={{ textAlign }}>
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

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
                  <h3 className="text-center text-lg font-semibold text-blue-800 mb-4" style={{ textAlign }}>
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