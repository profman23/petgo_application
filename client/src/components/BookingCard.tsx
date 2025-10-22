import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Calendar, Clock } from "lucide-react";

interface Pet {
  name: string;
  type: string;
}

interface BookingCardProps {
  booking: {
    id: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    vetsvanCode: string;
    vetsvanName?: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    pets?: Pet[];
    serviceType: string;
    paidAmount?: string | null;
    paymentStatus?: string | null;
    createdAt: string;
  };
  language: 'ar' | 'en';
  statusSelector?: React.ReactNode;
  additionalActions?: React.ReactNode;
  onClick?: () => void;
}

const getTextAlign = (language: string) => language === 'ar' ? 'right' : 'left';

export function BookingCard({ booking, language, statusSelector, additionalActions, onClick }: BookingCardProps) {
  return (
    <Card 
      className="h-fit border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
      onClick={onClick}
      data-testid={`booking-card-${booking.id}`}
    >
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-sm font-medium text-gray-900 truncate" data-testid="customer-name">
              {booking.customerName}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600 truncate" data-testid="customer-phone">
                {booking.customerPhone}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600 truncate" data-testid="customer-email">
                {booking.customerEmail}
              </span>
            </div>
          </div>
          <Badge
            className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
              booking.status === 'confirmed' 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : booking.status === 'pending_review'
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                : booking.status === 'cancelled'
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-blue-100 text-blue-700 border border-blue-300'
            }`}
            data-testid={`status-badge-${booking.status}`}
          >
            {booking.status === 'confirmed' && (language === 'ar' ? 'مؤكد' : 'Confirmed')}
            {booking.status === 'pending_review' && (language === 'ar' ? 'قيد المراجعة' : 'Pending')}
            {booking.status === 'cancelled' && (language === 'ar' ? 'ملغي' : 'Cancelled')}
            {!['confirmed', 'pending_review', 'cancelled'].includes(booking.status) && booking.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 px-3 pb-3">
        {/* VetsVan Info */}
        <div className="bg-purple-50 rounded p-1" data-testid="vetsvan-info">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-purple-600 rounded-full"></div>
            <span className="text-xs font-medium text-purple-700">
              {booking.vetsvanCode}
            </span>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-blue-600" />
            <span className="text-xs text-gray-600 truncate" data-testid="appointment-date">
              {new Date(booking.appointmentDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-blue-600" />
            <span className="text-xs text-gray-600" data-testid="appointment-time">
              {booking.appointmentTime}
            </span>
          </div>
        </div>

        {/* Service Type */}
        <div className="bg-blue-50 rounded p-1" data-testid="service-type">
          <span className="text-xs text-blue-700">
            {booking.serviceType === 'general_checkup' && (language === 'ar' ? 'كشف' : 'Check')}
            {booking.serviceType === 'grooming' && (language === 'ar' ? 'تنظيف' : 'Groom')}
            {!['general_checkup', 'grooming'].includes(booking.serviceType) && booking.serviceType}
          </span>
        </div>

        {/* Payment Status & Amount */}
        {booking.paidAmount && (
          <div className="bg-emerald-50 rounded p-1.5 border border-emerald-200" data-testid="paid-amount">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-emerald-700">
                  {language === 'ar' ? 'المبلغ المدفوع' : 'Paid Amount'}
                </span>
                {booking.paymentStatus === 'paid' && (
                  <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0" data-testid="payment-status-badge">
                    {language === 'ar' ? 'مدفوع' : 'Paid'}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-bold text-emerald-800">
                {booking.paidAmount} {language === 'ar' ? 'ريال' : 'SAR'}
              </span>
            </div>
          </div>
        )}

        {/* Pets */}
        {booking.pets && booking.pets.length > 0 && (
          <div className="bg-green-50 rounded p-1" data-testid="pets-list">
            <div className="flex flex-wrap gap-1">
              {booking.pets.map((pet, index) => (
                <span key={index} className="text-xs text-green-700 bg-green-100 px-1 rounded" data-testid={`pet-${index}`}>
                  {pet.name}
                  {pet.type === 'cat' && ' 🐱'}
                  {pet.type === 'dog' && ' 🐶'}
                  {pet.type === 'bird' && ' 🐦'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Status Selector (if provided) */}
        {statusSelector && (
          <div className="bg-gray-50 rounded p-1" data-testid="status-selector">
            {statusSelector}
          </div>
        )}

        {/* Additional Actions (if provided) */}
        {additionalActions && (
          <div data-testid="additional-actions">
            {additionalActions}
          </div>
        )}

        {/* Created Date */}
        <div className="border-t pt-1 mt-1">
          <div className="text-xs text-gray-400 text-center" data-testid="created-date">
            {new Date(booking.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
