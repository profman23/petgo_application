import { Clock, CheckCircle, Car, MapPin, Search } from 'lucide-react';
import { RIDE_STATUS_MESSAGES, RIDE_STATUS_DESCRIPTIONS } from '@/lib/constants';

interface RideStatusProps {
  status: string;
  className?: string;
}

export function RideStatus({ status, className }: RideStatusProps) {
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

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(status)}`}>
        {getStatusIcon(status)}
      </div>
      <div>
        <p className="font-semibold text-gray-900">
          {RIDE_STATUS_MESSAGES[status as keyof typeof RIDE_STATUS_MESSAGES] || status}
        </p>
        <p className="text-sm text-gray-600">
          {RIDE_STATUS_DESCRIPTIONS[status as keyof typeof RIDE_STATUS_DESCRIPTIONS] || 'جاري التحديث...'}
        </p>
      </div>
    </div>
  );
}
