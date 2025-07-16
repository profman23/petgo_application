import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BarChart3, ArrowLeft } from "lucide-react";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { Link } from "wouter";

// Invoice Card Component - Same as current design
const InvoiceCard = ({ invoice, language }: { invoice: any; language: string }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {language === 'ar' ? 'فاتورة رقم:' : 'Invoice #'} {invoice.invoiceNumber}
          </h3>
          <p className="text-sm text-gray-600">
            {language === 'ar' ? 'العميل:' : 'Customer:'} {invoice.customerName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-purple-600">
            {parseFloat(invoice.finalTotal).toFixed(2)} SAR
          </p>
          <p className="text-xs text-gray-500">
            {new Date(invoice.appointmentDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
          <span className="font-medium ml-2">{parseFloat(invoice.subtotal).toFixed(2)} SAR</span>
        </div>
        <div>
          <span className="text-gray-500">{language === 'ar' ? 'الضريبة:' : 'Tax:'}</span>
          <span className="font-medium ml-2">{parseFloat(invoice.vatAmount).toFixed(2)} SAR</span>
        </div>
      </div>
    </div>
  );
};

export default function SalesReportPage() {
  const { t, language } = useTranslation();

  // Fetch invoices data - same query as admin dashboard
  const { data: generatedInvoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['/api/admin/generated-invoices'],
    staleTime: 30000,
    cacheTime: 60000,
  });

  return (
    <div className="min-h-screen bg-gray-50" dir={getDirection(language)}>
      {/* Header - Same style as admin dashboard */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin-dashboard">
                <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="ml-2">
                    {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
                  </span>
                </button>
              </Link>
            </div>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}
              </h1>
              <p className="text-sm text-gray-600">
                {language === 'ar' ? 'جميع الفواتير المولدة' : 'All Generated Invoices'}
              </p>
            </div>
            
            <div className="w-24"></div> {/* Spacer for center alignment */}
          </div>
        </div>
      </div>

      {/* Main Content - Same design as current Sales Report */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {isLoadingInvoices ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}
                </h4>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'جميع الفواتير المولدة' : 'All Generated Invoices'}
                </p>
              </div>

              {generatedInvoices && generatedInvoices.length > 0 ? (
                <div className="space-y-4">
                  {generatedInvoices.map((invoice: any) => (
                    <InvoiceCard 
                      key={invoice.id} 
                      invoice={invoice} 
                      language={language}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {language === 'ar' ? 'لا توجد فواتير' : 'No Invoices'}
                  </h3>
                  <p className="text-gray-500">
                    {language === 'ar' ? 'لم يتم إنشاء أي فواتير بعد' : 'No invoices have been generated yet'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}