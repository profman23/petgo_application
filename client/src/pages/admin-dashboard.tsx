import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Shield, LogOut, Car, Clock, Trash2, MapPin, BarChart3, MessageSquare, FileText, User, Phone, Calendar, Mail, Volume2, VolumeX, Bell, Upload, Download, Edit, ChevronDown, ChevronUp, Search, Package, Stethoscope, X, TrendingUp } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { playBookingNotification, testAudioNotification, audioNotification } from "@/utils/audio";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";


// Products Management Component
const ProductsManagementTable = ({ language }: { language: string }) => {
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<{ id: number; price: string } | null>(null);
  const [editedProducts, setEditedProducts] = useState<{ [key: number]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/products'],
    staleTime: 5 * 60 * 1000,
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, price }: { id: number; price: string }) => {
      return apiRequest(`/api/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ price }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({
        title: language === 'ar' ? "تم التحديث بنجاح" : "Updated Successfully",
        description: language === 'ar' ? "تم تحديث سعر المنتج" : "Product price updated",
      });
      setEditingProduct(null);
      setEditedProducts({});
    },
    onError: () => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "فشل في تحديث السعر" : "Failed to update price",
        variant: "destructive",
      });
    },
  });

  const handlePriceEdit = (productId: number, currentPrice: string) => {
    setEditingProduct({ id: productId, price: currentPrice });
    setEditedProducts({ ...editedProducts, [productId]: currentPrice });
  };

  const handlePriceChange = (productId: number, newPrice: string) => {
    setEditedProducts({ ...editedProducts, [productId]: newPrice });
  };

  const handleSave = () => {
    if (editingProduct) {
      const newPrice = editedProducts[editingProduct.id];
      if (newPrice && !isNaN(parseFloat(newPrice))) {
        updateProductMutation.mutate({ id: editingProduct.id, price: newPrice });
      }
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil((products?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = products?.slice(startIndex, endIndex) || [];

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const getTextAlign = (lang: string) => lang === 'ar' ? 'right' : 'left';

  if (isLoading) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900" style={{ textAlign: getTextAlign(language) }}>
            {language === 'ar' ? 'إدارة المنتجات' : 'Products Management'}
          </h3>
          <div className="text-sm text-gray-500">
            {language === 'ar' ? 'المجموع:' : 'Total:'} {products?.length || 0}
          </div>
        </div>

        {products && products.length > 0 ? (
          <>
            {/* Pagination Controls - Top */}
            <div className="flex items-center justify-between mb-4" style={{ direction: getDirection(language) }}>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  {language === 'ar' ? 'عرض' : 'Show'}
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-purple-600 focus:border-purple-600"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">
                  {language === 'ar' ? 'من' : 'of'} {products.length} {language === 'ar' ? 'منتج' : 'products'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  {language === 'ar' 
                    ? `عرض ${startIndex + 1}-${Math.min(endIndex, products.length)} من ${products.length}`
                    : `Showing ${startIndex + 1}-${Math.min(endIndex, products.length)} of ${products.length}`
                  }
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ textAlign: getTextAlign(language) }}>
                        {language === 'ar' ? 'اسم المنتج' : 'Product Name'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ textAlign: getTextAlign(language) }}>
                        {language === 'ar' ? 'السعر (ريال)' : 'Price (SAR)'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ textAlign: getTextAlign(language) }}>
                        {language === 'ar' ? 'الإجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedProducts.map((product: any) => (
                      <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style={{ textAlign: getTextAlign(language) }}>
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ textAlign: getTextAlign(language) }}>
                      {editingProduct?.id === product.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editedProducts[product.id] || product.price}
                          onChange={(e) => handlePriceChange(product.id, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-purple-600 focus:border-purple-600"
                          style={{ textAlign: getTextAlign(language) }}
                        />
                      ) : (
                        `${product.price} ${language === 'ar' ? 'ريال' : 'SAR'}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ textAlign: getTextAlign(language) }}>
                      {editingProduct?.id === product.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSave}
                            disabled={updateProductMutation.isPending}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {updateProductMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              language === 'ar' ? 'حفظ' : 'Save'
                            )}
                          </button>
                          <button
                            onClick={() => setEditingProduct(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePriceEdit(product.id, product.price)}
                          className="text-purple-600 hover:text-purple-900 inline-flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          {language === 'ar' ? 'تعديل' : 'Edit'}
                        </button>
                      )}
                    </td>
                  </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls - Bottom */}
              <div className="flex items-center justify-between mt-4" style={{ direction: getDirection(language) }}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {language === 'ar' ? 'السابق' : 'Previous'}
                  </button>
                  
                  <span className="px-3 py-1 text-sm text-gray-700">
                    {language === 'ar' 
                      ? `صفحة ${currentPage} من ${totalPages}`
                      : `Page ${currentPage} of ${totalPages}`
                    }
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {language === 'ar' ? 'التالي' : 'Next'}
                  </button>
                </div>
              </div>
            </>
        ) : (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد منتجات' : 'No Products Found'}
            </h3>
            <p className="text-gray-600">
              {language === 'ar' 
                ? 'قم برفع ملف المنتجات من قسم الاستيراد'
                : 'Upload products file from Import section'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as UIBadge } from '@/components/ui/badge';
import { type GeneratedInvoice } from "@shared/schema";

interface Driver {
  id: number;
  name: string;
  phone: string;
  username: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  createdAt: string;
  vetsvanCode: string;
  vetsvanName: string;
}



interface NewDriverData {
  vetsvanCode: string;
  vetsvanName: string;
  phone: string;
  username: string;
  password: string;
}

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

// Invoice Card Component with Collapse/Expand functionality
function InvoiceCard({ invoice, language }: { invoice: GeneratedInvoice; language: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInvoiceDetails = async () => {
    if (invoiceDetails) return; // Already loaded
    
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
      {/* Invoice Header - Always Visible */}
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
              <span className="text-gray-400 block text-xs">{invoice.customerPhone}</span>
            </div>
            <div>
              <span className="text-gray-500 block">{language === 'ar' ? 'الطبيب' : 'Doctor'}</span>
              <span className="font-medium">{invoice.doctorName}</span>
            </div>
            <div>
              <span className="text-gray-500 block">VetsVan</span>
              <span className="font-medium">{invoice.vetsVanCode}</span>
            </div>
            <div>
              <span className="text-gray-500 block">{language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}</span>
              <span className="font-medium text-green-600">{Number(invoice.finalTotal)} SAR</span>
            </div>
            <div>
              <span className="text-gray-500 block">{language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid'}</span>
              <span className="font-medium text-blue-600">
                {invoice.totalPaid ? `${invoice.totalPaid} SAR` : '0.00 SAR'}
              </span>
              <span className="text-gray-400 text-xs block mt-1">{language === 'ar' ? 'طرق الدفع' : 'Pay Methods'}</span>
              
              {/* Payment Methods Details */}
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

          {/* Invoice Items Table - Exact copy from Doctor Invoice */}
          {invoiceDetails.invoiceItems && invoiceDetails.invoiceItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {language === 'ar' ? 'بنود الفاتورة' : 'Invoice Items'}
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full mb-4">
                  <thead>
                    <tr className="border-b">
                      {/* Field order for English: Description, Quantity, Unit Price, Discount, VAT, Total Before VAT, Total After VAT */}
                      {/* Field order for Arabic: Total After VAT, Total Before VAT, VAT, Discount, Unit Price, Quantity, Description */}
                      {language === 'ar' ? (
                        // Arabic RTL order
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
                        // English LTR order
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
            </div>
          )}

          {/* Notes */}
          {invoiceDetails.invoiceStatus.notes && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">{language === 'ar' ? 'ملاحظات' : 'Notes'}</h3>
              <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg border">{invoiceDetails.invoiceStatus.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('management'); // 'management', 'shifts', 'reports', 'requests', or 'import'
  const [reportsSubTab, setReportsSubTab] = useState<'analytics' | 'sales'>('analytics'); // Sub-tabs for Reports section
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(false); // New Reports & Analytics dropdown state
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<GeneratedInvoice | null>(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [newLocation, setNewLocation] = useState({ latitude: '', longitude: '' });
  const [showReviewsDialog, setShowReviewsDialog] = useState(false);
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editDriverData, setEditDriverData] = useState<{vetsvanCode: string, vetsvanName: string}>({
    vetsvanCode: "",
    vetsvanName: ""
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importSubTab, setImportSubTab] = useState<'products' | 'services'>('products');
  const [newDriver, setNewDriver] = useState<NewDriverData>({
    vetsvanCode: "",
    vetsvanName: "",
    phone: "",
    username: "",
    password: "",
  });

  // State for tracking notifications and audio
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastRequestCountRef = useRef(0);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);
  
  // State for Excel export
  const [isExporting, setIsExporting] = useState(false);
  
  // State for Date Filter
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // State for VetsVan Requests Filters
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [requestFilterDateFrom, setRequestFilterDateFrom] = useState<Date | undefined>(undefined);
  const [requestFilterDateTo, setRequestFilterDateTo] = useState<Date | undefined>(undefined);
  
  // Pagination State for VetsVan Requests
  const [requestCurrentPage, setRequestCurrentPage] = useState(1);
  const [requestItemsPerPage, setRequestItemsPerPage] = useState(10);

  // Clear Date Filters
  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Clear Request Filters
  const clearRequestFilters = () => {
    setRequestSearchTerm('');
    setRequestFilterDateFrom(undefined);
    setRequestFilterDateTo(undefined);
    setRequestCurrentPage(1); // Reset to first page when clearing filters
  };

  // Excel Export Function
  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/export-sales-report", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const { data, filename } = await response.json();

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Set column widths (updated for individual payment columns - up to 5 payments)
      const columnWidths = [
        { wch: 15 }, // Invoice Number
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Customer Phone
        { wch: 25 }, // Customer Email
        { wch: 15 }, // Doctor Name
        { wch: 12 }, // VetsVan Code
        { wch: 15 }, // Appointment Date
        { wch: 12 }, // Appointment Time
        { wch: 15 }, // Service Type
        { wch: 15 }, // Total Sales
        { wch: 15 }, // Total Paid
        { wch: 12 }, // VAT Amount
        { wch: 15 }, // Discount Amount
        { wch: 15 }, // Generated Date
        { wch: 20 }, // Notes
        { wch: 15 }, // Pet Names
        { wch: 12 }, // Pet Types
        { wch: 8 },  // Item #
        { wch: 25 }, // Description
        { wch: 10 }, // Quantity
        { wch: 15 }, // Unit Price (SAR)
        { wch: 15 }, // Item Total (SAR)
        { wch: 15 }, // Item Discount
        // Payment columns for up to 5 payments
        { wch: 15 }, // Payment Type 1
        { wch: 15 }, // Payment Amount 1 (SAR)
        { wch: 20 }, // Payment Description 1
        { wch: 12 }, // Payment Date 1
        { wch: 12 }, // Payment Time 1
        { wch: 15 }, // Payment Type 2
        { wch: 15 }, // Payment Amount 2 (SAR)
        { wch: 20 }, // Payment Description 2
        { wch: 12 }, // Payment Date 2
        { wch: 12 }, // Payment Time 2
        { wch: 15 }, // Payment Type 3
        { wch: 15 }, // Payment Amount 3 (SAR)
        { wch: 20 }, // Payment Description 3
        { wch: 12 }, // Payment Date 3
        { wch: 12 }, // Payment Time 3
        { wch: 15 }, // Payment Type 4
        { wch: 15 }, // Payment Amount 4 (SAR)
        { wch: 20 }, // Payment Description 4
        { wch: 12 }, // Payment Date 4
        { wch: 12 }, // Payment Time 4
        { wch: 15 }, // Payment Type 5
        { wch: 15 }, // Payment Amount 5 (SAR)
        { wch: 20 }, // Payment Description 5
        { wch: 12 }, // Payment Date 5
        { wch: 12 }  // Payment Time 5
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, language === 'ar' ? 'تقرير المبيعات' : 'Sales Report');

      // Generate Excel file and download
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      saveAs(blob, filename);

      toast({
        title: language === 'ar' ? 'تم التصدير بنجاح' : 'Export Successful',
        description: language === 'ar' ? 'تم تحميل ملف Excel بنجاح' : 'Excel file downloaded successfully',
      });

    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: language === 'ar' ? 'خطأ في التصدير' : 'Export Error',
        description: language === 'ar' ? 'فشل في تصدير البيانات' : 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Template download function
  const downloadTemplate = async (type: 'products' | 'services') => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/download-template/${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_template.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: language === 'ar' ? 'تم التحميل' : 'Downloaded',
        description: language === 'ar' 
          ? `تم تحميل نموذج ${type === 'products' ? 'المنتجات' : 'الخدمات'} بنجاح` 
          : `${type === 'products' ? 'Products' : 'Services'} template downloaded successfully`,
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل النموذج' : 'Failed to download template',
        variant: 'destructive',
      });
    }
  };

  // File upload handler with improved CSV/Excel parsing
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: language === 'ar' ? 'ملف كبير جداً' : 'File Too Large',
        description: language === 'ar' ? 'حجم الملف يجب أن يكون أقل من 10 ميجابايت' : 'File size must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file extension
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: language === 'ar' ? 'نوع ملف غير مدعوم' : 'Unsupported File Type',
        description: language === 'ar' ? 'يرجى رفع ملف CSV أو Excel' : 'Please upload a CSV or Excel file',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setUploadingFile(true);

    try {
      let data: any[] = [];

      if (fileExtension === '.csv') {
        // Use papaparse for CSV files
        const text = await file.text();
        const parseResult = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transform: (value: string, field: string) => {
            // Transform price field to number
            if (field === 'price') {
              return parseFloat(value) || 0;
            }
            return value.trim();
          }
        });

        if (parseResult.errors.length > 0) {
          console.warn('CSV parsing warnings:', parseResult.errors);
        }

        data = parseResult.data;
      } else {
        // For Excel files, we'll need to convert to CSV first or use xlsx library
        // For now, show error for Excel files
        toast({
          title: language === 'ar' ? 'Excel غير مدعوم حالياً' : 'Excel Not Supported Yet',
          description: language === 'ar' ? 'يرجى تحويل الملف إلى CSV أولاً' : 'Please convert to CSV format first',
          variant: 'destructive',
        });
        setUploadingFile(false);
        setSelectedFile(null);
        return;
      }

      // Validate required columns based on import type
      const requiredColumns = importSubTab === 'products' 
        ? ['name', 'price', 'category', 'description']
        : ['name', 'price', 'category', 'description'];

      if (data.length === 0) {
        throw new Error('No data found in file');
      }

      const firstItem = data[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstItem));
      
      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
      }

      // Send to server
      const token = localStorage.getItem("adminToken");
      const response = await fetch('/api/import-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: importSubTab,
          data,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Server error: ${errorData}`);
      }

      const result = await response.json();

      toast({
        title: language === 'ar' ? 'تم الاستيراد بنجاح' : 'Import Successful',
        description: language === 'ar' 
          ? `تم استيراد ${result.imported || 0} عنصر جديد، تحديث ${result.updated || 0} عنصر من ${file.name}`
          : `Imported ${result.imported || 0} new items, updated ${result.updated || 0} items from ${file.name}`,
      });

      // Reset file input
      event.target.value = '';
      setSelectedFile(null);

      // Refresh relevant data
      if (importSubTab === 'services') {
        queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      }

    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: language === 'ar' ? 'خطأ في الاستيراد' : 'Import Error',
        description: language === 'ar' 
          ? `فشل في استيراد البيانات: ${error.message}` 
          : `Failed to import data: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  // Check admin authentication and prevent doctors access
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const regularToken = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // إذا كان المستخدم طبيب، منعه من دخول admin dashboard
    if (user.membershipType === "doctor" || regularToken) {
      toast({
        title: language === 'ar' ? 'غير مسموح' : 'Access Denied',
        description: language === 'ar' ? 'لا يمكن للأطباء الوصول إلى لوحة إدارة النظام' : 'Doctors cannot access admin dashboard',
        variant: 'destructive',
      });
      setLocation("/doctor-dashboard");
      return;
    }
    
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation, toast, language]);

  const adminToken = localStorage.getItem("adminToken");
  const adminData = localStorage.getItem("admin");
  let admin = {};
  try {
    if (adminData && adminData !== "undefined" && adminData !== "null") {
      admin = JSON.parse(adminData);
    }
  } catch (error) {
    console.error('Error parsing admin data:', error);
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
  }

  // Fetch drivers
  const { data: drivers, isLoading, refetch: refetchDrivers } = useQuery({
    queryKey: ["/api/admin/drivers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/drivers", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch drivers");
      return await response.json() as Driver[];
    },
    enabled: !!adminToken,
    staleTime: 0, // Always consider data stale for immediate updates
    cacheTime: 1000, // Keep cache for 1 second only
  });

  // Fetch reports statistics
  const { data: reportsStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/admin/reports"],
    queryFn: async () => {
      const response = await fetch("/api/admin/reports", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch reports stats");
      return await response.json() as {
        totalBookings: number;
        completedBookings: number;
        averageRating: number;
        totalReviews: number;
        totalVetsVans: number;
        availableVetsVans: number;
      };
    },
    enabled: !!adminToken && activeTab === 'reports',
  });

  // Fetch detailed reviews when dialog is open
  const { data: detailedReviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["/api/admin/reviews-details"],
    queryFn: async () => {
      const response = await fetch("/api/admin/reviews-details", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch detailed reviews");
      return await response.json() as Array<{
        id: number;
        rating: number;
        comment: string;
        createdAt: string;
        userName: string;
        userPhone: string;
        vetsvanName: string;
        vetsvanCode: string;
      }>;
    },
    enabled: !!adminToken && showReviewsDialog,
  });

  // Fetch generated invoices for sales report
  const { data: allInvoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["/api/admin/generated-invoices"],
    queryFn: async () => {
      const response = await fetch("/api/admin/generated-invoices", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch generated invoices");
      return await response.json() as GeneratedInvoice[];
    },
    enabled: !!adminToken && activeTab === 'reports' && reportsSubTab === 'sales',
  });

  // Filter invoices by date range
  const generatedInvoices = allInvoices?.filter(invoice => {
    if (!dateFrom && !dateTo) return true;
    
    const invoiceDate = new Date(invoice.createdAt);
    const fromMatch = !dateFrom || invoiceDate >= dateFrom;
    const toMatch = !dateTo || invoiceDate <= dateTo;
    
    return fromMatch && toMatch;
  });

  // Fetch all VetsVan requests with real-time notifications
  const { data: allVetsVanRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/admin/vetsvan-requests"],
    queryFn: async () => {
      const response = await fetch("/api/admin/vetsvan-requests", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch VetsVan requests");
      return await response.json() as Array<{
        id: number;
        customerName: string;
        customerPhone: string;
        customerEmail: string;
        vetsvanCode: string;
        vetsvanName: string;
        appointmentDate: string;
        appointmentTime: string;
        status: string;
        location: any;
        pets: Array<{
          name: string;
          type: string;
        }>;
        serviceType: string;
        createdAt: string;
      }>;
    },
    enabled: !!adminToken,
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
    refetchIntervalInBackground: true,
  });

  // Filter VetsVan requests based on search term and date
  const filteredVetsVanRequests = allVetsVanRequests?.filter(request => {
    // Search filter - check name, phone, email, pets, vetsvan
    const searchMatch = !requestSearchTerm || 
      request.customerName.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
      request.customerPhone.includes(requestSearchTerm) ||
      request.customerEmail.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
      request.vetsvanCode.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
      request.vetsvanName.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
      request.pets?.some(pet => 
        pet.name.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
        pet.type.toLowerCase().includes(requestSearchTerm.toLowerCase())
      );

    // Date filter - check appointment date within range (compare dates only, ignore time)
    const appointmentDate = new Date(request.appointmentDate);
    const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    
    let dateMatch = true;
    if (requestFilterDateFrom || requestFilterDateTo) {
      const fromDateOnly = requestFilterDateFrom ? new Date(requestFilterDateFrom.getFullYear(), requestFilterDateFrom.getMonth(), requestFilterDateFrom.getDate()) : null;
      const toDateOnly = requestFilterDateTo ? new Date(requestFilterDateTo.getFullYear(), requestFilterDateTo.getMonth(), requestFilterDateTo.getDate()) : null;
      
      dateMatch = (!fromDateOnly || appointmentDateOnly >= fromDateOnly) &&
                  (!toDateOnly || appointmentDateOnly <= toDateOnly);
    }

    return searchMatch && dateMatch;
  });

  // Pagination calculations for VetsVan requests
  const totalRequestsCount = filteredVetsVanRequests?.length || 0;
  const totalRequestPages = Math.ceil(totalRequestsCount / requestItemsPerPage);
  const requestStartIndex = (requestCurrentPage - 1) * requestItemsPerPage;
  const requestEndIndex = requestStartIndex + requestItemsPerPage;
  const vetsVanRequests = filteredVetsVanRequests?.slice(requestStartIndex, requestEndIndex) || [];

  // Pagination handlers for VetsVan requests
  const handleRequestPageChange = (newPage: number) => {
    setRequestCurrentPage(newPage);
  };

  const handleRequestItemsPerPageChange = (newItemsPerPage: number) => {
    setRequestItemsPerPage(newItemsPerPage);
    setRequestCurrentPage(1); // Reset to first page
  };

  // Reset to first page when filters change
  useEffect(() => {
    setRequestCurrentPage(1);
  }, [requestSearchTerm, requestFilterDateFrom, requestFilterDateTo]);

  // Monitor for new requests and trigger notifications
  useEffect(() => {
    if (allVetsVanRequests && allVetsVanRequests.length > 0) {
      const currentCount = allVetsVanRequests.length;
      
      // Check if there are new requests
      if (lastRequestCountRef.current > 0 && currentCount > lastRequestCountRef.current) {
        const newRequestsCount = currentCount - lastRequestCountRef.current;
        
        // Play audio notification if enabled
        if (audioEnabled) {
          playBookingNotification();
        }
        
        // Show toast notification for new requests
        toast({
          title: language === 'ar' ? '🔔 طلب جديد!' : '🔔 New Request!',
          description: language === 'ar' 
            ? `تم استلام ${newRequestsCount} طلب جديد من العملاء` 
            : `${newRequestsCount} new customer request(s) received`,
          duration: 5000,
        });
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(
            language === 'ar' ? 'VETS VAN - طلب جديد' : 'VETS VAN - New Request',
            {
              body: language === 'ar' 
                ? `${newRequestsCount} طلب جديد من العملاء` 
                : `${newRequestsCount} new customer request(s)`,
              icon: '/favicon.ico'
            }
          );
        }
      }
      
      lastRequestCountRef.current = currentCount;
      setCurrentRequestCount(currentCount);
    }
  }, [allVetsVanRequests, audioEnabled, language, toast]);

  // Request browser notification permission on component mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Add driver mutation
  const addDriverMutation = useMutation({
    mutationFn: async (data: NewDriverData) => {
      const response = await fetch("/api/admin/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add driver");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      setNewDriver({ vetsvanCode: "", vetsvanName: "", phone: "", username: "", password: "" });
      setShowAddForm(false);
      toast({
        title: t('vetsVanAddedSuccess'),
        description: t('vetsVanAddedDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToAddVetsVan'),
        variant: "destructive",
      });
    },
  });

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ driverId, isAvailable }: { driverId: number; isAvailable: boolean }) => {
      await apiRequest(`/api/admin/drivers/${driverId}/availability`, {
        method: "PUT",
        body: JSON.stringify({ isAvailable }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      toast({
        title: t('statusUpdated'),
        description: t('driverStatusChanged'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToUpdateStatus'),
        variant: "destructive",
      });
    },
  });

  // Edit driver mutation
  const editDriverMutation = useMutation({
    mutationFn: async ({ driverId, data }: { driverId: number; data: {vetsvanCode: string, vetsvanName: string} }) => {
      await apiRequest(`/api/admin/drivers/${driverId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: async () => {
      // Clear cache completely
      queryClient.removeQueries({ queryKey: ["/api/admin/drivers"] });
      // Force immediate refresh
      await refetchDrivers();
      setShowEditDialog(false);
      setEditingDriver(null);
      toast({
        title: language === 'ar' ? 'تم التحديث بنجاح' : 'Updated Successfully',
        description: language === 'ar' ? 'تم تحديث بيانات VetsVan بنجاح في القائمة' : 'VetsVan data successfully updated in the list',
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: language === 'ar' ? 'فشل في تحديث البيانات' : 'Failed to update data',
        variant: "destructive",
      });
    },
  });

  // Delete driver mutation
  const deleteDriverMutation = useMutation({
    mutationFn: async (driverId: number) => {
      await apiRequest(`/api/admin/drivers/${driverId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      toast({
        title: t('vetsVanDeleted'),
        description: t('vetsVanDeletedDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToDeleteVetsVan'),
        variant: "destructive",
      });
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ driverId, latitude, longitude }: { driverId: number; latitude: number; longitude: number }) => {
      await apiRequest(`/api/admin/drivers/${driverId}/location`, {
        method: "PUT",
        body: JSON.stringify({ latitude, longitude }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      setShowLocationDialog(false);
      setSelectedDriver(null);
      setNewLocation({ latitude: '', longitude: '' });
      toast({
        title: language === 'ar' ? 'تم تحديث الموقع' : 'Location Updated',
        description: language === 'ar' ? 'تم تحديث موقع المركبة بنجاح' : 'VetsVan location updated successfully',
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: language === 'ar' ? 'فشل في تحديث الموقع' : 'Failed to update location',
        variant: "destructive",
      });
    },
  });

  // Send SMS mutation
  const sendSmsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/admin/send-sms", {
        method: "POST",
        body: JSON.stringify({ 
          message: "test sms from Taqnyat.sa , for testing internet sms service",
          phoneNumber: "966548336693" // Test number
        }),
      });
    },
    onSuccess: () => {
      setShowSmsDialog(false);
      toast({
        title: language === 'ar' ? 'تم إرسال الرسالة' : 'SMS Sent',
        description: language === 'ar' ? 'تم إرسال الرسالة النصية بنجاح للرقم 966548336693' : 'SMS message sent successfully to 966548336693',
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: language === 'ar' ? 'فشل في إرسال الرسالة النصية' : 'Failed to send SMS message',
        variant: "destructive",
      });
    },
  });

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      const response = await fetch(`/api/admin/booking/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update booking status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vetsvan-requests"] });
      toast({
        title: language === 'ar' ? 'تم تحديث الحالة' : 'Status Updated',
        description: language === 'ar' ? 'تم تحديث حالة الحجز بنجاح' : 'Booking status updated successfully',
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: language === 'ar' ? 'فشل في تحديث حالة الحجز' : 'Failed to update booking status',
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    setLocation("/admin-login");
  };

  const handleLocationClick = (driver: Driver) => {
    setSelectedDriver(driver);
    setNewLocation({
      latitude: driver.latitude.toString(),
      longitude: driver.longitude.toString()
    });
    setShowLocationDialog(true);
  };

  const handleLocationUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver || !newLocation.latitude || !newLocation.longitude) return;

    const latitude = parseFloat(newLocation.latitude);
    const longitude = parseFloat(newLocation.longitude);

    if (isNaN(latitude) || isNaN(longitude)) {
      toast({
        title: t('error'),
        description: language === 'ar' ? 'يرجى إدخال أرقام صحيحة للموقع' : 'Please enter valid location numbers',
        variant: "destructive",
      });
      return;
    }

    updateLocationMutation.mutate({
      driverId: selectedDriver.id,
      latitude,
      longitude
    });
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    sendSmsMutation.mutate();
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver.vetsvanCode || !newDriver.vetsvanName || !newDriver.phone || !newDriver.username || !newDriver.password) {
      toast({
        title: t('error'),
        description: t('fillAllFields'),
        variant: "destructive",
      });
      return;
    }
    addDriverMutation.mutate(newDriver);
  };

  const handleEditClick = (driver: Driver) => {
    setEditingDriver(driver);
    setEditDriverData({
      vetsvanCode: (driver as any).vetsvanCode || '',
      vetsvanName: (driver as any).vetsvanName || ''
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver || !editDriverData.vetsvanCode || !editDriverData.vetsvanName) {
      toast({
        title: t('error'),
        description: language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
        variant: "destructive",
      });
      return;
    }
    editDriverMutation.mutate({
      driverId: editingDriver.id,
      data: editDriverData
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={getDirection(language)}>
      {/* Logo positioned above sidebar */}
      <div className="absolute top-0 left-0 z-10 p-4">
        <img 
          src={vetsVanLogo} 
          alt="VETS VAN" 
          className="h-16 w-auto object-contain"
        />
      </div>

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center py-6">
            <div className="flex items-center gap-4">
              <LanguageSelector />
              
              {/* Audio notification toggle */}
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-2 rounded-full transition-colors duration-200 ${
                  audioEnabled 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={audioEnabled 
                  ? (language === 'ar' ? 'إيقاف الإشعارات الصوتية' : 'Disable audio notifications') 
                  : (language === 'ar' ? 'تفعيل الإشعارات الصوتية' : 'Enable audio notifications')
                }
              >
                {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>

              {/* Notifications counter */}
              {currentRequestCount > 0 && (
                <div className="relative">
                  <Bell className="h-6 w-6 text-purple-600" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {currentRequestCount > 99 ? '99+' : currentRequestCount}
                  </span>
                </div>
              )}
              
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

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="mt-20 px-2">
            <button
              onClick={() => setActiveTab('management')}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full ${
                activeTab === 'management'
                  ? 'bg-purple-600 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Car className="ml-3 h-6 w-6" />
              {language === 'ar' ? 'إدارة VETS VAN' : 'Vets Van Management'}
            </button>
            <button
              onClick={() => setLocation('/vets-van-shifts')}
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Clock className="ml-3 h-6 w-6" />
              {language === 'ar' ? 'مناوبات VETS VAN' : 'Vets Van Shifts'}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full mt-2 ${
                activeTab === 'reports'
                  ? 'bg-purple-600 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="ml-3 h-6 w-6" />
              {language === 'ar' ? 'التقارير' : 'Reports'}
            </button>
            {/* New Reports & Analytics Dropdown */}
            <div className="mt-2">
              <button
                onClick={() => setIsNewReportsExpanded(!isNewReportsExpanded)}
                className="group flex items-center px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <TrendingUp className="ml-3 h-6 w-6" />
                <span className="flex-1 text-left">
                  {language === 'ar' ? 'تقارير وتحليلات جديدة' : 'New Reports & Analytics'}
                </span>
                {isNewReportsExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {/* Dropdown Items */}
              {isNewReportsExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  <button
                    onClick={() => setLocation('/new-reports-analytics/sales-report')}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <BarChart3 className="ml-3 h-5 w-5" />
                    {language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setActiveTab('requests')}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full mt-2 ${
                activeTab === 'requests'
                  ? 'bg-purple-600 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <FileText className="ml-3 h-6 w-6" />
              {language === 'ar' ? 'طلبات VETS VAN' : 'Vets Van Requests'}
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full mt-2 ${
                activeTab === 'import'
                  ? 'bg-purple-600 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Upload className="ml-3 h-6 w-6" />
              {language === 'ar' ? 'استيراد البيانات' : 'Import'}
            </button>
            <button
              onClick={() => setLocation('/admin-dashboard/services')}
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Stethoscope className="ml-3 h-6 w-6" />
              {language === 'ar' ? 'الخدمات' : 'Services'}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full mt-2 ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Package className="ml-3 h-6 w-6" />
              {language === 'ar' ? 'المنتجات' : 'Products'}
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-3 pl-1 pr-6 lg:pr-8">
            <div className="px-1 py-3 sm:px-0">
              {activeTab === 'management' && (
                <div>
                  {/* Add Driver Section */}
                  <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">{t('vetsVanManagement')}</h3>
                        <button
                          onClick={() => setShowAddForm(!showAddForm)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-600"
                        >
                          <UserPlus className="h-4 w-4 ml-2" />
                          {t('addNewVetsVan')}
                        </button>
                      </div>

                      {showAddForm && (
                        <form onSubmit={handleAddDriver} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">VetsVan Code</label>
                            <input
                              type="text"
                              value={newDriver.vetsvanCode}
                              onChange={(e) => setNewDriver({ ...newDriver, vetsvanCode: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-#852085 focus:border-purple-600 sm:text-sm"
                              placeholder="V001"
                              style={{ textAlign: getTextAlign(language) }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">VetsVan Name</label>
                            <input
                              type="text"
                              value={newDriver.vetsvanName}
                              onChange={(e) => setNewDriver({ ...newDriver, vetsvanName: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-#852085 focus:border-purple-600 sm:text-sm"
                              placeholder="VETS VAN 1"
                              style={{ textAlign: getTextAlign(language) }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('phoneNumber')}</label>
                            <input
                              type="tel"
                              value={newDriver.phone}
                              onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-#852085 focus:border-purple-600 sm:text-sm"
                              placeholder="05xxxxxxxx"
                              style={{ textAlign: getTextAlign(language) }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('username')}</label>
                            <input
                              type="text"
                              value={newDriver.username}
                              onChange={(e) => setNewDriver({ ...newDriver, username: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-#852085 focus:border-purple-600 sm:text-sm"
                              placeholder={t('username')}
                              style={{ textAlign: getTextAlign(language) }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('password')}</label>
                            <input
                              type="password"
                              value={newDriver.password}
                              onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-#852085 focus:border-purple-600 sm:text-sm"
                              placeholder={t('password')}
                              style={{ textAlign: getTextAlign(language) }}
                            />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-5">
                            <button
                              type="submit"
                              disabled={addDriverMutation.isPending}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            >
                              {addDriverMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                              ) : (
                                t('addVetsVan')
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Drivers List */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">{t('currentVetsVans')}</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">{t('totalVetsVans')}: {drivers?.length || 0}</p>
                    </div>
                    <ul className="divide-y divide-gray-200">
                      {drivers?.map((driver) => (
                        <li key={driver.id} className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
                                  <span className="text-sm font-medium text-purple-600">
                                    {driver.name?.charAt(0) || 'V'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{(driver as any).vetsvanName || driver.name}</div>
                                <div className="text-sm text-gray-500">{driver.phone}</div>
                                <div className="text-sm text-gray-500">@{(driver as any).vetsvanCode || driver.username}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  driver.isAvailable
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {driver.isAvailable ? t('available') : t('notAvailable')}
                              </span>
                              <button
                                onClick={() =>
                                  toggleAvailabilityMutation.mutate({
                                    driverId: driver.id,
                                    isAvailable: !driver.isAvailable,
                                  })
                                }
                                className="text-sm text-purple-600 hover:text-purple-600"
                              >
                                {t('changeStatus')}
                              </button>
                              <button
                                onClick={() => handleLocationClick(driver)}
                                className="text-sm text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                              >
                                <MapPin className="w-3 h-3" />
                                {language === 'ar' ? 'تحديد الموقع' : 'Set Location'}
                              </button>
                              <button
                                onClick={() => handleEditClick(driver)}
                                className="text-sm text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                {language === 'ar' ? 'تعديل' : 'Edit'}
                              </button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button className="text-sm text-red-600 hover:text-red-900 inline-flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" />
                                    {t('delete')}
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('deleteVetsVanConfirm')} {(driver as any).vetsvanCode} - {(driver as any).vetsvanName}?
                                      <br />
                                      {t('deleteWarning')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteDriverMutation.mutate(driver.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {t('deleteConfirm')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div>
                  {/* Reports Section */}
                  <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                        {language === 'ar' ? 'التقارير والإحصائيات' : 'Reports & Analytics'}
                      </h3>

                      {/* Sub-tabs for Reports */}
                      <div className="mb-6">
                        <div className="border-b border-gray-200">
                          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button
                              onClick={() => setReportsSubTab('analytics')}
                              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                                reportsSubTab === 'analytics'
                                  ? 'border-purple-500 text-purple-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {language === 'ar' ? 'تحليلات وإحصائيات' : 'Analytics'}
                            </button>
                            <button
                              onClick={() => setReportsSubTab('sales')}
                              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                                reportsSubTab === 'sales'
                                  ? 'border-purple-500 text-purple-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}
                            </button>
                            <button
                              onClick={() => setLocation('/sales-reports')}
                              className="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            >
                              {language === 'ar' ? 'تقارير المبيعات' : 'Sales Reports'}
                            </button>
                          </nav>
                        </div>
                      </div>
                      
                      {/* Analytics Tab Content */}
                      {reportsSubTab === 'analytics' && (
                        <>
                          {isLoadingStats ? (
                            <div className="flex justify-center py-12">
                              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                            </div>
                          ) : (
                            <>
                          {/* Stats Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-6 text-white">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium opacity-90">
                                    {language === 'ar' ? 'إجمالي VETS VAN' : 'Total Vets Vans'}
                                  </h4>
                                  <p className="text-2xl font-bold">{reportsStats?.totalVetsVans || 0}</p>
                                </div>
                                <Car className="h-8 w-8 opacity-80" />
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-6 text-white">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium opacity-90">
                                    {language === 'ar' ? 'VETS VAN متاحة' : 'Available Vets Vans'}
                                  </h4>
                                  <p className="text-2xl font-bold">{reportsStats?.availableVetsVans || 0}</p>
                                </div>
                                <Shield className="h-8 w-8 opacity-80" />
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg p-6 text-white">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium opacity-90">
                                    {language === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}
                                  </h4>
                                  <p className="text-2xl font-bold">{reportsStats?.totalBookings || 0}</p>
                                </div>
                                <Clock className="h-8 w-8 opacity-80" />
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-purple-600 to-purple-600 rounded-lg p-6 text-white">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium opacity-90">
                                    {language === 'ar' ? 'الحجوزات المكتملة' : 'Completed Bookings'}
                                  </h4>
                                  <p className="text-2xl font-bold">{reportsStats?.completedBookings || 0}</p>
                                </div>
                                <BarChart3 className="h-8 w-8 opacity-80" />
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-6 text-white">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium opacity-90">
                                    {language === 'ar' ? 'متوسط التقييم' : 'Average Rating'}
                                  </h4>
                                  <p className="text-2xl font-bold">{reportsStats?.averageRating || 0}</p>
                                </div>
                                <div className="text-yellow-200 text-2xl">★</div>
                              </div>
                            </div>

                            <div 
                              className="bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-lg p-6 text-white cursor-pointer hover:shadow-lg transition-shadow duration-200"
                              onClick={() => setShowReviewsDialog(true)}
                            >
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium opacity-90">
                                    {language === 'ar' ? 'إجمالي التقييمات' : 'Total Reviews'}
                                  </h4>
                                  <p className="text-2xl font-bold">{reportsStats?.totalReviews || 0}</p>
                                  <p className="text-xs opacity-75 mt-1">
                                    {language === 'ar' ? 'اضغط لرؤية التفاصيل' : 'Click to view details'}
                                  </p>
                                </div>
                                <div className="text-indigo-200 text-2xl">💬</div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* Performance Summary */}
                      {!isLoadingStats && reportsStats && (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">
                            {language === 'ar' ? 'ملخص الأداء' : 'Performance Summary'}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                {language === 'ar' ? 'معدل إتمام الحجوزات' : 'Booking Completion Rate'}
                              </h5>
                              <div className="bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-green-500 h-3 rounded-full" 
                                  style={{ 
                                    width: `${reportsStats.totalBookings > 0 ? (reportsStats.completedBookings / reportsStats.totalBookings) * 100 : 0}%` 
                                  }}
                                ></div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {reportsStats.totalBookings > 0 ? Math.round((reportsStats.completedBookings / reportsStats.totalBookings) * 100) : 0}%
                              </p>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                {language === 'ar' ? 'معدل توفر VETS VAN' : 'Vets Van Availability'}
                              </h5>
                              <div className="bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-blue-500 h-3 rounded-full" 
                                  style={{ 
                                    width: `${reportsStats.totalVetsVans > 0 ? (reportsStats.availableVetsVans / reportsStats.totalVetsVans) * 100 : 0}%` 
                                  }}
                                ></div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {reportsStats.totalVetsVans > 0 ? Math.round((reportsStats.availableVetsVans / reportsStats.totalVetsVans) * 100) : 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                            )}
                        </>
                      )}

                      {/* Sales Report Tab Content */}
                      {reportsSubTab === 'sales' && (
                        <>
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
                        </>
                      )}
                      
                      {/* SMS Communication Section - Show in both tabs */}
                      <div className="bg-white border rounded-lg p-6 mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900">
                            {language === 'ar' ? 'إرسال الرسائل النصية' : 'SMS Communication'}
                          </h4>
                          <MessageSquare className="h-6 w-6 text-purple-600" />
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          {language === 'ar' ? 'إرسال رسائل نصية للعملاء باستخدام منصة تقنيات' : 'Send SMS messages to customers using Taqnyat platform'}
                        </p>
                        <button
                          onClick={() => setShowSmsDialog(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-600"
                        >
                          <MessageSquare className="h-4 w-4 ml-2" />
                          {language === 'ar' ? 'إرسال رسالة نصية' : 'Send SMS Message'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VetsVan Requests Tab - Cards Layout */}
              {activeTab === 'requests' && (
                <div className="space-y-3" dir={getDirection(language)}>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ textAlign: getTextAlign(language) }}>
                      {language === 'ar' ? 'جميع طلبات VETS VAN' : 'All VetsVan Requests'}
                    </h2>
                    <p className="text-gray-600" style={{ textAlign: getTextAlign(language) }}>
                      {language === 'ar' ? 'عرض جميع طلبات العملاء لكل سيارات VETS VAN' : 'View all customer requests for all VetsVan vehicles'}
                    </p>
                  </div>

                  {/* Filters Section */}
                  <div className="bg-white p-4 rounded-lg border-2 shadow-sm" style={{ borderColor: '#852085' }}>
                    <h3 className="text-lg font-medium text-gray-900 mb-3" style={{ textAlign: getTextAlign(language) }}>
                      {language === 'ar' ? 'فلاتر البحث' : 'Search Filters'}
                    </h3>
                    
                    <div className="space-y-2">
                      {/* Search Field - Full Width */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' ? 'البحث (اسم، هاتف، إيميل، حيوانات أليفة، VetsVan)' : 'Search (Name, Phone, Email, Pets, VetsVan)'}
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={requestSearchTerm}
                            onChange={(e) => setRequestSearchTerm(e.target.value)}
                            placeholder={language === 'ar' ? 'ابحث في جميع الحقول...' : 'Search all fields...'}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                            style={{ textAlign: getTextAlign(language) }}
                          />
                        </div>
                      </div>

                      {/* Date Range Filter - Full Width Below Search */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' ? 'فلتر بتاريخ الموعد (من - إلى)' : 'Filter by Appointment Date (From - To)'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* From Date */}
                          <div className="space-y-1">
                            <label className="text-xs text-gray-500">
                              {language === 'ar' ? 'من تاريخ' : 'From Date'}
                            </label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal border-gray-300 hover:border-purple-600 h-10"
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {requestFilterDateFrom ? (
                                    format(requestFilterDateFrom, language === 'ar' ? 'dd/MM/yyyy' : 'MM/dd/yyyy')
                                  ) : (
                                    <span className="text-gray-500">
                                      {language === 'ar' ? 'من' : 'From'}
                                    </span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={requestFilterDateFrom}
                                  onSelect={(date) => {
                                    // If "To Date" is selected and new "From Date" is after "To Date", reset "To Date"
                                    if (date && requestFilterDateTo && date > requestFilterDateTo) {
                                      setRequestFilterDateTo(undefined);
                                    }
                                    setRequestFilterDateFrom(date);
                                  }}
                                  disabled={(date) => requestFilterDateTo ? date > requestFilterDateTo : false}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* To Date */}
                          <div className="space-y-1">
                            <label className="text-xs text-gray-500">
                              {language === 'ar' ? 'إلى تاريخ' : 'To Date'}
                            </label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal border-gray-300 hover:border-purple-600 h-10"
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {requestFilterDateTo ? (
                                    format(requestFilterDateTo, language === 'ar' ? 'dd/MM/yyyy' : 'MM/dd/yyyy')
                                  ) : (
                                    <span className="text-gray-500">
                                      {language === 'ar' ? 'إلى' : 'To'}
                                    </span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={requestFilterDateTo}
                                  onSelect={(date) => {
                                    // If "From Date" is selected and new "To Date" is before "From Date", reset "From Date"
                                    if (date && requestFilterDateFrom && date < requestFilterDateFrom) {
                                      setRequestFilterDateFrom(undefined);
                                    }
                                    setRequestFilterDateTo(date);
                                  }}
                                  disabled={(date) => requestFilterDateFrom ? date < requestFilterDateFrom : false}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Filter Actions and Results Counter */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-2">
                        {(requestSearchTerm || requestFilterDateFrom || requestFilterDateTo) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearRequestFilters}
                            className="h-8 px-2 lg:px-3"
                          >
                            <X className="h-4 w-4" />
                            <span className="ml-1 text-xs">
                              {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
                            </span>
                          </Button>
                        )}
                      </div>

                      <div className="text-sm text-gray-500">
                        {language === 'ar' 
                          ? `عرض ${requestStartIndex + 1}-${Math.min(requestEndIndex, totalRequestsCount)} من ${totalRequestsCount} طلب` 
                          : `Showing ${requestStartIndex + 1}-${Math.min(requestEndIndex, totalRequestsCount)} of ${totalRequestsCount} requests`
                        }
                      </div>
                    </div>
                  </div>

                  {isLoadingRequests ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                      <span className="ml-2 text-purple-600">
                        {language === 'ar' ? 'جارٍ تحميل الطلبات...' : 'Loading requests...'}
                      </span>
                    </div>
                  ) : vetsVanRequests && vetsVanRequests.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      {vetsVanRequests.map((request) => (
                        <Card key={request.id} className="border-2 hover:shadow-md transition-all duration-200" style={{ borderColor: '#852085' }}>
                          <CardHeader className="pb-2 pt-3 px-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <CardTitle className="text-sm flex items-center gap-1">
                                  <User className="h-3 w-3 text-purple-600" />
                                  <span className="text-gray-900 truncate">{request.customerName}</span>
                                </CardTitle>
                                <div className="flex items-center gap-1 mt-1">
                                  <Phone className="h-3 w-3 text-gray-500" />
                                  <span className="text-xs text-gray-600">{request.customerPhone}</span>
                                </div>
                              </div>
                              <UIBadge 
                                variant={
                                  request.status === 'confirmed' ? 'default' :
                                  request.status === 'pending_review' ? 'secondary' :
                                  request.status === 'cancelled' ? 'destructive' : 'outline'
                                }
                                className="text-xs px-1 py-0"
                              >
                                {request.status === 'confirmed' && (language === 'ar' ? 'مؤكد' : 'Confirmed')}
                                {request.status === 'pending_review' && (language === 'ar' ? 'قيد المراجعة' : 'Pending Review')}
                                {request.status === 'cancelled' && (language === 'ar' ? 'ملغي' : 'Cancelled')}
                                {!['confirmed', 'pending_review', 'cancelled'].includes(request.status) && request.status}
                              </UIBadge>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-2 px-3 pb-3">
                            {/* VetsVan Info */}
                            <div className="bg-purple-50 rounded p-1">
                              <div className="flex items-center gap-1">
                                <div className="w-1 h-1 bg-purple-600 rounded-full"></div>
                                <span className="text-xs font-medium text-purple-700">
                                  {request.vetsvanCode}
                                </span>
                              </div>
                            </div>

                            {/* Appointment Details */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-blue-600" />
                                <span className="text-xs text-gray-600 truncate">
                                  {new Date(request.appointmentDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-blue-600" />
                                <span className="text-xs text-gray-600">{request.appointmentTime}</span>
                              </div>
                            </div>

                            {/* Service Type */}
                            <div className="bg-blue-50 rounded p-1">
                              <span className="text-xs text-blue-700">
                                {request.serviceType === 'general_checkup' && (language === 'ar' ? 'كشف' : 'Check')}
                                {request.serviceType === 'grooming' && (language === 'ar' ? 'تنظيف' : 'Groom')}
                                {!['general_checkup', 'grooming'].includes(request.serviceType) && request.serviceType}
                              </span>
                            </div>

                            {/* Pets */}
                            {request.pets && request.pets.length > 0 && (
                              <div className="bg-green-50 rounded p-1">
                                <div className="flex flex-wrap gap-1">
                                  {request.pets.map((pet, index) => (
                                    <span key={index} className="text-xs text-green-700 bg-green-100 px-1 rounded">
                                      {pet.name}
                                      {pet.type === 'cat' && ' 🐱'}
                                      {pet.type === 'dog' && ' 🐶'}
                                      {pet.type === 'bird' && ' 🐦'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Status Update */}
                            <div className="bg-gray-50 rounded p-1">
                              <select
                                value={request.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  updateBookingStatusMutation.mutate({ 
                                    bookingId: request.id, 
                                    status: newStatus 
                                  });
                                }}
                                disabled={updateBookingStatusMutation.isPending}
                                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-600 bg-white"
                                style={{ textAlign: getTextAlign(language) }}
                              >
                                <option value="pending_review">
                                  {language === 'ar' ? 'قيد المراجعة' : 'Pending Review'}
                                </option>
                                <option value="confirmed">
                                  {language === 'ar' ? 'مؤكد' : 'Confirmed'}
                                </option>
                                <option value="cancelled">
                                  {language === 'ar' ? 'ملغي' : 'Cancelled'}
                                </option>
                              </select>
                            </div>

                            {/* Created Date */}
                            <div className="border-t pt-1 mt-1">
                              <div className="text-xs text-gray-400 text-center">
                                {new Date(request.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">
                        {language === 'ar' ? 'لا توجد طلبات حتى الآن' : 'No requests found'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {language === 'ar' ? 'لم يتم تقديم أي طلبات VETS VAN بعد' : 'No VetsVan requests have been made yet'}
                      </p>
                    </div>
                  )}

                  {/* Pagination Controls for VetsVan Requests */}
                  {vetsVanRequests && totalRequestsCount > 0 && (
                    <div className="bg-white border-t px-4 py-3 flex items-center justify-between sm:px-6 mt-4">
                      <div className="flex-1 flex justify-between sm:hidden">
                        {/* Mobile Previous/Next */}
                        <button
                          onClick={() => handleRequestPageChange(requestCurrentPage - 1)}
                          disabled={requestCurrentPage === 1}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                            requestCurrentPage === 1
                              ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {language === 'ar' ? 'السابق' : 'Previous'}
                        </button>
                        <button
                          onClick={() => handleRequestPageChange(requestCurrentPage + 1)}
                          disabled={requestCurrentPage === totalRequestPages}
                          className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                            requestCurrentPage === totalRequestPages
                              ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {language === 'ar' ? 'التالي' : 'Next'}
                        </button>
                      </div>

                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between" style={{ direction: getDirection(language) }}>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-700">
                            {language === 'ar'
                              ? `عرض ${requestStartIndex + 1} إلى ${Math.min(requestEndIndex, totalRequestsCount)} من ${totalRequestsCount} طلب`
                              : `Showing ${requestStartIndex + 1} to ${Math.min(requestEndIndex, totalRequestsCount)} of ${totalRequestsCount} requests`
                            }
                          </div>
                          
                          {/* Items per page selector */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">
                              {language === 'ar' ? 'عرض:' : 'Show:'}
                            </span>
                            <select
                              value={requestItemsPerPage}
                              onChange={(e) => handleRequestItemsPerPageChange(Number(e.target.value))}
                              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                            >
                              <option value={10}>10</option>
                              <option value={50}>50</option>
                              <option value={100}>100</option>
                            </select>
                            <span className="text-sm text-gray-700">
                              {language === 'ar' ? 'طلب في الصفحة' : 'per page'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Previous Button */}
                          <button
                            onClick={() => handleRequestPageChange(requestCurrentPage - 1)}
                            disabled={requestCurrentPage === 1}
                            className={`relative inline-flex items-center px-3 py-2 rounded-md border text-sm font-medium ${
                              requestCurrentPage === 1
                                ? 'bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-purple-600'
                            }`}
                          >
                            <ChevronDown className={`h-4 w-4 ${language === 'ar' ? 'rotate-90' : '-rotate-90'}`} />
                            <span className="ml-1">{language === 'ar' ? 'السابق' : 'Previous'}</span>
                          </button>

                          {/* Page Numbers */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalRequestPages }, (_, i) => i + 1)
                              .filter(page => {
                                // Show first page, last page, current page, and pages around current
                                return page === 1 || 
                                       page === totalRequestPages || 
                                       Math.abs(page - requestCurrentPage) <= 1;
                              })
                              .map((page, index, array) => {
                                // Add ellipsis if there's a gap
                                const showEllipsis = index > 0 && page - array[index - 1] > 1;
                                return (
                                  <div key={page} className="flex items-center">
                                    {showEllipsis && (
                                      <span className="px-2 py-1 text-gray-500">...</span>
                                    )}
                                    <button
                                      onClick={() => handleRequestPageChange(page)}
                                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                                        page === requestCurrentPage
                                          ? 'bg-purple-600 text-white border border-purple-600'
                                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-purple-600'
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  </div>
                                );
                              })}
                          </div>

                          {/* Next Button */}
                          <button
                            onClick={() => handleRequestPageChange(requestCurrentPage + 1)}
                            disabled={requestCurrentPage === totalRequestPages}
                            className={`relative inline-flex items-center px-3 py-2 rounded-md border text-sm font-medium ${
                              requestCurrentPage === totalRequestPages
                                ? 'bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-purple-600'
                            }`}
                          >
                            <span className="mr-1">{language === 'ar' ? 'التالي' : 'Next'}</span>
                            <ChevronDown className={`h-4 w-4 ${language === 'ar' ? '-rotate-90' : 'rotate-90'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Import Tab */}
              {activeTab === 'import' && (
                <div>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6" style={{ textAlign: getTextAlign(language) }}>
                        {language === 'ar' ? 'استيراد البيانات' : 'Import Data'}
                      </h3>
                      
                      {/* Sub Tabs */}
                      <div className="flex border-b border-gray-200 mb-6">
                        <button
                          onClick={() => setImportSubTab('products')}
                          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                            importSubTab === 'products'
                              ? 'border-purple-600 text-purple-600 #85208550'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {language === 'ar' ? '📦 المنتجات' : '📦 Products'}
                        </button>
                        <button
                          onClick={() => setImportSubTab('services')}
                          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                            importSubTab === 'services'
                              ? 'border-purple-600 text-purple-600 #85208550'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {language === 'ar' ? '🩺 الخدمات' : '🩺 Services'}
                        </button>
                      </div>
                      
                      {/* Upload Section */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-600 transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' 
                            ? `ارفع ملف ${importSubTab === 'products' ? 'المنتجات' : 'الخدمات'}` 
                            : `Upload ${importSubTab === 'products' ? 'Products' : 'Services'} File`
                          }
                        </p>
                        <p className="text-sm text-gray-500 mb-4" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' 
                            ? `يمكنك رفع ملفات Excel أو CSV تحتوي على بيانات ${importSubTab === 'products' ? 'المنتجات' : 'الخدمات'}` 
                            : `Upload Excel or CSV files containing ${importSubTab === 'products' ? 'products' : 'services'} data`
                          }
                        </p>
                        
                        <div className="flex flex-col items-center gap-4">
                          <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                            id="import-file"
                            onChange={handleFileUpload}
                            disabled={uploadingFile}
                          />
                          <label
                            htmlFor="import-file"
                            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white cursor-pointer transition-colors ${
                              uploadingFile 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-purple-600 hover:bg-purple-600'
                            }`}
                          >
                            {uploadingFile ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                {language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
                              </>
                            ) : (
                              <>
                                <Upload className="h-5 w-5 mr-2" />
                                {language === 'ar' ? 'اختيار الملف' : 'Choose File'}
                              </>
                            )}
                          </label>
                          
                          {selectedFile && (
                            <div className="text-sm text-gray-600 mt-2" style={{ textAlign: getTextAlign(language) }}>
                              {language === 'ar' ? 'الملف المحدد: ' : 'Selected file: '}
                              <span className="font-medium">{selectedFile.name}</span>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500" style={{ textAlign: getTextAlign(language) }}>
                            {language === 'ar' 
                              ? 'الصيغ المدعومة: .xlsx, .xls, .csv - الحد الأقصى: 10 ميجابايت'
                              : 'Supported formats: .xlsx, .xls, .csv - Max size: 10MB'
                            }
                          </div>
                        </div>
                      </div>

                      {/* Template Download Section */}
                      <div className="mt-8">
                        <h4 className="text-md font-medium text-gray-900 mb-4" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' ? 'تحميل النموذج' : 'Download Template'}
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-2" style={{ textAlign: getTextAlign(language) }}>
                            {language === 'ar' 
                              ? `نموذج ${importSubTab === 'products' ? 'المنتجات' : 'الخدمات'}` 
                              : `${importSubTab === 'products' ? 'Products' : 'Services'} Template`
                            }
                          </h5>
                          <p className="text-sm text-gray-600 mb-3" style={{ textAlign: getTextAlign(language) }}>
                            {language === 'ar' 
                              ? `نموذج CSV يحتوي على الأعمدة المطلوبة لاستيراد ${importSubTab === 'products' ? 'المنتجات' : 'الخدمات'} (الاسم، السعر، الفئة، الوصف)`
                              : `CSV template with required columns for importing ${importSubTab === 'products' ? 'products' : 'services'} (name, price, category, description)`
                            }
                          </p>
                          <button 
                            onClick={() => downloadTemplate(importSubTab)}
                            className="inline-flex items-center text-sm text-purple-600 hover:text-purple-600 hover:underline"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            {language === 'ar' 
                              ? `تحميل نموذج ${importSubTab === 'products' ? 'المنتجات' : 'الخدمات'}` 
                              : `Download ${importSubTab === 'products' ? 'Products' : 'Services'} Template`
                            }
                          </button>
                        </div>
                      </div>

                      {/* Import Instructions */}
                      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <FileText className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-blue-800" style={{ textAlign: getTextAlign(language) }}>
                              {language === 'ar' ? 'تعليمات الاستيراد' : 'Import Instructions'}
                            </h4>
                            <div className="mt-2 text-sm text-blue-700" style={{ textAlign: getTextAlign(language) }}>
                              <ul className="list-disc list-inside space-y-1">
                                <li>
                                  {language === 'ar' 
                                    ? 'قم بتحميل النموذج المناسب (منتجات أو خدمات)'
                                    : 'Download the appropriate template (products or services)'
                                  }
                                </li>
                                <li>
                                  {language === 'ar' 
                                    ? 'املأ البيانات في الأعمدة المطلوبة: الاسم، السعر، الفئة، الوصف'
                                    : 'Fill in the required columns: name, price, category, description'
                                  }
                                </li>
                                <li>
                                  {language === 'ar' 
                                    ? 'احفظ الملف بصيغة CSV وارفعه هنا'
                                    : 'Save the file as CSV and upload it here'
                                  }
                                </li>
                                <li>
                                  {language === 'ar' 
                                    ? 'ستتم إضافة البيانات إلى قاعدة البيانات تلقائياً'
                                    : 'Data will be automatically added to the database'
                                  }
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Import History */}
                      <div className="mt-8">
                        <h4 className="text-md font-medium text-gray-900 mb-4" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' ? 'سجل عمليات الاستيراد' : 'Import History'}
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-6 text-center">
                          <p className="text-gray-500" style={{ textAlign: getTextAlign(language) }}>
                            {language === 'ar' 
                              ? 'لا توجد عمليات استيراد سابقة'
                              : 'No previous imports found'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {/* Products Tab */}
              {activeTab === 'products' && (
                <ProductsManagementTable language={language} />
              )}



            </div>
          </div>
        </div>
      </div>

      {/* Location Update Dialog */}
      {showLocationDialog && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir={getDirection(language)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {language === 'ar' ? 'تحديد موقع المركبة' : 'Set Vehicle Location'}
              </h3>
              <button
                onClick={() => setShowLocationDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {language === 'ar' ? 'المركبة: ' : 'Vehicle: '} 
                {selectedDriver.vetsvanCode} - {selectedDriver.vetsvanName}
              </p>
            </div>

            <form onSubmit={handleLocationUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'خط العرض (Latitude)' : 'Latitude'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={newLocation.latitude}
                  onChange={(e) => setNewLocation({ ...newLocation, latitude: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="24.7136"
                  required
                  style={{ textAlign: getTextAlign(language) }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'خط الطول (Longitude)' : 'Longitude'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={newLocation.longitude}
                  onChange={(e) => setNewLocation({ ...newLocation, longitude: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="46.6753"
                  required
                  style={{ textAlign: getTextAlign(language) }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLocationDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={updateLocationMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateLocationMutation.isPending 
                    ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...')
                    : (language === 'ar' ? 'تحديث الموقع' : 'Update Location')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit VetsVan Dialog */}
      {showEditDialog && editingDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir={getDirection(language)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {language === 'ar' ? 'تعديل بيانات VETS VAN' : 'Edit VETS VAN Data'}
              </h3>
              <button
                onClick={() => setShowEditDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'كود VETS VAN' : 'VETS VAN Code'}
                </label>
                <input
                  type="text"
                  value={editDriverData.vetsvanCode}
                  onChange={(e) => setEditDriverData({ ...editDriverData, vetsvanCode: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  style={{ textAlign: getTextAlign(language) }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'اسم VETS VAN' : 'VETS VAN Name'}
                </label>
                <input
                  type="text"
                  value={editDriverData.vetsvanName}
                  onChange={(e) => setEditDriverData({ ...editDriverData, vetsvanName: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  style={{ textAlign: getTextAlign(language) }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={editDriverMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editDriverMutation.isPending 
                    ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...')
                    : (language === 'ar' ? 'تحديث البيانات' : 'Update Data')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews Details Dialog */}
      {showReviewsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir={getDirection(language)}>
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {language === 'ar' ? 'تفاصيل التقييمات حسب المركبات' : 'Reviews Details by Vehicle'}
              </h3>
              <button
                onClick={() => setShowReviewsDialog(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingReviews ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : detailedReviews && detailedReviews.length > 0 ? (
                <div className="space-y-6">
                  {/* Group reviews by VetsVan */}
                  {Object.entries(
                    detailedReviews.reduce((groups, review) => {
                      const key = `${review.vetsvanCode} - ${review.vetsvanName}`;
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(review);
                      return groups;
                    }, {} as Record<string, typeof detailedReviews>)
                  ).map(([vetsvanInfo, reviews]) => (
                    <div key={vetsvanInfo} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-purple-600">
                          {vetsvanInfo}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {language === 'ar' ? 'عدد التقييمات:' : 'Reviews:'} {reviews.length}
                          </span>
                          <span className="text-sm text-gray-600">|</span>
                          <span className="text-sm text-gray-600">
                            {language === 'ar' ? 'المتوسط:' : 'Average:'} 
                            <span className="font-bold text-yellow-600 ml-1">
                              {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} ★
                            </span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {reviews.map((review) => (
                          <div key={review.id} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {review.userName}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  {review.userPhone}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={`text-lg ${
                                        i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(review.createdAt).toLocaleDateString(
                                    language === 'ar' ? 'ar-SA' : 'en-US'
                                  )}
                                </p>
                              </div>
                            </div>
                            
                            {review.comment && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-700" style={{ textAlign: getTextAlign(language) }}>
                                  "{review.comment}"
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {language === 'ar' ? 'لا توجد تقييمات' : 'No Reviews Yet'}
                  </h3>
                  <p className="text-gray-600">
                    {language === 'ar' 
                      ? 'سيتم عرض التقييمات هنا عندما يقوم العملاء بتقييم الخدمة'
                      : 'Customer reviews will appear here once services are rated'
                    }
                  </p>
                </div>
              )}
            </div>
            
            <div className="border-t p-4">
              <button
                onClick={() => setShowReviewsDialog(false)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-600"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Dialog */}
      {showSmsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir={getDirection(language)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {language === 'ar' ? 'إرسال رسالة نصية' : 'Send SMS Message'}
              </h3>
              <button
                onClick={() => setShowSmsDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {language === 'ar' ? 'رقم الهاتف: ' : 'Phone Number: '} 
                <span className="font-medium">966548336693</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar' ? 'رقم تجريبي لاختبار النظام' : 'Test number for system testing'}
              </p>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                {language === 'ar' ? 'نص الرسالة التجريبية:' : 'Test Message Text:'}
              </h4>
              <p className="text-sm text-gray-700 font-mono">
                test sms from Taqnyat.sa , for testing internet sms service
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {language === 'ar' ? 'رسالة ثابتة للاختبار - لا يمكن تعديلها' : 'Fixed test message - cannot be edited'}
              </p>
            </div>

            <form onSubmit={handleSendSms} className="space-y-4">

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSmsDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={sendSmsMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendSmsMutation.isPending 
                    ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                    : (language === 'ar' ? 'إرسال الرسالة' : 'Send Message')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}