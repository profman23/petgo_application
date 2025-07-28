import React from 'react';
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
  const invoiceNumber = generateInvoiceNumber(bookingId);
  
  const getDirection = () => language === 'ar' ? 'rtl' : 'ltr';
  const getTextAlign = () => language === 'ar' ? 'right' : 'left';

  return (
    <div 
      className="unified-invoice bg-white p-6 min-h-screen"
      dir={getDirection()}
      style={{ 
        textAlign: getTextAlign(),
        fontFamily: language === 'ar' ? 'Delius, Arial, sans-serif' : 'Comic Relief, Arial, sans-serif'
      }}
    >
      {/* Invoice Header - تخطيط فاتورة رسمية كلاسيكية */}
      <div className="invoice-header mb-8">
        <div className="flex justify-between items-start mb-4">
          {/* معلومات الفاتورة في أقصى اليسار */}
          <div className="invoice-details">
            <div className="mb-2">
              <span className="text-gray-700 font-medium">Invoice : </span>
              <span className="text-gray-900 font-semibold">{invoiceNumber}</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Date : </span>
              <span className="text-gray-900 font-semibold">{new Date().toLocaleDateString('en-GB')}</span>
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

      {/* المحتوى سيتم إضافته تدريجياً */}
      <div className="invoice-content">
        <p className="text-gray-600" style={{ fontSize: invoiceConfig.styles.bodyFontSize }}>
          {language === 'ar' ? 'محتوى الفاتورة سيتم إضافته تدريجياً...' : 'Invoice content will be added progressively...'}
        </p>
      </div>
    </div>
  );
};

export default UnifiedInvoice;