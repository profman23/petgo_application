import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Loader2, Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";

// Services Management Component
const ServicesManagementTable = ({ language }: { language: string }) => {
  const { toast } = useToast();
  const [editingService, setEditingService] = useState<{ id: number; price: string } | null>(null);
  const [editedServices, setEditedServices] = useState<{ [key: number]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter State
  const [filterText, setFilterText] = useState('');
  
  // Add Service State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    nameAr: '',
    price: ''
  });

  const { data: services, isLoading, refetch } = useQuery({
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
    onError: (error) => {
      console.error('Error updating service price:', error);
      toast({
        title: language === 'ar' ? "خطأ في التحديث" : "Update Error",
        description: language === 'ar' ? "فشل في تحديث سعر الخدمة" : "Failed to update service price",
        variant: "destructive",
      });
    }
  });

  // Add Service Mutation
  const addServiceMutation = useMutation({
    mutationFn: async (serviceData: { name: string; nameAr: string; price: string }) => {
      return apiRequest('/api/admin/services', {
        method: 'POST',
        body: JSON.stringify(serviceData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/services'] });
      toast({
        title: language === 'ar' ? "تمت الإضافة بنجاح" : "Added Successfully",
        description: language === 'ar' ? "تم إضافة الخدمة الجديدة" : "New service added",
      });
      setShowAddForm(false);
      setNewService({ name: '', nameAr: '', price: '' });
    },
    onError: (error) => {
      console.error('Error adding service:', error);
      toast({
        title: language === 'ar' ? "خطأ في الإضافة" : "Add Error",
        description: language === 'ar' ? "فشل في إضافة الخدمة" : "Failed to add service",
        variant: "destructive",
      });
    }
  });

  const handlePriceEdit = (serviceId: number, currentPrice: string) => {
    setEditingService({ id: serviceId, price: currentPrice });
    setEditedServices({ [serviceId]: currentPrice });
  };

  const handlePriceUpdate = async (serviceId: number) => {
    const newPrice = editedServices[serviceId];
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      toast({
        title: language === 'ar' ? "خطأ في السعر" : "Price Error",
        description: language === 'ar' ? "يرجى إدخال سعر صحيح" : "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    updateServiceMutation.mutate({ id: serviceId, price: newPrice });
  };

  const handleAddService = async () => {
    if (!newService.name || !newService.price || isNaN(parseFloat(newService.price))) {
      toast({
        title: language === 'ar' ? "خطأ في البيانات" : "Data Error",
        description: language === 'ar' ? "يرجى إدخال جميع البيانات المطلوبة" : "Please enter all required data",
        variant: "destructive",
      });
      return;
    }

    addServiceMutation.mutate(newService);
  };

  const cancelAddService = () => {
    setShowAddForm(false);
    setNewService({ name: '', nameAr: '', price: '' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
      </div>
    );
  }

  // Filter services based on search text
  const filteredServices = services?.filter(service => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return (
      service.name.toLowerCase().includes(searchLower) ||
      service.nameAr?.toLowerCase().includes(searchLower) ||
      service.price.toString().includes(searchLower)
    );
  }) || [];

  // Pagination calculations based on filtered results
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  // Reset to page 1 when filter changes
  const handleFilterChange = (value: string) => {
    setFilterText(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Service Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ 
          direction: getDirection(language), 
          textAlign: getTextAlign(language) 
        }}>
          {language === 'ar' ? 'إدارة الخدمات' : 'Services Management'}
        </h2>
        
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
          style={{ direction: getDirection(language) }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {language === 'ar' ? 'إضافة خدمة' : 'Add Service'}
        </Button>
      </div>

      {/* Filter Field */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={language === 'ar' ? 'البحث في الخدمات...' : 'Search services...'}
            value={filterText}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="pl-10 border-purple-300 focus:border-purple-500 focus:ring-purple-500"
            style={{ 
              direction: getDirection(language), 
              textAlign: getTextAlign(language),
              paddingLeft: language === 'ar' ? '12px' : '40px',
              paddingRight: language === 'ar' ? '40px' : '12px'
            }}
          />
          {language === 'ar' && (
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          )}
        </div>
        
        {filterText && (
          <div className="mt-2 text-sm text-gray-600" style={{ 
            direction: getDirection(language), 
            textAlign: getTextAlign(language) 
          }}>
            {language === 'ar' 
              ? `عرض ${filteredServices.length} من ${services?.length || 0} خدمة`
              : `Showing ${filteredServices.length} of ${services?.length || 0} services`
            }
          </div>
        )}
      </div>

      {/* Add Service Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-purple-200">
          <h3 className="text-lg font-semibold mb-4" style={{ 
            direction: getDirection(language), 
            textAlign: getTextAlign(language) 
          }}>
            {language === 'ar' ? 'إضافة خدمة جديدة' : 'Add New Service'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ 
                direction: getDirection(language), 
                textAlign: getTextAlign(language) 
              }}>
                {language === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'}
              </label>
              <Input
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل الاسم بالإنجليزية' : 'Enter English name'}
                className="border-purple-300 focus:border-purple-500"
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ 
                direction: getDirection(language), 
                textAlign: getTextAlign(language) 
              }}>
                {language === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}
              </label>
              <Input
                value={newService.nameAr}
                onChange={(e) => setNewService({ ...newService, nameAr: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل الاسم بالعربية' : 'Enter Arabic name'}
                className="border-purple-300 focus:border-purple-500"
                style={{ direction: 'rtl', textAlign: 'right' }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ 
                direction: getDirection(language), 
                textAlign: getTextAlign(language) 
              }}>
                {language === 'ar' ? 'السعر (ريال)' : 'Price (SAR)'}
              </label>
              <Input
                type="number"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل السعر' : 'Enter price'}
                className="border-purple-300 focus:border-purple-500"
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
            </div>
          </div>
          
          <div className="flex gap-3" style={{ 
            direction: getDirection(language), 
            justifyContent: language === 'ar' ? 'flex-start' : 'flex-end' 
          }}>
            <Button
              onClick={cancelAddService}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            
            <Button
              onClick={handleAddService}
              disabled={addServiceMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {addServiceMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-purple-50 to-purple-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                  {language === 'ar' ? 'المعرف' : 'ID'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                  {language === 'ar' ? 'اسم الخدمة' : 'Service Name'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                  {language === 'ar' ? 'السعر (ريال)' : 'Price (SAR)'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                  {language === 'ar' ? 'الفئة' : 'Category'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                  {language === 'ar' ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedServices.map((service: any, index: number) => (
                <tr key={service.id} className={index % 2 === 0 ? 'bg-white' : 'bg-purple-25'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {service.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="font-medium">{service.name}</div>
                      {service.nameAr && (
                        <div className="text-xs text-gray-500" style={{ direction: 'rtl' }}>
                          {service.nameAr}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingService?.id === service.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={editedServices[service.id] || ''}
                          onChange={(e) => setEditedServices({ ...editedServices, [service.id]: e.target.value })}
                          className="w-20 h-8 text-sm border-purple-300 focus:border-purple-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => handlePriceUpdate(service.id)}
                          disabled={updateServiceMutation.isPending}
                          className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {updateServiceMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            '✓'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingService(null);
                            setEditedServices({});
                          }}
                          className="h-8 px-2"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <span className="font-medium">{service.price}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div>{service.category}</div>
                      {service.categoryAr && (
                        <div className="text-xs text-gray-500" style={{ direction: 'rtl' }}>
                          {service.categoryAr}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      service.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {service.isActive 
                        ? (language === 'ar' ? 'نشط' : 'Active')
                        : (language === 'ar' ? 'غير نشط' : 'Inactive')
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingService?.id !== service.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePriceEdit(service.id, service.price.toString())}
                        className="h-8 px-3 border-purple-300 text-purple-600 hover:bg-purple-50"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        {language === 'ar' ? 'تعديل' : 'Edit'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        <div className="bg-white px-4 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-4">
          {/* Results Info & Items Per Page */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="text-sm text-gray-700" style={{ 
              direction: getDirection(language), 
              textAlign: getTextAlign(language) 
            }}>
              {language === 'ar' 
                ? `عرض ${paginatedServices.length} من أصل ${filteredServices.length} خدمة (المجموع: ${services?.length || 0})`
                : `Showing ${paginatedServices.length} of ${filteredServices.length} services (Total: ${services?.length || 0})`
              }
            </div>
            
            <div className="flex items-center gap-2" style={{ direction: getDirection(language) }}>
              <span className="text-sm text-gray-600">
                {language === 'ar' ? 'عرض:' : 'Show:'}
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-purple-300 rounded px-3 py-1 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white"
                style={{ direction: 'ltr' }}
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">
                {language === 'ar' ? 'لكل صفحة' : 'per page'}
              </span>
            </div>
          </div>
          
          {/* Navigation Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === 'ar' ? 'السابق' : 'Previous'}
              </Button>
              
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-md">
                <span className="text-sm font-medium text-purple-700">
                  {language === 'ar' 
                    ? `صفحة ${currentPage} من ${totalPages}`
                    : `Page ${currentPage} of ${totalPages}`
                  }
                </span>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === 'ar' ? 'التالي' : 'Next'}
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// Main Admin Services Page
export default function AdminServices() {
  const [, setLocation] = useLocation();
  const { language } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50" style={{ direction: getDirection(language) }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4" style={{ 
              direction: getDirection(language),
              gap: language === 'ar' ? '0 1rem 0 0' : '0 0 0 1rem'
            }}>
              <Button
                variant="ghost"
                onClick={() => setLocation('/admin-dashboard')}
                className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
              </Button>
              
              <div className="h-6 w-px bg-gray-300"></div>
              
              <h1 className="text-xl font-semibold text-gray-900">
                {language === 'ar' ? 'إدارة الخدمات' : 'Services Management'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ServicesManagementTable language={language} />
      </div>
    </div>
  );
}