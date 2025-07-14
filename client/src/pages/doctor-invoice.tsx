import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/i18n';
import { ArrowLeft, FileText, User, Phone, Calendar, Mail, Plus, Minus, Receipt, Save, Stethoscope, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceBeforeVAT: number;
  discount: number; // percentage (0-100)
  vatRate: number; // fixed at 15%
  totalBeforeVAT: number;
  totalAfterVAT: number;
}

interface Pet {
  id: number;
  name: string;
  type: string;
  ageYear: number;
  ageMonth: number;
  ageDay: number;
}

interface BookingDetails {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pets: Pet[];
  appointmentDate: string;
  appointmentTime: string;
  serviceType: string;
  location: any;
  status: string;
}

export default function DoctorInvoice() {
  const [, params] = useRoute('/doctor-invoice/:bookingId');
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { 
      id: '1', 
      description: '', 
      quantity: 1, 
      unitPriceBeforeVAT: 0, 
      discount: 0, 
      vatRate: 15, 
      totalBeforeVAT: 0, 
      totalAfterVAT: 0 
    }
  ]);
  const [isRecordLocked, setIsRecordLocked] = useState(false);

  // Fetch booking details
  const { data: booking, isLoading } = useQuery({
    queryKey: [`/api/doctor/booking/${params?.bookingId}`],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/doctor/booking/${params?.bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch booking details');
      return await response.json() as BookingDetails;
    },
    enabled: !!params?.bookingId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">
            {language === 'ar' ? 'لم يتم العثور على بيانات الموعد' : 'Booking data not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setLocation('/doctor-activity')}
              className="flex items-center text-gray-600 hover:text-purple-600"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {language === 'ar' ? 'رجوع' : 'Back'}
            </button>
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'ar' ? 'فاتورة الطبيب' : 'Doctor Invoice'}
              </h1>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User className="h-6 w-6 text-purple-600 mr-2" />
            {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'ar' ? 'الاسم' : 'Name'}
              </label>
              <p className="text-gray-900">{booking?.customerName || 'غير محدد'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'ar' ? 'الهاتف' : 'Phone'}
              </label>
              <p className="text-gray-900">{booking?.customerPhone || 'غير محدد'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <p className="text-gray-900">{booking?.customerEmail || 'غير محدد'}</p>
            </div>
          </div>
        </div>

        {/* Pet Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {language === 'ar' ? 'معلومات الحيوان الأليف' : 'Pet Information'}
          </h2>
          {booking?.pets && booking.pets.length > 0 ? booking.pets.map((pet, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:mb-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'اسم الحيوان' : 'Pet Name'}
                  </label>
                  <p className="text-gray-900">{pet.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'النوع' : 'Type'}
                  </label>
                  <p className="text-gray-900">{pet.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'العمر' : 'Age'}
                  </label>
                  <p className="text-gray-900">
                    {pet.ageYear} {language === 'ar' ? 'سنة' : 'years'} {pet.ageMonth} {language === 'ar' ? 'شهر' : 'months'} {pet.ageDay} {language === 'ar' ? 'يوم' : 'days'}
                  </p>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-gray-500">
              {language === 'ar' ? 'لا توجد حيوانات أليفة مسجلة' : 'No pets registered'}
            </div>
          )}
        </div>

        {/* Service Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="h-6 w-6 text-purple-600 mr-2" />
            {language === 'ar' ? 'تفاصيل الخدمة' : 'Service Details'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'ar' ? 'التاريخ' : 'Date'}
              </label>
              <p className="text-gray-900">{booking?.appointmentDate}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'ar' ? 'الوقت' : 'Time'}
              </label>
              <p className="text-gray-900">{booking?.appointmentTime}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'ar' ? 'نوع الخدمة' : 'Service Type'}
              </label>
              <p className="text-gray-900">{booking?.serviceType}</p>
            </div>
          </div>
        </div>

        {/* Simple Invoice Items Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Receipt className="h-6 w-6 text-purple-600 mr-2" />
            {language === 'ar' ? 'بنود الفاتورة' : 'Invoice Items'}
          </h2>
          <p className="text-gray-600">
            {language === 'ar' ? 'سيتم إضافة نظام الفاتورة المفصل قريباً' : 'Detailed invoice system will be added soon'}
          </p>
        </div>
      </div>
    </div>
  );
}