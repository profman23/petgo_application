import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Stethoscope, User, Lock } from 'lucide-react';

const doctorLoginSchema = z.object({
  username: z.string().min(1, 'اسم المستخدم مطلوب'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

type DoctorLoginData = z.infer<typeof doctorLoginSchema>;

interface AuthResponse {
  token: string;
  user: {
    id: number;
    phone: string;
    name: string;
    membershipType: string;
  };
}

export default function DoctorLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<DoctorLoginData>({
    resolver: zodResolver(doctorLoginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: DoctorLoginData) => {
      // Convert username to phone format for API compatibility
      const loginData = {
        phone: data.username,
        password: data.password,
      };
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData)
      });
      return response as AuthResponse;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: `مرحباً د. ${data.user.name}`,
      });
      window.location.href = '/doctor-dashboard';
    },
    onError: (error) => {
      toast({
        title: 'خطأ في تسجيل الدخول',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: DoctorLoginData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <Button
                variant="ghost"
                onClick={() => setLocation('/login')}
                className="mb-4 p-2"
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة
              </Button>
              
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">دخول الطبيب البيطري</h1>
              <p className="text-gray-600">سجل دخولك لإدارة الطلبات والمواعيد</p>
              
              {/* Test Account Info */}
              <div className="text-xs text-green-600 bg-green-50 p-3 rounded-lg mt-4">
                <p className="font-semibold mb-1">للتجربة استخدم:</p>
                <p>اسم المستخدم: vetsvan1</p>
                <p>كلمة المرور: 123456</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستخدم</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="text"
                            placeholder="vetsvan1"
                            className="text-right pr-4 pl-12"
                          />
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? 'جاري تسجيل الدخول...' : 'دخول'}
                </Button>
              </form>
            </Form>

            <div className="text-center text-xs text-gray-500 mt-6">
              <p>مخصص للأطباء البيطريين المعتمدين فقط</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}