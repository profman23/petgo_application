import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DoctorFooter } from '@/components/doctor-footer';
import { ArrowLeft, Calendar, Clock, MapPin, User, Phone, Volume2, VolumeX, Copy, CheckCircle, Truck } from 'lucide-react';
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';
import { playBookingNotification, testAudioNotification, audioNotification } from '@/utils/audio';
import { useToast } from '@/hooks/use-toast';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";

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
  paymentAmount?: string | null;
  paymentCurrency?: string;
  paymentStatus?: string | null;
  customerLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export default function DoctorActivity() {
  const [, setLocation] = useLocation();
  const t = useTranslation();
  const { language } = useLanguage();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showAddRecordDialog, setShowAddRecordDialog] = useState(false);
  const [customerPhoneSearch, setCustomerPhoneSearch] = useState('');
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current doctor info
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // State for tracking notifications
  const [audioEnabled, setAudioEnabled] = useState(audioNotification.isAudioEnabled());
  const [audioUnlocked, setAudioUnlocked] = useState(audioNotification.getUnlockStatus());
  const previousBookingCount = useRef<number>(0);

  // Fetch VetsVan location information
  const { data: vetsVanInfo } = useQuery({
    queryKey: ['/api/doctor/vetsvan-location'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Invalidate cache on mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/doctor/bookings'] });
  }, [queryClient]);

  // Fetch bookings for the current doctor's VetsVan
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['/api/doctor/bookings'],
    queryFn: () => apiRequest('/api/doctor/bookings'),
    refetchInterval: 3000,
    staleTime: 0,
    gcTime: 0, // Updated from cacheTime to gcTime for React Query v5
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });

  // Mutation to update booking status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      return await apiRequest(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: language === 'ar' ? '✅ تم تحديث الحالة' : '✅ Status Updated',
        description: language === 'ar' ? 
          `تم تحديث حالة الحجز بنجاح إلى: ${getStatusText(variables.status)}` :
          `Booking status updated successfully to: ${getStatusText(variables.status)}`,
      });
      // Refresh bookings
      queryClient.invalidateQueries({ queryKey: ['/api/doctor/bookings'] });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? '❌ فشل في التحديث' : '❌ Update Failed',
        description: language === 'ar' ? 
          'حدث خطأ أثناء تحديث حالة الحجز' :
          'An error occurred while updating booking status',
        variant: 'destructive',
      });
    },
  });

  // Mutation to send tracking notification
  const sendTrackingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      return await apiRequest(`/api/bookings/${bookingId}/send-tracking`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? '✅ تم إرسال التتبع' : '✅ Tracking Sent',
        description: language === 'ar' ? 
          'تم إرسال إشعار التتبع للعميل عبر الإيميل وفي التطبيق' :
          'Tracking notification sent to customer via email and in-app',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? '❌ فشل في إرسال التتبع' : '❌ Tracking Failed',
        description: language === 'ar' ? 
          'حدث خطأ أثناء إرسال إشعار التتبع' :
          'An error occurred while sending tracking notification',
        variant: 'destructive',
      });
    },
  });

  // Helper functions for status handling
  const getStatusText = (status: string) => {
    if (language === 'ar') {
      switch (status) {
        case 'pending_review':
          return 'قيد المراجعة';
        case 'confirmed':
          return 'مؤكد';
        case 'in_progress':
          return 'جاري التنفيذ';
        case 'completed':
          return 'مكتمل';
        case 'cancelled':
          return 'ملغي';
        default:
          return status;
      }
    } else {
      switch (status) {
        case 'pending_review':
          return 'Under Review';
        case 'confirmed':
          return 'Confirmed';
        case 'in_progress':
          return 'In Progress';
        case 'completed':
          return 'Completed';
        case 'cancelled':
          return 'Cancelled';
        default:
          return status;
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-purple-600 text-purple-600';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusOptions = () => {
    if (language === 'ar') {
      return [
        { value: 'pending_review', label: 'قيد المراجعة' },
        { value: 'confirmed', label: 'مؤكد' },
        { value: 'in_progress', label: 'جاري التنفيذ' },
        { value: 'completed', label: 'مكتمل' },
        { value: 'cancelled', label: 'ملغي' },
      ];
    } else {
      return [
        { value: 'pending_review', label: 'Under Review' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ];
    }
  };

  // Audio notification system
  useEffect(() => {
    const currentBookingCount = (bookings as Booking[]).length;
    
    // Play notification sound when new booking is added
    if (previousBookingCount.current > 0 && currentBookingCount > previousBookingCount.current) {
      const playAudioNotification = async () => {
        try {
          await playBookingNotification();
          toast({
            title: language === 'ar' ? '🔔 طلب جديد!' : '🔔 New Booking!',
            description: language === 'ar' 
              ? 'تم إضافة موعد جديد إلى جدولك'
              : 'A new appointment has been added to your schedule',
            variant: 'default',
          });
        } catch (error) {
          console.warn('Audio notification failed:', error);
          
          // Show user-friendly notification about audio permission
          if (error.message?.includes('Audio blocked') || error.message?.includes('Audio permission required')) {
            toast({
              title: language === 'ar' ? '🔔 طلب جديد!' : '🔔 New Booking!',
              description: language === 'ar' 
                ? 'تم إضافة موعد جديد. انقر في أي مكان لتفعيل الصوت للإشعارات القادمة'
                : 'A new appointment was added. Click anywhere to enable sound for future notifications',
              variant: 'default',
              duration: 6000,
            });
          } else {
            // Still show the booking notification even if sound fails
            toast({
              title: language === 'ar' ? '🔔 طلب جديد!' : '🔔 New Booking!',
              description: language === 'ar' 
                ? 'تم إضافة موعد جديد إلى جدولك'
                : 'A new appointment has been added to your schedule',
              variant: 'default',
            });
          }
        }
      };
      
      playAudioNotification();
    }
    
    // Update the previous count
    previousBookingCount.current = currentBookingCount;
  }, [bookings, language, toast]);

  // Audio control functions
  const toggleAudio = () => {
    if (audioEnabled) {
      audioNotification.disable();
      setAudioEnabled(false);
      toast({
        title: language === 'ar' ? 'تم إيقاف الإشعارات الصوتية' : 'Audio notifications disabled',
        description: language === 'ar' ? 'لن تسمع أصوات الإشعارات' : 'You will not hear notification sounds',
        variant: 'destructive',
      });
    } else {
      audioNotification.enable();
      setAudioEnabled(true);
      toast({
        title: language === 'ar' ? 'تم تفعيل الإشعارات الصوتية' : 'Audio notifications enabled',
        description: language === 'ar' ? 'ستسمع صوت إشعار عند كل موعد جديد' : 'You will hear notification sounds for new appointments',
        variant: 'default',
      });
      // Test the audio
      testAudioNotification();
    }
  };

  // Audio unlock function
  const unlockAudio = async () => {
    const unlocked = await audioNotification.requestAudioUnlock();
    setAudioUnlocked(unlocked);
    if (unlocked) {
      toast({
        title: language === 'ar' ? '🔓 تم تفعيل الصوت' : '🔓 Sound Enabled',
        description: language === 'ar' ? 'ستحصل على إشعارات صوتية للمواعيد الجديدة' : 'You will receive sound notifications for new appointments',
        variant: 'default',
      });
    }
  };

  // Check audio unlock status on page load
  useEffect(() => {
    const checkAudioStatus = () => {
      setAudioUnlocked(audioNotification.getUnlockStatus());
    };
    
    checkAudioStatus();
    
    // Check periodically in case audio gets unlocked elsewhere
    const interval = setInterval(checkAudioStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handle booking click to show map
  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    // setShowMap(true); // Disabled - modal no longer opens on card click
  };

  // Open Google Maps with customer location
  const openGoogleMaps = () => {
    if (selectedBooking?.customerLocation) {
      const { latitude, longitude } = selectedBooking.customerLocation;
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      
      // Try to open in new window/tab
      const newWindow = window.open(googleMapsUrl, '_blank');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // If popup was blocked, try direct navigation
        window.location.href = googleMapsUrl;
      }
      
      toast({
        title: language === 'ar' ? 'فتح خرائط جوجل' : 'Opening Google Maps',
        description: language === 'ar' ? 'يتم فتح موقع العميل في خرائط جوجل' : 'Opening customer location in Google Maps',
      });
    }
  };

  // Group bookings by date with Today's Requests first
  const groupedBookings = React.useMemo(() => {
    const groups: { [key: string]: Booking[] } = {};
    const today = new Date().toISOString().split('T')[0];
    
    (bookings as Booking[]).forEach((booking: Booking) => {
      const date = booking.appointmentDate;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(booking);
    });

    // Sort dates with today's requests first
    const sortedDates = Object.keys(groups).sort((a, b) => {
      // Today's date always comes first
      if (a === today && b !== today) return -1;
      if (b === today && a !== today) return 1;
      // For other dates, sort normally
      return new Date(a).getTime() - new Date(b).getTime();
    });
    
    const result: { [key: string]: Booking[] } = {};
    sortedDates.forEach(date => {
      // Sort bookings by time within each date
      result[date] = groups[date].sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
    });

    return result;
  }, [bookings]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    if (date.toDateString() === today.toDateString()) {
      return language === 'ar' ? 'اليوم' : 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return language === 'ar' ? 'غداً' : 'Tomorrow';
    } else if (date.toDateString() === dayAfterTomorrow.toDateString()) {
      return language === 'ar' ? 'بعد غدا' : 'Day After Tomorrow';
    } else {
      return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={`text-xs ${getStatusColor(status)}`}>
        {getStatusText(status)}
      </Badge>
    );
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    
    if (language === 'ar') {
      return `${hours}:${minutes}`;
    } else {
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    }
  };

  if (!localStorage.getItem('token') || user.membershipType !== 'doctor') {
    setLocation('/');
    return null;
  }

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
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="Vets Van" 
              className="h-8 object-contain"
            />
            <h1 className="text-lg font-semibold" style={{ textAlign }}>
              {language === 'ar' ? 'النشاط' : 'Activity'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testAudioNotification()}
              className="text-purple-600 hover:bg-purple-50"
            >
              {language === 'ar' ? 'اختبار الصوت' : 'Test Sound'}
            </Button>
            <Button
              variant="ghost"
              onClick={toggleAudio}
              className={`p-2 rounded-full ${audioEnabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
              title={language === 'ar' 
                ? (audioEnabled ? 'إيقاف الإشعارات الصوتية' : 'تفعيل الإشعارات الصوتية')
                : (audioEnabled ? 'Disable audio notifications' : 'Enable audio notifications')
              }
            >
              {audioEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Audio Unlock Banner */}
      {audioEnabled && !audioUnlocked && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Volume2 className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800" style={{ textAlign }}>
                  {language === 'ar' 
                    ? 'انقر لتفعيل الصوت'
                    : 'Click to enable sound'
                  }
                </p>
                <p className="text-xs text-yellow-700" style={{ textAlign }}>
                  {language === 'ar'
                    ? 'ستتلقى إشعارات صوتية للمواعيد الجديدة'
                    : 'You will receive sound notifications for new appointments'
                  }
                </p>
              </div>
            </div>
            <Button
              onClick={unlockAudio}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {language === 'ar' ? 'تفعيل' : 'Enable'}
            </Button>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Doctor Info Card */}
        <Card className="mb-6 bg-gradient-to-r #85208550 to-purple-600 border-purple-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-600" style={{ textAlign }}>
                  {user.name || user.username}
                </h3>
                <p className="text-sm text-purple-600" style={{ textAlign }}>
                  {language === 'ar' ? 'طبيب بيطري' : 'Veterinarian'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VetsVan Location Info Card */}
        {vetsVanInfo && (vetsVanInfo as any).vetsvanName && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900" style={{ textAlign }}>
                      {(vetsVanInfo as any).vetsvanName} ({(vetsVanInfo as any).vetsvanCode})
                    </h3>
                    <p className="text-sm text-blue-700" style={{ textAlign }}>
                      {(vetsVanInfo as any).carModel} - {(vetsVanInfo as any).carColor}
                    </p>
                    <p className="text-xs text-blue-600" style={{ textAlign }}>
                      {language === 'ar' ? 'رقم اللوحة:' : 'Plate:'} {(vetsVanInfo as any).plateNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-blue-600 mb-1" style={{ textAlign }}>
                    {language === 'ar' ? 'الموقع المحدد:' : 'Set Location:'}
                  </div>
                  <div className="text-sm font-mono text-blue-800" style={{ textAlign }}>
                    {(vetsVanInfo as any).latitude?.toFixed(6)}, {(vetsVanInfo as any).longitude?.toFixed(6)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs h-6 px-2 bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${(vetsVanInfo as any).latitude},${(vetsVanInfo as any).longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    {language === 'ar' ? 'عرض في الخرائط' : 'View on Maps'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Record Button */}
        <div className="mb-4">
          <Button 
            variant="default"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setShowAddRecordDialog(true)}
          >
            {language === 'ar' ? 'إضافة سجل' : 'Add Record'}
          </Button>
        </div>

        {/* Activity Title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ textAlign }}>
            {language === 'ar' ? 'جميع المواعيد' : 'All Appointments'}
          </h2>
          <p className="text-gray-600" style={{ textAlign }}>
            {language === 'ar' ? 'عرض جميع طلبات العملاء مرتبة حسب التاريخ والوقت' : 'View all customer requests sorted by date and time'}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {language === 'ar' ? 'جاري تحميل المواعيد...' : 'Loading appointments...'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Bookings by Date */}
        {!isLoading && Object.keys(groupedBookings).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {language === 'ar' ? 'لا توجد مواعيد' : 'No Appointments'}
              </h3>
              <p className="text-gray-600">
                {language === 'ar' ? 'لم يتم العثور على أي مواعيد حتى الآن' : 'No appointments found yet'}
              </p>
            </CardContent>
          </Card>
        )}

        {Object.entries(groupedBookings).map(([date, dateBookings]) => (
          <Card key={date} className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-600" style={{ textAlign }}>
                <Calendar className="w-5 h-5" />
                {formatDate(date)}
                <Badge variant="outline" className="ml-auto">
                  {dateBookings.length} {language === 'ar' ? 'موعد' : 'appointments'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dateBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer hover:bg-blue-50 w-full overflow-hidden"
                  onClick={() => handleBookingClick(booking)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-purple-600">
                        {formatTime(booking.appointmentTime)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(booking.status)}
                      {/* Debug payment data */}
                      {booking.id <= 111 && booking.id >= 107 && console.log(`Frontend booking ${booking.id}:`, {
                        paymentAmount: booking.paymentAmount,
                        paymentCurrency: booking.paymentCurrency,
                        paymentStatus: booking.paymentStatus,
                        amountType: typeof booking.paymentAmount,
                        numberValue: Number(booking.paymentAmount),
                        condition1: booking.paymentStatus === "paid",
                        condition2: !!booking.paymentAmount,
                        condition3: Number(booking.paymentAmount) > 0,
                        allConditions: booking.paymentStatus === "paid" && booking.paymentAmount && Number(booking.paymentAmount) > 0
                      })}
                      {booking.paymentStatus === "paid" && booking.paymentAmount && Number(booking.paymentAmount) > 0 && (
                        <div className="text-sm font-medium text-green-600" style={{ textAlign }}>
                          {language === 'ar' ? 'مدفوع:' : 'Paid'} {Number(booking.paymentAmount).toFixed(2)} {booking.paymentCurrency === 'SR' ? 'SAR' : (booking.paymentCurrency || 'SAR')}
                        </div>
                      )}

                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700" style={{ textAlign }}>
                        {booking.customerName}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700" style={{ textAlign }}>
                        {booking.customerPhone}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500" style={{ textAlign }}>
                        {language === 'ar' ? 'تم الحجز في:' : 'Booked at:'} {new Date(booking.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                  </div>

                  {/* Status Update Control */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-medium text-gray-700" style={{ textAlign }}>
                        {language === 'ar' ? 'حالة الحجز:' : 'Booking Status:'}
                      </span>
                      <Select
                        value={booking.status}
                        onValueChange={(newStatus) => {
                          updateStatusMutation.mutate({ 
                            bookingId: booking.id, 
                            status: newStatus 
                          });
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getStatusOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {updateStatusMutation.isPending && (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                          <span className="text-xs text-gray-500">
                            {language === 'ar' ? 'جاري التحديث...' : 'Updating...'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Mobile Responsive */}
                    <div className="flex flex-wrap justify-end gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-green-100 border-green-300 text-green-700 hover:bg-green-200 hover:border-green-400 flex-shrink-0 min-w-0 text-xs sm:text-sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click event
                          if (booking.customerLocation) {
                            setSelectedBooking(booking);
                            setShowMap(true);
                          } else {
                            toast({
                              title: language === 'ar' ? 'موقع غير متوفر' : 'Location Not Available',
                              description: language === 'ar' ? 'لا يتوفر موقع لهذا العميل' : 'No location available for this customer',
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">{language === 'ar' ? 'موقع العميل' : 'Customer Location'}</span>
                        <span className="sm:hidden">{language === 'ar' ? 'موقع' : 'Location'}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200 hover:border-blue-400 flex-shrink-0 min-w-0 text-xs sm:text-sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click event
                          sendTrackingMutation.mutate(booking.id);
                        }}
                        disabled={sendTrackingMutation.isPending}
                      >
                        {sendTrackingMutation.isPending ? (
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <Truck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        )}
                        <span className="hidden sm:inline">{language === 'ar' ? 'إرسال التتبع' : 'Send Tracking'}</span>
                        <span className="sm:hidden">{language === 'ar' ? 'تتبع' : 'Track'}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-purple-600 border-purple-600 text-white hover:bg-purple-700 hover:border-purple-700 flex-shrink-0 min-w-0 text-xs sm:text-sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click event
                          setLocation(`/doctor-invoice/${booking.id}`);
                        }}
                      >
                        <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">{language === 'ar' ? 'فتح السجل' : 'Open Record'}</span>
                        <span className="sm:hidden">{language === 'ar' ? 'سجل' : 'Record'}</span>
                      </Button>
                    </div>
                  </div>

                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customer Location Map Dialog */}
      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle style={{ textAlign }}>
              {language === 'ar' ? 'موقع العميل' : 'Customer Location'}
              {selectedBooking && (
                <span className="text-sm font-normal text-gray-600 mr-2">
                  - {selectedBooking.customerName}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && selectedBooking.customerLocation ? (
            <div className="space-y-4">
              {/* Address Display */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold" style={{ textAlign }}>
                    {language === 'ar' ? 'العنوان' : 'Address'}:
                  </span>
                </div>
                <p className="text-gray-700" style={{ textAlign }}>
                  {selectedBooking.customerLocation.address || 
                    `${selectedBooking.customerLocation.latitude}, ${selectedBooking.customerLocation.longitude}`
                  }
                </p>
              </div>

              {/* Location Details Card */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4" style={{ textAlign }}>
                    <MapPin className="w-5 h-5 text-blue-600" />
                    {language === 'ar' ? 'تفاصيل الموقع' : 'Location Details'}
                  </h3>
                  
                  {/* Coordinates Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="font-semibold text-gray-700">
                        {language === 'ar' ? 'خط العرض:' : 'Latitude:'}
                      </span>
                      <br />
                      <span className="font-mono text-blue-600 text-lg">
                        {selectedBooking.customerLocation.latitude.toFixed(6)}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="font-semibold text-gray-700">
                        {language === 'ar' ? 'خط الطول:' : 'Longitude:'}
                      </span>
                      <br />
                      <span className="font-mono text-blue-600 text-lg">
                        {selectedBooking.customerLocation.longitude.toFixed(6)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={openGoogleMaps}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                      size="sm"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'فتح في خرائط جوجل' : 'Open in Google Maps'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const { latitude, longitude } = selectedBooking.customerLocation!;
                        navigator.clipboard.writeText(`${latitude}, ${longitude}`);
                        toast({
                          title: language === 'ar' ? 'تم النسخ' : 'Copied',
                          description: language === 'ar' ? 'تم نسخ الإحداثيات' : 'Coordinates copied to clipboard',
                        });
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'نسخ الإحداثيات' : 'Copy Coordinates'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Customer Contact Info */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-600 mb-3" style={{ textAlign }}>
                  {language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="text-sm" style={{ textAlign }}>
                      {selectedBooking.customerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-600" />
                    <span className="text-sm" style={{ textAlign }}>
                      {selectedBooking.customerPhone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm" style={{ textAlign }}>
                      {formatTime(selectedBooking.appointmentTime)} - {formatDate(selectedBooking.appointmentDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {language === 'ar' ? 
                  'لم يتم العثور على موقع العميل' : 
                  'Customer location not available'
                }
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Record Dialog */}
      <Dialog open={showAddRecordDialog} onOpenChange={setShowAddRecordDialog}>
        <DialogContent className="sm:max-w-md" dir={direction}>
          <DialogHeader>
            <DialogTitle style={{ textAlign }}>
              {language === 'ar' ? 'إضافة سجل جديد' : 'Add New Record'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" style={{ textAlign }}>
                {language === 'ar' ? 'رقم هاتف العميل' : 'Customer Phone Number'}
              </label>
              <input
                type="text"
                placeholder={language === 'ar' ? 'ابحث عن رقم الهاتف...' : 'Search phone number...'}
                value={customerPhoneSearch}
                onChange={(e) => setCustomerPhoneSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                style={{ textAlign }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DoctorFooter />
    </div>
  );
}