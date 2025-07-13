import { useEffect, useRef, useState } from 'react';
import { AudioNotification } from '@/utils/audio';

// Force refresh notification system that bypasses ALL caching
export function useForceRefreshNotifications() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCountRef = useRef(0);
  const audioRef = useRef<AudioNotification | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize audio system
    audioRef.current = new AudioNotification();
    
    // Function to get fresh token and make API call
    const checkForNewBookings = async () => {
      try {
        // Force fresh token from localStorage (bypasses React state cache)
        const freshToken = window.localStorage.getItem('doctorToken');
        if (!freshToken) return;

        // Create unique URL with timestamp to bypass cache
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const url = `/api/doctor/bookings?_t=${timestamp}&_r=${randomId}`;

        // Force no-cache request
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${freshToken}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Requested-With': 'XMLHttpRequest'
          },
          cache: 'no-store'
        });

        if (response.ok) {
          const bookings = await response.json();
          const currentCount = bookings.length;
          
          console.log(`🔄 Force refresh check: ${currentCount} bookings (was ${lastCountRef.current})`);
          
          if (lastCountRef.current > 0 && currentCount > lastCountRef.current) {
            console.log('🎉 NEW BOOKING DETECTED!');
            
            // Play audio notification
            if (audioRef.current) {
              await audioRef.current.playNotification();
            }
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('VetsVan - طلب جديد', {
                body: 'تم استلام طلب حجز جديد',
                icon: '/app-icon.png'
              });
            }
            
            // Force page refresh to show new data
            window.location.reload();
          }
          
          lastCountRef.current = currentCount;
        } else if (response.status === 401) {
          console.log('🔐 Token expired, clearing localStorage');
          localStorage.removeItem('doctorToken');
          window.location.href = '/doctor-login';
        }
      } catch (error) {
        console.error('❌ Force refresh notification error:', error);
      }
    };

    // Start polling every 3 seconds with force refresh
    if (!intervalRef.current) {
      console.log('🚀 Starting force refresh notification system');
      checkForNewBookings(); // Initial check
      intervalRef.current = setInterval(checkForNewBookings, 3000);
      setIsInitialized(true);
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return { isInitialized };
}