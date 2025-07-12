import React, { useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useDoctorLocation } from '@/hooks/useDoctorLocation';
import { Map } from '@/components/map';
import { DoctorBookingsTable } from '@/components/doctor-bookings-table';
import { ArrowLeft, Check, X, MapPin, Clock, Navigation, Loader2, Satellite } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';
import { playNotificationSound, requestAudioPermission } from '@/utils/audio';
import { useState, useRef } from 'react';
import { DoctorFooter } from '@/components/doctor-footer';

export default function DoctorDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslation();
  const { language } = useLanguage();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<number | null>(null);
  
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

    // طلب إذن الصوت عند بداية التحميل
    const requestAudioPermission = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        console.log('Audio permission granted');
      } catch (error) {
        console.log('Audio permission denied:', error);
      }
    };

    requestAudioPermission();

    // طلب إذن الإشعارات
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast({
            title: language === 'ar' ? 'تم تفعيل الإشعارات' : 'Notifications Enabled',
            description: language === 'ar' ? 'ستصلك إشعارات عند وصول طلبات جديدة' : 'You will receive notifications when new requests arrive',
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

  // Simple notification tracking without loops
  const lastNotificationCount = React.useRef(0);
  
  // دالة تشغيل الصوت المحسنة
  const playNewRequestSound = React.useCallback(() => {
    try {
      // الطريقة الأولى: استخدام Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // نغمة أولى
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      
      oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator1.type = 'sine';
      
      gainNode1.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode1.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.8);
      
      // نغمة ثانية
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator2.type = 'sine';
        
        gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode2.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.8);
      }, 400);
      
    } catch (error) {
      console.log('Web Audio API failed, trying alternative:', error);
      try {
        // الطريقة البديلة: استخدام HTML5 Audio مع Data URL
        const beep = () => {
          const audio = new Audio();
          // تكوين موجة صوتية بسيطة
          const frequency = 800;
          const duration = 0.5;
          const sampleRate = 8000;
          const samples = duration * sampleRate;
          
          // إنشاء buffer صوتي
          const buffer = new ArrayBuffer(44 + samples * 2);
          const view = new DataView(buffer);
          
          // WAV header
          view.setUint32(0, 0x46464952); // "RIFF"
          view.setUint32(4, 36 + samples * 2, true);
          view.setUint32(8, 0x45564157); // "WAVE"
          view.setUint32(12, 0x20746d66); // "fmt "
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, 1, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * 2, true);
          view.setUint16(32, 2, true);
          view.setUint16(34, 16, true);
          view.setUint32(36, 0x61746164); // "data"
          view.setUint32(40, samples * 2, true);
          
          // إنشاء الموجة الصوتية
          for (let i = 0; i < samples; i++) {
            const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
            view.setInt16(44 + i * 2, sample * 32767, true);
          }
          
          const blob = new Blob([buffer], { type: 'audio/wav' });
          audio.src = URL.createObjectURL(blob);
          audio.volume = 0.5;
          audio.play().catch(() => {
            console.log('Audio play failed');
          });
        };
        
        beep();
        setTimeout(beep, 400); // نغمة ثانية
        
      } catch (fallbackError) {
        console.log('All audio methods failed:', fallbackError);
        // محاولة أخيرة بأبسط طريقة
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAC4hYOFZFJfdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Xsr2AcBDuO2e/XeSEFLISA8d+ZQgoPXrTn8apZFQpBmediqGAXBjuR2O/XfCEFLYDO8t2QQgoPX7Pr769YFAlCn+Xtr2EcBDyM1+7WfiMHL4LN8d2OQQwOXLfnJpZGFAlEn+XtrGEdBDyM1+7XfiEHL4LN8t2QQwwPXLfnBpZGFAlEn+btr');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch (finalError) {
          console.log('Final audio attempt failed:', finalError);
        }
      }
    }
  }, []);
  
  React.useEffect(() => {
    if (pendingRides && Array.isArray(pendingRides) && lastNotificationCount.current > 0) {
      const currentCount = pendingRides.length;
      if (currentCount > lastNotificationCount.current) {
        const newRides = currentCount - lastNotificationCount.current;
        
        // تشغيل الصوت عند وصول طلب جديد
        playNewRequestSound();
        
        // إشعار browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(
            language === 'ar' ? 'طلب جديد!' : 'New Request!',
            {
              body: language === 'ar' ? 'وصل طلب عيادة بيطرية جديد' : 'New veterinary clinic request received',
              icon: logoImage,
              badge: logoImage,
              tag: 'new-request',
              requireInteraction: true
            }
          );
        }
        
        toast({
          title: t.newRequest,
          description: `${t.newRequestDesc} (${newRides})`,
          duration: 10000,
        });
      }
    }
    if (pendingRides) {
      lastNotificationCount.current = pendingRides.length;
    }
  }, [pendingRides?.length, playNewRequestSound, t.newRequest, t.newRequestDesc, language]);

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
        title: language === 'ar' ? "تم رفض الطلب" : "Request Rejected",
        description: language === 'ar' ? "تم رفض طلب العيادة البيطرية" : "Veterinary clinic request has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/doctor/pending-rides'] });
      setShowCancelDialog(false);
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Play warning sound and show confirmation dialog for rejection
  const handleRejectRequest = (rideId: number) => {
    // Play warning sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBzaN1fPTeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBzaN1fPTeSsEKHvH8N2QQAoUXrTp66hVFApGn+DyvmMcBzaN1fPTeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBzaN1fPTeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmITBAoiXaAoIR6wVKQIAR');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Fallback beep sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      });
    } catch (error) {
      console.log('Audio not supported');
    }
    
    setSelectedRideId(rideId);
    setShowCancelDialog(true);
  };

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
    <div className="min-h-screen bg-gray-50 pb-20" dir={direction}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/user-type-selection')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </Button>
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="Vets Van" 
              className="h-8 object-contain"
            />
            <h1 className="text-lg font-semibold" style={{ textAlign }}>{t.doctorDashboard}</h1>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-red-600">
            {t.logout}
          </Button>
        </div>
      </header>

      <div className="p-4">


        {/* Stats Card */}
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-green-900" style={{ textAlign }}>{t.pendingRequests}</h2>
                <p className="text-green-700" style={{ textAlign }}>
                  {isLoading ? t.loading : `${pendingRides.length} ${language === 'ar' ? 'طلب في الانتظار' : 'requests pending'}`}
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

        {/* VetsVan Bookings Section */}
        {(() => {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          return user.vetsVanId && user.vetsVanName ? (
            <div className="mb-6">
              <DoctorBookingsTable 
                vetsVanId={user.vetsVanId} 
                vetsVanName={user.vetsVanName} 
              />
            </div>
          ) : null;
        })()}

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
                        onClick={() => handleRejectRequest(ride.id)}
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
                        <p className="text-gray-500" style={{ textAlign }}>{t.serviceType}</p>
                        <p className="font-medium" style={{ textAlign }}>{language === 'ar' ? 'عيادة بيطرية متنقلة' : 'Mobile Veterinary Clinic'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500" style={{ textAlign }}>{language === 'ar' ? 'الرسوم المتوقعة' : 'Expected Fee'}</p>
                        <p className="font-medium text-green-600" style={{ textAlign }}>{language === 'ar' ? '150 ريال' : '150 SAR'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Bookings Table for Current VetsVan */}
        {(() => {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const vetsVanId = user.vetsVanId; // Use the actual VetsVan ID from user session
          const vetsVanName = user.vetsVanName || user.name || 'VetsVan';
          
          return vetsVanId ? (
            <div className="mt-6">
              <DoctorBookingsTable 
                vetsVanId={vetsVanId} 
                vetsVanName={vetsVanName}
              />
            </div>
          ) : null;
        })()}
      </div>

      {/* Cancel/Reject Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent 
          className="max-w-md fixed z-[100000]" 
          dir={direction}
          style={{ zIndex: 100000, position: 'fixed' }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center" style={{ textAlign }}>
              {language === 'ar' ? 'تأكيد الرفض' : 'Confirm Rejection'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center" style={{ textAlign }}>
              {language === 'ar' ? 'هل أنت متأكد من رفض هذا الطلب؟' : 'Are you sure you want to reject this request?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 justify-center">
            <AlertDialogCancel 
              className="bg-gray-100 hover:bg-gray-200 text-gray-800"
              style={{ textAlign }}
            >
              {language === 'ar' ? 'لا، الرجوع' : 'No, Go Back'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedRideId) {
                  rejectMutation.mutate(selectedRideId);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={rejectMutation.isPending}
              style={{ textAlign }}
            >
              {rejectMutation.isPending ? 
                (language === 'ar' ? 'جاري الرفض...' : 'Rejecting...') :
                (language === 'ar' ? 'نعم، رفض الطلب' : 'Yes, Reject Request')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DoctorFooter />
    </div>
  );
}