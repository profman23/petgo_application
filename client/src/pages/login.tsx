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

  const registerForm = useForm<RegisterUser>({
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
    mutationFn: async (data: LoginFormData & { name: string }) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      return response.json() as Promise<AuthResponse>;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast({
        title: 'تم إنشاء الحساب بنجاح',
        description: `مرحباً ${data.user.name}`,
      });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: 'خطأ في إنشاء الحساب',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    if (isRegistering) {
      const name = data.phone.replace(/\D/g, '').slice(-4);
      registerMutation.mutate({ ...data, name: `مستخدم ${name}` });
    } else {
      loginMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation('/login')}
              className="mb-4 p-2"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة
            </Button>
            
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">دخول العميل</h1>
            <p className="text-gray-600">
              {isRegistering ? 'إنشاء حساب جديد' : 'سجل دخولك لطلب العيادة البيطرية'}
            </p>
            {!isRegistering && (
              <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg mt-4">
                <p className="font-semibold mb-1">للتجربة استخدم:</p>
                <p>رقم الهاتف: 0501234567</p>
                <p>كلمة المرور: 123456</p>
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
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
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
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
                className="w-full bg-primary hover:bg-gray-800 text-white py-3"
                disabled={loginMutation.isPending || registerMutation.isPending}
              >
                {isRegistering ? 'إنشاء حساب' : 'تسجيل الدخول'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-600 hover:underline text-sm"
            >
              {isRegistering ? 'لديك حساب؟ سجل دخولك' : 'لا تملك حساب؟ سجل الآن'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
