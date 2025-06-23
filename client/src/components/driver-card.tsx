import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, MessageCircle, Star } from 'lucide-react';
import type { Driver } from '@shared/schema';

interface DriverCardProps {
  driver: Driver;
  onCall?: () => void;
  onMessage?: () => void;
}

export function DriverCard({ driver, onCall, onMessage }: DriverCardProps) {
  return (
    <Card className="bg-gray-50 border-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={driver.profileImageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face'}
            alt={`صورة السائق ${driver.name}`}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{driver.name}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{driver.rating}</span>
              <span>•</span>
              <span>{driver.carModel} {driver.carColor}</span>
            </div>
          </div>
          <div className="text-left">
            <p className="text-sm text-gray-500">رقم اللوحة</p>
            <p className="font-semibold">{driver.plateNumber}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={onCall}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Phone className="w-4 h-4 ml-2" />
            اتصال
          </Button>
          <Button 
            onClick={onMessage}
            variant="outline"
            className="flex-1"
          >
            <MessageCircle className="w-4 h-4 ml-2" />
            رسالة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
