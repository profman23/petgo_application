import { useQuery } from "@tanstack/react-query";
import { Loader2, BarChart3 } from "lucide-react";
import { type GeneratedInvoice } from "@shared/schema";

interface SalesReportProps {
  language: string;
}

export const SalesReport = ({ language }: SalesReportProps) => {
  const { data: generatedInvoices, isLoading } = useQuery<GeneratedInvoice[]>({
    queryKey: ['/api/admin/generated-invoices'],
    staleTime: 30000,
  });

  const { data: totalPaidData, isLoading: isLoadingTotalPaid } = useQuery<{ totalPaid: number }>({
    queryKey: ['/api/admin/total-paid'],
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

      {/* Total Paid Summary */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-purple-900">
            {language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid'}:
          </span>
          <span className="text-xl font-bold text-purple-600">
            {isLoadingTotalPaid ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              `${totalPaidData?.totalPaid || 0} SAR`
            )}
          </span>
        </div>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};