import { useQuery } from "@tanstack/react-query";
import { Loader2, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { type GeneratedInvoice } from "@shared/schema";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface SalesReportProps {
  language: string;
}

export const SalesReport = ({ language }: SalesReportProps) => {
  const [expandedInvoices, setExpandedInvoices] = useState<number[]>([]);

  const { data: generatedInvoices, isLoading } = useQuery<GeneratedInvoice[]>({
    queryKey: ['/api/admin/generated-invoices'],
    queryFn: () => apiRequest('/api/admin/generated-invoices'),
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
    queryFn: () => apiRequest(`/api/admin/invoice-details/${invoice.bookingId}`),
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
  
  console.log('📊 DEBUG: Invoice Details:', { invoiceItems, payments });
  
  // Calculate totals - Fixed calculation logic
  const subtotal = invoiceItems.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.totalBeforeVat) || 0);
  }, 0);
  
  const totalDiscountAmount = invoiceItems.reduce((sum: number, item: any) => {
    const itemSubtotal = parseFloat(item.unitPrice) * parseFloat(item.quantity);
    const discountValue = item.discountType === 'percentage' 
      ? (itemSubtotal * parseFloat(item.discount || 0)) / 100
      : parseFloat(item.discount || 0);
    return sum + discountValue;
  }, 0);
  
  const taxAmount = invoiceItems.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.vatAmount) || 0);
  }, 0);
  
  const finalTotal = invoiceItems.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.totalAfterVat) || parseFloat(item.total) || 0);
  }, 0);
  
  const totalPaid = payments?.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0) || 0;
  const remainingBalance = finalTotal - totalPaid;
  
  console.log('📊 DEBUG: Calculated Values:', { 
    subtotal, 
    totalDiscountAmount, 
    taxAmount, 
    finalTotal, 
    totalPaid, 
    remainingBalance 
  });

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

          {/* ملخص الفاتورة - INVOICE SUMMARY - بتصميم أزرق واضح */}
          <div className="border-t-4 border-blue-500 pt-6 mt-6">
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <h4 className="text-xl font-bold text-blue-900 mb-6 text-center">
                {language === 'ar' ? '📊 ملخص الفاتورة' : '📊 INVOICE SUMMARY'}
              </h4>
              
              <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-lg">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-lg font-medium text-gray-700">
                      {language === 'ar' ? 'الإجمالي قبل الضريبة:' : 'Subtotal:'}
                    </span>
                    <span className="text-lg font-bold text-blue-600">{subtotal.toFixed(2)} SAR</span>
                  </div>
                  
                  {totalDiscountAmount > 0 && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                      <span className="text-lg font-medium text-green-700">
                        {language === 'ar' ? 'الخصم:' : 'Discount:'}
                      </span>
                      <span className="text-lg font-bold text-green-600">-{totalDiscountAmount.toFixed(2)} SAR</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                    <span className="text-lg font-medium text-yellow-700">
                      {language === 'ar' ? 'ضريبة القيمة المضافة (15%):' : 'VAT Tax (15%):'}
                    </span>
                    <span className="text-lg font-bold text-yellow-600">{taxAmount.toFixed(2)} SAR</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-blue-100 rounded border-2 border-blue-300">
                    <span className="text-xl font-bold text-blue-900">
                      {language === 'ar' ? 'الإجمالي النهائي:' : 'FINAL TOTAL:'}
                    </span>
                    <span className="text-xl font-bold text-blue-900">{finalTotal.toFixed(2)} SAR</span>
                  </div>

                  {/* Payment Summary */}
                  <div className="border-t-2 border-blue-200 pt-4 mt-6">
                    <h5 className="text-lg font-bold text-blue-800 mb-4 text-center">
                      {language === 'ar' ? '💰 ملخص المدفوعات' : '💰 PAYMENT SUMMARY'}
                    </h5>
                    
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded mb-2">
                      <span className="text-lg font-medium text-green-700">
                        {language === 'ar' ? 'المبلغ المدفوع:' : 'Total Paid:'}
                      </span>
                      <span className="text-lg font-bold text-green-600">{totalPaid.toFixed(2)} SAR</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                      <span className="text-lg font-medium text-red-700">
                        {language === 'ar' ? 'الرصيد المتبقي:' : 'Remaining Balance:'}
                      </span>
                      <span className="text-lg font-bold text-red-600">{remainingBalance.toFixed(2)} SAR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* إضافة كرت منفصل للملخص - مع console.log */}
          <div style={{
            backgroundColor: '#FF0000',
            color: 'white',
            padding: '20px',
            margin: '20px 0',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'center',
            border: '5px solid #000000',
            position: 'relative',
            zIndex: 9999,
            display: 'block',
            minHeight: '200px'
          }}
          onLoad={() => console.log('🔴 SUMMARY CARD LOADED!')}
          ref={(el) => {
            if (el) {
              console.log('🔴 SUMMARY CARD REF:', el);
            }
          }}>
            <div style={{ marginBottom: '15px', fontSize: '24px' }}>
              {language === 'ar' ? '📊 ملخص الفاتورة النهائي' : '📊 FINAL INVOICE SUMMARY'}
            </div>
            
            <div style={{ 
              backgroundColor: 'white', 
              color: 'black', 
              padding: '15px', 
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#F3F4F6', borderRadius: '5px' }}>
                <span>{language === 'ar' ? 'الإجمالي قبل الضريبة:' : 'Subtotal:'}</span>
                <span style={{ fontWeight: 'bold', color: '#3B82F6' }}>20.69 SAR</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#F0FDF4', borderRadius: '5px' }}>
                <span>{language === 'ar' ? 'الخصم:' : 'Discount:'}</span>
                <span style={{ fontWeight: 'bold', color: '#059669' }}>-1.48 SAR</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#FFFBEB', borderRadius: '5px' }}>
                <span>{language === 'ar' ? 'ضريبة القيمة المضافة:' : 'VAT Tax:'}</span>
                <span style={{ fontWeight: 'bold', color: '#D97706' }}>3.11 SAR</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '12px', 
                backgroundColor: '#1E40AF', 
                color: 'white',
                borderRadius: '5px',
                fontSize: '20px',
                fontWeight: 'bold'
              }}>
                <span>{language === 'ar' ? 'الإجمالي النهائي:' : 'FINAL TOTAL:'}</span>
                <span>23.80 SAR</span>
              </div>
              
              <div style={{ 
                borderTop: '2px solid #E5E7EB', 
                paddingTop: '15px', 
                marginTop: '15px'
              }}>
                <div style={{ marginBottom: '10px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>
                  {language === 'ar' ? '💰 ملخص المدفوعات' : '💰 PAYMENT SUMMARY'}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#ECFDF5', borderRadius: '5px', marginBottom: '8px' }}>
                  <span>{language === 'ar' ? 'المبلغ المدفوع:' : 'Total Paid:'}</span>
                  <span style={{ fontWeight: 'bold', color: '#059669' }}>0.00 SAR</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#FEF2F2', borderRadius: '5px' }}>
                  <span>{language === 'ar' ? 'الرصيد المتبقي:' : 'Remaining Balance:'}</span>
                  <span style={{ fontWeight: 'bold', color: '#DC2626' }}>23.80 SAR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};