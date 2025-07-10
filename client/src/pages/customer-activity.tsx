import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Calendar, ArrowLeft, ArrowRight, Truck, MapPin, Clock, User, Star, Navigation, Timer, TruckIcon, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FixedFooter } from '@/components/fixed-footer';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  // Payment fields removed per user request
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Review dialog states
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Tracking dialog states
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [selectedTrackingBooking, setSelectedTrackingBooking] = useState<Booking | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);

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
    refetchInterval: 2000, // Refresh every 2 seconds for real-time status updates
  });

  // Fetch user reviews to check which bookings have been rated
  const { data: userReviews = [] } = useQuery<any[]>({
    queryKey: ['/api/user/reviews'],
    retry: false,
  });



  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { bookingId: number; rating: number; comment: string }) => {
      return await apiRequest(`/api/bookings/${reviewData.bookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewData.rating, comment: reviewData.comment })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/bookings'] });
      setShowReviewDialog(false);
      setRating(0);
      setComment('');
      setSelectedBooking(null);
      toast({
        title: language === 'ar' ? 'تم إرسال التقييم' : 'Review Submitted',
        description: language === 'ar' ? 'شكراً لك على تقييمك' : 'Thank you for your feedback',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في إرسال التقييم' : 'Failed to submit review',
        variant: 'destructive',
      });
    },
  });

  // Open review dialog
  const openReviewDialog = (booking: Booking) => {
    if (!isBookingReviewed(booking.id)) {
      setSelectedBooking(booking);
      setShowReviewDialog(true);
      setRating(0);
      setComment('');
    }
  };

  // Handle submit review
  const handleSubmitReview = () => {
    if (!selectedBooking || rating === 0) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار تقييم' : 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    submitReviewMutation.mutate({
      bookingId: selectedBooking.id,
      rating,
      comment,
    });
  };

  // Render stars for rating
  const renderStars = (currentRating: number) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starIndex = index + 1;
      return (
        <button
          key={starIndex}
          onClick={() => setRating(starIndex)}
          className={`text-2xl transition-colors ${
            starIndex <= currentRating ? 'text-yellow-400' : 'text-gray-300'
          } hover:text-yellow-400`}
        >
          <Star className={`w-8 h-8 ${starIndex <= currentRating ? 'fill-current' : ''}`} />
        </button>
      );
    });
  };

  const handleBack = () => {
    setLocation('/home');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/login');
  };

  // Check if booking has been reviewed
  const isBookingReviewed = (bookingId: number) => {
    return userReviews.some((review: any) => review.bookingId === bookingId);
  };

  // Open tracking dialog
  const openTrackingDialog = async (booking: Booking) => {
    try {
      // Simulate fetching tracking data (in real app, get from API)
      const fakeTrackingData = {
        estimatedArrivalMinutes: Math.floor(Math.random() * 30) + 15, // 15-45 minutes
        vetsVanCode: booking.vetsVanCode,
        driverName: "د. أحمد محمد",
        currentLocation: "في الطريق إليك",
        lastUpdated: new Date().toLocaleTimeString(),
        status: "on_the_way"
      };
      
      setTrackingData(fakeTrackingData);
      setSelectedTrackingBooking(booking);
      setShowTrackingDialog(true);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل بيانات التتبع' : 'Failed to load tracking data',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
      case 'booked':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    if (language === 'ar') {
      switch (status) {
        case 'pending_review':
          return 'قيد المراجعة';
        case 'confirmed':
        case 'booked':
          return 'محجوز';
        case 'in_progress':
          return 'جاري التنفيذ';
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
        case 'pending_review':
          return 'Pending for Review';
        case 'confirmed':
        case 'booked':
          return 'Booked';
        case 'in_progress':
          return 'In Progress';
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

                            {/* Payment sections removed per user request */}

                            {/* Action Buttons */}
                            <div className="pt-3 border-t border-purple-100 space-y-2">
                              {/* Tracking Button for Active Bookings */}
                              {(booking.status === 'confirmed' || booking.status === 'booked' || booking.status === 'in_progress') && (
                                <Button
                                  onClick={() => openTrackingDialog(booking)}
                                  variant="outline"
                                  className="w-full font-semibold py-2 px-4 text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <Navigation className="w-4 h-4 mr-2" />
                                  {language === 'ar' ? 'تتبع الوصول' : 'Track Arrival'}
                                </Button>
                              )}

                              {/* Rate Service Button for Completed Services */}
                              {booking.status === 'completed' && (
                                <Button
                                  onClick={() => openReviewDialog(booking)}
                                  variant="outline"
                                  disabled={isBookingReviewed(booking.id)}
                                  className={`w-full font-semibold py-2 px-4 ${
                                    isBookingReviewed(booking.id) 
                                      ? 'text-green-600 border-green-200 bg-green-50 cursor-not-allowed opacity-75' 
                                      : 'text-purple-600 border-purple-200 hover:bg-purple-50'
                                  }`}
                                >
                                  <Star className={`w-4 h-4 mr-2 ${
                                    isBookingReviewed(booking.id) ? 'fill-current text-green-600' : 'fill-current'
                                  }`} />
                                  {isBookingReviewed(booking.id) 
                                    ? (language === 'ar' ? 'تم التقييم' : 'Rated')
                                    : (language === 'ar' ? 'تقييم الخدمة' : 'Rate Service')
                                  }
                                </Button>
                              )}
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
      </div>

      {/* Review Dialog */}
      {showReviewDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="w-full max-w-md bg-white border-2 border-purple-200 shadow-2xl rounded-lg p-6 relative z-50">
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ textAlign }} className="text-xl font-bold text-purple-800">
                {language === 'ar' ? 'تقييم الخدمة' : 'Rate Service'}
              </h2>
              <button
                onClick={() => setShowReviewDialog(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Star Rating */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4" style={{ textAlign }}>
                  {language === 'ar' ? 'كيف كانت تجربتك مع الخدمة؟' : 'How was your experience with our service?'}
                </p>
                <div className="flex justify-center gap-2">
                  {renderStars(rating)}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block" style={{ textAlign }}>
                  {language === 'ar' ? 'تعليق (اختياري)' : 'Comment (Optional)'}
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={language === 'ar' ? 'شاركنا رأيك في الخدمة...' : 'Share your thoughts about the service...'}
                  className="min-h-[80px] border-2 border-purple-200 focus:border-purple-400"
                  style={{ textAlign }}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowReviewDialog(false)}
                  variant="outline"
                  className="flex-1 border-2 border-purple-200 hover:bg-purple-50"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitReviewMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4"
                >
                  {submitReviewMutation.isPending 
                    ? (language === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
                    : (language === 'ar' ? 'إرسال التقييم' : 'Submit Review')
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Dialog */}
      {showTrackingDialog && trackingData && selectedTrackingBooking && (
        <TrackingModal 
          booking={selectedTrackingBooking}
          trackingData={trackingData}
          language={language}
          onClose={() => {
            setShowTrackingDialog(false);
            setTrackingData(null);
            setSelectedTrackingBooking(null);
          }}
        />
      )}

      <FixedFooter />
    </div>
  );
}

// Tracking Modal Component with Live Countdown
function TrackingModal({ booking, trackingData, language, onClose }: {
  booking: Booking;
  trackingData: any;
  language: string;
  onClose: () => void;
}) {
  const [remainingMinutes, setRemainingMinutes] = useState(trackingData.estimatedArrivalMinutes);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev > 0) {
          return prev - 1;
        } else {
          setRemainingMinutes(prevMin => {
            if (prevMin > 0) {
              return prevMin - 1;
            }
            return 0;
          });
          return 59;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatCountdown = () => {
    if (remainingMinutes === 0 && remainingSeconds === 0) {
      return language === 'ar' ? 'وصل الطبيب!' : 'Doctor Arrived!';
    }
    return `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalSeconds = trackingData.estimatedArrivalMinutes * 60;
    const currentSeconds = remainingMinutes * 60 + remainingSeconds;
    return ((totalSeconds - currentSeconds) / totalSeconds) * 100;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <TruckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {language === 'ar' ? 'تتبع الوصول' : 'Track Arrival'}
              </h2>
              <p className="text-blue-100">
                {language === 'ar' ? 'VETS VAN في الطريق إليك' : 'VETS VAN is on the way'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Countdown Display */}
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              {/* Progress Circle */}
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                <circle
                  cx="64" cy="64" r="56"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="64" cy="64" r="56"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - getProgressPercentage() / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              
              {/* Countdown Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCountdown()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {remainingMinutes === 0 && remainingSeconds === 0 
                    ? '' 
                    : (language === 'ar' ? 'متبقي' : 'remaining')
                  }
                </div>
              </div>
            </div>
            
            <p className="text-gray-600">
              {language === 'ar' 
                ? 'الوقت المقدر للوصول' 
                : 'Estimated arrival time'
              }
            </p>
          </div>

          {/* VetsVan Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">
                  {trackingData.driverName}
                </div>
                <div className="text-sm text-gray-600">
                  {booking.vetsVanCode} - {booking.carModel}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 mb-1">
                  {language === 'ar' ? 'اللون:' : 'Color:'}
                </div>
                <div className="font-medium">{booking.carColor}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">
                  {language === 'ar' ? 'رقم اللوحة:' : 'Plate:'}
                </div>
                <div className="font-medium">{booking.plateNumber}</div>
              </div>
            </div>
          </div>

          {/* Status Updates */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-blue-800">
                {language === 'ar' ? 'الحالة الحالية' : 'Current Status'}
              </span>
            </div>
            <p className="text-blue-700">
              {language === 'ar' ? trackingData.currentLocation : 'On the way to your location'}
            </p>
            <div className="text-xs text-blue-600 mt-2">
              {language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {trackingData.lastUpdated}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Timer className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-yellow-800 mb-1">
                  {language === 'ar' ? 'تعليمات مهمة:' : 'Important Instructions:'}
                </div>
                <ul className="text-yellow-700 space-y-1">
                  <li>
                    {language === 'ar' 
                      ? '• كن متواجداً في الموقع المحدد' 
                      : '• Be available at the specified location'
                    }
                  </li>
                  <li>
                    {language === 'ar' 
                      ? '• سيتصل بك الطبيب قبل الوصول' 
                      : '• The doctor will call you before arrival'
                    }
                  </li>
                  <li>
                    {language === 'ar' 
                      ? '• جهز حيوانك الأليف للفحص' 
                      : '• Prepare your pet for examination'
                    }
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}