import { Clock, CheckCircle, Car, MapPin, Search } from 'lucide-react';
import { RIDE_STATUS_MESSAGES, RIDE_STATUS_DESCRIPTIONS } from '@/lib/constants';
import { useLanguage } from '@/lib/i18n';

interface RideStatusProps {
  status: string;
  className?: string;
}

export function RideStatus({ status, className }: RideStatusProps) {
  const { language } = useLanguage();
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
      case 'processing':
        return <Search className="w-6 h-6 text-white" />;
      case 'confirmed':
        return <CheckCircle className="w-6 h-6 text-white" />;
      case 'enroute':
        return <Car className="w-6 h-6 text-white" />;
      case 'arrived':
        return <MapPin className="w-6 h-6 text-white" />;
      default:
        return <Clock className="w-6 h-6 text-white" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500 pulse-dot';
      case 'confirmed':
        return 'bg-green-500';
      case 'enroute':
        return 'bg-blue-500 pulse-dot';
      case 'arrived':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // ترجمة رسائل الحالة
  const getStatusMessage = (status: string) => {
    const statusMessages = {
      ar: {
        'requested': 'تم استلام الطلب',
        'processing': 'جاري المعالجة',
        'confirmed': 'تم تأكيد الطلب',
        'in_progress': 'قيد التنفيذ',
        'enroute': 'في الطريق',
        'arrived': 'تم الوصول',
        'completed': 'تم اكتمال الخدمة',
        'cancelled': 'تم إلغاء الطلب'
      },
      en: {
        'requested': 'Request Received',
        'processing': 'Processing',
        'confirmed': 'Request Confirmed',
        'in_progress': 'In Progress',
        'enroute': 'On the Way',
        'arrived': 'Arrived',
        'completed': 'Service Completed',
        'cancelled': 'Request Cancelled',
        'rejected': 'Request Rejected',
        'cancelled_by_doctor': 'Request Cancelled by Doctor'
      }
    };
    
    return statusMessages[language][status as keyof typeof statusMessages[typeof language]] || status;
  };

  const getStatusDescription = (status: string) => {
    const statusDescriptions = {
      ar: {
        'requested': 'تم استلام طلبك وجاري البحث عن طبيب بيطري',
        'processing': 'يتم معالجة طلبك حالياً',
        'confirmed': 'تم تأكيد طلبك وسيصل الطبيب قريباً',
        'in_progress': 'الطبيب البيطري في طريقه إليك',
        'enroute': 'الطبيب البيطري في الطريق إلى موقعك',
        'arrived': 'وصل الطبيب البيطري إلى موقعك',
        'completed': 'تم إكمال الخدمة البيطرية بنجاح',
        'cancelled': 'تم إلغاء الطلب'
      },
      en: {
        'requested': 'Your request has been received and we are finding a veterinarian',
        'processing': 'Your request is currently being processed',
        'confirmed': 'Your request has been confirmed and the doctor will arrive soon',
        'in_progress': 'The veterinarian is on their way to you',
        'enroute': 'The veterinarian is on the way to your location',
        'arrived': 'The veterinarian has arrived at your location',
        'completed': 'The veterinary service has been completed successfully',
        'cancelled': 'The request has been cancelled'
      }
    };
    
    return statusDescriptions[language][status as keyof typeof statusDescriptions[typeof language]] || 
           (language === 'ar' ? 'جاري التحديث...' : 'Updating...');
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(status)}`}>
        {getStatusIcon(status)}
      </div>
      <div style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
        <p className="font-semibold text-gray-900">
          {getStatusMessage(status)}
        </p>
        <p className="text-sm text-gray-600">
          {getStatusDescription(status)}
        </p>
      </div>
    </div>
  );
}
