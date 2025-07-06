import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Calendar, ArrowLeft, ArrowRight, Truck, MapPin, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FixedFooter } from '@/components/fixed-footer';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    if (language === 'ar') {
      switch (status) {
        case 'confirmed':
          return 'مؤكد';
        case 'pending':
          return 'في انتظار الموافقة';
        case 'cancelled':
          return 'ملغي';
        case 'completed':
          return 'مكتمل';
        default:
          return status;
      }
    } else {
      switch (status) {
        case 'confirmed':
          return 'Confirmed';
        case 'pending':
          return 'Pending';
        case 'cancelled':
          return 'Cancelled';
        case 'completed':
          return 'Completed';
        default:
          return status;
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (language === 'ar') {
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
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
        {/* Header - Exact same design as home.tsx */}
        <div className="bg-white text-gray-800 px-3 py-2 h-10 border-b shadow-sm">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-2">
              <div className="h-8 bg-white rounded-lg border-2 border-purple-300 px-2 py-1 shadow-sm hover:shadow-md transition-all duration-300">
                <img 
                  src={logoImage} 
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
              <LanguageSelector />
              <Bell className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-800" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="bg-purple-600 text-white hover:bg-purple-700 px-3 py-1 h-8 rounded-md font-medium transition-colors"
              >
                {language === 'ar' ? 'خروج' : 'Logout'}
              </Button>
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
                <div key={date} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <h3 className="font-semibold text-gray-800" style={{ textAlign }}>
                      {formatDate(date)}
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {groupedBookings[date].map((booking) => (
                      <Card key={booking.id} className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Header with status and time */}
                            <div className="flex items-center justify-between">
                              <Badge className={getStatusColor(booking.status)}>
                                {getStatusText(booking.status)}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="w-3 h-3" />
                                {formatTime(booking.appointmentTime)}
                              </div>
                            </div>

                            {/* VetsVan Details */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-purple-600" />
                                <span className="font-medium text-gray-800" style={{ textAlign }}>
                                  {booking.vetsVanName} ({booking.vetsVanCode})
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1" style={{ textAlign }}>
                                <div>
                                  {language === 'ar' ? 'الموديل:' : 'Model:'} {booking.carModel}
                                </div>
                                <div>
                                  {language === 'ar' ? 'اللون:' : 'Color:'} {booking.carColor}
                                </div>
                                <div>
                                  {language === 'ar' ? 'رقم اللوحة:' : 'Plate:'} {booking.plateNumber}
                                </div>
                              </div>
                            </div>

                            {/* Location if available */}
                            {booking.customerLocation && (
                              <div className="flex items-start gap-2 text-sm text-gray-600">
                                <MapPin className="w-3 h-3 mt-0.5 text-purple-600" />
                                <div style={{ textAlign }}>
                                  {booking.customerLocation.address || 
                                    `${booking.customerLocation.latitude}, ${booking.customerLocation.longitude}`
                                  }
                                </div>
                              </div>
                            )}
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
      </div>

      <FixedFooter />
    </div>
  );
}