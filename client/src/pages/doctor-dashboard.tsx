import React, { useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useDoctorLocation } from '@/hooks/useDoctorLocation';
import { Map } from '@/components/map';
import { ArrowLeft, Check, X, MapPin, Clock, Navigation, Loader2, Satellite } from 'lucide-react';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';

export default function DoctorDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslation();
  const { language } = useLanguage();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  
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
          title: t.sessionExpired,
          description: t.loginAgain,
          variant: 'destructive',
        });
        setLocation('/login');
      }
    }).catch(() => {
      // Network error, ignore
    });

    // طلب إذن الإشعارات
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast({
            title: 'تم تفعيل الإشعارات',
            description: 'ستصلك إشعارات عند وصول طلبات جديدة',
          });
        }
      });
    }
  }, [setLocation, toast]);

  // Check for active ride and redirect if found
  const { data: activeRideData } = useQuery({
    queryKey: ['/api/doctor/active-ride'],
    refetchInterval: 2000,
    retry: false,
  });

  const { data: pendingRides = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/doctor/pending-rides'],
    refetchInterval: 3000, // Poll every 3 seconds for new requests
  });

  // Simple notification system without dependency loops
  const [lastRideCount, setLastRideCount] = React.useState(0);
  
  React.useEffect(() => {
    if (pendingRides && Array.isArray(pendingRides)) {
      const currentCount = pendingRides.length;
      
      if (currentCount > lastRideCount && lastRideCount > 0) {
        const newRidesCount = currentCount - lastRideCount;
        toast({
          title: t.newRequest,
          description: `${t.newRequestDesc} (${newRidesCount})`,
          duration: 10000,
        });
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(t.newVetRequest, {
            body: `${t.pendingApproval} (${newRidesCount})`,
            icon: '/icon.png'
          });
        }
      }
      
      setLastRideCount(currentCount);
    }
  }, [pendingRides?.length]); // Only depend on length, not the whole array

  // Redirect to tracking page if there's an active ride
  useEffect(() => {
    if (activeRideData && activeRideData.ride) {
      setLocation('/doctor-ride-tracking');
    }
  }, [activeRideData, setLocation]);

  const acceptMutation = useMutation({
    mutationFn: async (rideId: number) => {
      const response = await apiRequest(`/api/doctor/rides/${rideId}/accept`, {
        method: 'POST'
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: 'تم قبول الطلب',
        description: 'جاري فتح خرائط Google للتوجه للعميل...',
      });
      
      // فتح Google Maps مباشرة مع موقع العميل
      if (data && data.ride) {
        const { pickupLatitude, pickupLongitude } = data.ride;
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pickupLatitude},${pickupLongitude}&travelmode=driving`;
        
        // فتح في نافذة جديدة مع تجربة عدة طرق
        const newWindow = window.open(mapsUrl, '_blank');
        if (!newWindow) {
          // إذا تم حظر النافذة المنبثقة، حاول فتح في نفس النافذة
          window.location.href = mapsUrl;
        }
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/doctor/active-ride'] });
      queryClient.invalidateQueries({ queryKey: ['/api/doctor/pending-rides'] });
      
      // توجه لصفحة المتابعة بعد ثانية واحدة
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
      const response = await apiRequest(`/api/doctor/rides/${rideId}/reject`, {
        method: 'POST'
      });
      return response;
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
    <div className="min-h-screen bg-gray-50" dir={direction}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/user-type-selection')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="Vets Van" 
              className="h-8 object-contain"
            />
            <h1 className="text-lg font-semibold">لوحة تحكم الطبيب البيطري</h1>
          </div>
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
              <h3 className="font-semibold flex items-center gap-2 text-blue-900" style={{ textAlign }}>
                <Satellite className="w-5 h-5" />
                {t.locationTracking}
              </h3>
              {isLoadingGPS && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
            </div>
            
            {latitude && longitude ? (
              <div className="space-y-2 text-sm" style={{ textAlign }}>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">{t.locationDetectedSuccessfully}</span>
                </div>
                <div className="text-gray-600">
                  {t.latitude}: {latitude.toFixed(6)}
                </div>
                <div className="text-gray-600">
                  {t.longitude}: {longitude.toFixed(6)}
                </div>
                {accuracy && (
                  <div className="text-gray-600">
                    {t.accuracy}: {Math.round(accuracy)} {t.meters}
                  </div>
                )}
              </div>
            ) : gpsError ? (
              <div className="flex items-center gap-2 text-red-600" style={{ textAlign }}>
                <X className="w-4 h-4" />
                <span>{t.error}: {gpsError}</span>
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
              <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ textAlign }}>
                <MapPin className="w-5 h-5 text-blue-600" />
                {t.customerLocation}
              </h3>
              <div className="h-64 rounded-lg overflow-hidden">
                <Map
                  customerLocation={latitude && longitude ? [latitude, longitude] : [24.7136, 46.6753]}
                  drivers={[]}
                  pendingRides={pendingRides}
                  className="h-full w-full"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2" style={{ textAlign }}>
                {language === 'ar' ? 'الدوائر الزرقاء تمثل مواقع العملاء، والدائرة الخضراء تمثل موقعك الحالي' : 'Blue circles represent customer locations, green circle represents your current location'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pending Requests */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500" style={{ textAlign }}>{t.loading}</p>
              </CardContent>
            </Card>
          ) : pendingRides.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">😴</div>
                <p className="text-gray-500" style={{ textAlign }}>{t.noPendingRequests}</p>
                <p className="text-sm text-gray-400 mt-2" style={{ textAlign }}>
                  {language === 'ar' ? 'سيتم تحديث القائمة تلقائياً عند وصول طلبات جديدة' : 'The list will be updated automatically when new requests arrive'}
                </p>
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
                        <span className="font-semibold text-blue-900" style={{ textAlign }}>{t.newRequest} #{ride.id}</span>
                      </div>
                      <div className="space-y-1 text-sm" style={{ textAlign }}>
                        <p className="text-gray-700">
                          <strong>{t.name}:</strong> {ride.customer?.name || t.error}
                        </p>
                        <p className="text-gray-700">
                          <strong>{t.customerLocation}:</strong> {ride.pickupLocation}
                        </p>
                        <p className="text-gray-700">
                          <strong>{t.phone}:</strong> {ride.customer?.phone || t.error}
                        </p>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>{language === 'ar' ? 'تم الطلب في' : 'Requested at'} {formatTime(ride.createdAt)}</span>
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
                        {t.accept}
                      </Button>
                      <Button
                        onClick={() => rejectMutation.mutate(ride.id)}
                        disabled={acceptMutation.isPending || rejectMutation.isPending}
                        variant="destructive"
                        size="sm"
                      >
                        <X className="w-4 h-4 ml-1" />
                        {t.reject}
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