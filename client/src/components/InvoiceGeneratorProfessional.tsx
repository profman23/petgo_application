import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer, X, Phone, Mail, Calendar, Clock, User, PawPrint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import logoImage from "@assets/IMG-20250415-WA0047_1751986059751.jpg";
import riyalLogo from "@assets/Screenshot 2025-07-08 171929_1751985624644.png";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: string;
  vatRate: number;
  vatAmount: number;
  totalBeforeVat: number;
  totalAfterVat: number;
  total: number;
}

interface Customer {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface Pet {
  id: number;
  name: string;
  type: string;
  ageYear: number;
  ageMonth: number;
  ageDay: number;
}

interface PaymentMethod {
  id: string;
  method: string;
  amount: number;
  date: string;
  reference?: string;
}

interface InvoiceData {
  bookingId: number;
  invoiceNumber?: string;
  customer: Customer;
  pets: Pet[];
  appointmentDate: string;
  appointmentTime: string;
  serviceType: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string;
  doctorName: string;
  vetsVanCode: string;
  paymentMethods?: PaymentMethod[];
}

interface InvoiceGeneratorProps {
  invoiceData: InvoiceData;
  onClose: () => void;
}

export default function InvoiceGeneratorProfessional({ invoiceData, onClose }: InvoiceGeneratorProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Saudi Riyal Currency Icon Component
  const RiyalIcon = () => (
    <img 
      src={riyalLogo}
      alt="SAR"
      width="20" 
      height="20" 
      className="inline-block ml-1 object-contain bg-white rounded px-1 py-0.5"
    />
  );

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return (
      <span className="flex items-center justify-center">
        {(numAmount || 0).toFixed(2)}
        <RiyalIcon />
      </span>
    );
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? (language === 'ar' ? 'مساءً' : 'PM') : (language === 'ar' ? 'صباحاً' : 'AM');
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  // Generate QR Code
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrData = {
          invoice: invoiceData.invoiceNumber || `VETSVAN-${invoiceData.bookingId}`,
          customer: `${invoiceData.customer.firstName} ${invoiceData.customer.lastName}`,
          total: invoiceData.total,
          date: invoiceData.appointmentDate,
          vetsvan: invoiceData.vetsVanCode,
          verification: `https://vetsvan.com/verify/${invoiceData.bookingId}`
        };
        
        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 150,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        
        setQrCodeUrl(qrCodeDataURL);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [invoiceData]);

