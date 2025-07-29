import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, Star, MessageCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import logoPath from '@assets/10773561_1751295833176.png';
import { FixedFooter } from '@/components/fixed-footer';
import { LanguageSelector } from '@/components/language-selector';

interface Booking {
  id: number;
  userId: number;
  shiftId: number;
  vetsVanId: number;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  customerLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
  vetsVanName?: string;
  vetsVanLocation?: string;
}

interface Review {
  id: number;
  bookingId: number;
  userId: number;
  rating: number;
  comment?: string;
  createdAt: string;
}

export default function Activity() {
  const { t, language } = useTranslation();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReviewDialog, setShowReviewDialog] = useState(false);

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
    refetchInterval: 5000, // Refresh every 5 seconds to show new updates
  });

  // Fetch user reviews to check which bookings have been rated
  const { data: userReviews = [] } = useQuery<Review[]>({
    queryKey: ['/api/user/reviews'],
    retry: false,
  });



  const handleBack = () => {
    setLocation('/home');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/');
  };

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { bookingId: number; rating: number; comment: string }) => {
      return await apiRequest(`/api/bookings/${reviewData.bookingId}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating: reviewData.rating, comment: reviewData.comment })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/bookings'] });
      setShowReviewDialog(false);
      setRating(5);
      setComment('');
      setSelectedBooking(null);
      
      toast({
        title: language === 'ar' ? 'تم إرسال التقييم' : 'Review Submitted',
        description: language === 'ar' ? 'شكراً لك على تقييم الخدمة' : 'Thank you for rating our service',
        variant: 'default',
      });
    },
    onError: () => {
      toast({
        title: language === 'ar' ? 'خطأ في إرسال التقييم' : 'Error Submitting Review',
        description: language === 'ar' ? 'حدث خطأ أثناء إرسال التقييم' : 'An error occurred while submitting the review',
        variant: 'destructive',
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'booked':
      case 'confirmed':
        return <Clock className="text-yellow-500" size={20} />;
      case 'cancelled':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <AlertCircle className="text-orange-500" size={20} />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'booked': language === 'ar' ? 'محجوز' : 'Booked',
      'completed': language === 'ar' ? 'تم الانتهاء' : 'Completed',
      'cancelled': language === 'ar' ? 'ملغي' : 'Cancelled',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'booked':
      case 'confirmed':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Check if booking has been reviewed
  const isBookingReviewed = (bookingId: number) => {
    return userReviews.some(review => review.bookingId === bookingId);
  };

  // Open review dialog
  const openReviewDialog = (booking: Booking) => {
    if (!isBookingReviewed(booking.id)) {
      console.log('Opening review dialog for booking:', booking.id);
      setSelectedBooking(booking);
      setShowReviewDialog(true);
    }
  };

  // Submit review
  const handleSubmitReview = () => {
    if (!selectedBooking) return;
    
    submitReviewMutation.mutate({
      bookingId: selectedBooking.id,
      rating,
      comment: comment.trim()
    });
  };

  // Render star rating
  const renderStars = (currentRating: number, interactive = true) => {
    return Array.from({ length: 5 }, (_, index) => {
      const filled = index < currentRating;
      return (
        <Star
          key={index}
          className={`w-6 h-6 cursor-pointer transition-colors ${
            filled ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
          onClick={interactive ? () => setRating(index + 1) : undefined}
        />
      );
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ArrowIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br #85208550 to-white flex items-center justify-center">
        <div className="text-purple-600">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br #85208550 to-white" dir={direction}>
      {/* Header with Enhanced Logo and Back Button */}
      <div className="bg-white shadow-lg border-b border-purple-600 p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-600 hover:bg-purple-100 px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowIcon size={16} />
            <span className="text-sm font-medium">{t('back')}</span>
          </button>
          
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <div className="w-12 h-12 flex items-center justify-center #85208550 rounded-xl border-2 border-purple-600 shadow-sm">
              <img 
                src={logoPath} 
                alt="VETS VAN Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <button
              onClick={handleLogout}
              className="bg-purple-600 text-white hover:bg-purple-600 px-3 py-1 h-8 rounded-md font-medium transition-colors text-sm"
            >
              {language === 'ar' ? 'خروج' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-center text-purple-600" style={{ textAlign }}>
          {language === 'ar' ? 'سجل المواعيد' : 'Appointment History'}
        </h1>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto w-16 h-16 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-purple-600 mb-2">
              {language === 'ar' ? 'لا توجد مواعيد سابقة' : 'No Previous Appointments'}
            </h3>
            <p className="text-gray-600" style={{ textAlign }}>
              {language === 'ar' ? 'لم تقم بأي مواعيد حتى الآن' : 'You haven\'t made any appointments yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking: Booking) => (
              <Card key={booking.id} className="bg-white shadow-sm border border-purple-600 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(booking.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500" style={{ textAlign }}>
                      {formatDate(booking.createdAt)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-purple-600" />
                      <span className="text-sm text-gray-700" style={{ textAlign }}>
                        {language === 'ar' ? 'التاريخ:' : 'Date:'} {booking.appointmentDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-500" />
                      <span className="text-sm text-gray-700" style={{ textAlign }}>
                        {language === 'ar' ? 'الوقت:' : 'Time:'} {booking.appointmentTime}
                      </span>
                    </div>
                    {booking.vetsVanName && (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-green-500" />
                        <span className="text-sm text-gray-700" style={{ textAlign }}>
                          {language === 'ar' ? 'العيادة:' : 'Clinic:'} {booking.vetsVanName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rate Service Button for Completed Services */}
                  {booking.status === 'completed' && (
                    <div className="pt-3 border-t border-purple-600">
                      <Button
                        onClick={() => openReviewDialog(booking)}
                        variant="outline"
                        disabled={isBookingReviewed(booking.id)}
                        className={`w-full font-semibold py-2 px-4 ${
                          isBookingReviewed(booking.id) 
                            ? 'text-green-600 border-green-200 bg-green-50 cursor-not-allowed opacity-75' 
                            : 'text-purple-600 border-purple-600 hover:bg-purple-100'
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
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      {showReviewDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="w-full max-w-md bg-white border-2 border-purple-600 shadow-2xl rounded-lg p-6 relative z-50">
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ textAlign }} className="text-xl font-bold text-purple-600">
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
                  className="min-h-[80px] border-2 border-purple-600 focus:border-purple-600"
                  style={{ textAlign }}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowReviewDialog(false)}
                  variant="outline"
                  className="flex-1 border-2 border-purple-600 hover:bg-purple-100"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitReviewMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-600 text-white font-semibold py-2 px-4"
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

      {/* Fixed Footer */}
      <FixedFooter />
    </div>
  );
}