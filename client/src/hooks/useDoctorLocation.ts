import { useEffect, useCallback } from 'react';
import { useGeolocation } from './useGeolocation';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';

export function useDoctorLocation() {
  const { toast } = useToast();
  const {
    latitude,
    longitude,
    accuracy,
    error,
    isLoading,
    startWatching,
    stopWatching,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000,
    watch: true, // تتبع مستمر للطبيب
  });

  // إرسال موقع الطبيب للخادم عند التحديث
  const updateDoctorLocation = useCallback(async (lat: number, lng: number) => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || user.membershipType !== 'doctor') {
        return;
      }

      await apiRequest('PUT', '/api/doctor/location', {
        latitude: lat,
        longitude: lng,
        accuracy,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating doctor location:', error);
    }
  }, [accuracy]);

  // تحديث موقع الطبيب عند تغيير الإحداثيات
  useEffect(() => {
    if (latitude && longitude) {
      // فحص ما إذا كان الموقع داخل المملكة العربية السعودية
      const isInSaudiArabia = latitude >= 16 && latitude <= 32 && longitude >= 34 && longitude <= 56;
      
      if (isInSaudiArabia) {
        updateDoctorLocation(latitude, longitude);
        
        // إشعار بدقة الموقع
        if (accuracy && accuracy < 50) {
          toast({
            title: 'موقع الطبيب محدث',
            description: `دقة الموقع: ${Math.round(accuracy)} متر`,
          });
        }
      } else {
        console.warn('Doctor location outside Saudi Arabia:', { latitude, longitude });
      }
    }
  }, [latitude, longitude, accuracy, updateDoctorLocation, toast]);

  // التعامل مع أخطاء GPS
  useEffect(() => {
    if (error) {
      toast({
        title: 'خطأ في تحديد موقع الطبيب',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  return {
    latitude,
    longitude,
    accuracy,
    error,
    isLoading,
    startWatching,
    stopWatching,
    updateLocation: updateDoctorLocation,
  };
}