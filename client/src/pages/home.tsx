import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRide } from '@/hooks/useRide';
import { Bell, Settings, User, Car, Star } from 'lucide-react';
import { MEMBERSHIP_TYPES } from '@/lib/constants';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { activeRide, isLoadingActiveRide } = useRide();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      setLocation('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // رسالة ترحيب للمستخدمين الجدد (يتم عرضها مرة واحدة فقط)
    const hasSeenWelcome = localStorage.getItem(`welcome_${parsedUser.id}`);
    if (!hasSeenWelcome) {
      setTimeout(() => {
        toast({
          title: `مرحباً ${parsedUser.firstName}! 👋`,
          description: `نحن سعداء لانضمامك إلى عيادة الحيوانات المتنقلة. يمكنك الآن طلب طبيب بيطري لحيوانك الأليف ${parsedUser.petName || 'الأليف'}.`,
        });
        localStorage.setItem(`welcome_${parsedUser.id}`, 'true');
      }, 1000);
    }
    
    // Test token validity on page load
    fetch('/api/rides/active', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast({
          title: 'انتهت جلسة العمل',
          description: 'يرجى تسجيل الدخول مرة أخرى',
          variant: 'destructive',
        });
        setLocation('/login');
      }
    }).catch(() => {
      // Network error, ignore
    });
  }, [setLocation, toast]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast({
      title: 'تم تسجيل الخروج',
      description: 'تم تسجيل خروجك بنجاح',
    });
    setLocation('/login');
  };

  const handleRequestRide = () => {
    if (activeRide) {
      setLocation('/ride-tracking');
    } else {
      setLocation('/ride-request');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src={logoImage} 
                alt="Vets Van" 
                className="h-8 object-contain"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">
                العضوية: {MEMBERSHIP_TYPES[user.membershipType as keyof typeof MEMBERSHIP_TYPES]}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="text-red-600">
              خروج
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Active Ride Card */}
        {activeRide && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-900">لديك رحلة نشطة</p>
                  <p className="text-sm text-blue-700">اضغط لمتابعة الرحلة</p>
                </div>
                <Button onClick={() => setLocation('/ride-tracking')} className="bg-blue-600 hover:bg-blue-700">
                  متابعة الرحلة
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">طلب عيادة بيطرية متنقلة</h2>
          <Button
            onClick={handleRequestRide}
            disabled={!!activeRide}
            className="w-full bg-green-600 hover:bg-green-700 text-white p-8 h-auto flex-col"
          >
            <div className="text-4xl mb-3">🏥</div>
            <span className="font-bold text-lg">طلب عيادة متنقلة</span>
            <span className="text-sm opacity-90 mt-1">خدمة بيطرية في موقعك</span>
          </Button>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">الطلبات الأخيرة</h3>
            <div className="text-center py-8">
              <p className="text-gray-500">لا توجد طلبات سابقة</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
