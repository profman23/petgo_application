import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import logoPath from '@assets/10773561_1751295833176.png';
import { FixedFooter } from '@/components/fixed-footer';

interface Ride {
  id: number;
  status: string;
  pickupLocation: string;
  destination: string;
  estimatedCost: number | null;
  createdAt: string;
}

export default function Activity() {
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

  // Fetch ride history
  const { data: rideHistory = [], isLoading } = useQuery<Ride[]>({
    queryKey: ['/api/rides'],
    retry: false,
    refetchInterval: 5000, // Refresh every 5 seconds to show new requests
  });

  const handleBack = () => {
    setLocation('/home');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'arrived':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'cancelled':
      case 'cancelled_by_doctor':
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />;
      case 'requested':
      case 'confirmed':
      case 'in_progress':
        return <AlertCircle className="text-orange-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'requested': language === 'ar' ? 'جاري المعالجة' : 'Processing',
      'confirmed': language === 'ar' ? 'تم القبول' : 'Confirmed',
      'in_progress': language === 'ar' ? 'قيد التنفيذ' : 'In Progress',
      'arrived': language === 'ar' ? 'تم الوصول' : 'Arrived',
      'completed': language === 'ar' ? 'تم الانتهاء' : 'Completed',
      'cancelled': language === 'ar' ? 'ملغي' : 'Cancelled',
      'cancelled_by_doctor': language === 'ar' ? 'ملغي من الطبيب' : 'Cancelled by Doctor',
      'rejected': language === 'ar' ? 'مرفوض' : 'Rejected',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'arrived':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled':
      case 'cancelled_by_doctor':
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'requested':
      case 'confirmed':
      case 'in_progress':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-purple-600">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white" dir={direction}>
      {/* Header with Logo and Back Button */}
      <div className="bg-white shadow-sm border-b border-purple-100 p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowIcon size={16} />
            <span className="text-sm font-medium">{t('back')}</span>
          </button>
          
          <img 
            src={logoPath} 
            alt="VETS VAN Logo" 
            className="h-8 w-auto"
          />
        </div>
      </div>

      <div className="max-w-md mx-auto p-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2" style={{ textAlign }}>
            {t('activity')}
          </h1>
          <p className="text-gray-600" style={{ textAlign }}>
            {language === 'ar' ? 'تاريخ طلباتك للعيادة البيطرية المتنقلة' : 'History of your mobile veterinary clinic requests'}
          </p>
        </div>

        {/* Activity List */}
        {rideHistory.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-purple-200 shadow-lg p-8 text-center">
            <Calendar className="mx-auto mb-4 text-purple-400" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ textAlign }}>
              {language === 'ar' ? 'لا توجد طلبات سابقة' : 'No Previous Requests'}
            </h3>
            <p className="text-gray-600" style={{ textAlign }}>
              {language === 'ar' 
                ? 'لم تقم بأي طلبات للعيادة البيطرية المتنقلة حتى الآن' 
                : 'You haven\'t made any mobile veterinary clinic requests yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rideHistory.map((ride: Ride) => (
              <div 
                key={ride.id}
                className="bg-white rounded-xl border-2 border-purple-200 shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                {/* Status and Date */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(ride.status)}`}>
                    {getStatusIcon(ride.status)}
                    <span className="text-sm font-medium">
                      {getStatusText(ride.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{formatDate(ride.createdAt)}</span>
                  </div>
                </div>

                {/* Ride Details */}
                <div className="space-y-3">
                  {/* Pickup Location */}
                  <div className="flex items-start gap-3">
                    <MapPin className="text-purple-500 flex-shrink-0 mt-0.5" size={16} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800" style={{ textAlign }}>
                        {language === 'ar' ? 'موقع الاستلام' : 'Pickup Location'}
                      </p>
                      <p className="text-sm text-gray-600 break-words" style={{ textAlign }}>
                        {ride.pickupLocation}
                      </p>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex items-start gap-3">
                    <MapPin className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800" style={{ textAlign }}>
                        {language === 'ar' ? 'الوجهة' : 'Destination'}
                      </p>
                      <p className="text-sm text-gray-600 break-words" style={{ textAlign }}>
                        {ride.destination}
                      </p>
                    </div>
                  </div>

                  {/* Cost */}
                  {ride.estimatedCost && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="text-yellow-500 flex-shrink-0" size={16} />
                      <div>
                        <p className="text-sm font-medium text-gray-800" style={{ textAlign }}>
                          {language === 'ar' ? 'التكلفة المقدرة' : 'Estimated Cost'}
                        </p>
                        <p className="text-sm text-gray-600" style={{ textAlign }}>
                          {ride.estimatedCost} {language === 'ar' ? 'ريال' : 'SAR'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add padding for fixed footer */}
        <div className="pb-20"></div>
      </div>
      
      {/* Fixed Footer */}
      <FixedFooter />
    </div>
  );
}