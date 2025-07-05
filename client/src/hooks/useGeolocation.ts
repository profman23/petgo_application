import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const { language } = useLanguage();
  
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: true,
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
  } = options;

  const updateLocation = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    
    setState({
      latitude,
      longitude,
      accuracy,
      error: null,
      isLoading: false,
    });
  }, []);

  const onError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = language === 'ar' ? 'خطأ في تحديد الموقع' : 'Location error';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = language === 'ar' ? 'تم رفض إذن الوصول للموقع' : 'Location access denied';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = language === 'ar' ? 'الموقع غير متاح' : 'Location unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = language === 'ar' ? 'انتهت مهلة تحديد الموقع' : 'Location timeout';
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
    }));
  }, [language]);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: language === 'ar' ? 'المتصفح لا يدعم تحديد الموقع' : 'Browser does not support geolocation',
        isLoading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      updateLocation,
      onError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, updateLocation, onError, language]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: language === 'ar' ? 'المتصفح لا يدعم تحديد الموقع' : 'Browser does not support geolocation',
        isLoading: false,
      }));
      return;
    }

    const id = navigator.geolocation.watchPosition(
      updateLocation,
      onError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );

    setWatchId(id);
  }, [enableHighAccuracy, timeout, maximumAge, updateLocation, onError, language]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  useEffect(() => {
    if (watch) {
      startWatching();
    } else {
      getCurrentPosition();
    }

    return () => {
      stopWatching();
    };
  }, [watch]); // إزالة watchId من dependencies لتجنب infinite loop

  return {
    ...state,
    getCurrentPosition,
    startWatching,
    stopWatching,
    isWatching: watchId !== null,
  };
}