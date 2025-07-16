import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Car, 
  ClipboardList, 
  Upload, 
  Stethoscope, 
  Package,
  FileText,
  Edit,
  MapPin,
  Loader2,
  Bell,
  BellOff,
  MessageCircle,
  Download,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/language';
import { apiRequest } from '@/lib/queryClient';

const queryClient = useQueryClient();

// Services Management Component
const ServicesManagementTable = ({ language }: { language: string }) => {
  const { toast } = useToast();
  const [editingService, setEditingService] = useState<{ id: number; price: string } | null>(null);
  const [editedServices, setEditedServices] = useState<{ [key: number]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { data: services, isLoading } = useQuery({
    queryKey: ['/api/admin/services'],
    staleTime: 5 * 60 * 1000,
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, price }: { id: number; price: string }) => {
      return apiRequest(`/api/admin/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ price }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/services'] });
      toast({
        title: language === 'ar' ? "تم التحديث بنجاح" : "Updated Successfully",
        description: language === 'ar' ? "تم تحديث سعر الخدمة" : "Service price updated",
      });
      setEditingService(null);
      setEditedServices({});
    },
    onError: () => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "فشل في تحديث السعر" : "Failed to update price",
        variant: "destructive",
      });
    },
  });

  const handlePriceEdit = (id: number, currentPrice: string) => {
    setEditingService({ id, price: currentPrice });
    setEditedServices({ ...editedServices, [id]: currentPrice });
  };

  const handlePriceChange = (serviceId: number, newPrice: string) => {
    setEditedServices({ ...editedServices, [serviceId]: newPrice });
  };

  const handleSave = () => {
    if (editingService) {
      const newPrice = editedServices[editingService.id];
      if (newPrice && !isNaN(parseFloat(newPrice))) {
        updateServiceMutation.mutate({ id: editingService.id, price: newPrice });
      }
    }
  };

  const getTextAlign = (lang: string) => lang === 'ar' ? 'right' : 'left';

  // Pagination calculations
  const totalItems = services?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = services?.slice(startIndex, endIndex) || [];
  const startItem = totalItems > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, totalItems);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }
    
    rangeWithDots.push(...range);
    
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }
    
    return rangeWithDots;
  };

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
            {language === 'ar' ? 'إدارة الخدمات' : 'Services Management'}
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              {totalItems > 0 && (
                language === 'ar' 
                  ? `عرض ${startItem}-${endItem} من ${totalItems}`
                  : `Showing ${startItem}-${endItem} of ${totalItems}`
              )}
            </div>
            <select 
              value={itemsPerPage} 
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {services && services.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ textAlign: getTextAlign(language) }}>
                      {language === 'ar' ? 'اسم الخدمة' : 'Service Name'}
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
                  {currentItems.map((service: any) => (
                    <tr key={service.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" style={{ textAlign: getTextAlign(language) }}>
                        {service.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style={{ textAlign: getTextAlign(language) }}>
                        {editingService?.id === service.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editedServices[service.id] || service.price}
                            onChange={(e) => handlePriceChange(service.id, e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                            style={{ textAlign: getTextAlign(language) }}
                          />
                        ) : (
                          `${service.price} ${language === 'ar' ? 'ريال' : 'SAR'}`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ textAlign: getTextAlign(language) }}>
                        {editingService?.id === service.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSave}
                              disabled={updateServiceMutation.isPending}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              {updateServiceMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                language === 'ar' ? 'حفظ' : 'Save'
                              )}
                            </button>
                            <button
                              onClick={() => setEditingService(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePriceEdit(service.id, service.price)}
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
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                <div className="flex justify-between flex-1 sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {language === 'ar' ? 'السابق' : 'Previous'}
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {language === 'ar' ? 'التالي' : 'Next'}
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      {language === 'ar' 
                        ? `عرض ${startItem} إلى ${endItem} من ${totalItems} نتيجة`
                        : `Showing ${startItem} to ${endItem} of ${totalItems} results`
                      }
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">{language === 'ar' ? 'السابق' : 'Previous'}</span>
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      {getPageNumbers().map((page, index) => (
                        <button
                          key={index}
                          onClick={() => typeof page === 'number' && setCurrentPage(page)}
                          disabled={page === '...'}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                            page === currentPage
                              ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                              : page === '...'
                              ? 'bg-white border-gray-300 text-gray-300 cursor-default'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">{language === 'ar' ? 'التالي' : 'Next'}</span>
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Stethoscope className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد خدمات' : 'No Services Found'}
            </h3>
            <p className="text-gray-600">
              {language === 'ar' 
                ? 'قم برفع ملف الخدمات من قسم الاستيراد'
                : 'Upload services file from Import section'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { language } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
            <ServicesManagementTable language={language} />
          </div>
        </div>
      </div>
    </div>
  );
}