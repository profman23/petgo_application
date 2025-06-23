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
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً ${data.user.name}`,
      });
      setLocation('/');
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
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "مرحباً بك في عيادة الحيوانات المتنقلة",
      });
      setLocation('/');
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </h1>
            <p className="text-gray-600">
              {isRegistering 
                ? 'انضم إلى خدمة العيادة البيطرية المتنقلة' 
                : 'ادخل إلى حسابك للوصول إلى الخدمات البيطرية'
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
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="tel"
                            placeholder="0501234567"
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    حساب تجريبي: 0501234567 / 123456
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsRegistering(true)}
                    className="w-full"
                  >
                    <UserPlus className="w-4 h-4 ml-2" />
                    إنشاء حساب جديد
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">الاسم الأول *</label>
                  <Input
                    type="text"
                    placeholder="أحمد"
                    className="text-right"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الاسم الثاني *</label>
                  <Input
                    type="text"
                    placeholder="محمد"
                    className="text-right"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">اسم الأليف *</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="فيلو"
                    className="text-right pr-4 pl-12"
                    value={formData.petName}
                    onChange={(e) => updateFormData('petName', e.target.value)}
                    required
                  />
                  <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">نوع الأليف *</label>
                <Select value={formData.petType} onValueChange={(value) => updateFormData('petType', value)}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر نوع الأليف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="كلب">كلب</SelectItem>
                    <SelectItem value="قطة">قطة</SelectItem>
                    <SelectItem value="طير">طير</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">رقم الهاتف *</label>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder="0501234567"
                    className="text-right pr-4 pl-12"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    required
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">كلمة المرور *</label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="كلمة المرور (6 أحرف على الأقل)"
                    className="text-right pr-4 pl-12"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    required
                    minLength={6}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="text-center text-lg font-semibold text-yellow-800 mb-2">رمز التحقق *</h3>
                <div className="flex justify-center mb-3">
                  <div className="inline-block bg-white border-2 border-blue-200 px-4 py-2 rounded text-xl font-bold text-blue-800">
                    {captcha.question}
                  </div>
                </div>
                <Input
                  type="number"
                  placeholder="أدخل الإجابة"
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
                    تجديد السؤال
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsRegistering(false)}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة لتسجيل الدخول
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}