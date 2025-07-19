import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Sales Reports Component
const AdminSalesReports = () => {
  const { language } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch generated invoices for sales report
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['/api/admin/generated-invoices'],
    staleTime: 5 * 60 * 1000,
  });

  const exportSalesReport = async () => {
    try {
      const response = await apiRequest('/api/admin/export-sales-report', {
        method: 'GET',
      });

      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid export data received');
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(response);

      // Auto-size columns
      const columnWidths = [
        { wch: 15 }, // Invoice Number
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Phone Number
        { wch: 20 }, // Pet Name
        { wch: 15 }, // Pet Type
        { wch: 30 }, // Item Description
        { wch: 10 }, // Quantity
        { wch: 12 }, // Unit Price
        { wch: 12 }, // Item Total
        { wch: 12 }, // Subtotal
        { wch: 12 }, // Tax Amount
        { wch: 12 }, // Discount Amount
        { wch: 12 }, // Final Total
        { wch: 12 }, // Total Paid
        { wch: 15 }, // Payment Type 1
        { wch: 12 }, // Payment Amount 1
        { wch: 15 }, // Payment Type 2
        { wch: 12 }, // Payment Amount 2
        { wch: 15 }, // Payment Type 3
        { wch: 12 }, // Payment Amount 3
        { wch: 15 }, // Payment Type 4
        { wch: 12 }, // Payment Amount 4
        { wch: 15 }, // Payment Type 5
        { wch: 12 }, // Payment Amount 5
        { wch: 15 }, // Date
        { wch: 15 }, // VetsVan
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Save file
      const fileName = `sales-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);

      toast({
        title: language === 'ar' ? "تم التصدير بنجاح" : "Export Successful",
        description: language === 'ar' ? "تم تصدير تقرير المبيعات إلى Excel" : "Sales report exported to Excel",
      });

    } catch (error) {
      console.error('Error exporting sales report:', error);
      toast({
        title: language === 'ar' ? "خطأ في التصدير" : "Export Error",
        description: language === 'ar' ? "فشل في تصدير تقرير المبيعات" : "Failed to export sales report",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Button
                variant="ghost"
                onClick={() => setLocation('/admin/dashboard')}
                className="flex items-center gap-2"
                style={{ direction: getDirection(language) }}
              >
                <ArrowLeft className="h-4 w-4" />
                {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ 
                direction: getDirection(language), 
                textAlign: getTextAlign(language) 
              }}>
                {language === 'ar' ? 'تقارير المبيعات' : 'Sales Reports'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Sales Report Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900" style={{ 
                    direction: getDirection(language), 
                    textAlign: getTextAlign(language) 
                  }}>
                    {language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}
                  </h2>
                  <p className="text-sm text-gray-500" style={{ 
                    direction: getDirection(language), 
                    textAlign: getTextAlign(language) 
                  }}>
                    {language === 'ar' ? 'عرض جميع الفواتير والمبيعات' : 'View all invoices and sales'}
                  </p>
                </div>
              </div>
              <Button
                onClick={exportSalesReport}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                style={{ direction: getDirection(language) }}
              >
                <Download className="h-4 w-4" />
                {language === 'ar' ? 'تصدير إلى Excel' : 'Export to Excel'}
              </Button>
            </div>
          </div>

          {/* Sales Report Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'رقم الفاتورة' : 'Invoice Number'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'اسم العميل' : 'Customer Name'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'التاريخ' : 'Date'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'VetsVan' : 'VetsVan'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoicesLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                    </td>
                  </tr>
                ) : invoices?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      {language === 'ar' ? 'لا توجد فواتير' : 'No invoices found'}
                    </td>
                  </tr>
                ) : (
                  invoices?.map((invoice: any, index: number) => (
                    <tr key={invoice.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseFloat(invoice.finalTotal).toFixed(2)} SAR
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {invoice.totalPaid ? `${parseFloat(invoice.totalPaid).toFixed(2)} SAR` : '0.00 SAR'}
                          </div>
                          {invoice.paymentMethods && invoice.paymentMethods.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {language === 'ar' ? 'طرق الدفع' : 'Pay Methods'}
                              <br />
                              {invoice.paymentMethods.map((method: any, idx: number) => (
                                <span key={idx} className="block">
                                  {method.paymentType}: {parseFloat(method.amount).toFixed(2)} SAR
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(invoice.appointmentDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.vetsVanCode}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSalesReports;