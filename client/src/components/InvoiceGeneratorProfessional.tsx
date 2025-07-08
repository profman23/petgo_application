import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer, X, Phone, Mail, Calendar, Clock, User, PawPrint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import riyalLogo from "@assets/Screenshot 2025-07-08 171929_1751985624644.png";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
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

interface InvoiceData {
  bookingId: number;
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

  const formatCurrency = (amount: number) => {
    return (
      <span className="flex items-center justify-center">
        {amount.toFixed(2)}
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
          invoice: `VETSVAN-${invoiceData.bookingId}`,
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

  const printInvoice = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="utf-8">
          <title>VETS VAN Invoice #${invoiceData.bookingId}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', 'Helvetica', sans-serif; 
              font-size: 14px; 
              line-height: 1.6; 
              color: #333;
              background: white;
            }
            .invoice-container { 
              max-width: 210mm; 
              margin: 0 auto; 
              padding: 20mm;
              background: white;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              margin-bottom: 30px; 
              padding-bottom: 20px; 
              border-bottom: 3px solid #8B2F8B;
            }
            .logo-section { flex: 1.5; }
            .company-name { 
              font-size: 32px; 
              font-weight: 900; 
              color: #8B2F8B; 
              margin-bottom: 8px;
              text-shadow: 1px 1px 2px rgba(139, 47, 139, 0.1);
            }
            .company-tagline { 
              font-size: 16px; 
              color: #666; 
              font-style: italic;
              margin-bottom: 10px;
            }
            .contact-info { 
              font-size: 12px; 
              color: #888; 
              line-height: 1.4;
            }
            .invoice-details { 
              flex: 1; 
              text-align: center; 
              padding: 0 20px;
            }
            .invoice-number { 
              font-size: 24px; 
              font-weight: bold; 
              color: #8B2F8B; 
              margin-bottom: 10px;
            }
            .invoice-date { 
              font-size: 14px; 
              color: #666; 
              margin-bottom: 5px;
            }
            .qr-section { 
              flex: 1; 
              text-align: ${language === 'ar' ? 'left' : 'right'};
            }
            .qr-code { 
              width: 120px; 
              height: 120px; 
              border: 2px solid #000; 
              border-radius: 8px;
            }
            .section { 
              margin-bottom: 25px; 
              padding: 20px; 
              background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); 
              border-radius: 10px; 
              border-left: 5px solid #8B2F8B;
            }
            .section-title { 
              font-size: 18px; 
              font-weight: bold; 
              color: #8B2F8B; 
              margin-bottom: 15px; 
              border-bottom: 1px solid #e9ecef; 
              padding-bottom: 8px;
            }
            .customer-info { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin-top: 15px;
            }
            .info-item { 
              margin-bottom: 8px; 
            }
            .info-label { 
              font-weight: bold; 
              color: #555; 
              display: inline-block; 
              min-width: 80px;
            }
            .pets-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
              gap: 15px; 
              margin-top: 15px;
            }
            .pet-card { 
              padding: 15px; 
              background: white; 
              border-radius: 8px; 
              border: 2px solid #e9ecef; 
              text-align: center;
            }
            .pet-name { 
              font-size: 16px; 
              font-weight: bold; 
              color: #8B2F8B; 
              margin-bottom: 8px;
            }
            .pet-details { 
              font-size: 12px; 
              color: #666; 
              line-height: 1.4;
            }
            .services-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0; 
              border-radius: 8px; 
              overflow: hidden; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .services-table th { 
              background: linear-gradient(135deg, #8B2F8B 0%, #a855f7 100%); 
              color: white; 
              padding: 15px 10px; 
              text-align: center; 
              font-weight: bold; 
              font-size: 14px;
            }
            .services-table td { 
              padding: 12px 10px; 
              border: 1px solid #e9ecef; 
              text-align: center;
            }
            .services-table tbody tr:nth-child(even) { 
              background: #f8f9fa;
            }
            .total-section { 
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
              padding: 25px; 
              border-radius: 12px; 
              border: 3px solid #8B2F8B; 
              margin-top: 20px;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 8px 0; 
              border-bottom: 1px solid #d1d5db; 
              font-size: 15px;
            }
            .total-row:last-child { 
              border-bottom: none;
            }
            .final-total { 
              font-size: 20px; 
              font-weight: bold; 
              color: #8B2F8B; 
              border-top: 2px solid #8B2F8B; 
              padding-top: 15px; 
              margin-top: 10px; 
              background: white; 
              padding: 15px; 
              border-radius: 8px; 
              text-align: center;
            }
            .notes-section { 
              margin-top: 25px; 
              padding: 20px; 
              background: #fff8dc; 
              border-radius: 8px; 
              border: 2px solid #d4af37;
            }
            .footer { 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 2px solid #8B2F8B; 
              text-align: center; 
              font-size: 12px; 
              color: #666;
            }
            .thank-you { 
              font-size: 18px; 
              font-weight: bold; 
              color: #8B2F8B; 
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const downloadInvoice = async () => {
    setIsGenerating(true);
    try {
      // Create a formatted HTML version for download
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
          <head>
            <meta charset="utf-8">
            <title>VETS VAN Invoice #${invoiceData.bookingId}</title>
            <style>
              /* Include all the print styles here */
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; }
              /* ... rest of styles ... */
            </style>
          </head>
          <body>
            ${invoiceRef.current?.innerHTML}
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `VETSVAN-Invoice-${invoiceData.bookingId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: language === 'ar' ? 'تم التحميل بنجاح' : 'Download Successful',
        description: language === 'ar' ? 'تم تحميل الفاتورة بنجاح' : 'Invoice downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: language === 'ar' ? 'خطأ في التحميل' : 'Download Error',
        description: language === 'ar' ? 'فشل في تحميل الفاتورة' : 'Failed to download invoice',
        variant: 'destructive'
      });
    }
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-200">
        {/* Action Buttons */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-purple-50 to-purple-100 no-print rounded-t-2xl">
          <h3 className="text-2xl font-bold text-purple-800 flex items-center">
            <FileText className="h-7 w-7 mr-3" />
            {language === 'ar' ? 'فاتورة VETS VAN' : 'VETS VAN Invoice'}
          </h3>
          <div className="flex gap-3">
            <Button onClick={printInvoice} variant="outline" size="sm" className="text-purple-700 border-purple-300 hover:bg-purple-50">
              <Printer className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'طباعة' : 'Print'}
            </Button>
            <Button onClick={downloadInvoice} disabled={isGenerating} size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Download className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'تحميل' : 'Download'}
            </Button>
            <Button onClick={onClose} variant="outline" size="sm" className="text-gray-600 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div ref={invoiceRef} className="invoice-container p-8">
          {/* Header Section */}
          <div className="header mb-8">
            <div className="logo-section">
              <div className="flex items-center mb-4">
                <div className="relative mr-4">
                  <img 
                    src={logoImage} 
                    alt="VETS VAN Logo" 
                    className="w-20 h-12 object-cover rounded-lg border-4 border-purple-500 shadow-lg"
                  />
                </div>
                <div>
                  <div className="company-name text-3xl font-black text-purple-800">
                    VETS VAN
                  </div>
                  <div className="company-tagline text-gray-600 font-medium">
                    {language === 'ar' ? 'خدمات بيطرية متنقلة في منزلك' : 'Mobile Veterinary Services at Your Home'}
                  </div>
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
            
            <div className="invoice-details text-center">
              <div className="invoice-number text-2xl font-bold text-purple-800 mb-2">
                {language === 'ar' ? 'فاتورة رقم' : 'Invoice'} #VETSVAN-{invoiceData.bookingId}
              </div>
              <div className="invoice-date text-gray-600 mb-2 flex items-center justify-center">
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
          <div className="w-full h-px bg-gradient-to-r from-purple-200 via-purple-500 to-purple-200 my-6"></div>

          {/* Customer Information */}
          <div className="section border-2 border-purple-200 shadow-lg">
            <h3 className="section-title flex items-center bg-purple-100 -m-5 mb-4 p-4 rounded-t-lg">
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
          <div className="w-full h-px bg-gradient-to-r from-purple-200 via-purple-500 to-purple-200 my-6"></div>

          {/* Pets Information */}
          <div className="section border-2 border-purple-200 shadow-lg">
            <h3 className="section-title flex items-center bg-purple-100 -m-5 mb-4 p-4 rounded-t-lg">
              <PawPrint className="h-5 w-5 mr-2" />
              {language === 'ar' ? 'معلومات الحيوانات الأليفة' : 'Pet Information'}
            </h3>
            <div className="pets-grid">
              {invoiceData.pets.map((pet) => (
                <div key={pet.id} className="pet-card border-2 border-purple-100 shadow-md">
                  <div className="pet-name">{pet.name}</div>
                  <div className="pet-details">
                    <div><strong>{language === 'ar' ? 'النوع:' : 'Type:'}</strong> {pet.type}</div>
                    <div><strong>{language === 'ar' ? 'العمر:' : 'Age:'}</strong> {pet.ageYear || 0} {language === 'ar' ? 'سنوات' : 'years'} {pet.ageMonth || 0} {language === 'ar' ? 'شهور' : 'months'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Separator Line */}
          <div className="w-full h-px bg-gradient-to-r from-purple-200 via-purple-500 to-purple-200 my-6"></div>

          {/* Service Items */}
          <div className="section border-2 border-purple-200 shadow-lg">
            <h3 className="section-title flex items-center bg-purple-100 -m-5 mb-4 p-4 rounded-t-lg">
              <FileText className="h-5 w-5 mr-2" />
              {language === 'ar' ? 'تفاصيل الخدمات' : 'Service Details'}
            </h3>
            <div className="overflow-x-auto">
              <table className="services-table w-full border-2 border-purple-200 rounded-lg overflow-hidden shadow-md">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-purple-800">
                    <th className="text-white font-bold py-4 px-6 text-center border-r border-purple-400">
                      {language === 'ar' ? 'الخدمة' : 'Service'}
                    </th>
                    <th className="text-white font-bold py-4 px-6 text-center border-r border-purple-400">
                      {language === 'ar' ? 'الكمية' : 'Quantity'}
                    </th>
                    <th className="text-white font-bold py-4 px-6 text-center border-r border-purple-400">
                      {language === 'ar' ? 'السعر' : 'Unit Price'}
                    </th>
                    <th className="text-white font-bold py-4 px-6 text-center">
                      {language === 'ar' ? 'المجموع' : 'Total'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={item.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-purple-50 transition-colors`}>
                      <td className="font-medium py-4 px-6 text-left border-r border-gray-200">
                        {item.description}
                      </td>
                      <td className="py-4 px-6 text-center border-r border-gray-200 font-semibold">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-6 text-center border-r border-gray-200 font-medium">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-purple-700">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Separator Line */}
          <div className="w-full h-px bg-gradient-to-r from-purple-200 via-purple-500 to-purple-200 my-6"></div>

          {/* Totals */}
          <div className="total-section border-4 border-purple-300 shadow-xl">
            <h3 className="section-title text-center text-xl bg-purple-100 -m-6 mb-4 p-4 rounded-t-lg">
              {language === 'ar' ? 'ملخص الفاتورة' : 'Invoice Summary'}
            </h3>
            <div className="space-y-3">
              <div className="total-row border-b border-purple-200 pb-2">
                <span className="font-medium text-lg">{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                <span className="font-medium text-lg">{formatCurrency(invoiceData.subtotal)}</span>
              </div>
              {invoiceData.discount > 0 && (
                <div className="total-row text-green-600 border-b border-purple-200 pb-2">
                  <span className="font-medium text-lg">{language === 'ar' ? 'الخصم:' : 'Discount:'}</span>
                  <span className="font-medium text-lg">-{formatCurrency(invoiceData.discount)}</span>
                </div>
              )}
              <div className="total-row border-b border-purple-200 pb-2">
                <span className="font-medium text-lg">{language === 'ar' ? 'الضريبة (15%):' : 'Tax (15%):'}</span>
                <span className="font-medium text-lg">{formatCurrency(invoiceData.tax)}</span>
              </div>
              <div className="final-total bg-gradient-to-r from-purple-100 to-purple-200 border-2 border-purple-400 rounded-lg">
                <div className="flex justify-between items-center text-xl">
                  <span className="text-2xl font-bold">{language === 'ar' ? 'المجموع النهائي:' : 'Total Amount:'}</span>
                  <span className="text-3xl font-black text-purple-800">{formatCurrency(invoiceData.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Separator Line */}
          <div className="w-full h-px bg-gradient-to-r from-purple-200 via-purple-500 to-purple-200 my-6"></div>

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