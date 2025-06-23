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

  // Generate simple math captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let answer;
    let question;
    switch (operation) {
      case '+':
        answer = num1 + num2;
        question = `${num1} + ${num2} = ؟`;
        break;
      case '-':
        answer = Math.max(num1, num2) - Math.min(num1, num2);
        question = `${Math.max(num1, num2)} - ${Math.min(num1, num2)} = ؟`;
        break;
      case '*':
        answer = num1 * num2;
        question = `${num1} × ${num2} = ؟`;
        break;
      default:
        answer = num1 + num2;
        question = `${num1} + ${num2} = ؟`;
    }
    
    setCaptcha({ question, answer });
  };

  useEffect(() => {
    if (isRegistering) {
      generateCaptcha();
    }
  }, [isRegistering]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      petName: '',
      petType: 'كلب',
      phone: '',
      password: '',
      captcha: '',
    },
    mode: 'onChange',
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return response.json() as Promise<AuthResponse>;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: `مرحباً ${data.user.name}`,
      });
      
      // Redirect based on user type
      if (data.user.membershipType === 'doctor') {
        setLocation('/doctor-dashboard');
      } else {
        setLocation('/');
      }
    },
    onError: (error) => {
      toast({
        title: 'خطأ في تسجيل الدخول',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterUser) => {
      // Validate captcha on frontend first
      if (parseInt(data.captcha) !== captcha.answer) {
        throw new Error('رمز التحقق غير صحيح');
      }
      
      const response = await apiRequest('POST', '/api/auth/register', {
        phone: data.phone,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        petName: data.petName,
        petType: data.petType
      });
      return response.json() as Promise<AuthResponse>;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast({
        title: 'تم التسجيل بنجاح',
        description: `مرحباً ${data.user.name}، تم إنشاء حسابك بنجاح`,
      });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: 'خطأ في التسجيل',
        description: error.message,
        variant: 'destructive',
      });
      generateCaptcha(); // Generate new captcha on error
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterUser) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="text-center flex-1">
              <div className="flex items-center justify-center mb-2">
                {isRegistering ? (
                  <UserPlus className="w-8 h-8 text-blue-600 ml-2" />
                ) : (
                  <User className="w-8 h-8 text-blue-600 ml-2" />
                )}
                <h1 className="text-2xl font-bold text-gray-900">
                  {isRegistering ? 'إنشاء حساب جديد' : 'تسجيل دخول العملاء'}
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                {isRegistering 
                  ? 'املأ جميع البيانات المطلوبة لإنشاء حساب جديد'
                  : 'ادخل بياناتك للوصول إلى خدمات العيادة البيطرية المتنقلة'
                }
              </p>
            </div>
          </div>

          {!isRegistering && (
            <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg mb-4">
              <p className="font-semibold mb-1">للتجربة استخدم:</p>
              <p>رقم الهاتف: 0501234567</p>
              <p>كلمة المرور: 123456</p>
            </div>
          )}

          {!isRegistering ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف أو اسم المستخدم</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="text"
                            placeholder="05xxxxxxxx أو vetsvan1"
                            className="text-right pr-4 pl-12"
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
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="password"
                            placeholder="كلمة المرور"
                            className="text-right pr-4 pl-12"
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
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={registerForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الأول *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="أحمد"
                            className="text-right"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الثاني *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="محمد"
                            className="text-right"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={registerForm.control}
                  name="petName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الأليف *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="text"
                            placeholder="فيلو"
                            className="text-right pr-4 pl-12"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                          <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="petType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الأليف *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-right">
                            <SelectValue placeholder="اختر نوع الأليف" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="كلب">كلب 🐕</SelectItem>
                          <SelectItem value="قطة">قطة 🐱</SelectItem>
                          <SelectItem value="طير">طير 🐦</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="tel"
                            placeholder="0501234567"
                            className="text-right pr-4 pl-12"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="password"
                            placeholder="كلمة المرور (6 أحرف على الأقل)"
                            className="text-right pr-4 pl-12"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Captcha Section */}
                <div className="bg-blue-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <FormLabel className="text-sm font-medium">رمز التحقق *</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={generateCaptcha}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <RefreshCw className="w-4 h-4 ml-1" />
                      تجديد
                    </Button>
                  </div>
                  <div className="text-center mb-3">
                    <div className="inline-block bg-white border-2 border-blue-200 px-4 py-2 rounded text-xl font-bold text-blue-800">
                      {captcha.question}
                    </div>
                  </div>
                  <FormField
                    control={registerForm.control}
                    name="captcha"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="أدخل الإجابة"
                            className="text-center text-lg"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-600 hover:underline text-sm"
            >
              {isRegistering ? 'لديك حساب؟ سجل دخولك' : 'لا تملك حساب؟ سجل الآن'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => setLocation('/doctor-login')}
              className="text-gray-600 hover:text-gray-800 text-sm underline"
            >
              دخول الأطباء
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}