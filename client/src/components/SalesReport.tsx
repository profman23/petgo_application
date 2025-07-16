import { useQuery } from "@tanstack/react-query";
import { Loader2, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { type GeneratedInvoice } from "@shared/schema";
import { useState } from "react";

interface SalesReportProps {
  language: string;
}

export const SalesReport = ({ language }: SalesReportProps) => {
  const [expandedInvoices, setExpandedInvoices] = useState<number[]>([]);

  const { data: generatedInvoices, isLoading } = useQuery<GeneratedInvoice[]>({
    queryKey: ['/api/admin/generated-invoices'],
    staleTime: 30000,
  });

  const toggleInvoiceDetails = (invoiceId: number) => {
    setExpandedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

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
                  {language === 'ar' ? 'الطبيب' : 'Doctor'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {language === 'ar' ? 'VetsVan' : 'VetsVan'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {language === 'ar' ? 'الإجمالي' : 'Total'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {language === 'ar' ? 'التاريخ' : 'Date'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {language === 'ar' ? 'التفاصيل' : 'Details'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {generatedInvoices.map((invoice) => (
                <>
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
                      {invoice.doctorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.vetsVanCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-medium">{Number(invoice.finalTotal)} SAR</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.generatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => toggleInvoiceDetails(invoice.id)}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        {language === 'ar' ? 'عرض التفاصيل' : 'Show Details'}
                        {expandedInvoices.includes(invoice.id) ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedInvoices.includes(invoice.id) && (
                    <InvoiceDetailsRow 
                      invoice={invoice} 
                      language={language}
                    />
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Component to display invoice details row
interface InvoiceDetailsRowProps {
  invoice: GeneratedInvoice;
  language: string;
}

const InvoiceDetailsRow = ({ invoice, language }: InvoiceDetailsRowProps) => {
  const { data: invoiceDetails, isLoading } = useQuery({
    queryKey: [`/api/admin/invoice-details/${invoice.bookingId}`],
    enabled: true,
  });

  if (isLoading) {
    return (
      <tr>
        <td colSpan={7} className="px-6 py-4">
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </td>
      </tr>
    );
  }

  if (!invoiceDetails || !invoiceDetails.invoiceItems) {
    return (
      <tr>
        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
          {language === 'ar' ? 'لا توجد تفاصيل متاحة' : 'No details available'}
        </td>
      </tr>
    );
  }

  const { invoiceItems, payments } = invoiceDetails;
  
  // Calculate totals (same logic as doctor interface)
  const subtotal = invoiceItems.reduce((sum: number, item: any) => sum + (parseFloat(item.totalBeforeVat) || parseFloat(item.total) || 0), 0);
  const totalDiscountAmount = invoiceItems.reduce((sum: number, item: any) => sum + (parseFloat(item.discount) || 0), 0);
  const taxAmount = invoiceItems.reduce((sum: number, item: any) => sum + (parseFloat(item.vatAmount) || (parseFloat(item.total) * 0.15) || 0), 0);
  const finalTotal = subtotal - totalDiscountAmount + taxAmount;
  const totalPaid = payments?.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0) || 0;
  const remainingBalance = finalTotal - totalPaid;

  return (
    <tr>
      <td colSpan={7} className="px-6 py-4 bg-gray-50">
        <div className="space-y-6">
          {/* Invoice Items */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">
              {language === 'ar' ? 'عناصر الفاتورة' : 'Invoice Items'}
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase border-b">
                      {language === 'ar' ? 'الوصف' : 'Description'}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase border-b">
                      {language === 'ar' ? 'الكمية' : 'Quantity'}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase border-b">
                      {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase border-b">
                      {language === 'ar' ? 'خصم' : 'Discount'}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase border-b">
                      {language === 'ar' ? 'الإجمالي' : 'Total'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{parseFloat(item.unitPrice).toFixed(2)} SAR</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.discountType === 'percentage' 
                          ? `${item.discount}%` 
                          : `${parseFloat(item.discount || 0).toFixed(2)} SAR`
                        }
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{parseFloat(item.total).toFixed(2)} SAR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Summary - Same as Doctor Interface but different colors */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-80">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">
                    {language === 'ar' ? 'الإجمالي قبل الضريبة:' : 'Total Before VAT:'}
                  </span>
                  <span className="text-gray-900">{subtotal.toFixed(2)} SAR</span>
                </div>
                {totalDiscountAmount > 0 && (
                  <div className="flex justify-between mb-2 text-red-600">
                    <span>{language === 'ar' ? 'الخصم:' : 'Discount:'}</span>
                    <span>-{totalDiscountAmount.toFixed(2)} SAR</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">
                    {language === 'ar' ? 'ضريبة القيمة المضافة 15%:' : 'VAT 15%:'}
                  </span>
                  <span className="text-gray-900">{taxAmount.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mb-4 text-blue-900">
                  <span>{language === 'ar' ? 'الإجمالي النهائي:' : 'Final Total:'}</span>
                  <span>{finalTotal.toFixed(2)} SAR</span>
                </div>

                {/* Payment Summary */}
                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between text-blue-600 font-semibold mb-2">
                    <span>{language === 'ar' ? 'المبلغ المدفوع:' : 'Total Paid:'}</span>
                    <span>{totalPaid.toFixed(2)} SAR</span>
                  </div>
                  <div className="flex justify-between text-orange-600 font-semibold mb-4">
                    <span>{language === 'ar' ? 'الرصيد المتبقي:' : 'Remaining Balance:'}</span>
                    <span>{remainingBalance.toFixed(2)} SAR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};