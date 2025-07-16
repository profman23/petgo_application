import { useQuery } from "@tanstack/react-query";
import { Loader2, BarChart3, CreditCard } from "lucide-react";
import { type GeneratedInvoice, type Payment } from "@shared/schema";

interface SalesReportProps {
  language: string;
}

// Extended interface for invoice with payment info
interface InvoiceWithPayment extends GeneratedInvoice {
  paymentInfo?: {
    amountPaid: string;
    paymentMethod: string;
    paymentStatus: string;
    paidAt: string;
  } | null;
}

export const SalesReport = ({ language }: SalesReportProps) => {
  const { data: generatedInvoices, isLoading } = useQuery<InvoiceWithPayment[]>({
    queryKey: ['/api/admin/sales-report'],
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!generatedInvoices || generatedInvoices.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {language === 'ar' ? 'لا توجد فواتير' : 'No Invoices'}
        </h3>
        <p className="text-gray-500">
          {language === 'ar' ? 'لم يتم إنشاء أي فواتير بعد' : 'No invoices have been generated yet'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          {language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}
        </h4>
        <p className="text-sm text-gray-600">
          {language === 'ar' ? 'جميع الفواتير المولدة' : 'All Generated Invoices'}
        </p>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {language === 'ar' ? 'رقم الفاتورة' : 'Invoice Number'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {language === 'ar' ? 'العميل' : 'Customer'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {language === 'ar' ? 'المبلغ المدفوع' : 'Amount Paid'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {generatedInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="font-medium">{invoice.customerName}</div>
                      <div className="text-gray-400">{invoice.customerPhone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.paymentInfo ? (
                      <span className="font-medium text-green-600">
                        {Number(invoice.paymentInfo.amountPaid)} SAR
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        {language === 'ar' ? 'غير مدفوع' : 'Not Paid'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.paymentInfo ? (
                      <span>
                        {language === 'ar' ? 
                          (invoice.paymentInfo.paymentMethod === 'cash' ? 'نقدي' :
                           invoice.paymentInfo.paymentMethod === 'card' ? 'بطاقة' :
                           invoice.paymentInfo.paymentMethod === 'transfer' ? 'تحويل' : 
                           invoice.paymentInfo.paymentMethod) :
                          invoice.paymentInfo.paymentMethod}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};