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
import { User, Phone, Lock, ArrowLeft, UserPlus, RefreshCw, Heart } from 'lucide-react';
import { useLocation } from 'wouter';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { useTranslation, getDirection } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';

interface LoginFormData {
  phone: string;
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
    petName: '',
    petType: 'كلب',
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
      phone: '',
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
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً ${data.user.name}`,
      });
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      // Validate captcha first
      if (parseInt(data.captcha) !== captcha.answer) {
        throw new Error('رمز التحقق غير صحيح');
      }
      
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response as AuthResponse;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // رسالة ترحيب مفصلة
      toast({
        title: "🎉 مرحباً بك في عيادة الحيوانات المتنقلة!",
        description: `أهلاً وسهلاً ${formData.firstName}! تم إنشاء حسابك بنجاح. يمكنك الآن طلب الخدمات البيطرية لحيوانك الأليف ${formData.petName}.`,
      });
      
      // رسالة ترحيب إضافية بعد ثانيتين
      setTimeout(() => {
        toast({
          title: "نصائح للبداية",
          description: "يمكنك طلب طبيب بيطري متنقل الآن، وسيصل إليك في أسرع وقت ممكن!",
        });
      }, 2000);
      
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في إنشاء الحساب",
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
      {/* Language Selector */}
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <Card className="w-full max-w-md border-2 shadow-xl" style={{ borderColor: 'var(--purple-primary)', boxShadow: '0 15px 35px rgba(139, 47, 139, 0.15)' }}>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6">
              <img 
                src={logoImage} 
                alt="Vets Van - Mobile Veterinary Clinic" 
                className="h-20 mx-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isRegistering ? t('createNewAccount') : t('welcomeBack')}
            </h1>
            <p className="text-gray-600">
              {isRegistering 
                ? t('joinMobileVetService') 
                : t('loginToAccount')
              }
            </p>
          </div>

          {!isRegistering ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('phoneNumber')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="tel"
                            placeholder={t('enterPhone')}
                            className={`pr-4 pl-12 border-2 focus:ring-2 focus:ring-opacity-50 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                            style={{ borderColor: 'var(--purple-primary)', '--tw-ring-color': 'var(--purple-primary)' } as any}
                          />
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                      <FormLabel>{t('password')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="password"
                            placeholder={t('enterPassword')}
                            className={`pr-4 pl-12 border-2 focus:ring-2 focus:ring-opacity-50 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                            style={{ borderColor: 'var(--purple-primary)', '--tw-ring-color': 'var(--purple-primary)' } as any}
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full text-white" 
                  disabled={loginMutation.isPending}
                  style={{ backgroundColor: 'var(--purple-primary)', borderColor: 'var(--purple-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--purple-dark)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--purple-primary)'}
                >
                  {loginMutation.isPending ? t('loading') : t('login')}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    {language === 'ar' ? 'حساب تجريبي: 0501234567 / 123456' : 'Test account: 0501234567 / 123456'}
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsRegistering(true)}
                    className="w-full"
                  >
                    <UserPlus className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {t('createNewAccount')}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('firstName')} *</label>
                  <Input
                    type="text"
                    placeholder={t('enterFirstName')}
                    className={`${language === 'ar' ? 'text-right' : 'text-left'}`}
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('lastName')} *</label>
                  <Input
                    type="text"
                    placeholder={t('enterLastName')}
                    className={`${language === 'ar' ? 'text-right' : 'text-left'}`}
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('petName')} *</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder={t('enterPetName')}
                    className={`pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                    value={formData.petName}
                    onChange={(e) => updateFormData('petName', e.target.value)}
                    required
                  />
                  <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('petType')} *</label>
                <Select value={formData.petType} onValueChange={(value) => updateFormData('petType', value)}>
                  <SelectTrigger className={`${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <SelectValue placeholder={language === 'ar' ? 'اختر نوع الأليف' : 'Select pet type'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="كلب">{language === 'ar' ? 'كلب' : 'Dog'}</SelectItem>
                    <SelectItem value="قطة">{language === 'ar' ? 'قطة' : 'Cat'}</SelectItem>
                    <SelectItem value="طير">{language === 'ar' ? 'طير' : 'Bird'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('phoneNumber')} *</label>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder={t('enterPhone')}
                    className={`pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    required
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('password')} *</label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder={t('enterPassword')}
                    className={`pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    required
                    minLength={6}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="text-center text-lg font-semibold text-yellow-800 mb-2">{t('mathCaptcha')} *</h3>
                <div className="flex justify-center mb-3">
                  <div className="inline-block bg-white border-2 border-blue-200 px-4 py-2 rounded text-xl font-bold text-blue-800">
                    {captcha.question}
                  </div>
                </div>
                <Input
                  type="number"
                  placeholder={t('enterCaptchaAnswer')}
                  className="text-center text-lg mb-2"
                  value={formData.captcha}
                  onChange={(e) => updateFormData('captcha', e.target.value)}
                  required
                />
                <div className="flex justify-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={generateCaptcha}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {language === 'ar' ? 'تجديد السؤال' : 'Refresh Question'}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? t('loading') : t('createNewAccount')}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsRegistering(false)}
                className="w-full"
              >
                <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {t('backToLogin')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}