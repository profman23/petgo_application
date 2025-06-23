import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useDoctorLocation } from '@/hooks/useDoctorLocation';
import { Map } from '@/components/map';
import { ArrowLeft, Check, X, MapPin, Clock, Navigation, Loader2, Satellite } from 'lucide-react';

export default function DoctorDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // نظام تتبع GPS للطبيب
  const {
    latitude,
    longitude,
    accuracy,
    error: gpsError,
    isLoading: isLoadingGPS,
    startWatching,
    stopWatching,
  } = useDoctorLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.membershipType !== 'doctor') {
      setLocation('/');
      return;
    }
    
    // Test token validity on page load
    fetch('/api/doctor/pending-rides', {
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

  const { data: pendingRides = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/doctor/pending-rides'],
    refetchInterval: 3000, // Poll every 3 seconds for new requests
  });

  const acceptMutation = useMutation({
    mutationFn: async (rideId: number) => {
      const response = await apiRequest('POST', `/api/doctor/rides/${rideId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم قبول الطلب',
        description: 'تم قبول طلب العيادة البيطرية بنجاح',
      });
      refetch();
      // Redirect to ride tracking page with navigation
      setTimeout(() => {
        setLocation('/doctor-ride-tracking');
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (rideId: number) => {
      const response = await apiRequest('POST', `/api/doctor/rides/${rideId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم رفض الطلب',
        description: 'تم رفض طلب العيادة البيطرية',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast({
      title: 'تم تسجيل الخروج',
      description: 'تم تسجيل خروجك بنجاح',
    });
    setLocation('/login');
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <h1 className="text-lg font-semibold">لوحة تحكم الطبيب البيطري</h1>
          <Button variant="ghost" onClick={handleLogout} className="text-red-600">
            خروج
          </Button>
        </div>
      </header>

      <div className="p-4">
        {/* GPS Status Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-blue-900">
                <Satellite className="w-5 h-5" />
                حالة تتبع الموقع
              </h3>
              {isLoadingGPS && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
            </div>
            
            {latitude && longitude ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">الموقع محدد بنجاح</span>
                </div>
                <div className="text-gray-600">
                  خط العرض: {latitude.toFixed(6)}
                </div>
                <div className="text-gray-600">
                  خط الطول: {longitude.toFixed(6)}
                </div>
                {accuracy && (
                  <div className="text-gray-600">
                    دقة الموقع: {Math.round(accuracy)} متر
                  </div>
                )}
              </div>
            ) : gpsError ? (
              <div className="flex items-center gap-2 text-red-600">
                <X className="w-4 h-4" />
                <span>خطأ في تحديد الموقع: {gpsError}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-600">
                <Navigation className="w-4 h-4" />
                <span>جاري تحديد الموقع...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-green-900">الطلبات المعلقة</h2>
                <p className="text-green-700">
                  {isLoading ? 'جاري التحميل...' : `${pendingRides.length} طلب في الانتظار`}
                </p>
              </div>
              <div className="text-3xl">🏥</div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Map showing customer locations */}
        {!isLoading && pendingRides && pendingRides.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                خريطة مواقع العملاء
              </h3>
              <div className="h-64 rounded-lg overflow-hidden">
                <Map
                  customerLocation={latitude && longitude ? [latitude, longitude] : [24.7136, 46.6753]}
                  drivers={[]}
                  pendingRides={pendingRides}
                  className="h-full w-full"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                الدوائر الزرقاء تمثل مواقع العملاء، والدائرة الخضراء تمثل موقعك الحالي
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pending Requests */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">جاري تحميل الطلبات...</p>
              </CardContent>
            </Card>
          ) : pendingRides.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">😴</div>
                <p className="text-gray-500">لا توجد طلبات معلقة حالياً</p>
                <p className="text-sm text-gray-400 mt-2">سيتم تحديث القائمة تلقائياً عند وصول طلبات جديدة</p>
              </CardContent>
            </Card>
          ) : (
            pendingRides.map((ride: any) => (
              <Card key={ride.id} className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-blue-900">طلب جديد #{ride.id}</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700">
                          <strong>العميل:</strong> {ride.customer?.name || 'غير محدد'}
                        </p>
                        <p className="text-gray-700">
                          <strong>الموقع:</strong> {ride.pickupLocation}
                        </p>
                        <p className="text-gray-700">
                          <strong>الهاتف:</strong> {ride.customer?.phone || 'غير محدد'}
                        </p>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>تم الطلب في {formatTime(ride.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => acceptMutation.mutate(ride.id)}
                        disabled={acceptMutation.isPending || rejectMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <Check className="w-4 h-4 ml-1" />
                        موافق
                      </Button>
                      <Button
                        onClick={() => rejectMutation.mutate(ride.id)}
                        disabled={acceptMutation.isPending || rejectMutation.isPending}
                        variant="destructive"
                        size="sm"
                      >
                        <X className="w-4 h-4 ml-1" />
                        رفض
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t border-blue-200 pt-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-gray-500">نوع الخدمة</p>
                        <p className="font-medium">عيادة بيطرية متنقلة</p>
                      </div>
                      <div>
                        <p className="text-gray-500">الرسوم المتوقعة</p>
                        <p className="font-medium text-green-600">150 ريال</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}