import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/i18n';
import { invoiceConfig, generateInvoiceNumber } from '@shared/invoice-config';
import logoImage from '@assets/Screenshot 2025-07-10 181936_1753696339125.png';
import sarIcon from '@assets/Screenshot 2025-07-27 144314_1753699402447.png';

// CSS للطباعة لضمان التناسق
const printStyles = `
  @media print {
    .table-header-cell {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      text-align: center !important;
      gap: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .table-header-cell > div {
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
      line-height: 1.2 !important;
    }
  }
`;

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

  // Fetch invoice items
  const { data: invoiceItems } = useQuery({
    queryKey: [`/api/invoice-items/${bookingId}`],
    enabled: !!bookingId
  });

  // Fetch invoice payments for totals calculation
  const { data: invoicePayments } = useQuery({
    queryKey: [`/api/invoice-payments/${bookingId}`],
    enabled: !!bookingId
  });
  
  // Rename for consistency in payment types section
  const payments = invoicePayments;
  
  const getDirection = () => language === 'ar' ? 'rtl' : 'ltr';
  const getTextAlign = () => language === 'ar' ? 'right' : 'left';

  // Use real data when available
  const realInvoiceNumber = (generatedInvoice as any)?.invoiceNumber || generateInvoiceNumber(bookingId);
  const realDate = (booking as any)?.appointmentDate ? new Date((booking as any).appointmentDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

  // Calculate totals from invoice items
  const calculateTotals = () => {
    if (!invoiceItems || !(invoiceItems as any[]).length) {
      return { totalBeforeVat: 0, totalDiscount: 0, totalVat: 0, finalTotal: 0 };
    }

    let totalBeforeVat = 0;
    let totalDiscount = 0;
    let totalVat = 0;

    (invoiceItems as any[]).forEach((item: any) => {
      const quantity = parseFloat(item.quantity || '1');
      const unitPrice = parseFloat(item.unitPrice || '0');
      const subtotal = quantity * unitPrice;
      const discountPercent = item.discountType === '10%' ? 10 : item.discountType === '100%' ? 100 : 0;
      const discountAmount = (subtotal * discountPercent) / 100;
      const beforeVat = subtotal - discountAmount;
      const vatAmount = beforeVat * 0.15;

      totalBeforeVat += beforeVat;
      totalDiscount += discountAmount;
      totalVat += vatAmount;
    });

    const finalTotal = totalBeforeVat + totalVat;
    return { totalBeforeVat, totalDiscount, totalVat, finalTotal };
  };

  const totals = calculateTotals();
  
  // Calculate payments
  const totalPaid = invoicePayments 
    ? (invoicePayments as any[]).reduce((sum, payment) => sum + parseFloat(payment.amount || '0'), 0)
    : 0;
  
  const remainingBalance = totals.finalTotal - totalPaid;

  return (
    <div 
      className="unified-invoice bg-white p-6 min-h-screen"
      dir={getDirection()}
      style={{ 
        textAlign: getTextAlign(),
        fontFamily: 'Roboto, Arial, sans-serif'
      }}
    >
      {/* إضافة CSS للطباعة */}
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      {/* Invoice Header - تخطيط فاتورة رسمية كلاسيكية */}
      <div className="invoice-header mb-4">
        <div className="flex justify-between items-start mb-2">
          {/* معلومات الفاتورة في أقصى اليسار */}
          <div className="invoice-details mt-4">
            <div className="mb-2">
              <span className="text-gray-600 font-medium text-xs">Invoice : </span>
              <span className="text-gray-600 font-semibold text-xs">{realInvoiceNumber}</span>
            </div>
            <div>
              <span className="text-gray-600 font-medium text-xs">Date : </span>
              <span className="text-gray-600 font-semibold text-xs">{realDate}</span>
            </div>
          </div>
          
          {/* QR Code في المنتصف */}
          <div className="qr-code-container flex justify-center items-center">
            {(() => {
              // إنشاء بيانات QR Code مشفرة
              const qrData = {
                companyName: "شركة فن النخبة البيطرية",
                vatNumber: "300848569100003",
                taxAmount: totals.totalVat.toFixed(2),
                totalAmount: totals.finalTotal.toFixed(2),
                invoiceNumber: realInvoiceNumber,
                issueDateTime: new Date().toISOString()
              };
              
              // تشفير البيانات بـ Base64 مع دعم Unicode
              const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(qrData))));
              
              // إنشاء QR Code باستخدام Google Charts API
              const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(encodedData)}`;
              
              return (
                <img 
                  src={qrCodeUrl}
                  alt="Invoice QR Code"
                  className="w-20 h-20 object-contain"
                  style={{ maxWidth: '80px', maxHeight: '80px' }}
                />
              );
            })()}
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
        
        {/* VAT Number Section - أسفل اللوجو */}
        <div className="vat-number-section mb-2">
          <div className="flex justify-between items-center">
            {/* VAT Number بالإنجليزية - الجهة اليسرى */}
            <div className="vat-en text-left">
              <span className="text-gray-600 font-medium text-xs">VAT Number: </span>
              <span className="text-gray-600 font-semibold text-xs">300848569100003</span>
            </div>

            {/* VAT Number بالعربية - الجهة اليمنى */}
            <div className="vat-ar text-right" dir="rtl">
              <span className="text-gray-600 font-medium text-xs">الرقم الضريبي : </span>
              <span className="text-gray-600 font-semibold text-xs">300848569100003</span>
            </div>
          </div>
        </div>
        
        {/* خط فاصل بعرض الفاتورة - نفس لون الموف في اللوجو */}
        <div 
          className="w-full h-0.5 my-2"
          style={{ backgroundColor: '#8B2F8B' }}
        ></div>
      </div>

      {/* Customer Information Section - ثنائي اللغة */}
      <div className="customer-info mb-4 mt-1">
        <div className="flex justify-between items-start">
          {/* معلومات العميل بالإنجليزية - الجهة اليسرى */}
          <div className="customer-info-en text-left">
            <div className="mb-1">
              <span className="text-gray-600 font-medium text-xs">Customer : </span>
              <span className="text-gray-600 font-semibold text-xs">{(booking as any)?.customerName || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-gray-600 font-medium text-xs">Phone : </span>
              <span className="text-gray-600 font-semibold text-xs">{(booking as any)?.customerPhone || 'Not specified'}</span>
            </div>
          </div>

          {/* معلومات العميل بالعربية - الجهة اليمنى */}
          <div className="customer-info-ar text-right" dir="rtl">
            <div className="mb-1">
              <span className="text-gray-600 font-medium text-xs">العميل : </span>
              <span className="text-gray-600 font-semibold text-xs">{(booking as any)?.customerName || 'غير محدد'}</span>
            </div>
            <div>
              <span className="text-gray-600 font-medium text-xs">الجوال : </span>
              <span className="text-gray-600 font-semibold text-xs">{(booking as any)?.customerPhone || 'غير محدد'}</span>
            </div>
          </div>
        </div>
        
        {/* خط فاصل ثاني أسفل معلومات العميل */}
        <div 
          className="w-full h-0.5 mt-2"
          style={{ backgroundColor: '#8B2F8B' }}
        ></div>
        
        {/* Pet Information Section - ثنائي اللغة */}
        <div className="pet-info-section mt-1 mb-2">
          <div className="flex justify-between items-start gap-6">
            {/* Pet Info بالإنجليزية - الجهة اليسرى */}
            <div className="pet-en text-left flex-1">
              <div className="mb-1">
                <span className="text-gray-600 font-medium text-xs">Pet Name: </span>
                <span className="text-gray-600 font-semibold text-xs">
                  {(booking as any)?.selectedPets?.[0]?.name || 'N/A'}
                </span>
              </div>
              <div className="mb-1">
                <span className="text-gray-600 font-medium text-xs">Pet Type: </span>
                <span className="text-gray-600 font-semibold text-xs">
                  {(booking as any)?.selectedPets?.[0]?.type === 'cat' ? 'Cat' : 
                   (booking as any)?.selectedPets?.[0]?.type === 'dog' ? 'Dog' : 
                   (booking as any)?.selectedPets?.[0]?.type === 'bird' ? 'Bird' : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 font-medium text-xs">Pet Gender: </span>
                <span className="text-gray-600 font-semibold text-xs">
                  {(booking as any)?.selectedPets?.[0]?.gender || 'N/A'}
                </span>
              </div>
            </div>

            {/* Pet Info بالعربية - الجهة اليمنى */}
            <div className="pet-ar text-right flex-1" dir="rtl">
              <div className="mb-1">
                <span className="text-gray-600 font-medium text-xs">اسم الأليف : </span>
                <span className="text-gray-600 font-semibold text-xs">
                  {(booking as any)?.selectedPets?.[0]?.name || 'غير محدد'}
                </span>
              </div>
              <div className="mb-1">
                <span className="text-gray-600 font-medium text-xs">نوع الأليف : </span>
                <span className="text-gray-600 font-semibold text-xs">
                  {(booking as any)?.selectedPets?.[0]?.type || 'غير محدد'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 font-medium text-xs">جنس الأليف : </span>
                <span className="text-gray-600 font-semibold text-xs">
                  {(booking as any)?.selectedPets?.[0]?.gender || 'غير محدد'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* خط فاصل ثالث أسفل معلومات الأليف */}
        <div 
          className="w-full h-0.5 mt-2"
          style={{ backgroundColor: '#8B2F8B' }}
        ></div>
      </div>

      {/* Invoice Items Table Header */}
      <div className="invoice-items-section mb-4">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b border-gray-300 pb-2 mb-2">
          {/* Description */}
          <div className="text-center">
            <div className="text-gray-600 font-semibold text-sm">Description</div>
            <div className="text-gray-600 font-medium text-xs">وصف الصنف</div>
          </div>
          
          {/* Quantity */}
          <div className="text-center">
            <div className="text-gray-600 font-semibold text-sm">Quantity</div>
            <div className="text-gray-600 font-medium text-xs">الكمية</div>
          </div>
          
          {/* Unit Price */}
          <div className="text-center">
            <div className="text-gray-600 font-semibold text-sm">Unit Price</div>
            <div className="text-gray-600 font-medium text-xs">سعر الوحدة</div>
          </div>
          
          {/* Discount */}
          <div className="text-center">
            <div className="text-gray-600 font-semibold text-sm">Discount</div>
            <div className="text-gray-600 font-medium text-xs">الخصم</div>
          </div>
          
          {/* VAT */}
          <div className="text-center">
            <div className="text-gray-600 font-semibold text-sm">VAT</div>
            <div className="text-gray-600 font-medium text-xs">ض.ق.م</div>
          </div>
          
          {/* Total B.Vat */}
          <div className="text-center">
            <div className="text-gray-600 font-semibold text-sm">Total B.Vat</div>
            <div className="text-gray-600 font-medium text-xs">المجموع ق.ض</div>
          </div>
          
          {/* Total A.Vat */}
          <div className="text-center">
            <div className="text-gray-600 font-semibold text-sm">Total A.Vat</div>
            <div className="text-gray-600 font-medium text-xs">المجموع ب.ض</div>
          </div>
        </div>
        
        {/* Invoice Items Data */}
        {invoiceItems && (invoiceItems as any[]).length > 0 ? (
          (invoiceItems as any[]).map((item: any, index: number) => {
            // Calculate values
            const quantity = parseFloat(item.quantity || '1');
            const unitPrice = parseFloat(item.unitPrice || '0');
            const subtotal = quantity * unitPrice;
            const discountPercent = item.discountType === '10%' ? 10 : item.discountType === '100%' ? 100 : 0;
            const discountAmount = (subtotal * discountPercent) / 100;
            const totalBeforeVat = subtotal - discountAmount;
            const vatAmount = totalBeforeVat * 0.15; // 15% VAT
            const totalAfterVat = totalBeforeVat + vatAmount;

            return (
              <div key={index} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 py-1 border-b border-gray-100">
                {/* Item Description */}
                <div className="text-center">
                  <span className="text-gray-600 text-sm">{item.description || 'Service'}</span>
                </div>
                
                {/* Quantity */}
                <div className="text-center">
                  <span className="text-gray-600 text-sm">{quantity}</span>
                </div>
                
                {/* Unit Price */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-gray-600 text-sm">{unitPrice.toFixed(2)}</span>
                    <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                  </div>
                </div>
                
                {/* Discount */}
                <div className="text-center">
                  <span className="text-gray-600 text-sm">
                    {discountPercent > 0 ? `Discount ${discountPercent}%` : 'No Discount'}
                  </span>
                </div>
                
                {/* VAT */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-gray-600 text-sm">{vatAmount.toFixed(2)}</span>
                    <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                  </div>
                </div>
                
                {/* Total B.Vat */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-gray-600 text-sm">{totalBeforeVat.toFixed(2)}</span>
                    <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                  </div>
                </div>
                
                {/* Total A.Vat */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-gray-600 text-sm font-semibold">{totalAfterVat.toFixed(2)}</span>
                    <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm">{language === 'ar' ? 'بيانات الأصناف ستظهر هنا' : 'Invoice items will appear here'}</p>
          </div>
        )}
        
        {/* Invoice Totals Section - ثنائي اللغة */}
        <div className="invoice-totals mt-6">
          <div className="flex justify-between items-start gap-6">
            {/* المجاميع بالإنجليزية - الجهة اليسرى */}
            <div className="totals-en text-left w-80 border border-gray-300 rounded-lg p-4">
              {/* عنوان القسم الإنجليزي */}
              <div className="mb-3">
                <h3 className="text-gray-700 font-bold text-sm border-b border-gray-200 pb-2 text-center">Total Invoice</h3>
              </div>
              
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600 font-medium text-sm">Total Before VAT:</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 font-semibold text-sm">{totals.totalBeforeVat.toFixed(2)}</span>
                  <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-1">
                <span className="text-green-600 font-medium text-sm">Discount:</span>
                <div className="flex items-center gap-1">
                  <span className="text-green-600 font-semibold text-sm">{totals.totalDiscount.toFixed(2)}</span>
                  <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 font-medium text-sm">VAT 15%:</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 font-semibold text-sm">{totals.totalVat.toFixed(2)}</span>
                  <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                </div>
              </div>
              
              {/* خط رمادي بسيط */}
              <div className="w-full h-px bg-gray-300 mb-2"></div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 font-bold text-sm">Final Total:</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 font-bold text-sm">{totals.finalTotal.toFixed(2)}</span>
                  <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                </div>
              </div>
              
              {/* خط رمادي بسيط */}
              <div className="w-full h-px bg-gray-300 mb-2"></div>
              
              <div className="flex items-center justify-between mb-1">
                <span className="text-green-600 font-medium text-sm">Total Paid:</span>
                <div className="flex items-center gap-1">
                  <span className="text-green-600 font-semibold text-sm">{totalPaid.toFixed(2)}</span>
                  <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-red-600 font-medium text-sm">Remaining Balance:</span>
                <div className="flex items-center gap-1">
                  <span className="text-red-600 font-semibold text-sm">{remainingBalance.toFixed(2)}</span>
                  <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                </div>
              </div>
            </div>

            {/* المجاميع بالعربية - الجهة اليمنى */}
            <div className="totals-ar text-right w-80 border border-gray-300 rounded-lg p-4" dir="rtl">
              {/* عنوان القسم العربي */}
              <div className="mb-3">
                <h3 className="text-gray-700 font-bold text-sm border-b border-gray-200 pb-2 text-center">مجموع الفاتورة</h3>
              </div>
              
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600 font-medium text-sm">المجموع قبل الضريبة :</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 font-semibold text-sm">{totals.totalBeforeVat.toFixed(2)}</span>
                  <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-1">
                <span className="text-green-600 font-medium text-sm">الخصم :</span>
                <div className="flex items-center gap-1">
                  <span className="text-green-600 font-semibold text-sm">{totals.totalDiscount.toFixed(2)}</span>
                  <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 font-medium text-sm">ضريبة القيمة المضافة 15% :</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 font-semibold text-sm">{totals.totalVat.toFixed(2)}</span>
                  <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                </div>
              </div>
              
              {/* خط رمادي بسيط */}
              <div className="w-full h-px bg-gray-300 mb-2"></div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 font-bold text-sm">المجموع النهائي :</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 font-bold text-sm">{totals.finalTotal.toFixed(2)}</span>
                  <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                </div>
              </div>
              
              {/* خط رمادي بسيط */}
              <div className="w-full h-px bg-gray-300 mb-2"></div>
              
              <div className="flex items-center justify-between mb-1">
                <span className="text-green-600 font-medium text-sm">المبلغ المدفوع :</span>
                <div className="flex items-center gap-1">
                  <span className="text-green-600 font-semibold text-sm">{totalPaid.toFixed(2)}</span>
                  <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-red-600 font-medium text-sm">الرصيد المتبقي :</span>
                <div className="flex items-center gap-1">
                  <span className="text-red-600 font-semibold text-sm">{remainingBalance.toFixed(2)}</span>
                  <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Type Section - ثنائي اللغة */}
        <div className="payment-types mt-6">
          <div className="flex justify-between items-start gap-6">
            {/* Payment Types بالإنجليزية - الجهة اليسرى */}
            <div className="payment-en text-left w-80 border border-gray-300 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 text-center">
                Payment Types
              </div>
              
              {payments && (payments as any[]).length > 0 ? (
                (payments as any[]).map((payment: any, index: number) => (
                  <div key={index} className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 font-medium text-sm">
                      {payment.paymentType === 'cash' ? 'Cash' : 'Card'}:
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 font-semibold text-sm">{parseFloat(payment.amount).toFixed(2)}</span>
                      <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No payments recorded
                </div>
              )}
            </div>

            {/* Payment Types بالعربية - الجهة اليمنى */}
            <div className="payment-ar text-right w-80 border border-gray-300 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 text-center">
                أنواع الدفع
              </div>
              
              {payments && (payments as any[]).length > 0 ? (
                (payments as any[]).map((payment: any, index: number) => (
                  <div key={index} className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <img src={sarIcon} alt="SAR" className="h-3 w-3 object-contain" />
                      <span className="text-gray-600 font-semibold text-sm">{parseFloat(payment.amount).toFixed(2)}</span>
                    </div>
                    <span className="text-gray-600 font-medium text-sm">
                      :{payment.paymentType === 'cash' ? 'نقدي' : 'بطاقة'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">
                  لا توجد مدفوعات مسجلة
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* خط فاصل رابع أسفل المجاميع */}
        <div 
          className="w-full h-0.5 mt-4"
          style={{ backgroundColor: '#8B2F8B' }}
        ></div>
      </div>
    </div>
  );
};

export default UnifiedInvoice;