import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Phone, Mail, Calendar, Clock, User, PawPrint, FileText } from 'lucide-react';
import riyalSymbolUrl from '@assets/Screenshot 2025-07-27 144314_1753616612709.png';

interface InvoiceData {
  invoiceNumber: string;
  bookingId: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  vetsVanCode: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  pets: Array<{
    id: string;
    name: string;
    type: string;
    ageYear: number;
    ageMonth: number;
  }>;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountType?: string;
    vatAmount: number;
    totalBeforeVat: number;
    totalAfterVat: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  serviceType: string;
  paymentMethods?: Array<{
    amount: number;
    paymentType: string;
  }>;
}

interface UnifiedInvoiceViewerProps {
  invoiceData: InvoiceData;
  qrCodeUrl?: string;
  language?: 'ar' | 'en';
}

const UnifiedInvoiceViewer: React.FC<UnifiedInvoiceViewerProps> = ({
  invoiceData,
  qrCodeUrl,
  language: propLanguage
}) => {
  const { language: contextLanguage } = useLanguage();
  const language = propLanguage || contextLanguage;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return language === 'ar' 
      ? date.toLocaleDateString('ar-SA')
      : date.toLocaleDateString('en-US');
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const formatCurrency = (amount: number) => {
    return (
      <span className="flex items-center gap-1">
        {amount.toFixed(2)}
        <img src={riyalSymbolUrl} alt="ر.س" className="w-3 h-3" />
      </span>
    );
  };

  const totalPaid = (invoiceData.paymentMethods || []).reduce(
    (sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 
    0
  );

  const remainingBalance = Math.max(0, (invoiceData.total || 0) - totalPaid);

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-8 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="header mb-4">
        <div className="logo-section">
          <div className="mb-3">
            <div className="company-name text-3xl font-black text-purple-600">
              VETS VAN
            </div>
            <div className="company-tagline text-gray-600 font-medium">
              {language === 'ar' ? 'خدمات بيطرية متنقلة في منزلك' : 'Mobile Veterinary Services at Your Home'}
            </div>
          </div>
          <div className="contact-info text-sm text-gray-600 space-y-1">
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-purple-600" />
              <span>+966 50 123 4567</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-purple-600" />
              <span>info@vetsvan.com</span>
            </div>
            <div>
              <span>{language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</span>
            </div>
          </div>
        </div>
        
        <div className="invoice-details text-left">
          <div className="text-sm font-semibold text-gray-800 mb-1">
            Invoice: {invoiceData.invoiceNumber || `VETSVAN-${invoiceData.bookingId}`}
          </div>
          <div className="invoice-date text-gray-600 mb-2 flex items-center font-semibold">
            <Calendar className="h-4 w-4 mr-2 text-purple-600" />
            {formatDate(invoiceData.appointmentDate)}
          </div>
          <div className="invoice-time text-gray-600 mb-2 flex items-center justify-center">
            <Clock className="h-4 w-4 mr-2 text-purple-600" />
            {formatTime(invoiceData.appointmentTime)}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{language === 'ar' ? 'الطبيب:' : 'Doctor:'}</span> {invoiceData.doctorName}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{language === 'ar' ? 'المركبة:' : 'Vehicle:'}</span> {invoiceData.vetsVanCode}
          </div>
        </div>
        
        <div className="qr-section text-center">
          {qrCodeUrl ? (
            <div>
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="qr-code w-32 h-32 mx-auto border-2 border-black rounded-lg shadow-md"
              />
              <p className="text-xs text-gray-600 mt-2 font-medium">
                {language === 'ar' ? 'امسح للتحقق' : 'Scan to verify'}
              </p>
            </div>
          ) : (
            <div className="w-32 h-32 border-2 border-black rounded-lg mx-auto flex items-center justify-center bg-gray-50">
              <span className="text-xs text-gray-500">QR Code</span>
            </div>
          )}
        </div>
      </div>

      {/* Separator Line */}
      <div className="w-full h-px bg-gradient-to-r from-purple-600 via-purple-600 to-purple-600 my-6"></div>

      {/* Customer Information */}
      <div className="section border-2 border-purple-600 shadow-lg">
        <h3 className="section-title flex items-center bg-purple-600 -m-5 mb-4 p-4 rounded-t-lg text-white">
          <User className="h-5 w-5 mr-2" />
          {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
        </h3>
        <div className="customer-info">
          <div>
            <div className="info-item">
              <span className="info-label">{language === 'ar' ? 'الاسم:' : 'Name:'}</span>
              <span>{invoiceData.customer.firstName} {invoiceData.customer.lastName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{language === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
              <span>{invoiceData.customer.phone}</span>
            </div>
          </div>
          <div>
            {invoiceData.customer.email && (
              <div className="info-item">
                <span className="info-label">{language === 'ar' ? 'الإيميل:' : 'Email:'}</span>
                <span>{invoiceData.customer.email}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">{language === 'ar' ? 'الخدمة:' : 'Service:'}</span>
              <span>{invoiceData.serviceType}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Separator Line */}
      <div className="w-full h-px bg-gradient-to-r from-purple-600 via-purple-600 to-purple-600 my-6"></div>

      {/* Pets Information */}
      <div className="section border-2 border-purple-600 shadow-lg">
        <h3 className="section-title flex items-center bg-purple-600 -m-5 mb-4 p-4 rounded-t-lg text-white">
          <PawPrint className="h-5 w-5 mr-2" />
          {language === 'ar' ? 'معلومات الحيوانات الأليفة' : 'Pet Information'}
        </h3>
        <div className="pets-grid">
          {invoiceData.pets.map((pet) => (
            <div key={pet.id} className="pet-card border-2 border-purple-600 shadow-md rounded-lg p-4 bg-gradient-to-r from-purple-50 to-white">
              <div className="pet-name text-lg font-bold text-purple-600 mb-2">{pet.name}</div>
              <div className="pet-details text-sm text-gray-700 space-y-1">
                <div><strong>{language === 'ar' ? 'النوع:' : 'Type:'}</strong> {pet.type}</div>
                <div><strong>{language === 'ar' ? 'العمر:' : 'Age:'}</strong> {pet.ageYear || 0} {language === 'ar' ? 'سنوات' : 'years'} {pet.ageMonth || 0} {language === 'ar' ? 'شهور' : 'months'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Separator Line */}
      <div className="w-full h-px bg-gradient-to-r from-purple-600 via-purple-600 to-purple-600 my-6"></div>

      {/* Service Items */}
      <div className="section border-2 border-purple-600 shadow-lg">
        <h3 className="section-title flex items-center bg-purple-600 -m-5 mb-4 p-4 rounded-t-lg text-white">
          <FileText className="h-5 w-5 mr-2" />
          {language === 'ar' ? 'تفاصيل الخدمات' : 'Service Details'}
        </h3>
        <div className="overflow-x-auto">
          <table className="services-table w-full border-2 border-purple-600 rounded-lg overflow-hidden shadow-md">
            <thead>
              <tr className="bg-gradient-to-r from-purple-600 to-purple-600">
                <th className="text-white font-bold py-3 px-3 text-center border-r border-purple-600 text-xs">
                  {language === 'ar' ? 'الخدمة' : 'Service'}
                </th>
                <th className="text-white font-bold py-3 px-3 text-center border-r border-purple-600 text-xs">
                  {language === 'ar' ? 'الكمية' : 'Qty'}
                </th>
                <th className="text-white font-bold py-3 px-3 text-center border-r border-purple-600 text-xs">
                  {language === 'ar' ? 'السعر' : 'Unit Price'}
                </th>
                <th className="text-white font-bold py-3 px-3 text-center border-r border-purple-600 text-xs">
                  {language === 'ar' ? 'الخصم' : 'Discount'}
                </th>
                <th className="text-white font-bold py-3 px-3 text-center border-r border-purple-600 text-xs">
                  {language === 'ar' ? 'ضريبة' : 'VAT'}
                </th>
                <th className="text-white font-bold py-3 px-3 text-center border-r border-purple-600 text-xs">
                  {language === 'ar' ? 'قبل الضريبة' : 'Before VAT'}
                </th>
                <th className="text-white font-bold py-3 px-3 text-center text-xs">
                  {language === 'ar' ? 'بعد الضريبة' : 'After VAT'}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => (
                <tr key={item.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-purple-100 transition-colors`}>
                  <td className="font-medium py-3 px-3 text-left border-r border-gray-200 text-sm">
                    {item.description}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-gray-200 font-semibold text-sm">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-gray-200 font-medium text-sm">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-gray-200 text-sm">
                    <div className="text-green-600 font-semibold">
                      {(() => {
                        const itemSubtotal = item.unitPrice * item.quantity;
                        let discountAmount = 0;
                        
                        if (item.discountType === '10%') {
                          discountAmount = itemSubtotal * 0.10;
                        } else if (item.discountType === '100%') {
                          discountAmount = itemSubtotal;
                        }
                        
                        if (discountAmount === 0) {
                          return language === 'ar' ? 'لا يوجد' : 'None';
                        }
                        
                        return (
                          <div className="text-center">
                            <div className="text-green-600 font-semibold">
                              {item.discountType === '10%' ? '10%' : item.discountType === '100%' ? '100%' : 'Custom'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatCurrency(discountAmount)}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center border-r border-gray-200 text-sm">
                    <div className="text-blue-600 font-semibold">
                      {formatCurrency(item.vatAmount)}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center border-r border-gray-200 font-medium text-sm">
                    {formatCurrency(item.totalBeforeVat)}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-purple-600 text-sm">
                    {formatCurrency(item.totalAfterVat)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spacing between items table and totals */}
      <div className="mb-12"></div>

      {/* Totals Section - Bilingual Side by Side */}
      <div className="flex justify-between gap-6 mb-6">
        {/* English Totals - Left Side */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-md p-4 w-80">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center border-b border-gray-200 pb-2">
            Invoice Totals
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-700">
                Total Before VAT:
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {formatCurrency((invoiceData.subtotal || 0) - (invoiceData.discount || 0))}
              </span>
            </div>
            <div className="border-b border-gray-200"></div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-700">
                VAT (15%):
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {formatCurrency(invoiceData.tax || 0)}
              </span>
            </div>
            <div className="border-b border-gray-200"></div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-700">
                Final Total:
              </span>
              <span className="text-sm font-bold text-purple-600">
                {formatCurrency(invoiceData.total || 0)}
              </span>
            </div>
            <div className="border-b border-gray-200"></div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-700">
                Total Paid:
              </span>
              <span className="text-sm font-semibold text-green-600">
                {formatCurrency(totalPaid)}
              </span>
            </div>
            <div className="border-b border-gray-200"></div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-700">
                Remaining Balance:
              </span>
              <span className="text-sm font-semibold text-red-600">
                {formatCurrency(remainingBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Arabic Totals - Right Side */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-md p-4 w-80" dir="rtl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center border-b border-gray-200 pb-2">
            مجموع الفاتورة
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-700">
                المجموع قبل الضريبة:
              </span>
              <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                <img src={riyalSymbolUrl} alt="ر.س" className="w-3 h-3" />
                {((invoiceData.subtotal || 0) - (invoiceData.discount || 0)).toFixed(2)}
              </span>
            </div>
            <div className="border-b border-gray-200"></div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-700">
                ضريبة القيمة المضافة (15%):
              </span>
              <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                <img src={riyalSymbolUrl} alt="ر.س" className="w-3 h-3" />
                {(invoiceData.tax || 0).toFixed(2)}
              </span>
            </div>
            <div className="border-b border-gray-200"></div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-700">
                المجموع النهائي:
              </span>
              <span className="text-sm font-bold text-purple-600 flex items-center gap-1">
                <img src={riyalSymbolUrl} alt="ر.س" className="w-3 h-3" />
                {(invoiceData.total || 0).toFixed(2)}
              </span>
            </div>
            <div className="border-b border-gray-200"></div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-700">
                المبلغ المدفوع:
              </span>
              <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                <img src={riyalSymbolUrl} alt="ر.س" className="w-3 h-3" />
                {totalPaid.toFixed(2)}
              </span>
            </div>
            <div className="border-b border-gray-200"></div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-700">
                الرصيد المتبقي:
              </span>
              <span className="text-sm font-semibold text-red-600 flex items-center gap-1">
                <img src={riyalSymbolUrl} alt="ر.س" className="w-3 h-3" />
                {remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedInvoiceViewer;