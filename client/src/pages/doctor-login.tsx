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
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { useLanguage, useTranslation, getDirection } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';

type DoctorLoginData = {
  username: string;
  password: string;
};

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
  const { language } = useLanguage();
  const { t } = useTranslation();

  const doctorLoginSchema = z.object({
    username: z.string().min(1, language === 'ar' ? 'اسم المستخدم مطلوب' : 'Username is required'),
    password: z.string().min(1, language === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required'),
  });

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4" dir={getDirection(language)}>
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            {/* Language Selector */}
            <div className="flex justify-end mb-4">
              <LanguageSelector />
            </div>
            
            {/* Header */}
            <div className="text-center mb-8">
              <Button
                variant="ghost"
                onClick={() => setLocation('/login')}
                className="mb-4 p-2"
              >
                <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
{t('back')}
              </Button>
              
              <div className="mx-auto mb-6">
                <img 
                  src={logoImage} 
                  alt="Vets Van - Mobile Veterinary Clinic" 
                  className="h-20 mx-auto object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {language === 'ar' ? 'دخول الطبيب البيطري' : 'Veterinary Doctor Login'}
              </h1>
              <p className="text-gray-600">
                {language === 'ar' ? 'سجل دخولك لإدارة الطلبات والمواعيد' : 'Log in to manage requests and appointments'}
              </p>
              
              {/* Test Account Info */}
              <div className="text-xs text-green-600 bg-green-50 p-3 rounded-lg mt-4">
                <p className="font-semibold mb-1">
                  {language === 'ar' ? 'للتجربة استخدم:' : 'For testing use:'}
                </p>
                <p>{language === 'ar' ? 'اسم المستخدم: vetsvan1' : 'Username: vetsvan1'}</p>
                <p>{language === 'ar' ? 'كلمة المرور: 123456' : 'Password: 123456'}</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="text"
                            placeholder="vetsvan1"
                            className={`pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
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