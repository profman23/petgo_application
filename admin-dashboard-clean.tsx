import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Shield, Car, UserPlus, Search, Edit, Trash2, 
  BarChart3, FileText, MessageSquare, LogOut, 
  Users, Upload, Loader2, MapPin, Volume2, VolumeX, 
  Bell, Clock, ChevronDown, ChevronRight 
} from "lucide-react";
import { useLanguage } from '@/store/language';

// Simplified Invoice Table Component
function InvoiceDetailsTable({ invoice, invoiceDetails, language }) {
  return (
    <tr>
      <td colSpan={7} className="px-6 py-4 bg-gray-50">
        <div className="max-w-full overflow-x-auto">
          <h5 className="text-sm font-medium text-gray-900 mb-3">
            {language === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}
          </h5>
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border">
                  {language === 'ar' ? 'الكمية' : 'Quantity'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border">
                  {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border">
                  {language === 'ar' ? 'الخصم' : 'Discount'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border">
                  {language === 'ar' ? 'الضريبة' : 'VAT'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border">
                  {language === 'ar' ? 'المجموع قبل الضريبة' : 'Total Before VAT'}
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border">
                  {language === 'ar' ? 'المجموع بعد الضريبة' : 'Total After VAT'}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceDetails[invoice.id]?.items?.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-3 py-2 text-sm text-gray-700 border">{item.description}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 border">{item.quantity}</td>
                  <td className="px-3 py-2 text-sm text-gray-700 border">{item.unitPrice} SAR</td>
                  <td className="px-3 py-2 text-sm text-gray-700 border">
                    {item.discountType === '10%' ? '10%' : item.discountType === '100%' ? '100%' : '0%'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 border">{Number(item.vatAmount || 0).toFixed(2)} SAR</td>
                  <td className="px-3 py-2 text-sm text-gray-700 border">{(item.quantity * item.unitPrice).toFixed(2)} SAR</td>
                  <td className="px-3 py-2 text-sm text-gray-700 border">{Number(item.totalAfterVat || 0).toFixed(2)} SAR</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}

export default function AdminDashboard() {
  const { language, t } = useLanguage();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('management');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);
  
  // State for invoice expansion
  const [expandedInvoices, setExpandedInvoices] = useState(new Set());
  const [invoiceDetails, setInvoiceDetails] = useState({});

  // Admin info (from token/session)
  const admin = { name: 'Admin' };

  // Helper functions
  const getDirection = (language) => language === 'ar' ? 'rtl' : 'ltr';
  const getTextAlign = (language) => language === 'ar' ? 'right' : 'left';

  // Toggle invoice expansion
  const toggleInvoiceExpansion = async (invoiceId) => {
    const newExpanded = new Set(expandedInvoices);
    
    if (newExpanded.has(invoiceId)) {
      newExpanded.delete(invoiceId);
    } else {
      newExpanded.add(invoiceId);
      
      // Fetch invoice details if not already loaded
      if (!invoiceDetails[invoiceId]) {
        try {
          const response = await apiRequest(`/api/admin/invoice-details/${invoiceId}`);
          const data = await response.json();
          setInvoiceDetails(prev => ({
            ...prev,
            [invoiceId]: data
          }));
        } catch (error) {
          console.error('Error fetching invoice details:', error);
        }
      }
    }
    
    setExpandedInvoices(newExpanded);
  };

  // Query for generated invoices
  const { data: generatedInvoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['/api/admin/generated-invoices'],
    enabled: activeTab === 'reports'
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLocation('/user-type-selection');
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={getDirection(language)}>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className={`flex items-center ${language === 'ar' ? 'ml-auto' : 'mr-auto'}`}>
              <Shield className="h-8 w-8 text-purple-600 ml-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('adminDashboard')}</h1>
                <p className="text-sm text-gray-500">{t('welcome')} {admin.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 ml-2" />
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="mt-5 px-2">
            <button
              onClick={() => setActiveTab('reports')}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full ${
                activeTab === 'reports'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="ml-3 h-6 w-6" />
              {language === 'ar' ? 'التقارير' : 'Reports'}
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div className="space-y-6" dir={getDirection(language)}>
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'جميع الفواتير المولدة' : 'All Generated Invoices'}
                    </p>
                  </div>

                  {isLoadingInvoices ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                  ) : generatedInvoices && generatedInvoices.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                              {/* Arrow column */}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'رقم الفاتورة' : 'Invoice Number'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'العميل' : 'Customer'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'الطبيب' : 'Doctor'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'VetsVan' : 'VetsVan'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'الإجمالي' : 'Total'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'التاريخ' : 'Date'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {generatedInvoices.map((invoice) => (
                            <React.Fragment key={invoice.id}>
                              <tr className="hover:bg-gray-50">
                                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <button
                                    onClick={() => toggleInvoiceExpansion(invoice.id)}
                                    className="hover:text-gray-700 transition-colors"
                                  >
                                    {expandedInvoices.has(invoice.id) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </button>
                                </td>
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
                                  {new Date(invoice.generatedAt || '').toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                </td>
                              </tr>
                              {expandedInvoices.has(invoice.id) && invoiceDetails?.[invoice.id] && (
                                <InvoiceDetailsTable 
                                  invoice={invoice} 
                                  invoiceDetails={invoiceDetails} 
                                  language={language} 
                                />
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}