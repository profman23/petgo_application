import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, FileText, Calendar } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

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

interface PaymentMethod {
  id: string;
  method: string;
  amount: string;
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

interface InvoiceGeneratorNewProps {
  invoiceData: InvoiceData;
  onClose: () => void;
}

const InvoiceGeneratorNew: React.FC<InvoiceGeneratorNewProps> = ({ invoiceData, onClose }) => {
  const { language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
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

    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
    setIsGenerating(false);
  };

  const handleDownload = async () => {
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

    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
    setIsGenerating(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              {language === 'ar' ? 'فاتورة' : 'Invoice'}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Content */}
        <div ref={printRef} className="invoice-container">
          <div className="date-section">
            <div className="date-label">
              <Calendar className="inline h-5 w-5 mr-2" />
              {language === 'ar' ? 'تاريخ الفاتورة' : 'Invoice Date'}
            </div>
            <div className="date-value">
              {invoiceData.appointmentDate}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <Button
            onClick={handlePrint}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {language === 'ar' ? 'طباعة' : 'Print'}
          </Button>
          
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {language === 'ar' ? 'تحميل' : 'Download'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceGeneratorNew;