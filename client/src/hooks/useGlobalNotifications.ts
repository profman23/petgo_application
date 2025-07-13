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
  const { language } = useLanguage();
  const { toast } = useToast();
  const previousBookingCount = useRef<number>(-1); // -1 indicates not initialized
  const lastBookingId = useRef<number>(0); // Track the latest booking ID

  // Check if user is a doctor
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isDoctorUser = user?.membershipType === 'doctor';

  // Only run notifications for doctors
  const { data: bookings = [] } = useQuery({
    queryKey: ['/api/doctor/bookings'],
    refetchInterval: isDoctorUser ? 5000 : false, // Poll every 5 seconds only for doctors
    enabled: isDoctorUser, // Only fetch if user is a doctor
    staleTime: 0, // Always fetch fresh data
    gcTime: 1000 * 60, // Keep in cache for 1 minute
  });

  // Global notification effect
  useEffect(() => {
    if (!isDoctorUser || !Array.isArray(bookings)) return;

    const currentBookingCount = bookings.length;
    const latestBooking = bookings.length > 0 ? 
      bookings.reduce((latest, booking) => 
        booking.id > latest.id ? booking : latest
      ) : null;

    // Initialize on first load
    if (previousBookingCount.current === -1) {
      previousBookingCount.current = currentBookingCount;
      lastBookingId.current = latestBooking?.id || 0;
      console.log('🔔 Global notifications initialized:', {
        count: currentBookingCount,
        latestId: lastBookingId.current
      });
      return;
    }

    // Check for new bookings - either count increased or new booking ID
    const hasNewBooking = currentBookingCount > previousBookingCount.current ||
      (latestBooking && latestBooking.id > lastBookingId.current);

    if (hasNewBooking) {
      console.log('🔔 New booking detected! Playing notification...');
      console.log('Previous count:', previousBookingCount.current, 'Current count:', currentBookingCount);
      console.log('Previous ID:', lastBookingId.current, 'Latest ID:', latestBooking?.id);

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