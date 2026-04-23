import { useState, useEffect } from 'react';
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
import { useLanguage, useTranslation, getDirection, getTextAlign } from '@/lib/i18n';

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

  // Prevent Back button navigation ONLY for /login/doctor route
  useEffect(() => {
    // Check if current path is exactly /login/doctor
    if (window.location.pathname === '/login/doctor') {
      // Add current state to history to create a "trap"
      const currentState = { page: 'doctor-login', preventBack: true };
      window.history.pushState(currentState, '', window.location.href);
      
      // Handle popstate events (Back/Forward button presses)
      const handlePopState = (event: PopStateEvent) => {
        // If user tries to go back from doctor login, stay on the same page
        if (window.location.pathname === '/login/doctor') {
          // Push the state again to keep user on doctor login
          window.history.pushState(currentState, '', window.location.href);
        }
      };
      
      window.addEventListener('popstate', handlePopState);
      
      // Cleanup event listener on component unmount
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []);

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
      const response = await apiRequest('/api/doctor/login', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response as AuthResponse;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast({
        title: language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login Successful',
        description: language === 'ar' ? `مرحباً بك في خدمتنا البيطرية د. ${data.user.name}` : `Welcome to our veterinary service Dr. ${data.user.name}`,
        variant: "default",
      });
      window.location.href = '/doctor-dashboard';
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? 'حدث خطأ' : 'An error occurred',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: DoctorLoginData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4" dir={getDirection(language)}>
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-2" style={{ borderColor: 'var(--purple-primary)', boxShadow: '0 15px 35px rgba(139, 47, 139, 0.15)' }}>
          {/* Header with back button - matching customer login style */}
          <div className="bg-white p-6 text-center relative rounded-t-lg border-b shadow-sm">
            {/* Back button - hidden for /login/doctor route */}
            <button
              onClick={() => setLocation('/user-type-selection')}
              className="absolute top-4 left-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={language === 'ar' ? 'العودة للخلف' : 'Go Back'}
              title={language === 'ar' ? 'العودة للخلف' : 'Go Back'}
              style={{ display: window.location.pathname === '/login/doctor' ? 'none' : 'block' }}
            >
              <ArrowLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
            
            <div className="mb-4 flex justify-center">
              <div className="bg-white rounded-2xl p-3 shadow-md transition-all duration-300 hover:scale-105">
                <img 
                  src={logoImage} 
                  alt="PetGo" 
                  className="h-16 w-auto max-w-[200px] object-contain mx-auto"
                  style={{ 
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1)) contrast(1.05)',
                  }}
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800" style={{ textAlign: getTextAlign(language) }}>
              {language === 'ar' ? 'دخول الطبيب البيطري' : 'Veterinary Doctor Login'}
            </h1>
            <p className="text-gray-600 mt-2" style={{ textAlign: getTextAlign(language) }}>
              {language === 'ar' ? 'سجل دخولك لإدارة الطلبات والمواعيد' : 'Log in to manage requests and appointments'}
            </p>
          </div>

          <CardContent className="p-8">

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="doctor-username">
                        {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            id="doctor-username"
                            type="text"
                            placeholder="vetsvan1"
                            autoComplete="username"
                            className={`pr-4 pl-12 border-2 focus:ring-2 focus:ring-opacity-50 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                            style={{ borderColor: 'var(--purple-primary)', '--tw-ring-color': 'var(--purple-primary)' } as any}
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
                      <FormLabel htmlFor="doctor-password">
                        {language === 'ar' ? 'كلمة المرور' : 'Password'}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            id="doctor-password"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
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
                  className="w-full text-white py-3 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 
                    hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed
                    bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  disabled={loginMutation.isPending}
                  aria-describedby={loginMutation.isPending ? "login-status" : undefined}
                  style={{ 
                    background: loginMutation.isPending ? '#6B21A8' : 'var(--purple-primary)',
                    boxShadow: '0 8px 25px rgba(133, 32, 133, 0.4)'
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    {loginMutation.isPending && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {loginMutation.isPending 
                      ? (language === 'ar' ? 'جاري تسجيل الدخول...' : 'Logging in...') 
                      : (language === 'ar' ? 'دخول' : 'Login')
                    }
                  </div>
                </Button>
                
                {loginMutation.isPending && (
                  <div id="login-status" className="sr-only">
                    {language === 'ar' ? 'جاري تسجيل الدخول، يرجى الانتظار' : 'Login in progress, please wait'}
                  </div>
                )}
              </form>
            </Form>

            <div className="text-center text-xs text-gray-500 mt-6">
              <p>
                {language === 'ar' 
                  ? 'مخصص للأطباء البيطريين المعتمدين فقط' 
                  : 'For certified veterinary doctors only'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}