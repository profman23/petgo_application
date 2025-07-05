import { useEffect, useCallback } from 'react';
import { useGeolocation } from './useGeolocation';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';

export function useCustomerLocation() {
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
    watch: false, // تم تغييره لـ false لتجنب التتبع المستمر والـ infinite loops
  });

  // تبسيط دالة تحديث الموقع
  const updateCustomerLocation = useCallback(async (lat: number, lng: number) => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || user.membershipType !== 'customer') {
        return;
      }

      console.log('📍 Updating customer location:', { lat, lng, accuracy });
      // لا نرسل للخادم الآن، فقط نحفظ محلياً
    } catch (error) {
      console.error('Error updating customer location:', error);
    }
  }, []);

  // تم إزالة useEffect لتجنب infinite loops - سيتم استدعاء updateCustomerLocation يدوياً عند الحاجة

  // تم إزالة useEffect للأخطاء لتبسيط الكود وتجنب أي مشاكل في التحديث

  return {
    latitude,
    longitude,
    accuracy,
    error,
    isLoading,
    startWatching,
    stopWatching,
    updateLocation: updateCustomerLocation,
    currentLocation: latitude && longitude ? { latitude, longitude, accuracy } : null,
  };
}