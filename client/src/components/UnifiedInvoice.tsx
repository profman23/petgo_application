import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { invoiceConfig, generateInvoiceNumber } from '@shared/invoice-config';

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
      {/* Invoice Header - رقم الفاتورة في أقصى اليسار */}
      <div className="invoice-header mb-8">
        <div className="flex justify-between items-start">
          <div className="invoice-number">
            <h1 
              className="text-lg font-semibold text-gray-800"
              style={{ 
                fontSize: invoiceConfig.styles.headerFontSize,
                color: invoiceConfig.styles.primaryColor 
              }}
            >
              {texts.invoice}: {invoiceNumber}
            </h1>
          </div>
        </div>
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