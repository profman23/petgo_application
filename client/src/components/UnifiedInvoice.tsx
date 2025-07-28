import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/i18n';
import { invoiceConfig, generateInvoiceNumber } from '@shared/invoice-config';
import logoImage from '@assets/Screenshot 2025-07-10 181936_1753696339125.png';

interface UnifiedInvoiceProps {
  bookingId: number;
  mode?: 'view' | 'print' | 'pdf';
}

export const UnifiedInvoice: React.FC<UnifiedInvoiceProps> = ({ 
  bookingId, 
  mode = 'view' 
}) => {
  const { language } = useLanguage();
  const texts = invoiceConfig.texts[language as 'ar' | 'en'];
  
  // Fetch real booking data
  const { data: booking } = useQuery({
    queryKey: [`/api/doctor/booking/${bookingId}`],
    enabled: !!bookingId
  });

  // Fetch real generated invoice data  
  const { data: generatedInvoice } = useQuery({
    queryKey: [`/api/generated-invoice/Vets9000020`],
    enabled: !!bookingId
  });
  
  const getDirection = () => language === 'ar' ? 'rtl' : 'ltr';
  const getTextAlign = () => language === 'ar' ? 'right' : 'left';

  // Use real data when available
  const realInvoiceNumber = (generatedInvoice as any)?.invoiceNumber || generateInvoiceNumber(bookingId);
  const realDate = (booking as any)?.appointmentDate ? new Date((booking as any).appointmentDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

  return (
    <div 
      className="unified-invoice bg-white p-6 min-h-screen"
      dir={getDirection()}
      style={{ 
        textAlign: getTextAlign(),
        fontFamily: 'Roboto, Arial, sans-serif'
      }}
    >
      {/* Invoice Header - تخطيط فاتورة رسمية كلاسيكية */}
      <div className="invoice-header mb-8">
        <div className="flex justify-between items-start mb-4">
          {/* معلومات الفاتورة في أقصى اليسار */}
          <div className="invoice-details">
            <div className="mb-2">
              <span className="text-gray-600 font-medium">Invoice : </span>
              <span className="text-gray-600 font-semibold text-sm">{realInvoiceNumber}</span>
            </div>
            <div>
              <span className="text-gray-600 font-medium">Date : </span>
              <span className="text-gray-600 font-semibold text-sm">{realDate}</span>
            </div>
          </div>
          
          {/* اللوجو في أقصى اليمين */}
          <div className="company-logo">
            <img 
              src={logoImage} 
              alt="VETS VAN Logo" 
              className="h-20 w-auto object-contain"
              style={{ maxHeight: '80px' }}
            />
          </div>
        </div>
        
        {/* خط فاصل بعرض الفاتورة - نفس لون الموف في اللوجو */}
        <div 
          className="w-full h-0.5"
          style={{ backgroundColor: '#8B2F8B' }}
        ></div>
      </div>

      {/* Customer Information Section - ثنائي اللغة */}
      <div className="customer-info mb-8">
        <div className="flex justify-between items-start">
          {/* معلومات العميل بالإنجليزية - الجهة اليسرى */}
          <div className="customer-info-en text-left">
            <div className="mb-1">
              <span className="text-gray-600 font-medium">Customer : </span>
              <span className="text-gray-600 font-semibold text-sm">{(booking as any)?.customerName || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-gray-600 font-medium">Phone : </span>
              <span className="text-gray-600 font-semibold text-sm">{(booking as any)?.customerPhone || 'Not specified'}</span>
            </div>
          </div>

          {/* معلومات العميل بالعربية - الجهة اليمنى */}
          <div className="customer-info-ar text-right" dir="rtl">
            <div className="mb-1">
              <span className="text-gray-600 font-medium">العميل : </span>
              <span className="text-gray-600 font-semibold text-sm">{(booking as any)?.customerName || 'غير محدد'}</span>
            </div>
            <div>
              <span className="text-gray-600 font-medium">الجوال : </span>
              <span className="text-gray-600 font-semibold text-sm">{(booking as any)?.customerPhone || 'غير محدد'}</span>
            </div>
          </div>
        </div>
        
        {/* خط فاصل ثاني أسفل معلومات العميل */}
        <div 
          className="w-full h-0.5 mt-4"
          style={{ backgroundColor: '#8B2F8B' }}
        ></div>
      </div>

      {/* Invoice Items Table Header */}
      <div className="invoice-items-section mb-8">
        <div className="grid grid-cols-7 gap-4 border-b border-gray-300 pb-3 mb-4">
          {/* Item Description */}
          <div className="text-center">
            <div className="text-gray-600 font-semibold text-sm">Item Description</div>
            <div className="text-gray-600 font-medium text-xs mt-1">وصف الصنف</div>
          </div>
          
          {/* Quantity */}
          <div className="text-center">
            <div className="text-gray-600 font-semibold text-sm">Quantity</div>
            <div className="text-gray-600 font-medium text-xs mt-1">الكمية</div>
          </div>
          
          {/* Unit Price */}
          <div className="text-center">
            <div className="text-gray-600 font-semibold text-sm">Unit Price</div>
            <div className="text-gray-600 font-medium text-xs mt-1">سعر الوحدة</div>
          </div>
          
          {/* Discount */}
          <div className="text-center">
            <div className="text-gray-600 font-semibold text-sm">Discount</div>
            <div className="text-gray-600 font-medium text-xs mt-1">الخصم</div>
          </div>
          
          {/* VAT */}
          <div className="text-center">
            <div className="text-gray-600 font-semibold text-sm">VAT</div>
            <div className="text-gray-600 font-medium text-xs mt-1">ض.ق.م</div>
          </div>
          
          {/* Total B.Vat */}
          <div className="text-center">
            <div className="text-gray-600 font-semibold text-sm">Total B.Vat</div>
            <div className="text-gray-600 font-medium text-xs mt-1">المجموع ق.ض</div>
          </div>
          
          {/* Total A.Vat */}
          <div className="text-center">
            <div className="text-gray-600 font-semibold text-sm">Total A.Vat</div>
            <div className="text-gray-600 font-medium text-xs mt-1">المجموع ب.ض</div>
          </div>
        </div>
        
        {/* Placeholder for invoice items */}
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm">{language === 'ar' ? 'بيانات الأصناف ستظهر هنا' : 'Invoice items will appear here'}</p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedInvoice;