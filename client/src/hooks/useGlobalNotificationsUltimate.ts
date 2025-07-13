import { useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { audioNotification } from '@/utils/audio';

interface Booking {
  id: number;
  userId: number;
  shiftId: number;
  vetsVanId: number;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
}

export function useGlobalNotificationsUltimate() {
  console.log('🔧 useGlobalNotificationsUltimate hook initialized - FRESH TOKEN SYSTEM');
  const { language } = useLanguage();
  const { toast } = useToast();
  const previousBookingCount = useRef<number>(-1); // -1 indicates not initialized
  const lastBookingId = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if user is a doctor
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isDoctorUser = user?.membershipType === 'doctor';

  // Fresh token fetcher - gets new token every time
  const getFreshToken = (): string | null => {
    const token = localStorage.getItem('token');
    console.log('🔑 Getting fresh token:', token ? `${token.substring(0, 10)}...` : 'null');
    return token;
  };

  // Fresh API request with new token each time
  const freshApiRequest = async (endpoint: string): Promise<any> => {
    const token = getFreshToken();
    if (!token) {
      console.log('❌ No token available for fresh request');
      throw new Error('No authentication token');
    }

    console.log('🚀 Making fresh API request to:', endpoint);
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

    if (!response.ok) {
      console.log('❌ Fresh API request failed:', response.status, response.statusText);
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Fresh API request successful, data length:', Array.isArray(data) ? data.length : 'not array');
    return data;
  };

  // Polling function
  const checkForNewBookings = async () => {
    if (!isDoctorUser) return;

    try {
      const bookings = await freshApiRequest('/api/doctor/bookings');
      
      if (!Array.isArray(bookings)) {
        console.log('❌ Bookings data is not an array:', bookings);
        return;
      }

      const currentBookingCount = bookings.length;
      const latestBooking = bookings.length > 0 ? bookings[bookings.length - 1] : null;

      console.log('📊 Fresh booking check:', {
        doctor: user?.vetsvanCode || user?.username,
        currentCount: currentBookingCount,
        previousCount: previousBookingCount.current,
        latestId: latestBooking?.id,
        lastId: lastBookingId.current
      });

      // Check for new bookings - either count increased or new booking ID
      const hasNewBooking = currentBookingCount > previousBookingCount.current ||
        (latestBooking && latestBooking.id > lastBookingId.current);

      if (hasNewBooking && previousBookingCount.current !== -1) {
        console.log('🔔 NEW BOOKING DETECTED WITH FRESH TOKEN!');
        console.log('Doctor:', user?.vetsvanCode || user?.username);
        console.log('Previous count:', previousBookingCount.current, 'Current count:', currentBookingCount);
        console.log('Previous ID:', lastBookingId.current, 'Latest ID:', latestBooking?.id);
        console.log('Latest booking details:', latestBooking);

        // Play audio notification
        try {
          await audioNotification.playNotification();
          console.log('✅ Audio notification played successfully');
        } catch (audioError) {
          console.warn('❌ Audio notification failed:', audioError);
        }

        // Show toast notification
        toast({
          title: language === 'ar' ? '🔔 طلب جديد!' : '🔔 New Request!',
          description: language === 'ar' 
            ? `طلب جديد من العميل: ${latestBooking?.customerName || 'غير محدد'}`
            : `New request from customer: ${latestBooking?.customerName || 'Unknown'}`,
          duration: 5000,
        });
      }

      // Update tracking values
      previousBookingCount.current = currentBookingCount;
      if (latestBooking) {
        lastBookingId.current = latestBooking.id;
      }

    } catch (error) {
      console.error('❌ Fresh booking check failed:', error);
    }
  };

  // Setup polling effect
  useEffect(() => {
    if (!isDoctorUser) {
      console.log('❌ Fresh notifications not active - not a doctor user');
      return;
    }

    console.log('✅ Starting fresh notification polling for doctor:', user?.vetsvanCode || user?.username);

    // Initial check
    checkForNewBookings();

    // Start polling every 5 seconds
    intervalRef.current = setInterval(checkForNewBookings, 5000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('🧹 Fresh notification polling cleaned up');
      }
    };
  }, [isDoctorUser]);
}