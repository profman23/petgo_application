import { FileText } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface Invoice {
  id?: number;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  appointmentDate: string;
  finalTotal: string | number;
  bookingId?: number;
}

interface Customer {
  id: number;
  customerName: string;
  customerPhone?: string;
}

interface InvoiceDataTableProps {
  invoices: (Invoice | Customer)[];
  onSelectInvoice: (item: Invoice | Customer) => void;
  isLoading?: boolean;
  mode?: 'invoice' | 'customer';
}

export function InvoiceDataTable({ invoices, onSelectInvoice, isLoading, mode = 'invoice' }: InvoiceDataTableProps) {
  const { language } = useLanguage();

  const getDirection = () => language === 'ar' ? 'rtl' : 'ltr';
  const getTextAlign = () => language === 'ar' ? 'right' : 'left';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">
          {mode === 'invoice' 
            ? (language === 'ar' ? 'جاري تحميل الفواتير...' : 'Loading invoices...')
            : (language === 'ar' ? 'جاري تحميل العملاء...' : 'Loading customers...')}
        </span>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-lg font-medium">
          {mode === 'invoice'
            ? (language === 'ar' ? 'لا توجد فواتير' : 'No invoices available')
            : (language === 'ar' ? 'لا يوجد عملاء' : 'No customers available')}
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-400 rounded-lg overflow-hidden" dir={getDirection()}>
      <div className="max-h-96 overflow-y-auto overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b-2 border-gray-400">
            <tr>
              {mode === 'invoice' ? (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-400" style={{ textAlign: getTextAlign() }}>
                    {language === 'ar' ? 'رقم الفاتورة' : 'Invoice No'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-400" style={{ textAlign: getTextAlign() }}>
                    {language === 'ar' ? 'التاريخ' : 'Date'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-400" style={{ textAlign: getTextAlign() }}>
                    {language === 'ar' ? 'اسم العميل' : 'Customer Name'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l-2 border-gray-400" style={{ textAlign: getTextAlign() }}>
                    {language === 'ar' ? 'الهاتف' : 'Phone'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l-2 border-gray-400">
                    {/* Empty column header */}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l-2 border-gray-400">
                    {/* Empty column header */}
                  </th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-400" style={{ textAlign: getTextAlign() }}>
                    {language === 'ar' ? 'معرف العميل' : 'Customer ID'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-400" style={{ textAlign: getTextAlign() }}>
                    {language === 'ar' ? 'اسم العميل' : 'Customer Name'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-400" style={{ textAlign: getTextAlign() }}>
                    {language === 'ar' ? 'رقم الهاتف' : 'Customer Phone'}
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y-2 divide-gray-400">
            {invoices.map((item) => {
              if (mode === 'invoice') {
                const invoice = item as Invoice;
                return (
                  <tr 
                    key={invoice.invoiceNumber}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onSelectInvoice(invoice)}
                    data-testid={`table-invoice-row-${invoice.invoiceNumber}`}
                  >
                    {/* Invoice Number */}
                    <td className="px-4 py-3 border-r-2 border-gray-400" style={{ textAlign: getTextAlign() }}>
                      <span className="font-semibold text-purple-600 text-sm">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    
                    {/* Date */}
                    <td className="px-4 py-3 border-r-2 border-gray-400" style={{ textAlign: getTextAlign() }}>
                      <span className="text-sm text-gray-800">
                        {formatDate(invoice.appointmentDate)}
                      </span>
                    </td>
                    
                    {/* Customer Name */}
                    <td className="px-4 py-3 border-r-2 border-gray-400" style={{ textAlign: getTextAlign() }}>
                      <span className="text-sm font-medium text-gray-800">
                        {invoice.customerName}
                      </span>
                    </td>
                    
                    {/* Phone */}
                    <td className="px-4 py-3 border-l-2 border-gray-400" style={{ textAlign: getTextAlign() }}>
                      <span className="text-sm text-gray-600">
                        {invoice.customerPhone || '-'}
                      </span>
                    </td>
                    
                    {/* Empty Column 5 */}
                    <td className="px-4 py-3 border-l-2 border-gray-400">
                      {/* Empty content for future use */}
                    </td>
                    
                    {/* Empty Column 6 */}
                    <td className="px-4 py-3 border-l-2 border-gray-400">
                      <span className="text-sm font-bold text-green-600">
                        {formatAmount(invoice.finalTotal)} SAR
                      </span>
                    </td>
                  </tr>
                );
              } else {
                const customer = item as Customer;
                return (
                  <tr 
                    key={customer.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onSelectInvoice(customer)}
                    data-testid={`table-customer-row-${customer.id}`}
                  >
                    {/* Customer ID */}
                    <td className="px-4 py-3 border-r-2 border-gray-400" style={{ textAlign: getTextAlign() }}>
                      <span className="font-semibold text-purple-600 text-sm">
                        {customer.id}
                      </span>
                    </td>
                    
                    {/* Customer Name */}
                    <td className="px-4 py-3 border-r-2 border-gray-400" style={{ textAlign: getTextAlign() }}>
                      <span className="text-sm font-medium text-gray-800">
                        {customer.customerName}
                      </span>
                    </td>
                    
                    {/* Customer Phone */}
                    <td className="px-4 py-3 border-r-2 border-gray-400" style={{ textAlign: getTextAlign() }}>
                      <span className="text-sm text-gray-600">
                        {customer.customerPhone || '-'}
                      </span>
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}