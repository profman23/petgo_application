import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { loginSchema } from '@shared/schema';
import { Car, Phone, Lock } from 'lucide-react';
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
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
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
      setLocation('/');
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
            <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">تطبيق النقل</h1>
            <p className="text-gray-600">
              {isRegistering ? 'إنشاء حساب جديد' : 'سجل دخولك للبدء في طلب الرحلة'}
            </p>
            {!isRegistering && (
              <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg mt-4">
                <p className="font-semibold mb-1">للتجربة استخدم:</p>
                <p>الهاتف: 0501234567</p>
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
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type="tel"
                          placeholder="05xxxxxxxx"
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
