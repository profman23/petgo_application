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
    watch: true, // Continuous tracking for customer during ride
  });

  // Send customer location to server
  const updateCustomerLocation = useCallback(async (lat: number, lng: number) => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || user.membershipType !== 'customer') {
        return;
      }

      await apiRequest('PUT', '/api/customer/location', {
        latitude: lat,
        longitude: lng,
        accuracy,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating customer location:', error);
    }
  }, [accuracy]);

  // Update customer location when coordinates change
  useEffect(() => {
    if (latitude && longitude) {
      // Check if location is within Saudi Arabia boundaries
      const isInSaudiArabia = latitude >= 16 && latitude <= 32 && longitude >= 34 && longitude <= 56;
      
      if (isInSaudiArabia) {
        updateCustomerLocation(latitude, longitude);
      } else {
        console.warn('Customer location outside Saudi Arabia:', { latitude, longitude });
      }
    }
  }, [latitude, longitude, updateCustomerLocation]);

  // Handle GPS errors
  useEffect(() => {
    if (error) {
      console.error('Customer GPS error:', error);
    }
  }, [error]);

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