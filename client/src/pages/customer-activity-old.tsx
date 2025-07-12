import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, Car, CheckCircle, XCircle, AlertCircle, Phone, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import logoPath from '@assets/10773561_1751295833176.png';
import { FixedFooter } from '@/components/fixed-footer';

interface Booking {
  id: number;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  vetsVanName: string;
  vetsVanCode: string;
  carModel: string;
  carColor: string;
  plateNumber: string;
  customerLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
}

export default function CustomerActivity() {
  const { t, language } = useTranslation();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  const [, setLocation] = useLocation();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLocation('/login');
      return;
    }
  }, [setLocation]);

  // Fetch user bookings
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['/api/user/bookings'],
    retry: false,
    refetchInterval: 5000, // Refresh every 5 seconds to show new bookings
  });

  const handleBack = () => {
    setLocation('/home');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'booked':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'cancelled':
        return <XCircle className="text-red-500" size={20} />;
      case 'in_progress':
        return <AlertCircle className="text-orange-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'booked':
        return language === 'ar' ? 'مؤكد' : 'Confirmed';
      case 'completed':
        return language === 'ar' ? 'مكتمل' : 'Completed';
      case 'cancelled':
        return language === 'ar' ? 'ملغي' : 'Cancelled';
      case 'in_progress':
        return language === 'ar' ? 'قيد التنفيذ' : 'In Progress';
      default:
        return language === 'ar' ? 'غير محدد' : 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (language === 'ar') {
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    
    if (language === 'ar') {
      return date.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  // Group bookings by date
  const groupedBookings = bookings.reduce((groups: { [key: string]: Booking[] }, booking) => {
    const date = booking.appointmentDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(booking);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedBookings).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div 
      className="min-h-screen bg-gray-50"
      style={{ direction }}
    >
      <div className="max-w-md mx-auto bg-white shadow-sm overflow-hidden">
        {/* Header - Same design as home.tsx */}
        <div className="bg-white text-gray-800 px-3 py-2 h-10 border-b shadow-sm">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-2">
              <div className="h-8 bg-white rounded-lg border-2 border-purple-600 px-2 py-1 shadow-sm hover:shadow-md transition-all duration-300">
                <img 
                  src={logoPath} 
                  alt="VETS VAN Logo" 
                  className="h-full w-auto object-contain"
                  style={{ 
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    maxWidth: '120px'
                  }}
                />
              </div>
              <div className="text-lg font-bold text-gray-800">
                {language === 'ar' ? 'نشاطي' : 'My Activity'}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm"
              >
                {direction === 'rtl' ? (
                  <ArrowRight className="w-4 h-4" />
                ) : (
                  <ArrowLeft className="w-4 h-4" />
                )}
                {language === 'ar' ? 'العودة' : 'Back'}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-20">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2" style={{ textAlign }}>
              {language === 'ar' ? 'لا توجد حجوزات' : 'No Bookings'}
            </h3>
            <p className="text-gray-500" style={{ textAlign }}>
              {language === 'ar' 
                ? 'لم تقم بحجز أي مواعيد بعد. ابدأ بحجز موعدك الأول!'
                : 'You haven\'t booked any appointments yet. Start by booking your first appointment!'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                {/* Date Header */}
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ textAlign }}>
                    <Calendar className="w-5 h-5 text-purple-600" />
                    {formatDate(date)}
                  </h2>
                </div>

                {/* Bookings for this date */}
                <div className="space-y-3">
                  {groupedBookings[date].map((booking) => (
                    <Card key={booking.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Booking Status */}
                            <div className="flex items-center gap-2 mb-3">
                              {getStatusIcon(booking.status)}
                              <span className="font-semibold text-gray-800" style={{ textAlign }}>
                                {getStatusText(booking.status)}
                              </span>
                              <span className="text-sm text-gray-500">
                                #{booking.id}
                              </span>
                            </div>

                            {/* VetsVan Details */}
                            <div className="mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Car className="w-4 h-4 text-purple-600" />
                                <span className="font-medium text-gray-900" style={{ textAlign }}>
                                  {booking.vetsVanName}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({booking.vetsVanCode})
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1" style={{ textAlign }}>
                                <div>
                                  <strong>{language === 'ar' ? 'السيارة:' : 'Vehicle:'}</strong> {booking.carModel} - {booking.carColor}
                                </div>
                                <div>
                                  <strong>{language === 'ar' ? 'رقم اللوحة:' : 'Plate Number:'}</strong> {booking.plateNumber}
                                </div>
                              </div>
                            </div>

                            {/* Appointment Time */}
                            <div className="flex items-center gap-2 mb-3">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <span className="text-gray-700" style={{ textAlign }}>
                                <strong>{language === 'ar' ? 'الوقت:' : 'Time:'}</strong> {formatTime(booking.appointmentTime)}
                              </span>
                            </div>

                            {/* Location (if available) */}
                            {booking.customerLocation && (
                              <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-gray-600" style={{ textAlign }}>
                                  {booking.customerLocation.address || 
                                    (language === 'ar' ? 'موقع العميل' : 'Customer Location')
                                  }
                                </span>
                              </div>
                            )}

                            {/* Booking Date */}
                            <div className="text-xs text-gray-400" style={{ textAlign }}>
                              {language === 'ar' ? 'تم الحجز في:' : 'Booked on:'} {' '}
                              {new Date(booking.createdAt).toLocaleString(
                                language === 'ar' ? 'ar-SA' : 'en-US'
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FixedFooter />
    </div>
  );
}