  const printInvoice = async () => {
    setIsGenerating(true);
    try {
      // Make API call to generate PDF for printing
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/generate-pdf/invoice/${invoiceData.bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      // Create download link for PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invoiceData.invoiceNumber || invoiceData.bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: language === 'ar' ? 'تم تحميل الـ PDF بنجاح' : 'PDF Downloaded Successfully',
        description: language === 'ar' ? 'تم تحميل الفاتورة كملف PDF' : 'Invoice downloaded as PDF file',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: language === 'ar' ? 'خطأ في تحميل PDF' : 'PDF Download Error',
        description: language === 'ar' ? 'فشل في تحميل الفاتورة كـ PDF' : 'Failed to download invoice as PDF',
        variant: 'destructive'
      });
    }
    setIsGenerating(false);
  };

  const downloadInvoice = async () => {
    setIsGenerating(true);
    try {
      // Make API call to generate PDF
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/generate-pdf/invoice/${invoiceData.bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invoiceData.invoiceNumber || invoiceData.bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: language === 'ar' ? 'تم تحميل الـ PDF بنجاح' : 'PDF Downloaded Successfully',
        description: language === 'ar' ? 'تم تحميل الفاتورة كملف PDF' : 'Invoice downloaded as PDF file',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: language === 'ar' ? 'خطأ في تحميل PDF' : 'PDF Download Error',
        description: language === 'ar' ? 'فشل في تحميل الفاتورة كـ PDF' : 'Failed to download invoice as PDF',
        variant: 'destructive'
      });
    }
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-200">
        {/* Action Buttons */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700 no-print rounded-t-2xl">
          <h3 className="text-2xl font-bold text-white flex items-center">
            <FileText className="h-7 w-7 mr-3 text-white" />
            {language === 'ar' ? 'فاتورة VETS VAN' : 'VETS VAN Invoice'}
          </h3>
          <div className="flex gap-3">
            <Button onClick={printInvoice} disabled={isGenerating} variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-purple-600">
              <Printer className="h-4 w-4 mr-2" />
              {isGenerating ? (language === 'ar' ? 'جاري التحميل...' : 'Generating...') : (language === 'ar' ? 'تحميل PDF' : 'Download PDF')}
            </Button>
            <Button onClick={downloadInvoice} disabled={isGenerating} size="sm" className="bg-white text-purple-600 hover:bg-gray-100">
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? (language === 'ar' ? 'جاري التحميل...' : 'Generating...') : (language === 'ar' ? 'تحميل PDF' : 'Download PDF')}
            </Button>
            <Button onClick={onClose} variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-purple-600">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div ref={invoiceRef} className="invoice-container p-8">
          {/* Company Logo Header */}
          <div className="logo-header">
            <img 
              src={logoImage}
              alt="Vets Van Logo"
              className="mx-auto h-20 object-contain"
            />
          </div>
          
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
              <div className="text-sm text-gray-600 mb-1">
                Invoice: {invoiceData.invoiceNumber || `VETSVAN-${invoiceData.bookingId}`}
              </div>
              <div className="invoice-date text-gray-600 mb-2 flex items-center">
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
          <div className="w-full h-px bg-gradient-to-r from-purple-600 via-#852085 to-purple-600 my-6"></div>

          {/* Customer Information */}
          <div className="section border-2 border-purple-600 shadow-lg">
            <h3 className="section-title flex items-center bg-purple-600 -m-5 mb-4 p-4 rounded-t-lg">
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
          <div className="w-full h-px bg-gradient-to-r from-purple-600 via-#852085 to-purple-600 my-6"></div>

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
          <div className="w-full h-px bg-gradient-to-r from-purple-600 via-#852085 to-purple-600 my-6"></div>

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

          {/* Totals Section - Right Side */}
          <div className="flex justify-end mb-6">
            <div className="bg-white border border-gray-300 rounded-lg shadow-md p-4 w-80">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'المجموع قبل الضريبة:' : 'Total Before VAT:'}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {formatCurrency(invoiceData.subtotal - (invoiceData.discount || 0))}
                  </span>
                </div>
                <div className="border-b border-gray-200"></div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'ضريبة القيمة المضافة:' : 'VAT:'}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {formatCurrency(invoiceData.tax)}
                  </span>
                </div>
                <div className="border-b border-gray-200"></div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'المجموع النهائي:' : 'Final Total:'}
                  </span>
                  <span className="text-sm font-bold text-purple-600">
                    {formatCurrency(invoiceData.total)}
                  </span>
                </div>
                <div className="border-b border-gray-200"></div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'المبلغ المدفوع:' : 'Total Paid:'}
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency((invoiceData.paymentMethods || []).reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 0))}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'الرصيد المتبقي:' : 'Remaining Balance:'}
                  </span>
                  <span className="text-sm font-semibold text-red-600">
                    {formatCurrency(Math.max(0, (invoiceData.total || 0) - ((invoiceData.paymentMethods || []).reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 0))))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Separator Line */}
          <div className="w-full h-px bg-gradient-to-r from-purple-600 via-#852085 to-purple-600 my-6"></div>

          {/* Enhanced Invoice Summary */}
          <div className="total-section border-4 border-purple-600 shadow-xl bg-gradient-to-br from-purple-50 to-white rounded-lg">
            <h3 className="section-title text-center text-xl bg-purple-600 -m-6 mb-6 p-4 rounded-t-lg text-white">
              {language === 'ar' ? 'ملخص الفاتورة' : 'Invoice Summary'}
            </h3>
            <div className="space-y-4">
              {/* Subtotal */}
              <div className="total-row border-b border-purple-600 pb-3 bg-gray-50 rounded-lg p-3">
                <span className="font-semibold text-lg text-gray-700">{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                <span className="font-bold text-lg text-purple-600">{formatCurrency(invoiceData.subtotal)}</span>
              </div>
              
              {/* Discount Section */}
              {invoiceData.discount > 0 && (
                <div className="total-row text-green-600 border-b border-purple-600 pb-3 bg-green-50 rounded-lg p-3">
                  <span className="font-semibold text-lg">{language === 'ar' ? 'إجمالي الخصم:' : 'Total Discount:'}</span>
                  <span className="font-bold text-lg">-{formatCurrency(invoiceData.discount)}</span>
                </div>
              )}
              
              {/* VAT Section */}
              <div className="total-row border-b border-purple-600 pb-3 bg-blue-50 rounded-lg p-3">
                <span className="font-semibold text-lg text-blue-700">{language === 'ar' ? 'ضريبة القيمة المضافة (15%):' : 'Value Added Tax (15%):'}</span>
                <span className="font-bold text-lg text-blue-600">{formatCurrency(invoiceData.tax)}</span>
              </div>
              
              {/* Amount After Discount */}
              <div className="total-row border-b border-purple-600 pb-3 bg-purple-50 rounded-lg p-3">
                <span className="font-semibold text-lg text-purple-700">{language === 'ar' ? 'المجموع بعد الخصم:' : 'Amount After Discount:'}</span>
                <span className="font-bold text-lg text-purple-600">{formatCurrency(invoiceData.subtotal - invoiceData.discount)}</span>
              </div>
              
              {/* Final Total */}
              <div className="final-total bg-gradient-to-r from-purple-600 to-purple-600 border-3 border-purple-600 rounded-lg shadow-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-black text-white">{language === 'ar' ? 'المبلغ الإجمالي:' : 'TOTAL AMOUNT:'}</span>
                  <span className="text-3xl font-black text-white">{formatCurrency(invoiceData.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Separator Line */}
          <div className="w-full h-px bg-gradient-to-r from-purple-600 via-#852085 to-purple-600 my-6"></div>

          {/* Payment Methods */}
          {invoiceData.paymentMethods && invoiceData.paymentMethods.length > 0 && (
            <div className="section border-2 border-green-600 shadow-lg">
              <h3 className="section-title flex items-center bg-green-600 -m-5 mb-4 p-4 rounded-t-lg text-white">
                <FileText className="h-5 w-5 mr-2" />
                {language === 'ar' ? 'تفاصيل الدفع' : 'Payment Details'}
              </h3>
              <div className="space-y-3">
                {invoiceData.paymentMethods.map((payment) => (
                  <div key={payment.id} className="payment-item bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-green-800">{payment.method}</span>
                        {payment.reference && (
                          <span className="text-sm text-green-600 ml-2">
                            ({language === 'ar' ? 'المرجع:' : 'Ref:'} {payment.reference})
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-700 text-lg">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-sm text-green-600">
                          {new Date(payment.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="payment-summary bg-green-100 border-2 border-green-400 rounded-lg p-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-green-800 text-lg">
                      {language === 'ar' ? 'إجمالي المدفوع:' : 'Total Paid:'}
                    </span>
                    <span className="font-bold text-green-700 text-xl">
                      {formatCurrency(invoiceData.paymentMethods.reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Separator Line */}
          <div className="w-full h-px bg-gradient-to-r from-purple-600 via-#852085 to-purple-600 my-6"></div>

          {/* Notes */}
          {invoiceData.notes && (
            <div className="notes-section border-2 border-yellow-300 shadow-lg">
              <h3 className="section-title text-yellow-700 bg-yellow-100 -m-5 mb-4 p-4 rounded-t-lg">
                {language === 'ar' ? 'ملاحظات' : 'Notes'}
              </h3>
              <p className="text-gray-700 leading-relaxed text-base">{invoiceData.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <div className="thank-you">
              {language === 'ar' ? 'شكراً لاختياركم VETS VAN' : 'Thank you for choosing VETS VAN'}
            </div>
            <p>
              {language === 'ar' 
                ? 'نحن ملتزمون بتقديم أفضل الخدمات البيطرية لحيواناتكم الأليفة'
                : 'We are committed to providing the best veterinary services for your beloved pets'
              }
            </p>
            <p className="mt-2 text-xs">
              {language === 'ar' 
                ? 'هذه الفاتورة صالحة لأغراض الضرائب والمحاسبة'
                : 'This invoice is valid for tax and accounting purposes'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { InvoiceGeneratorProfessional };