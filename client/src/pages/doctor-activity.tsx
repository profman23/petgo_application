import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DoctorFooter } from '@/components/doctor-footer';
import { ArrowLeft, Calendar, Clock, MapPin, User, Phone } from 'lucide-react';
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';
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
}

export default function DoctorActivity() {
  const [, setLocation] = useLocation();
  const t = useTranslation();
  const { language } = useLanguage();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);

  // Get current doctor info
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch bookings for the current doctor's VetsVan
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['/api/doctor/bookings'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Group bookings by date
  const groupedBookings = React.useMemo(() => {
    const groups: { [key: string]: Booking[] } = {};
    
    (bookings as Booking[]).forEach((booking: Booking) => {
      const date = booking.appointmentDate;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(booking);
    });

    // Sort dates
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
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
    const statusMap = {
      'pending': { 
        label: language === 'ar' ? 'قيد الانتظار' : 'Pending',
        variant: 'secondary' as const
      },
      'confirmed': { 
        label: language === 'ar' ? 'مؤكد' : 'Confirmed',
        variant: 'default' as const
      },
      'completed': { 
        label: language === 'ar' ? 'مكتمل' : 'Completed',
        variant: 'default' as const
      },
      'cancelled': { 
        label: language === 'ar' ? 'ملغي' : 'Cancelled',
        variant: 'destructive' as const
      }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: 'secondary' as const
    };

    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
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
            onClick={() => setLocation('/doctor-dashboard')}
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
          <div className="w-16" /> {/* Spacer for center alignment */}
        </div>
      </header>

      <div className="p-4">
        {/* Doctor Info Card */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900" style={{ textAlign }}>
                  {user.name || user.username}
                </h3>
                <p className="text-sm text-purple-700" style={{ textAlign }}>
                  {language === 'ar' ? 'طبيب بيطري' : 'Veterinarian'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <CardTitle className="flex items-center gap-2 text-purple-900" style={{ textAlign }}>
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
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-purple-900">
                        {formatTime(booking.appointmentTime)}
                      </span>
                    </div>
                    {getStatusBadge(booking.status)}
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

                  {booking.status === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                          {language === 'ar' ? 'قبول' : 'Accept'}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-600 hover:bg-red-50">
                          {language === 'ar' ? 'رفض' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <DoctorFooter />
    </div>
  );
}