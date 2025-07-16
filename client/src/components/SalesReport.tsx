import { useQuery } from "@tanstack/react-query";
import { Loader2, BarChart3, Eye, Download, X, DollarSign } from "lucide-react";
import { type GeneratedInvoice } from "@shared/schema";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SalesReportProps {
  language: string;
}

interface PaymentDetail {
  id: number;
  amount: number;
  method: string;
  createdAt: string;
  notes: string;
}

interface InvoicePaymentDetails {
  bookingId: number;
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  paymentStatus: 'paid' | 'pending';
  payments: PaymentDetail[];
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceItemsDetails {
  bookingId: number;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: string;
  discountAmount: number;
  totalBeforeVat: number;
  vatAmount: number;
  finalTotal: number;
  generatedAt: string;
}

export const SalesReport = ({ language }: SalesReportProps) => {
  const [selectedInvoice, setSelectedInvoice] = useState<GeneratedInvoice | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const { toast } = useToast();

  const { data: generatedInvoices, isLoading } = useQuery<GeneratedInvoice[]>({
    queryKey: ['/api/admin/generated-invoices'],
    staleTime: 30000,
  });

  // Fetch payment details for selected invoice
  const { data: paymentDetails, isLoading: isLoadingDetails } = useQuery<InvoicePaymentDetails>({
    queryKey: ['/api/admin/invoice-payment-details', selectedInvoice?.bookingId],
    queryFn: async () => {
      if (!selectedInvoice) return null;
      return await apiRequest(`/api/admin/invoice-payment-details/${selectedInvoice.bookingId}`);
    },
    enabled: !!selectedInvoice && showDetailsModal,
  });

  // Fetch invoice items for selected invoice
  const { data: invoiceItems, isLoading: isLoadingItems } = useQuery<InvoiceItemsDetails>({
    queryKey: ['/api/admin/invoice-items', selectedInvoice?.bookingId],
    queryFn: async () => {
      if (!selectedInvoice) return null;
      return await apiRequest(`/api/admin/invoice-items/${selectedInvoice.bookingId}`);
    },
    enabled: !!selectedInvoice && showItemsModal,
  });

  // Export sales report with payment details
  const handleExportReport = async () => {
    try {
      const exportData = await apiRequest('/api/admin/export-sales-report');
      
      // Convert to CSV
      const csvContent = convertToCSV(exportData, language);
      
      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sales-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast({
        title: language === 'ar' ? "تم التصدير بنجاح" : "Export Successful",
        description: language === 'ar' ? "تم تصدير تقرير المبيعات" : "Sales report exported successfully",
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ في التصدير" : "Export Error",
        description: language === 'ar' ? "فشل في تصدير التقرير" : "Failed to export report",
        variant: "destructive",
      });
    }
  };

  // Convert data to CSV format
  const convertToCSV = (data: any[], lang: string) => {
    const headers = lang === 'ar' 
      ? ['رقم الفاتورة', 'اسم العميل', 'هاتف العميل', 'اسم الطبيب', 'VetsVan', 'إجمالي الفاتورة', 'المبلغ المدفوع', 'المبلغ المتبقي', 'حالة الدفع', 'تاريخ الإنشاء']
      : ['Invoice Number', 'Customer Name', 'Customer Phone', 'Doctor Name', 'VetsVan', 'Total Amount', 'Total Paid', 'Remaining Amount', 'Payment Status', 'Generated Date'];
    
    const csvRows = [headers.join(',')];
    
    data.forEach(item => {
      const row = [
        item.invoiceNumber,
        item.customerName,
        item.customerPhone,
        item.doctorName,
        item.vetsVanCode,
        item.totalAmount,
        item.totalPaid,
        item.remainingAmount,
        item.paymentStatus,
        item.generatedDate
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  };

  // Show payment details modal
  const showPaymentDetails = (invoice: GeneratedInvoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  // Show invoice items modal
  const showInvoiceItems = (invoice: GeneratedInvoice) => {
    setSelectedInvoice(invoice);
    setShowItemsModal(true);
  };

  // Close modal
  const closeModal = () => {
    setSelectedInvoice(null);
    setShowDetailsModal(false);
    setShowItemsModal(false);
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
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}
          </h4>
          <p className="text-sm text-gray-600">
            {language === 'ar' ? 'جميع الفواتير المولدة مع تفاصيل المدفوعات' : 'All Generated Invoices with Payment Details'}
          </p>
        </div>
        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="h-4 w-4" />
          {language === 'ar' ? 'تصدير التقرير' : 'Export Report'}
        </button>
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
                  {language === 'ar' ? 'الإجراءات' : 'Actions'}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <button
                        onClick={() => showPaymentDetails(invoice)}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors text-sm"
                      >
                        <Eye className="h-3 w-3" />
                        {language === 'ar' ? 'المدفوعات' : 'Payments'}
                      </button>
                      <button
                        onClick={() => showInvoiceItems(invoice)}
                        className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md transition-colors text-sm"
                      >
                        <Eye className="h-3 w-3" />
                        {language === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {language === 'ar' ? 'تفاصيل المدفوعات' : 'Payment Details'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {isLoadingDetails ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : paymentDetails ? (
                <div className="space-y-6">
                  {/* Invoice Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      {language === 'ar' ? 'ملخص الفاتورة' : 'Invoice Summary'}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">
                          {language === 'ar' ? 'رقم الفاتورة:' : 'Invoice Number:'}
                        </span>
                        <span className="ml-2 font-medium">{selectedInvoice.invoiceNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">
                          {language === 'ar' ? 'العميل:' : 'Customer:'}
                        </span>
                        <span className="ml-2 font-medium">{selectedInvoice.customerName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-sm text-gray-600">
                        {language === 'ar' ? 'إجمالي الفاتورة' : 'Total Amount'}
                      </div>
                      <div className="text-xl font-bold text-blue-600">
                        {paymentDetails.totalAmount.toFixed(2)} SAR
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-sm text-gray-600">
                        {language === 'ar' ? 'المبلغ المدفوع' : 'Total Paid'}
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        {paymentDetails.totalPaid.toFixed(2)} SAR
                      </div>
                    </div>

                    <div className={`${paymentDetails.remainingAmount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4 text-center`}>
                      <DollarSign className={`h-8 w-8 ${paymentDetails.remainingAmount > 0 ? 'text-red-600' : 'text-gray-600'} mx-auto mb-2`} />
                      <div className="text-sm text-gray-600">
                        {language === 'ar' ? 'المبلغ المتبقي' : 'Remaining Amount'}
                      </div>
                      <div className={`text-xl font-bold ${paymentDetails.remainingAmount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {paymentDetails.remainingAmount.toFixed(2)} SAR
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      paymentDetails.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {paymentDetails.paymentStatus === 'paid' 
                        ? (language === 'ar' ? 'مدفوعة بالكامل' : 'Fully Paid')
                        : (language === 'ar' ? 'مدفوعة جزئياً' : 'Partially Paid')
                      }
                    </span>
                  </div>

                  {/* Payment History */}
                  {paymentDetails.payments.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        {language === 'ar' ? 'تاريخ المدفوعات' : 'Payment History'}
                      </h4>
                      <div className="space-y-2">
                        {paymentDetails.payments.map((payment) => (
                          <div key={payment.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-900">
                                {payment.amount.toFixed(2)} SAR
                              </div>
                              <div className="text-sm text-gray-500">
                                {payment.method} • {new Date(payment.createdAt).toLocaleDateString()}
                              </div>
                              {payment.notes && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {payment.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {paymentDetails.payments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {language === 'ar' ? 'لا توجد مدفوعات مسجلة' : 'No payments recorded'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {language === 'ar' ? 'فشل في تحميل التفاصيل' : 'Failed to load details'}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Items Modal */}
      {showItemsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-purple-600 text-white border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {language === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}
              </h3>
              <p className="text-sm text-purple-100 mt-1">
                {language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}: {invoiceItems?.invoiceNumber || ''}
              </p>
            </div>

            <div className="p-6">
              {isLoadingItems ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">
                    {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                  </p>
                </div>
              ) : invoiceItems ? (
                <div className="space-y-6">
                  {/* Invoice Items */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-gray-800">
                      {language === 'ar' ? 'عناصر الفاتورة' : 'Invoice Items'}
                    </h4>
                    {invoiceItems.items.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {language === 'ar' ? 'الوصف' : 'Description'}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {language === 'ar' ? 'الكمية' : 'Quantity'}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {language === 'ar' ? 'السعر للوحدة (ريال)' : 'Unit Price (SAR)'}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {language === 'ar' ? 'المجموع (ريال)' : 'Total (SAR)'}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {invoiceItems.items.map((item) => (
                              <tr key={item.id}>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {item.description}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {item.unitPrice.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {item.total.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        {language === 'ar' ? 'لا توجد عناصر في الفاتورة' : 'No items in invoice'}
                      </div>
                    )}
                  </div>

                  {/* Financial Summary */}
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold mb-4 text-gray-800">
                      {language === 'ar' ? 'الملخص المالي' : 'Financial Summary'}
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}
                        </span>
                        <span className="font-medium">{invoiceItems.subtotal.toFixed(2)} SAR</span>
                      </div>
                      
                      {invoiceItems.discountType !== 'none' && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {language === 'ar' ? 'الخصم:' : 'Discount:'}
                          </span>
                          <span className="font-medium text-green-600">
                            -{invoiceItems.discountAmount.toFixed(2)} SAR
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {language === 'ar' ? 'المجموع قبل الضريبة:' : 'Total Before VAT:'}
                        </span>
                        <span className="font-medium">{invoiceItems.totalBeforeVat.toFixed(2)} SAR</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {language === 'ar' ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}
                        </span>
                        <span className="font-medium">{invoiceItems.vatAmount.toFixed(2)} SAR</span>
                      </div>
                      
                      <div className="flex justify-between border-t pt-3 text-lg">
                        <span className="font-semibold text-gray-800">
                          {language === 'ar' ? 'المجموع النهائي:' : 'Total After VAT:'}
                        </span>
                        <span className="font-bold text-purple-600">{invoiceItems.finalTotal.toFixed(2)} SAR</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {language === 'ar' ? 'فشل في تحميل تفاصيل الفاتورة' : 'Failed to load invoice details'}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};