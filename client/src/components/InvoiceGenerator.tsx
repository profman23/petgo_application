import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

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

export default function InvoiceGenerator({ invoiceData, onClose }: InvoiceGeneratorProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  // Saudi Riyal Currency Icon Component
  const RiyalIcon = () => (
    <img 
      src="/attached_assets/Screenshot 2025-07-08 171944_1751984409622.png"
      alt="SAR"
      width="20" 
      height="20" 
      className="inline-block ml-1 object-contain"
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
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice VETSVAN-${invoiceData.bookingId}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: white;
              direction: ${language === 'ar' ? 'rtl' : 'ltr'};
            }
            .invoice-container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: white; 
              border: 1px solid #ddd;
              border-radius: 8px;
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #8B2F8B, #9333EA); 
              color: white; 
              padding: 20px; 
              text-align: center;
            }
            .logo { 
              width: 80px; 
              height: 80px; 
              margin: 0 auto 10px; 
              background: white; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              font-weight: bold;
              color: #8B2F8B;
            }
            .content { padding: 20px; }
            .section { margin-bottom: 20px; }
            .flex { display: flex; justify-content: space-between; align-items: center; }
            .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .table th, .table td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: ${language === 'ar' ? 'right' : 'left'}; 
            }
            .table th { background: #f5f5f5; }
            .total-section { 
              background: #f9f9f9; 
              padding: 15px; 
              border-radius: 8px; 
              margin-top: 20px;
            }
            .qr-code { 
              width: 100px; 
              height: 100px; 
              border: 1px solid #ddd; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              background: #f0f0f0;
              margin: 0 auto;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
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
    }, 250);
  };

  const downloadInvoice = async () => {
    setIsGenerating(true);
    try {
      // Generate HTML content for PDF
      const htmlContent = invoiceRef.current?.innerHTML;
      if (!htmlContent) return;

      // Create a blob with the invoice HTML
      const blob = new Blob([`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice VETSVAN-${invoiceData.bookingId}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              direction: ${language === 'ar' ? 'rtl' : 'ltr'};
            }
            .invoice-container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: white; 
              border: 1px solid #ddd;
              border-radius: 8px;
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #8B2F8B, #9333EA); 
              color: white; 
              padding: 20px; 
              text-align: center;
            }
            .logo { 
              width: 80px; 
              height: 80px; 
              margin: 0 auto 10px; 
              background: white; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              font-weight: bold;
              color: #8B2F8B;
            }
            .content { padding: 20px; }
            .section { margin-bottom: 20px; }
            .flex { display: flex; justify-content: space-between; align-items: center; }
            .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .table th, .table td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: ${language === 'ar' ? 'right' : 'left'}; 
            }
            .table th { background: #f5f5f5; }
            .total-section { 
              background: #f9f9f9; 
              padding: 15px; 
              border-radius: 8px; 
              margin-top: 20px;
            }
            .qr-code { 
              width: 100px; 
              height: 100px; 
              border: 1px solid #ddd; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              background: #f0f0f0;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `], { type: 'text/html' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-VETSVAN-${invoiceData.bookingId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

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
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Action Buttons */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 no-print">
          <h3 className="text-lg font-semibold">
            {language === 'ar' ? 'فاتورة VETS VAN' : 'VETS VAN Invoice'}
          </h3>
          <div className="flex gap-2">
            <Button onClick={printInvoice} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'طباعة' : 'Print'}
            </Button>
            <Button onClick={downloadInvoice} disabled={isGenerating} size="sm">
              <Download className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'تحميل' : 'Download'}
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div ref={invoiceRef} className="invoice-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {/* Header */}
          <div className="header">
            <div className="logo">
              VETS
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {language === 'ar' ? 'VETS VAN - العيادة البيطرية المتنقلة' : 'VETS VAN - Mobile Veterinary Clinic'}
            </h1>
            <p className="text-sm opacity-90">
              {language === 'ar' ? 'خدمات بيطرية متميزة في منزلك' : 'Premium Veterinary Services at Your Home'}
            </p>
          </div>

          {/* Content */}
          <div className="content">
            {/* Invoice Info */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold mb-2">
                  {language === 'ar' ? 'فاتورة رقم' : 'Invoice'} #VETSVAN-{invoiceData.bookingId}
                </h2>
                <p className="text-gray-600">
                  {language === 'ar' ? 'التاريخ:' : 'Date:'} {formatDate(invoiceData.appointmentDate)}
                </p>
                <p className="text-gray-600">
                  {language === 'ar' ? 'الوقت:' : 'Time:'} {invoiceData.appointmentTime}
                </p>
                <p className="text-gray-600">
                  {language === 'ar' ? 'رقم المركبة:' : 'Vehicle:'} {invoiceData.vetsVanCode}
                </p>
              </div>
              
              {/* QR Code */}
              <div className="text-center">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-24 h-24 mx-auto border border-gray-300 rounded"
                  />
                ) : (
                  <div className="w-24 h-24 border border-gray-300 rounded mx-auto flex items-center justify-center bg-gray-100">
                    <div className="text-xs text-gray-500">QR Code</div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'ar' ? 'امسح للتحقق' : 'Scan to verify'}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="section">
              <h3 className="text-lg font-semibold mb-3 border-b pb-2">
                {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>{language === 'ar' ? 'الاسم:' : 'Name:'}</strong> {invoiceData.customer.firstName} {invoiceData.customer.lastName}</p>
                  <p><strong>{language === 'ar' ? 'الهاتف:' : 'Phone:'}</strong> {invoiceData.customer.phone}</p>
                </div>
                <div>
                  <p><strong>{language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</strong> {invoiceData.customer.email}</p>
                  <p><strong>{language === 'ar' ? 'نوع الخدمة:' : 'Service Type:'}</strong> {invoiceData.serviceType}</p>
                </div>
              </div>
            </div>

            {/* Pets Info */}
            <div className="section">
              <h3 className="text-lg font-semibold mb-3 border-b pb-2">
                {language === 'ar' ? 'الحيوانات الأليفة' : 'Pets'}
              </h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>{language === 'ar' ? 'اسم الحيوان' : 'Pet Name'}</th>
                    <th>{language === 'ar' ? 'النوع' : 'Type'}</th>
                    <th>{language === 'ar' ? 'العمر' : 'Age'}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.pets.map((pet) => (
                    <tr key={pet.id}>
                      <td>{pet.name}</td>
                      <td>{pet.type}</td>
                      <td>
                        {pet.ageYear ? `${pet.ageYear} ${language === 'ar' ? 'سنة' : 'years'}` : ''}
                        {pet.ageMonth ? ` ${pet.ageMonth} ${language === 'ar' ? 'شهر' : 'months'}` : ''}
                        {pet.ageDay ? ` ${pet.ageDay} ${language === 'ar' ? 'يوم' : 'days'}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Items */}
            <div className="section">
              <h3 className="text-lg font-semibold mb-3 border-b pb-2">
                {language === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}
              </h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>{language === 'ar' ? 'الوصف' : 'Description'}</th>
                    <th>{language === 'ar' ? 'الكمية' : 'Quantity'}</th>
                    <th>{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
                    <th>{language === 'ar' ? 'المجموع' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="total-section">
              <div className="flex justify-between py-2">
                <span>{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                <span>{formatCurrency(invoiceData.subtotal)}</span>
              </div>
              {invoiceData.discount > 0 && (
                <div className="flex justify-between py-2">
                  <span>{language === 'ar' ? 'الخصم (10%):' : 'Discount (10%):'}</span>
                  <span>-{formatCurrency(invoiceData.discount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span>{language === 'ar' ? 'الضريبة (15%):' : 'Tax (15%):'}</span>
                <span>{formatCurrency(invoiceData.tax)}</span>
              </div>
              <div className="flex justify-between py-2 text-xl font-bold border-t pt-2">
                <span>{language === 'ar' ? 'المجموع الكلي:' : 'Total:'}</span>
                <span>{formatCurrency(invoiceData.total)}</span>
              </div>
            </div>

            {/* Notes */}
            {invoiceData.notes && (
              <div className="section">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">
                  {language === 'ar' ? 'ملاحظات' : 'Notes'}
                </h3>
                <p className="text-gray-700">{invoiceData.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="section border-t pt-4 mt-6">
              <div className="text-center text-sm text-gray-500">
                <p className="mb-2">
                  {language === 'ar' ? 'شكراً لاختيارك VETS VAN - العيادة البيطرية المتنقلة' : 'Thank you for choosing VETS VAN - Mobile Veterinary Clinic'}
                </p>
                <p>
                  {language === 'ar' ? 'الطبيب البيطري:' : 'Veterinarian:'} {invoiceData.doctorName}
                </p>
                <p className="mt-2 text-xs">
                  {language === 'ar' ? 'هذه فاتورة إلكترونية ولا تحتاج إلى توقيع' : 'This is an electronic invoice and does not require a signature'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}