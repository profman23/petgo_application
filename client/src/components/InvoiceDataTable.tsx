import { FileText, Calendar, User, DollarSign } from 'lucide-react';
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

interface InvoiceDataTableProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  isLoading?: boolean;
}

export function InvoiceDataTable({ invoices, onSelectInvoice, isLoading }: InvoiceDataTableProps) {
  const { language } = useLanguage();

  const getDirection = () => language === 'ar' ? 'rtl' : 'ltr';
  const getTextAlign = () => language === 'ar' ? 'right' : 'left';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(
      language === 'ar' ? 'ar-SA' : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
    );
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
          {language === 'ar' ? 'جاري تحميل الفواتير...' : 'Loading invoices...'}
        </span>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-lg font-medium">
          {language === 'ar' ? 'لا توجد فواتير' : 'No invoices available'}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden" dir={getDirection()}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ textAlign: getTextAlign() }}>
                {language === 'ar' ? 'رقم الفاتورة' : 'Invoice No'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ textAlign: getTextAlign() }}>
                {language === 'ar' ? 'التاريخ' : 'Date'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ textAlign: getTextAlign() }}>
                {language === 'ar' ? 'اسم العميل' : 'Customer Name'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ textAlign: getTextAlign() }}>
                {language === 'ar' ? 'كود العميل' : 'Customer Code'}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {/* Empty column header */}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {/* Empty column header */}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr 
                key={invoice.invoiceNumber}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSelectInvoice(invoice)}
                data-testid={`table-invoice-row-${invoice.invoiceNumber}`}
              >
                {/* Invoice Number */}
                <td className="px-4 py-3" style={{ textAlign: getTextAlign() }}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-purple-600 text-sm">
                      {invoice.invoiceNumber}
                    </span>
                  </div>
                </td>
                
                {/* Date */}
                <td className="px-4 py-3" style={{ textAlign: getTextAlign() }}>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-800">
                      {formatDate(invoice.appointmentDate)}
                    </span>
                  </div>
                </td>
                
                {/* Customer Name */}
                <td className="px-4 py-3" style={{ textAlign: getTextAlign() }}>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-800">
                      {invoice.customerName}
                    </span>
                  </div>
                </td>
                
                {/* Customer Code */}
                <td className="px-4 py-3" style={{ textAlign: getTextAlign() }}>
                  <span className="text-sm text-gray-600">
                    {invoice.customerPhone || '-'}
                  </span>
                </td>
                
                {/* Empty Column 5 */}
                <td className="px-4 py-3">
                  {/* Empty content for future use */}
                </td>
                
                {/* Empty Column 6 */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-green-600">
                      {formatAmount(invoice.finalTotal)} SAR
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}