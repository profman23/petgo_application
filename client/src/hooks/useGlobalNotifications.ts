// Global notification system for doctors - works across all pages
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';
import { playBookingNotification } from '@/utils/audio';

interface Booking {
  id: number;
  userId: number;
  vetsVanId: number;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
}

export function useGlobalNotifications() {
  console.log('🔧 useGlobalNotifications hook initialized');
  const { language } = useLanguage();
  const { toast } = useToast();
  const previousBookingCount = useRef<number>(-1); // -1 indicates not initialized
  const lastBookingId = useRef<number>(0); // Track the latest booking ID

  // Check if user is a doctor and get their VetsVan info
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const doctorToken = localStorage.getItem('doctorToken');
  const isDoctorUser = user?.membershipType === 'doctor' && doctorToken;

  // Only run notifications for doctors with valid tokens
  const { data: bookings = [] } = useQuery({
    queryKey: ['/api/doctor/bookings'],
    // DISABLED: refetchInterval: isDoctorUser ? 5000 : false, // Poll every 5 seconds only for doctors - DISABLED to reduce system load
    enabled: isDoctorUser, // Only fetch if user is a doctor with token
    staleTime: 0, // Always fetch fresh data
    gcTime: 1000 * 60, // Keep in cache for 1 minute
    queryFn: async () => {
      const response = await fetch('/api/doctor/bookings', {
        headers: {
          'Authorization': `Bearer ${doctorToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch doctor bookings:', response.status);
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }
      
      return response.json();
    }
  });

  // Global notification effect
  useEffect(() => {
    if (!isDoctorUser || !Array.isArray(bookings)) {
      console.log('❌ Global notifications not active:', {
        isDoctorUser,
        bookingsIsArray: Array.isArray(bookings),
        bookings
      });
      return;
    }

    const currentBookingCount = bookings.length;
    const latestBooking = bookings.length > 0 ? 
      bookings.reduce((latest, booking) => 
        booking.id > latest.id ? booking : latest
      ) : null;

    // Initialize on first load
    if (previousBookingCount.current === -1) {
      previousBookingCount.current = currentBookingCount;
      lastBookingId.current = latestBooking?.id || 0;
      console.log('🔔 Global notifications initialized for doctor:', user?.vetsvanCode, {
        count: currentBookingCount,
        latestId: lastBookingId.current,
        hasToken: !!doctorToken,
        user: user
      });
      return;
    }

    // Check for new bookings - either count increased or new booking ID
    const hasNewBooking = currentBookingCount > previousBookingCount.current ||
      (latestBooking && latestBooking.id > lastBookingId.current);

    if (hasNewBooking) {
      console.log('🔔 NEW BOOKING DETECTED! Playing notification...');
      console.log('Doctor:', user?.vetsvanCode || user?.username);
      console.log('Previous count:', previousBookingCount.current, 'Current count:', currentBookingCount);
      console.log('Previous ID:', lastBookingId.current, 'Latest ID:', latestBooking?.id);
      console.log('Latest booking details:', latestBooking);

      // Play audio notification
      const playAudioNotification = async () => {
        try {
          await playBookingNotification();
          console.log('🔊 Audio notification played successfully');
        } catch (error) {
          console.warn('🔇 Audio notification failed:', error);
        }
      };

      // Show toast notification
      toast({
        title: language === 'ar' ? '🔔 حجز جديد!' : '🔔 New Booking!',
        description: language === 'ar' 
          ? `تم حجز موعد جديد مع ${latestBooking?.customerName || 'عميل'}`
          : `New appointment booked with ${latestBooking?.customerName || 'customer'}`,
        variant: 'default',
        duration: 6000, // Show for 6 seconds
      });

      // Play the audio
      playAudioNotification();

      // Try to request browser notification permission if not granted
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Send browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(
          language === 'ar' ? '🔔 حجز جديد - VetsVan' : '🔔 New Booking - VetsVan',
          {
            body: language === 'ar' 
              ? `موعد جديد مع ${latestBooking?.customerName || 'عميل'}`
              : `New appointment with ${latestBooking?.customerName || 'customer'}`,
            icon: '/icon-192x192.png',
            tag: 'new-booking',
            requireInteraction: true, // Keep notification visible until user interacts
          }
        );
      }
    }

    // Update tracking values
    previousBookingCount.current = currentBookingCount;
    lastBookingId.current = latestBooking?.id || lastBookingId.current;

  }, [bookings, isDoctorUser, language, toast]);

  return {
    isDoctorUser,
    bookingCount: bookings.length,
    isNotificationActive: isDoctorUser
  };
}