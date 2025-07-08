import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import riyalLogo from "@assets/Screenshot 2025-07-08 171929_1751985624644.png";
import logoImage from "@assets/IMG-20250415-WA0047_1751986059751.jpg";

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

export default function InvoiceGeneratorNew({ invoiceData, onClose }: InvoiceGeneratorProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
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

  // Generate QR Code
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrData = {
          invoice: `VETSVAN-${invoiceData.bookingId}`,
          customer: `${invoiceData.customer.firstName} ${invoiceData.customer.lastName}`,
          total: invoiceData.total,
          date: invoiceData.appointmentDate,
          vetsvan: invoiceData.vetsVanCode
        };
        
        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 120,
          margin: 2,
          color: {
            dark: '#8B2F8B',
            light: '#FFFFFF'
          }
        });
        
        setQrCodeUrl(qrCodeDataURL);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [invoiceData]);

  const printInvoice = () => {
    window.print();
  };

  const downloadInvoice = async () => {
    setIsGenerating(true);
    try {
      const element = invoiceRef.current;
      if (!element) return;

      // Create a new window with the invoice content
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice VETSVAN-${invoiceData.bookingId}</title>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              direction: ${language === 'ar' ? 'rtl' : 'ltr'};
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: white;
            }
            .header {
              background: linear-gradient(135deg, #8B2F8B 0%, #A855F7 50%, #6B46C1 100%);
              color: white;
              padding: 40px;
              text-align: center;
              border-radius: 16px;
              margin-bottom: 30px;
              box-shadow: 0 8px 25px rgba(139, 47, 139, 0.3);
            }
            .logo {
              width: 90px;
              height: 90px;
              background: rgba(255,255,255,0.25);
              border: 3px solid rgba(255,255,255,0.8);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              font-size: 28px;
              font-weight: bold;
              box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            .content { padding: 20px 0; }
            .info-section {
              background: #f8fafc;
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 25px;
              border: 1px solid #e2e8f0;
            }
            .flex { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
            }
            .table th {
              background: linear-gradient(135deg, #8B2F8B, #A855F7);
              color: white;
              padding: 15px;
              text-align: ${language === 'ar' ? 'right' : 'left'};
              font-weight: 600;
            }
            .table td {
              padding: 12px 15px;
              border-bottom: 1px solid #e5e7eb;
              text-align: ${language === 'ar' ? 'right' : 'left'};
            }
            .table tr:nth-child(even) { background-color: #f9fafb; }
            .total-section {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              padding: 25px;
              border-radius: 12px;
              border: 2px solid #e2e8f0;
              margin-top: 30px;
            }
            .qr-section {
              text-align: center;
              padding: 20px;
              background: #f8fafc;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
            }
            .pets-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin: 15px 0;
            }
            .pet-card {
              background: #f1f5f9;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #cbd5e1;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .header { padding: 30px; }
              .invoice-container { padding: 10px; }
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
        </html>
      `);

      printWindow.document.close();
      
      // Download as HTML file
      const blob = new Blob([printWindow.document.documentElement.outerHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-VETSVAN-${invoiceData.bookingId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      printWindow.close();

      toast({
        title: language === 'ar' ? 'تم تحميل الفاتورة بنجاح' : 'Invoice downloaded successfully',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ في تحميل الفاتورة' : 'Error downloading invoice',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Action Buttons */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-purple-50 to-purple-100 no-print sticky top-0 z-10">
          <h3 className="text-xl font-bold text-purple-800">
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
            <Button onClick={onClose} variant="outline" size="sm" className="text-gray-600 hover:bg-gray-50">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div ref={invoiceRef} className="invoice-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {/* Header */}
          <div className="header">
            <div className="logo">VV</div>
            <h1 className="text-3xl font-bold mb-2">
              VETS VAN
            </h1>
            <p className="text-lg opacity-90 mb-1">
              {language === 'ar' ? 'العيادة البيطرية المتنقلة' : 'Mobile Veterinary Clinic'}
            </p>
            <p className="text-sm opacity-80">
              {language === 'ar' ? 'خدمات بيطرية متميزة في منزلك' : 'Premium Veterinary Services at Your Home'}
            </p>
          </div>

          {/* Content */}
          <div className="content">
            {/* Invoice Header Info */}
            <div className="info-section">
              <div className="flex">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-3 text-purple-800">
                    {language === 'ar' ? 'فاتورة رقم' : 'Invoice'} #VETSVAN-{invoiceData.bookingId}
                  </h2>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-semibold">{language === 'ar' ? 'التاريخ:' : 'Date:'}</span> {formatDate(invoiceData.appointmentDate)}</p>
                    <p><span className="font-semibold">{language === 'ar' ? 'الوقت:' : 'Time:'}</span> {invoiceData.appointmentTime}</p>
                    <p><span className="font-semibold">{language === 'ar' ? 'الطبيب:' : 'Doctor:'}</span> {invoiceData.doctorName}</p>
                    <p><span className="font-semibold">{language === 'ar' ? 'رقم المركبة:' : 'Vehicle:'}</span> {invoiceData.vetsVanCode}</p>
                  </div>
                </div>
                
                {/* QR Code */}
                <div className="qr-section">
                  {qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="w-28 h-28 mx-auto"
                    />
                  ) : (
                    <div className="w-28 h-28 border-2 border-gray-300 rounded mx-auto flex items-center justify-center bg-gray-100">
                      <span className="text-xs text-gray-500">QR Code</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mt-2 font-medium">
                    {language === 'ar' ? 'امسح للتحقق' : 'Scan to verify'}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="info-section">
              <h3 className="text-lg font-bold mb-3 text-purple-800">
                {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-semibold">{language === 'ar' ? 'الاسم:' : 'Name:'}</span> {invoiceData.customer.firstName} {invoiceData.customer.lastName}</p>
                  <p><span className="font-semibold">{language === 'ar' ? 'الهاتف:' : 'Phone:'}</span> {invoiceData.customer.phone}</p>
                </div>
                <div>
                  {invoiceData.customer.email && (
                    <p><span className="font-semibold">{language === 'ar' ? 'الإيميل:' : 'Email:'}</span> {invoiceData.customer.email}</p>
                  )}
                  <p><span className="font-semibold">{language === 'ar' ? 'نوع الخدمة:' : 'Service Type:'}</span> {invoiceData.serviceType}</p>
                </div>
              </div>
            </div>

            {/* Pets Information */}
            <div className="info-section">
              <h3 className="text-lg font-bold mb-3 text-purple-800">
                {language === 'ar' ? 'معلومات الحيوانات الأليفة' : 'Pet Information'}
              </h3>
              <div className="pets-grid">
                {invoiceData.pets.map((pet) => (
                  <div key={pet.id} className="pet-card">
                    <h4 className="font-semibold text-purple-700">{pet.name}</h4>
                    <p className="text-sm text-gray-600">{language === 'ar' ? 'النوع:' : 'Type:'} {pet.type}</p>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'العمر:' : 'Age:'} {pet.ageYear} {language === 'ar' ? 'سنوات' : 'years'} {pet.ageMonth} {language === 'ar' ? 'شهور' : 'months'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Items */}
            <div className="info-section">
              <h3 className="text-lg font-bold mb-3 text-purple-800">
                {language === 'ar' ? 'تفاصيل الخدمات' : 'Service Details'}
              </h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>{language === 'ar' ? 'الخدمة' : 'Service'}</th>
                    <th>{language === 'ar' ? 'الكمية' : 'Quantity'}</th>
                    <th>{language === 'ar' ? 'السعر' : 'Unit Price'}</th>
                    <th>{language === 'ar' ? 'المجموع' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item) => (
                    <tr key={item.id}>
                      <td className="font-medium">{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td className="font-semibold">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="total-section">
              <h3 className="text-lg font-bold mb-4 text-purple-800">
                {language === 'ar' ? 'ملخص الفاتورة' : 'Invoice Summary'}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                  <span>{formatCurrency(invoiceData.subtotal)}</span>
                </div>
                {invoiceData.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-medium">{language === 'ar' ? 'الخصم:' : 'Discount:'}</span>
                    <span>-{formatCurrency(invoiceData.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">{language === 'ar' ? 'الضريبة (15%):' : 'Tax (15%):'}</span>
                  <span>{formatCurrency(invoiceData.tax)}</span>
                </div>
                <div className="border-t-2 border-purple-300 pt-3">
                  <div className="flex justify-between text-xl font-bold text-purple-800">
                    <span>{language === 'ar' ? 'المجموع النهائي:' : 'Final Total:'}</span>
                    <span>{formatCurrency(invoiceData.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoiceData.notes && (
              <div className="info-section">
                <h3 className="text-lg font-bold mb-3 text-purple-800">
                  {language === 'ar' ? 'ملاحظات' : 'Notes'}
                </h3>
                <p className="text-gray-700 leading-relaxed">{invoiceData.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                {language === 'ar' ? 'شكراً لاختيارك VETS VAN' : 'Thank you for choosing VETS VAN'}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {language === 'ar' ? 'خدمة بيطرية متميزة' : 'Premium Veterinary Service'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}