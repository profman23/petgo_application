import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BarChart3, Calendar, X } from "lucide-react";
import { type GeneratedInvoice } from "@shared/schema";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface SalesReportProps {
  language: string;
}

export const SalesReport = ({ language }: SalesReportProps) => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const { data: allInvoices, isLoading } = useQuery<GeneratedInvoice[]>({
    queryKey: ['/api/admin/generated-invoices'],
    staleTime: 30000,
  });

  // Filter invoices by date range
  const generatedInvoices = allInvoices?.filter(invoice => {
    if (!dateFrom && !dateTo) return true;
    
    const invoiceDate = new Date(invoice.createdAt);
    const fromMatch = !dateFrom || invoiceDate >= dateFrom;
    const toMatch = !dateTo || invoiceDate <= dateTo;
    
    return fromMatch && toMatch;
  });

  // Calculate total paid from filtered invoices
  const totalPaid = generatedInvoices ? generatedInvoices.reduce((sum, invoice) => {
    return sum + Number(invoice.finalTotal || 0);
  }, 0) : 0;

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
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

      {/* Date Filter Section */}
      <div className="mb-4 bg-gray-50 rounded-lg p-4 border">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {language === 'ar' ? 'فلترة حسب التاريخ:' : 'Filter by Date:'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[140px] justify-start text-left font-normal"
                >
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy") : (
                    <span className="text-gray-500">
                      {language === 'ar' ? 'من تاريخ' : 'From'}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-gray-400">-</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[140px] justify-start text-left font-normal"
                >
                  {dateTo ? format(dateTo, "dd/MM/yyyy") : (
                    <span className="text-gray-500">
                      {language === 'ar' ? 'إلى تاريخ' : 'To'}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 lg:px-3"
              >
                <X className="h-4 w-4" />
                <span className="ml-1 text-xs">
                  {language === 'ar' ? 'مسح' : 'Clear'}
                </span>
              </Button>
            )}
          </div>

          {(dateFrom || dateTo) && (
            <div className="text-xs text-gray-500">
              {language === 'ar' 
                ? `عرض ${generatedInvoices?.length || 0} فاتورة` 
                : `Showing ${generatedInvoices?.length || 0} invoices`
              }
            </div>
          )}
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
        
        {/* Total Paid Summary */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-lg font-medium text-gray-900">
                {language === 'ar' ? 'إجمالي المدفوع:' : 'Total Paid:'}
              </span>
              <span className="text-sm text-gray-600 mt-1">
                {language === 'ar' ? 'طرق الدفع' : 'Pay Methods'}
              </span>
            </div>
            <span className="text-xl font-bold text-purple-600">
              {totalPaid.toFixed(2)} SAR
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};