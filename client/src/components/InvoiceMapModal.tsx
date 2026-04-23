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
  payment_methods?: string | object;
  paymentMethods?: string | object;
}

interface InvoiceMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  creditNotes: CreditNote[];
  payments: Payment[];
  modalType?: 'income' | 'outgoing' | 'creditnote';
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
    if (isOpen) {
      const initialPositions: {[key: string]: {x: number, y: number}} = {};
      
      if (modalType === 'creditnote') {
        // Invoice-centric layout for credit note modal
        if (invoice) {
          initialPositions[`invoice-${invoice.invoiceNumber}`] = { x: 400, y: 250 }; // Center the invoice
        }
        
        // Position credit notes to the right of invoice
        creditNotes.forEach((creditNote, index) => {
          initialPositions[`creditnote-${creditNote.id}`] = { 
            x: 750, 
            y: 200 + (index * 170) 
          };
        });
        
        // Position payments to the left of invoice (if exist)
        if (payments && payments.length > 0) {
          payments.forEach((payment, index) => {
            initialPositions[`payment-${payment.id}`] = { 
              x: 50, 
              y: 220 + (index * 170)
            };
          });
        }
      } else {
        // Payment-centric layout for income/outgoing payment modals
        if (payments && payments.length > 0) {
          payments.forEach((payment, index) => {
            initialPositions[`payment-${payment.id}`] = { 
              x: 400, // Center horizontally
              y: 250 + (index * 170) // Center vertically with spacing for multiple payments
            };
          });
          
          // Position invoice box to the right of payment (if exists)
          if (invoice) {
            initialPositions[`invoice-${invoice.invoiceNumber}`] = { x: 750, y: 300 };
          }
          
          // Position credit notes to the left of payment (if exist)
          creditNotes.forEach((creditNote, index) => {
            initialPositions[`creditnote-${creditNote.id}`] = { 
              x: 50, 
              y: 200 + (index * 170) 
            };
          });
        }
      }
      
      setBoxPositions(initialPositions);
    }
  }, [isOpen, invoice, creditNotes, payments, modalType]);

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

  // Only return null for non-credit note modals when no payments exist
  if (modalType !== 'creditnote' && (!payments || payments.length === 0)) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-screen h-screen max-w-none p-0 m-0 border-0 rounded-none overflow-hidden" dir={getDirection(language)}>
        <DialogHeader className="sr-only">
          <DialogTitle>
            {modalType === 'income' 
              ? (language === 'ar' ? 'خريطة الدفع الوارد' : 'Income Payment Map')
              : modalType === 'outgoing'
              ? (language === 'ar' ? 'خريطة الدفع الصادر' : 'Outgoing Payment Map')
              : (language === 'ar' ? 'خريطة مذكرات الائتمان' : 'Credit Notes Map')}
          </DialogTitle>
          <DialogDescription>
            {modalType === 'income'
              ? (language === 'ar' ? 'عرض مرئي للدفع الوارد والعناصر المرتبطة به' : 'Visual representation of income payment and related items')
              : modalType === 'outgoing'
              ? (language === 'ar' ? 'عرض مرئي للدفع الصادر والعناصر المرتبطة به' : 'Visual representation of outgoing payment and related items')
              : (language === 'ar' ? 'عرض مرئي لمذكرة الائتمان والعناصر المرتبطة بها' : 'Visual representation of credit note and related items')}
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
                colors="primary:#1E50C8,secondary:#545454"
                style={{ width: '80px', height: '80px' }}
              ></lord-icon>
              <h2 className="text-xl font-bold text-gray-800">
                {modalType === 'income' 
                  ? (language === 'ar' ? 'خريطة الدفع الوارد' : 'Income Payment Map')
                  : modalType === 'outgoing'
                  ? (language === 'ar' ? 'خريطة الدفع الصادر' : 'Outgoing Payment Map')
                  : (language === 'ar' ? 'خريطة مذكرات الائتمان' : 'Credit Notes Map')}
              </h2>
              {invoice && (
                <span className="text-sm text-gray-600">
                  {invoice.invoiceNumber}
                </span>
              )}
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
              {modalType === 'creditnote' ? (
                <>
                  {/* Credit Note Modal: Draw lines from invoice to each credit note */}
                  {invoice && creditNotes.map((creditNote) => {
                    const invoicePos = boxPositions[`invoice-${invoice.invoiceNumber}`];
                    const creditNotePos = boxPositions[`creditnote-${creditNote.id}`];
                    
                    if (invoicePos && creditNotePos) {
                      return (
                        <line
                          key={`line-invoice-creditnote-${creditNote.id}`}
                          x1={invoicePos.x + 300} // Invoice box right edge
                          y1={invoicePos.y + 85}  // Invoice box center + half height
                          x2={creditNotePos.x}    // Credit note box left edge
                          y2={creditNotePos.y + 80} // Credit note box center + half height
                          stroke="#1E50C8"
                          strokeWidth="2"
                          strokeDasharray="none"
                        />
                      );
                    }
                    return null;
                  })}
                  
                  {/* Credit Note Modal: Draw lines from payment to invoice */}
                  {invoice && payments && payments.length > 0 && payments.map((payment) => {
                    const invoicePos = boxPositions[`invoice-${invoice.invoiceNumber}`];
                    const paymentPos = boxPositions[`payment-${payment.id}`];
                    
                    if (invoicePos && paymentPos) {
                      return (
                        <line
                          key={`line-payment-invoice-${payment.id}`}
                          x1={paymentPos.x + 250} // Payment box right edge
                          y1={paymentPos.y + 80}  // Payment box center + half height
                          x2={invoicePos.x}    // Invoice box left edge
                          y2={invoicePos.y + 85} // Invoice box center + half height
                          stroke="#4CAF50"
                          strokeWidth="2"
                          strokeDasharray="none"
                        />
                      );
                    }
                    return null;
                  })}
                </>
              ) : (
                <>
                  {/* Payment Modal: Draw lines from payment to each credit note */}
                  {payments.length > 0 && creditNotes.map((creditNote) => {
                    const paymentPos = boxPositions[`payment-${payments[0].id}`]; // Use first payment as connection point
                    const creditNotePos = boxPositions[`creditnote-${creditNote.id}`];
                    
                    if (paymentPos && creditNotePos) {
                      return (
                        <line
                          key={`line-creditnote-${creditNote.id}`}
                          x1={paymentPos.x} // Payment box left edge
                          y1={paymentPos.y + 80}  // Payment box center + half height
                          x2={creditNotePos.x + 250}    // Credit note box right edge
                          y2={creditNotePos.y + 80} // Credit note box center + half height
                          stroke="#1E50C8"
                          strokeWidth="2"
                          strokeDasharray="none"
                        />
                      );
                    }
                    return null;
                  })}
                  
                  {/* Payment Modal: Draw lines from payment to invoice */}
                  {invoice && payments.length > 0 && (() => {
                    const invoicePos = boxPositions[`invoice-${invoice.invoiceNumber}`];
                    const paymentPos = boxPositions[`payment-${payments[0].id}`]; // Use first payment as connection point
                    
                    if (invoicePos && paymentPos) {
                      const lineColor = modalType === 'income' ? '#4CAF50' : '#F44336';
                      return (
                        <line
                          key={`line-payment-invoice`}
                          x1={paymentPos.x + 250} // Payment box right edge
                          y1={paymentPos.y + 80}  // Payment box center + half height
                          x2={invoicePos.x}    // Invoice box left edge
                          y2={invoicePos.y + 85} // Invoice box center + half height
                          stroke={lineColor}
                          strokeWidth="2"
                          strokeDasharray="none"
                        />
                      );
                    }
                    return null;
                  })()}
                </>
              )}
            </svg>

            {/* Invoice Box */}
            {invoice && boxPositions[`invoice-${invoice.invoiceNumber}`] && (
              <div
                className="absolute bg-white border-2 shadow-lg rounded-lg cursor-move z-20"
                style={{
                  left: boxPositions[`invoice-${invoice.invoiceNumber}`].x,
                  top: boxPositions[`invoice-${invoice.invoiceNumber}`].y,
                  borderColor: '#1E50C8',
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
                    borderColor: '#1E50C8',
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

            {/* Payment Boxes */}
            {payments.map((payment) => {
              const position = boxPositions[`payment-${payment.id}`];
              if (!position) return null;

              const isIncomePayment = modalType === 'income' || modalType === 'creditnote';
              const paymentColors = {
                border: isIncomePayment ? '#4CAF50' : '#F44336',
                headerBg: isIncomePayment ? 'bg-green-50' : 'bg-red-50',
                headerBorder: isIncomePayment ? 'border-green-200' : 'border-red-200',
                iconColor: isIncomePayment ? 'text-green-600' : 'text-red-600',
                textColor: isIncomePayment ? 'text-green-700' : 'text-red-700',
                amountColor: isIncomePayment ? 'text-green-600' : 'text-red-600'
              };

              return (
                <div
                  key={`payment-box-${payment.id}`}
                  className="absolute bg-white border-2 shadow-lg rounded-lg cursor-move z-20"
                  style={{
                    left: position.x,
                    top: position.y,
                    borderColor: paymentColors.border,
                    width: '250px',
                    height: '160px'
                  }}
                  onMouseDown={createDragHandler(`payment-${payment.id}`)}
                >
                  {/* Header Section */}
                  <div className={`${paymentColors.headerBg} px-3 py-2 border-b ${paymentColors.headerBorder} rounded-t-lg flex items-center justify-center gap-2`}>
                    <svg className={`h-4 w-4 ${paymentColors.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                    <span className={`text-sm font-semibold ${paymentColors.textColor}`}>
                      {modalType === 'creditnote'
                        ? (language === 'ar' ? 'دفعة دخل من الفاتورة' : 'Income Payment From Invoice')
                        : isIncomePayment 
                        ? (language === 'ar' ? 'دفعة دخل' : 'Income Payment')
                        : (language === 'ar' ? 'دفعة صادرة' : 'Outgoing Payment')}
                    </span>
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-3 flex-1 flex flex-col justify-center" style={{ direction: language === 'ar' ? 'rtl' : 'ltr', textAlign: language === 'en' ? 'left' : 'right' }}>
                    <div className={`text-base font-bold ${paymentColors.amountColor} mb-1`}>
                      {(modalType === 'creditnote' || isIncomePayment) ? '+' : '-'}{parseFloat((payment.amount ?? payment.totalAmount ?? '0').toString()).toFixed(2)} SAR
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {language === 'ar' ? 'طريقة الدفع: ' : 'Payment Method: '}
                      {(() => {
                        // For Credit Note modal, use paymentType directly
                        if (modalType === 'creditnote') {
                          return payment.paymentType || '-';
                        }
                        
                        // For Income/Outgoing modals, parse payment_methods JSON
                        const paymentMethodsData = payment.paymentMethods || payment.payment_methods;
                        if (paymentMethodsData) {
                          try {
                            const methods = typeof paymentMethodsData === 'string' 
                              ? JSON.parse(paymentMethodsData) 
                              : paymentMethodsData;
                            
                            const activePayments = [];
                            if (methods.cash && methods.cash.checked && methods.cash.amount > 0) {
                              activePayments.push(language === 'ar' ? 'نقدي' : 'Cash');
                            }
                            if (methods.card && methods.card.checked && methods.card.amount > 0) {
                              activePayments.push(language === 'ar' ? 'بطاقة' : 'Card');
                            }
                            if (methods.bank && methods.bank.checked && methods.bank.amount > 0) {
                              activePayments.push(language === 'ar' ? 'تحويل مصرفي' : 'Bank Transfer');
                            }
                            
                            return activePayments.length > 0 ? activePayments.join(', ') : '-';
                          } catch (e) {
                            return '-';
                          }
                        }
                        
                        return payment.paymentType || '-';
                      })()}
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