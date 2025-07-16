import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Users, Calendar, Star, DollarSign, Phone, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const AdminReports = () => {
  const { language } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailedReviews, setDetailedReviews] = useState<any[]>([]);

  // Fetch reports data
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/admin/reports'],
    staleTime: 30 * 1000,
    cacheTime: 60 * 1000,
  });

  // Fetch detailed reviews
  const fetchDetailedReviews = async () => {
    try {
      const response = await apiRequest('/api/admin/detailed-reviews', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      setDetailedReviews(response);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching detailed reviews:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل التقييمات' : 'Failed to load reviews',
        variant: 'destructive',
      });
    }
  };

  // SMS Test functionality
  const handleSendTestSms = async () => {
    try {
      const response = await apiRequest('/api/admin/send-sms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'test sms from Taqnyat.sa , for testing internet sms service',
        }),
      });

      if (response.success) {
        toast({
          title: language === 'ar' ? 'تم الإرسال بنجاح' : 'SMS Sent Successfully',
          description: language === 'ar' 
            ? `تم إرسال الرسالة بنجاح. رقم الرسالة: ${response.messageId}`
            : `SMS sent successfully. Message ID: ${response.messageId}`,
        });
      } else {
        throw new Error(response.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('SMS send error:', error);
      toast({
        title: language === 'ar' ? 'فشل في الإرسال' : 'SMS Send Failed',
        description: error.message || (language === 'ar' ? 'حدث خطأ أثناء إرسال الرسالة' : 'An error occurred while sending SMS'),
        variant: 'destructive',
      });
    }
  };

  if (reportsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">
            {language === 'ar' ? 'جاري تحميل التقارير...' : 'Loading reports...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/admin-dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'ar' ? 'التقارير' : 'Reports'}
              </h1>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Bookings */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {language === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {reportsData?.totalBookings || 0}
              </div>
            </CardContent>
          </Card>

          {/* Completed Bookings */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {language === 'ar' ? 'الحجوزات المكتملة' : 'Completed Bookings'}
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reportsData?.completedBookings || 0}
              </div>
            </CardContent>
          </Card>

          {/* Total Reviews */}
          <Card className="bg-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {language === 'ar' ? 'إجمالي التقييمات' : 'Total Reviews'}
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent onClick={fetchDetailedReviews}>
              <div className="text-2xl font-bold text-yellow-600">
                {reportsData?.totalReviews || 0}
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {reportsData?.totalRevenue || 0} SAR
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SMS Test Section */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {language === 'ar' ? 'اختبار الرسائل النصية' : 'SMS Test'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleSendTestSms}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'إرسال رسالة تجريبية' : 'Send Test SMS'}
              </Button>
              <div className="text-sm text-gray-600">
                {language === 'ar' 
                  ? 'إرسال رسالة تجريبية لاختبار خدمة الرسائل النصية' 
                  : 'Send a test message to verify SMS service'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Reviews Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center mb-4">
                {language === 'ar' ? 'تفاصيل التقييمات' : 'Detailed Reviews'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {detailedReviews.map((vetsvan, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">
                      {vetsvan.vetsVanCode} - {vetsvan.vetsVanName}
                    </h3>
                    <Badge variant="secondary" className="px-3 py-1">
                      {language === 'ar' ? 'متوسط التقييم' : 'Avg Rating'}: {vetsvan.averageRating}/5
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {vetsvan.reviews.map((review: any, reviewIndex: number) => (
                      <div key={reviewIndex} className="bg-white p-3 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.customerName}</span>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-500" />
                              <span className="text-sm text-gray-600">{review.customerPhone}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {review.comment && (
                          <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          {language === 'ar' ? 'تاريخ التقييم' : 'Review Date'}: {new Date(review.reviewDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {detailedReviews.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {language === 'ar' ? 'لا توجد تقييمات' : 'No reviews available'}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminReports;