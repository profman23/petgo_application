import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation, getDirection } from "@/lib/i18n";
import { FileText as InvoiceIcon, CreditCard } from "lucide-react";

// Declare lord-icon custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any;
    }
  }
}

interface Invoice {
  invoiceNumber: string;
  customerName: string;
  finalTotal?: string | number;
  appointmentDate?: string;
}

interface CreditNote {
  id: number | string;
  creditNoteNumber: string;
  customerName: string;
  finalTotal: string | number;
  postingDate: string;
  appointmentDate?: string;
}

interface Payment {
  id: number | string;
  amount?: string | number;
  totalAmount?: string | number;
  paymentType?: string;
  docnum?: string;
  description?: string;
  createdAt?: string;
  postingDate?: string;
}

interface InvoiceMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  creditNotes: CreditNote[];
  payments: Payment[];
  modalType?: 'income' | 'outgoing';
}

export function InvoiceMapModal({ 
  isOpen, 
  onClose, 
  invoice, 
  creditNotes, 
  payments,
  modalType = 'income'
}: InvoiceMapModalProps) {
  const { t, language } = useTranslation();
  const [boxPositions, setBoxPositions] = useState<{[key: string]: {x: number, y: number}}>({});

  // Initialize positions when modal opens or data changes
  useEffect(() => {
    if (isOpen && invoice) {
      const initialPositions: {[key: string]: {x: number, y: number}} = {};
      
      // Center invoice box
      initialPositions[`invoice-${invoice.invoiceNumber}`] = { x: 200, y: 300 };
      
      // Position credit notes to the right of invoice
      creditNotes.forEach((creditNote, index) => {
        initialPositions[`creditnote-${creditNote.id}`] = { 
          x: 600, 
          y: 200 + (index * 150) 
        };
      });
      
      // Position payment boxes to the left of invoice (visible within canvas)
      payments.forEach((payment, index) => {
        initialPositions[`payment-${payment.id}`] = { 
          x: Math.max(20, 200 - 350), // 20px margin from left edge, or left of invoice with spacing
          y: 200 + (index * 150) 
        };
      });
      
      setBoxPositions(initialPositions);
    }
  }, [isOpen, invoice, creditNotes, payments]);

  // Handle modal close
  const handleClose = () => {
    setBoxPositions({});
    onClose();
  };

  // Drag handler generator for reuse
  const createDragHandler = (boxKey: string) => (e: React.MouseEvent) => {
    const startX = e.clientX - boxPositions[boxKey].x;
    const startY = e.clientY - boxPositions[boxKey].y;
    
    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      
      setBoxPositions(prev => ({
        ...prev,
        [boxKey]: { x: newX, y: newY }
      }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-screen h-screen max-w-none p-0 m-0 border-0 rounded-none overflow-hidden" dir={getDirection(language)}>
        <DialogHeader className="sr-only">
          <DialogTitle>
            {modalType === 'income' 
              ? (language === 'ar' ? 'خريطة الدفع الوارد' : 'Income Payment Map')
              : (language === 'ar' ? 'خريطة الدفع الصادر' : 'Outgoing Payment Map')}
          </DialogTitle>
          <DialogDescription>
            {modalType === 'income'
              ? (language === 'ar' ? 'عرض مرئي للدفع الوارد والعناصر المرتبطة به' : 'Visual representation of income payment and related items')
              : (language === 'ar' ? 'عرض مرئي للدفع الصادر والعناصر المرتبطة به' : 'Visual representation of outgoing payment and related items')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative w-full h-full bg-gray-50" style={{ fontFamily: 'Arimo' }}>
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-white border-b px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <lord-icon
                src="https://cdn.lordicon.com/wsvtrygf.json"
                trigger="loop"
                delay="1500"
                colors="primary:#852085,secondary:#545454"
                style={{ width: '80px', height: '80px' }}
              ></lord-icon>
              <h2 className="text-xl font-bold text-gray-800">
                {modalType === 'income' 
                  ? (language === 'ar' ? 'خريطة الدفع الوارد' : 'Income Payment Map')
                  : (language === 'ar' ? 'خريطة الدفع الصادر' : 'Outgoing Payment Map')}
              </h2>
              <span className="text-sm text-gray-600">
                {invoice.invoiceNumber}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={handleClose}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </div>

          {/* Map Canvas */}
          <div className="absolute inset-0 pt-20 overflow-hidden">
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              style={{ zIndex: 10 }}
            >
              {/* Draw lines from invoice to each credit note */}
              {creditNotes.map((creditNote) => {
                const invoicePos = boxPositions[`invoice-${invoice.invoiceNumber}`];
                const creditNotePos = boxPositions[`creditnote-${creditNote.id}`];
                
                if (invoicePos && creditNotePos) {
                  return (
                    <line
                      key={`line-${creditNote.id}`}
                      x1={invoicePos.x + 150} // Invoice box center + half width
                      y1={invoicePos.y + 85}  // Invoice box center + half height
                      x2={creditNotePos.x}    // Credit note box left edge
                      y2={creditNotePos.y + 80} // Credit note box center + half height
                      stroke="#8B2F8B"
                      strokeWidth="2"
                      strokeDasharray="none"
                    />
                  );
                }
                return null;
              })}
              
              {/* Draw lines from invoice to each payment */}
              {payments.map((payment) => {
                const invoicePos = boxPositions[`invoice-${invoice.invoiceNumber}`];
                const paymentPos = boxPositions[`payment-${payment.id}`];
                
                if (invoicePos && paymentPos) {
                  return (
                    <line
                      key={`line-payment-${payment.id}`}
                      x1={invoicePos.x} // Invoice box left edge
                      y1={invoicePos.y + 85}  // Invoice box center + half height
                      x2={paymentPos.x + 250}    // Payment box right edge
                      y2={paymentPos.y + 80} // Payment box center + half height
                      stroke="#4CAF50"
                      strokeWidth="2"
                      strokeDasharray="none"
                    />
                  );
                }
                return null;
              })}
            </svg>

            {/* Invoice Box */}
            {boxPositions[`invoice-${invoice.invoiceNumber}`] && (
              <div
                className="absolute bg-white border-2 shadow-lg rounded-lg cursor-move z-20"
                style={{
                  left: boxPositions[`invoice-${invoice.invoiceNumber}`].x,
                  top: boxPositions[`invoice-${invoice.invoiceNumber}`].y,
                  borderColor: '#8B2F8B',
                  width: '300px',
                  height: '170px'
                }}
                onMouseDown={createDragHandler(`invoice-${invoice.invoiceNumber}`)}
              >
                {/* Header Section */}
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 rounded-t-lg flex items-center justify-center gap-2">
                  <InvoiceIcon className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    {language === 'ar' ? 'فاتورة' : 'Invoice'}
                  </span>
                </div>
                
                {/* Content Section */}
                <div className="p-3 flex-1 flex flex-col justify-center" style={{ direction: language === 'ar' ? 'rtl' : 'ltr', textAlign: language === 'en' ? 'left' : 'right' }}>
                  <div className="text-lg font-bold text-gray-800 mb-2">
                    {invoice.invoiceNumber}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {invoice.customerName}
                  </div>
                  {invoice.finalTotal && (
                    <div className="text-sm font-semibold text-green-600 mb-2">
                      {parseFloat(invoice.finalTotal.toString()).toFixed(2)} SAR
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {/* Show appointment date if available */}
                    {invoice.appointmentDate && (
                      <>
                        {language === 'ar' ? 'التاريخ: ' : 'Date: '}
                        {new Date(invoice.appointmentDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Credit Note Boxes */}
            {creditNotes.map((creditNote) => {
              const position = boxPositions[`creditnote-${creditNote.id}`];
              if (!position) return null;

              return (
                <div
                  key={`box-${creditNote.id}`}
                  className="absolute bg-white border-2 shadow-lg rounded-lg cursor-move z-20"
                  style={{
                    left: position.x,
                    top: position.y,
                    borderColor: '#8B2F8B',
                    width: '250px',
                    height: '160px'
                  }}
                  onMouseDown={createDragHandler(`creditnote-${creditNote.id}`)}
                >
                  {/* Header Section */}
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 rounded-t-lg flex items-center justify-center gap-2">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-700">
                      {language === 'ar' ? 'مذكرة ائتمان' : 'Credit Note'}
                    </span>
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-3 flex-1 flex flex-col justify-center" style={{ direction: language === 'ar' ? 'rtl' : 'ltr', textAlign: language === 'en' ? 'left' : 'right' }}>
                    <div className="text-base font-bold text-gray-800 mb-1">
                      CRN{creditNote.creditNoteNumber}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {creditNote.customerName}
                    </div>
                    <div className="text-sm font-semibold text-red-600 mb-2">
                      -{parseFloat(creditNote.finalTotal.toString()).toFixed(2)} SAR
                    </div>
                    <div className="text-xs text-gray-500">
                      {language === 'ar' ? 'التاريخ: ' : 'Date: '}
                      {new Date(creditNote.postingDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Income Payment Boxes */}
            {payments.map((payment) => {
              const position = boxPositions[`payment-${payment.id}`];
              if (!position) return null;

              return (
                <div
                  key={`payment-box-${payment.id}`}
                  className="absolute bg-white border-2 shadow-lg rounded-lg cursor-move z-20"
                  style={{
                    left: position.x,
                    top: position.y,
                    borderColor: '#4CAF50',
                    width: '250px',
                    height: '160px'
                  }}
                  onMouseDown={createDragHandler(`payment-${payment.id}`)}
                >
                  {/* Header Section */}
                  <div className="bg-green-50 px-3 py-2 border-b border-green-200 rounded-t-lg flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                    <span className="text-sm font-semibold text-green-700">
                      {language === 'ar' ? 'دفعة دخل' : 'Income Payment'}
                    </span>
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-3 flex-1 flex flex-col justify-center" style={{ direction: language === 'ar' ? 'rtl' : 'ltr', textAlign: language === 'en' ? 'left' : 'right' }}>
                    <div className="text-base font-bold text-green-600 mb-1">
                      +{parseFloat((payment.amount || payment.totalAmount || '0').toString()).toFixed(2)} SAR
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {language === 'ar' ? 'رقم المستند: ' : 'DocNum: '}
                      {payment.docnum || payment.paymentType || '-'}
                    </div>
                    {payment.description && (
                      <div className="text-xs text-gray-500 mb-2">
                        {payment.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {language === 'ar' ? 'التاريخ: ' : 'Date: '}
                      {new Date(payment.createdAt || payment.postingDate || new Date()).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Load lord-icon script */}
        <script src="https://cdn.lordicon.com/lordicon.js"></script>
      </DialogContent>
    </Dialog>
  );
}