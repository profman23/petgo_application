import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Loader2, 
  BarChart3, 
  Calendar, 
  Download,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { type GeneratedInvoice } from "@shared/schema";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface InvoiceDetails {
  invoiceItems: any[];
  invoiceStatus: {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    finalTotal: number;
    notes: string;
  };
  booking: {
    id: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    appointmentDate: string;
    appointmentTime: string;
    serviceType: string;
    pets: any[];
  };
}

// Invoice Card Component
function InvoiceCard({ invoice, language }: { invoice: GeneratedInvoice; language: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInvoiceDetails = async () => {
    if (invoiceDetails) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/invoice-details/${invoice.bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const details = await response.json();
        setInvoiceDetails(details);
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpand = () => {
    if (!isExpanded) {
      fetchInvoiceDetails();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border">
      {/* Invoice Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex-1 grid grid-cols-7 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-gray-500 block">{language === 'ar' ? 'العميل' : 'Customer'}</span>
              <span className="font-medium">{invoice.customerName}</span>
            </div>
            <div>
              <span className="text-gray-500 block">{language === 'ar' ? 'VETS VAN' : 'VETS VAN'}</span>
              <span className="font-medium">{invoice.vetsvanCode} - {invoice.vetsvanName}</span>
            </div>
            <div>
              <span className="text-gray-500 block">{language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}</span>
              <span className="font-medium text-green-600">{parseFloat(invoice.finalTotal || '0').toFixed(2)} SAR</span>
            </div>
            <div>
              <span className="text-gray-500 block">{language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid'}</span>
              <span className="font-medium text-blue-600">{parseFloat(invoice.totalPaid || '0').toFixed(2)} SAR</span>
              <span className="text-gray-400 text-xs block mt-1">{language === 'ar' ? 'طرق الدفع' : 'Pay Methods'}</span>
              
              {invoice.payments && invoice.payments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {invoice.payments.map((payment) => (
                    <div key={payment.id} className="text-xs bg-gray-50 p-2 rounded border">
                      <div className="font-semibold text-green-600">
                        {parseFloat(payment.amount).toFixed(2)} SAR
                      </div>
                      <div className="text-gray-600">
                        {payment.paymentType} • {payment.description || (language === 'ar' ? 'لا يوجد وصف' : 'No description')}
                      </div>
                      <div className="text-gray-500">
                        {new Date(payment.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </div>
                      <div className="text-green-500 float-right">✓</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <span className="text-gray-500 block">{language === 'ar' ? 'التاريخ' : 'Date'}</span>
              <span className="font-medium">{new Date(invoice.generatedAt || '').toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
            </div>
          </div>
          
          {/* Expand/Collapse Button */}
          <button
            onClick={handleToggleExpand}
            className="flex items-center text-purple-600 hover:text-purple-800 transition-colors ml-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
            <span className="ml-1">
              {language === 'ar' ? (isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل') : (isExpanded ? 'Hide Details' : 'Show Details')}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Invoice Details */}
      {isExpanded && invoiceDetails && (
        <div className="p-6 bg-gray-50" dir={getDirection(language)}>
          {/* Pet Information */}
          {invoiceDetails.booking.pets && invoiceDetails.booking.pets.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">{language === 'ar' ? 'معلومات الحيوان الأليف' : 'Pet Information'}</h3>
              {invoiceDetails.booking.pets.map((pet, index) => (
                <div key={index} className="border-b border-gray-200 pb-3 mb-3 last:border-b-0 last:mb-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'ar' ? 'اسم الحيوان' : 'Pet Name'}</label>
                      <p className="text-gray-900">{pet.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'ar' ? 'النوع' : 'Type'}</label>
                      <p className="text-gray-900">{pet.type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'ar' ? 'العمر' : 'Age'}</label>
                      <p className="text-gray-900">
                        {pet.ageYear} {language === 'ar' ? 'سنة' : 'years'} {pet.ageMonth} {language === 'ar' ? 'شهر' : 'months'} {pet.ageDay} {language === 'ar' ? 'يوم' : 'days'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Invoice Items Table */}
          {invoiceDetails.invoiceItems && invoiceDetails.invoiceItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {language === 'ar' ? 'بنود الفاتورة' : 'Invoice Items'}
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full mb-4">
                  <thead>
                    <tr className="border-b">
                      {language === 'ar' ? (
                        <>
                          <th className="text-center py-2 px-2 w-32">
                            {language === 'ar' ? 'المجموع بعد الضريبة' : 'Total After VAT'} (SAR)
                          </th>
                          <th className="text-center py-2 px-2 w-32">
                            {language === 'ar' ? 'المجموع قبل الضريبة' : 'Total Before VAT'} (SAR)
                          </th>
                          <th className="text-center py-2 px-2 w-24">
                            {language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'} (15%)
                          </th>
                          <th className="text-center py-2 px-2 w-28">
                            {language === 'ar' ? 'الخصم' : 'Discount'}
                          </th>
                          <th className="text-center py-2 px-2 w-32">
                            {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'} (SAR)
                          </th>
                          <th className="text-center py-2 px-2 w-24">
                            {language === 'ar' ? 'الكمية' : 'Quantity'}
                          </th>
                          <th className="text-left py-2 px-2" style={{ textAlign: language === 'ar' ? 'right' : 'left', width: '35%' }}>
                            {language === 'ar' ? 'الوصف' : 'Description'}
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="text-left py-2 px-2" style={{ textAlign: language === 'ar' ? 'right' : 'left', width: '35%' }}>
                            {language === 'ar' ? 'الوصف' : 'Description'}
                          </th>
                          <th className="text-center py-2 px-2 w-24">
                            {language === 'ar' ? 'الكمية' : 'Quantity'}
                          </th>
                          <th className="text-center py-2 px-2 w-32">
                            {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'} (SAR)
                          </th>
                          <th className="text-center py-2 px-2 w-28">
                            {language === 'ar' ? 'الخصم' : 'Discount'}
                          </th>
                          <th className="text-center py-2 px-2 w-24">
                            {language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'} (15%)
                          </th>
                          <th className="text-center py-2 px-2 w-32">
                            {language === 'ar' ? 'المجموع قبل الضريبة' : 'Total Before VAT'} (SAR)
                          </th>
                          <th className="text-center py-2 px-2 w-32">
                            {language === 'ar' ? 'المجموع بعد الضريبة' : 'Total After VAT'} (SAR)
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceDetails.invoiceItems.map((item, index) => (
                      <tr key={index} className="border-b">
                        {/* Render cells in different order based on language */}
                        {language === 'ar' ? (
                          // Arabic RTL order: Total After VAT, Total Before VAT, VAT, Discount, Unit Price, Quantity, Description
                          <>
                            {/* Total After VAT */}
                            <td className="py-2 px-2 text-center">
                              <div className="bg-gray-100 p-2 rounded text-gray-700 font-semibold">
                                {parseFloat(item.totalAfterVat || '0').toFixed(2)}
                              </div>
                            </td>
                            
                            {/* Total Before VAT */}
                            <td className="py-2 px-2 text-center">
                              <div className="bg-gray-100 p-2 rounded text-gray-700">
                                {parseFloat(item.totalBeforeVat || '0').toFixed(2)}
                              </div>
                            </td>
                            
                            {/* VAT Amount */}
                            <td className="py-2 px-2 text-center">
                              <div className="bg-green-100 p-2 rounded text-green-700">
                                {parseFloat(item.vatAmount || '0').toFixed(2)}
                              </div>
                            </td>
                            
                            {/* Discount */}
                            <td className="py-2 px-2">
                              <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                                {item.discountType === 'none' 
                                  ? (language === 'ar' ? 'بدون خصم' : 'No Discount')
                                  : item.discountType === '10%' 
                                    ? (language === 'ar' ? 'خصم 10%' : '10% Discount')
                                    : (language === 'ar' ? 'خصم 100%' : '100% Discount')
                                }
                              </div>
                            </td>
                            
                            {/* Unit Price */}
                            <td className="py-2 px-2">
                              <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                                {parseFloat(item.unitPrice || '0').toFixed(2)}
                              </div>
                            </td>
                            
                            {/* Quantity */}
                            <td className="py-2 px-2">
                              <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                                {item.quantity}
                              </div>
                            </td>
                            
                            {/* Description */}
                            <td className="py-2 px-2" style={{ width: '35%' }}>
                              <div className="bg-gray-100 p-2 rounded text-gray-700">
                                {item.description || (language === 'ar' ? 'الوصف' : 'Description')}
                              </div>
                            </td>
                          </>
                        ) : (
                          // English LTR order: Description, Quantity, Unit Price, Discount, VAT, Total Before VAT, Total After VAT
                          <>
                            {/* Description */}
                            <td className="py-2 px-2" style={{ width: '35%' }}>
                              <div className="bg-gray-100 p-2 rounded text-gray-700">
                                {item.description || (language === 'ar' ? 'الوصف' : 'Description')}
                              </div>
                            </td>
                            
                            {/* Quantity */}
                            <td className="py-2 px-2">
                              <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                                {item.quantity}
                              </div>
                            </td>
                            
                            {/* Unit Price */}
                            <td className="py-2 px-2">
                              <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                                {parseFloat(item.unitPrice || '0').toFixed(2)}
                              </div>
                            </td>
                            
                            {/* Discount */}
                            <td className="py-2 px-2">
                              <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                                {item.discountType === 'none' 
                                  ? (language === 'ar' ? 'بدون خصم' : 'No Discount')
                                  : item.discountType === '10%' 
                                    ? (language === 'ar' ? 'خصم 10%' : '10% Discount')
                                    : (language === 'ar' ? 'خصم 100%' : '100% Discount')
                                }
                              </div>
                            </td>
                            
                            {/* VAT Amount */}
                            <td className="py-2 px-2 text-center">
                              <div className="bg-green-100 p-2 rounded text-green-700">
                                {parseFloat(item.vatAmount || '0').toFixed(2)}
                              </div>
                            </td>
                            
                            {/* Total Before VAT */}
                            <td className="py-2 px-2 text-center">
                              <div className="bg-gray-100 p-2 rounded text-gray-700">
                                {parseFloat(item.totalBeforeVat || '0').toFixed(2)}
                              </div>
                            </td>
                            
                            {/* Total After VAT */}
                            <td className="py-2 px-2 text-center">
                              <div className="bg-gray-100 p-2 rounded text-gray-700 font-semibold">
                                {parseFloat(item.totalAfterVat || '0').toFixed(2)}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Totals */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                      <span>{invoiceDetails.invoiceStatus.subtotal.toFixed(2)} SAR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{language === 'ar' ? 'الخصم:' : 'Discount:'}</span>
                      <span>-{invoiceDetails.invoiceStatus.discountAmount.toFixed(2)} SAR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{language === 'ar' ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</span>
                      <span>{invoiceDetails.invoiceStatus.taxAmount.toFixed(2)} SAR</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-lg font-bold">
                      <span>{language === 'ar' ? 'المجموع النهائي:' : 'Final Total:'}</span>
                      <span>{invoiceDetails.invoiceStatus.finalTotal.toFixed(2)} SAR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SalesReports() {
  const [, setLocation] = useLocation();
  const { language } = useTranslation();
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const handleBack = () => {
    setLocation('/admin-dashboard');
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Fetch generated invoices
  const { data: generatedInvoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["/api/admin/generated-invoices"],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch("/api/admin/generated-invoices", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch generated invoices");
      return await response.json() as GeneratedInvoice[];
    },
    enabled: !!localStorage.getItem('adminToken'),
  });

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/export-sales-report', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const data = await response.json();
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      
      // Auto-size columns
      const columnWidths = [
        { wch: 15 }, // Invoice Number
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Customer Phone
        { wch: 25 }, // Customer Email
        { wch: 15 }, // VetsVan Code
        { wch: 20 }, // VetsVan Name
        { wch: 12 }, // Date
        { wch: 12 }, // Time
        { wch: 15 }, // Service Type
        { wch: 15 }, // Pet Name
        { wch: 10 }, // Pet Type
        { wch: 30 }, // Description
        { wch: 8 },  // Quantity
        { wch: 12 }, // Unit Price
        { wch: 10 }, // Discount
        { wch: 10 }, // VAT
        { wch: 15 }, // Total Before VAT
        { wch: 15 }, // Total After VAT
        { wch: 12 }, // Subtotal
        { wch: 12 }, // Tax Amount
        { wch: 15 }, // Discount Amount
        { wch: 15 }, // Final Total
        { wch: 15 }, // Payment Type 1
        { wch: 15 }, // Payment Amount 1
        { wch: 15 }, // Payment Type 2
        { wch: 15 }, // Payment Amount 2
        { wch: 15 }, // Payment Type 3
        { wch: 15 }, // Payment Amount 3
        { wch: 15 }, // Payment Type 4
        { wch: 15 }, // Payment Amount 4
        { wch: 15 }, // Payment Type 5
        { wch: 15 }  // Payment Amount 5
      ];
      
      worksheet['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, language === 'ar' ? 'تقرير المبيعات' : 'Sales Report');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const filename = `sales-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, filename);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ direction: getDirection(language) }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4" style={{ 
              flexDirection: language === 'ar' ? 'row-reverse' : 'row',
              gap: language === 'ar' ? '1rem' : '0'
            }}>
              <Button
                variant="ghost" 
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
                style={{ 
                  flexDirection: language === 'ar' ? 'row-reverse' : 'row'
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                {language === 'ar' ? 'العودة' : 'Back'}
              </Button>
              
              <h1 className="text-2xl font-bold text-gray-900" style={{ 
                textAlign: getTextAlign(language)
              }}>
                {language === 'ar' ? 'تقارير المبيعات' : 'Sales Reports'}
              </h1>
            </div>
            
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {isLoadingInvoices ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'جميع الفواتير المولدة' : 'All Generated Invoices'}
                    </p>
                  </div>
                  
                  {/* Excel Export Button */}
                  <button
                    onClick={handleExportToExcel}
                    disabled={isExporting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {language === 'ar' ? 'جاري التصدير...' : 'Exporting...'}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'تصدير إلى Excel' : 'Export to Excel'}
                      </>
                    )}
                  </button>
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

                {generatedInvoices && generatedInvoices.length > 0 ? (
                  <div className="space-y-4">
                    {generatedInvoices.map((invoice) => (
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
    </div>
  );
}