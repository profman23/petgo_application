import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, FileText, Calendar } from 'lucide-react';
import { useLanguageStore } from '../lib/languageStore';

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
  const { language } = useLanguageStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = printRef.current;
    if (!printContent) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="utf-8">
          <title>Invoice</title>
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            body { 
              font-family: Arial, sans-serif;
              background: white;
              color: #333;
              direction: ${language === 'ar' ? 'rtl' : 'ltr'};
            }
            .invoice-container {
              max-width: 800px;
              margin: 20px auto;
              padding: 40px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              background: white;
            }
            .date-section {
              text-align: center;
              padding: 20px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              background: #f9fafb;
            }
            .date-label {
              font-size: 18px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 10px;
            }
            .date-value {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
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

  const handleDownload = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="utf-8">
          <title>Invoice</title>
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            body { 
              font-family: Arial, sans-serif;
              background: white;
              color: #333;
              direction: ${language === 'ar' ? 'rtl' : 'ltr'};
            }
            .invoice-container {
              max-width: 800px;
              margin: 20px auto;
              padding: 40px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              background: white;
            }
            .date-section {
              text-align: center;
              padding: 20px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              background: #f9fafb;
            }
            .date-label {
              font-size: 18px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 10px;
            }
            .date-value {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoiceData.invoiceNumber || invoiceData.bookingId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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