import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Clock, User, Phone, Calendar, Bell } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useRef, useEffect } from "react";

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

interface DoctorBookingsTableProps {
  vetsVanId: number;
  vetsVanName: string;
}

export function DoctorBookingsTable({ vetsVanId, vetsVanName }: DoctorBookingsTableProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const previousBookingsCount = useRef<number>(0);

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ['/api/doctor/bookings', vetsVanId],
    staleTime: 30 * 1000, // 30 seconds - frequent updates for real-time notifications
    gcTime: 60 * 1000, // 1 minute
    refetchInterval: 10 * 1000, // Poll every 10 seconds for new bookings
  });

  // Notification system for new bookings
  useEffect(() => {
    if (bookings && Array.isArray(bookings)) {
      const currentCount = bookings.length;
      
      // Check if there are new bookings (avoid initial load notification)
      if (previousBookingsCount.current > 0 && currentCount > previousBookingsCount.current) {
        const newBookingsCount = currentCount - previousBookingsCount.current;
        
        // Show toast notification
        toast({
          title: language === 'ar' ? '🔔 حجز جديد!' : '🔔 New Booking!',
          description: language === 'ar' ? 
            `تم حجز ${newBookingsCount} موعد جديد على ${vetsVanName}` :
            `${newBookingsCount} new appointment(s) booked for ${vetsVanName}`,
          variant: 'default',
        });

        // Play notification sound
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFAlBmN3zvmYdBjuO1fnOfjEFJnTB8OGTQw0PWrHm7KpXFA==');
          audio.volume = 0.5;
          audio.play().catch(() => {
            // Ignore audio play errors (permission denied, etc.)
          });
        } catch (error) {
          // Ignore audio errors
        }

        // Browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(
            language === 'ar' ? 'حجز جديد على VetsVan' : 'New VetsVan Booking',
            {
              body: language === 'ar' ? 
                `تم حجز موعد جديد على ${vetsVanName}` :
                `New appointment booked for ${vetsVanName}`,
              icon: '/favicon.ico'
            }
          );
        }
      }
      
      previousBookingsCount.current = currentCount;
    }
  }, [bookings, language, vetsVanName, toast]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>{language === 'ar' ? 'جاري تحميل الحجوزات...' : 'Loading bookings...'}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-center">
          {language === 'ar' ? 'خطأ في تحميل الحجوزات' : 'Error loading bookings'}
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (language === 'ar') {
      return date.toLocaleDateString('ar-SA', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    if (language === 'ar') {
      const ampm = hour >= 12 ? 'مساءً' : 'صباحاً';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } else {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold text-gray-800">
          {language === 'ar' ? `حجوزات ${vetsVanName}` : `${vetsVanName} Bookings`}
        </h3>
        {bookings && bookings.length > 0 && (
          <span className="bg-purple-600 text-purple-600 px-2 py-1 rounded-full text-sm font-medium">
            {bookings.length}
          </span>
        )}
      </div>

      {!bookings || bookings.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {language === 'ar' ? 'لا توجد حجوزات حالياً' : 'No bookings currently'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking: Booking) => (
            <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-800">{booking.customerName}</h4>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">{booking.customerPhone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-600">{formatDate(booking.appointmentDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-600">{formatTime(booking.appointmentTime)}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {language === 'ar' ? 'مؤكد' : 'Confirmed'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {language === 'ar' ? 'رقم الحجز:' : 'Booking ID:'} #{booking.id}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}