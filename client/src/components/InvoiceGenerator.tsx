import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer } from 'lucide-react';
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
      link.download = `Invoice_${invoiceData.bookingId}.pdf`;
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
      link.download = `Invoice_${invoiceData.bookingId}.pdf`;
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