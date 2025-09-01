import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Loader2, Plus, X, Search, Trash2, Bell, Volume2, LogOut, VolumeX, Car, Clock, BarChart3, TrendingUp, ChevronDown, ChevronUp, FileText, Upload, Stethoscope, Package, Users, User, Shield, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";

// Services Management Component
const ServicesManagementTable = ({ language }: { language: 'ar' | 'en' }) => {
  const { toast } = useToast();
  const [editingService, setEditingService] = useState<{ id: number; price: string } | null>(null);
  const [editedServices, setEditedServices] = useState<{ [key: number]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter State
  const [filterText, setFilterText] = useState('');
  
  // Selection State - only for currently visible services
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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

  // Maintain display order to prevent reordering after updates
  const [displayServices, setDisplayServices] = useState<any[]>([]);
  
  useEffect(() => {
    if (services && Array.isArray(services)) {
      // Only update display order if it's different from current services
      if (displayServices.length === 0 || services.length !== displayServices.length) {
        setDisplayServices([...services]);
      }
    }
  }, [services]);

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, price }: { id: number; price: string }) => {
      return apiRequest(`/api/admin/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ price }),
      });
    },
    onSuccess: (updatedService, variables) => {
      // Update the service in the display array to maintain position
      setDisplayServices(prev => 
        prev.map(service => 
          service.id === variables.id 
            ? { ...service, price: parseFloat(variables.price) }
            : service
        )
      );
      
      // Also invalidate the cache for fresh data on next load
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
    onSuccess: (newService) => {
      // Add the new service to display array
      setDisplayServices(prev => [...prev, newService]);
      
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

  // Bulk Delete Services Mutation
  const deleteServicesMutation = useMutation({
    mutationFn: async (serviceIds: number[]) => {
      // Delete services one by one to use existing single delete endpoint
      const deletePromises = serviceIds.map(id => 
        apiRequest(`/api/admin/services/${id}`, { method: 'DELETE' })
      );
      return Promise.all(deletePromises);
    },
    onSuccess: () => {
      // Remove deleted services from display array
      setDisplayServices(prev => 
        prev.filter(service => !selectedServices.includes(service.id))
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/services'] });
      toast({
        title: language === 'ar' ? "تم الحذف بنجاح" : "Deleted Successfully",
        description: language === 'ar' ? `تم حذف ${selectedServices.length} خدمة` : `${selectedServices.length} services deleted`,
      });
      
      // Reset selection
      setSelectedServices([]);
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      console.error('Error deleting services:', error);
      toast({
        title: language === 'ar' ? "خطأ في الحذف" : "Delete Error",
        description: language === 'ar' ? "فشل في حذف الخدمات" : "Failed to delete services",
        variant: "destructive",
      });
    }
  });

  // Selection handling functions
  const handleSelectAll = () => {
    const visibleServiceIds = paginatedServices.map((service: any) => service.id);
    if (selectedServices.length === visibleServiceIds.length) {
      // Deselect all if all are selected
      setSelectedServices([]);
    } else {
      // Select all visible services
      setSelectedServices(visibleServiceIds);
    }
  };

  const handleServiceSelection = (serviceId: number, checked: boolean) => {
    if (checked) {
      setSelectedServices(prev => [...prev, serviceId]);
    } else {
      setSelectedServices(prev => prev.filter(id => id !== serviceId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedServices.length > 0) {
      deleteServicesMutation.mutate(selectedServices);
    }
  };

  // Clear selection when pagination or filter changes
  const handleFilterChange = (value: string) => {
    setFilterText(value);
    setCurrentPage(1);
    setSelectedServices([]); // Clear selection on filter change
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedServices([]); // Clear selection on page change
  };

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

  // Filter services based on search text using display services to maintain order
  const filteredServices = displayServices.filter(service => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return (
      service.name.toLowerCase().includes(searchLower) ||
      service.nameAr?.toLowerCase().includes(searchLower) ||
      service.price.toString().includes(searchLower)
    );
  });

  // Pagination calculations based on filtered results
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  // Check if all visible services are selected
  const areAllVisibleSelected = paginatedServices.length > 0 && 
    paginatedServices.every((service: any) => selectedServices.includes(service.id));

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
        
        <div className="flex flex-col gap-2 items-end">
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            style={{ direction: 'ltr' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
          
          <Button
            onClick={handleSelectAll}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
            style={{ direction: 'ltr' }}
          >
            {areAllVisibleSelected ? 'Deselect All' : 'Select All'}
          </Button>

          {selectedServices.length > 0 && (
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  style={{ direction: 'ltr' }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedServices.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedServices.length} selected service(s)? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    disabled={deleteServicesMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteServicesMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
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
              ? `عرض ${filteredServices.length} من ${displayServices.length} خدمة`
              : `Showing ${filteredServices.length} of ${displayServices.length} services`
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
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={areAllVisibleSelected}
                    onCheckedChange={() => handleSelectAll()}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                </th>
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
                <tr key={service.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-purple-25'} ${selectedServices.includes(service.id) ? 'bg-purple-50 border-purple-200' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={(checked) => handleServiceSelection(service.id, !!checked)}
                      className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                  </td>
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
                ? `عرض ${paginatedServices.length} من أصل ${filteredServices.length} خدمة (المجموع: ${Array.isArray(services) ? services.length : 0})`
                : `Showing ${paginatedServices.length} of ${filteredServices.length} services (Total: ${Array.isArray(services) ? services.length : 0})`
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
                  handlePageChange(1);
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
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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
  const { language, t } = useTranslation();
  
  // State for tracking notifications and audio - matches VetsVan Shifts and admin dashboard
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastRequestCountRef = useRef(0);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(false);
  const [isAdministrationExpanded, setIsAdministrationExpanded] = useState(() => {
    const savedState = localStorage.getItem('isAdministrationExpanded');
    return savedState !== null ? JSON.parse(savedState) : false;
  });

  // Fetch current user permissions
  const adminToken = localStorage.getItem("adminToken");
  const { data: currentUserPermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["/api/admin/current-user-permissions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/current-user-permissions", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch permissions");
      return response.json();
    },
    enabled: !!adminToken,
    staleTime: 0, // Always fetch fresh permissions
    gcTime: 0, // Don't cache permissions
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Fetch current requests count for notification badge - matches VetsVan Shifts
  const { data: allVetsVanRequests } = useQuery({
    queryKey: ['/api/admin/vetsvan-requests'],
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates like admin dashboard
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  // Monitor for new requests and update notification count - exact same logic as VetsVan Shifts
  useEffect(() => {
    if (allVetsVanRequests && allVetsVanRequests.length > 0) {
      const currentCount = allVetsVanRequests.length;
      
      lastRequestCountRef.current = currentCount;
      setCurrentRequestCount(currentCount);
    }
  }, [allVetsVanRequests]);

  return (
    <div 
      className="min-h-screen bg-gray-50"
      dir={getDirection(language)}
      style={{ textAlign: getTextAlign(language) }}
    >
      {/* Full-width Header with logo and controls - exact copy from VetsVan Shifts */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src={vetsVanLogo} 
              alt="VETS VAN" 
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* Header Controls */}
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

            {/* Notifications counter - matches VetsVan Shifts and admin dashboard */}
            <div className="relative">
              <Bell className="h-6 w-6 text-purple-600" />
              {currentRequestCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {currentRequestCount > 99 ? '99+' : currentRequestCount}
                </span>
              )}
            </div>
            
            <button
              onClick={() => {
                localStorage.removeItem("adminToken");
                setLocation("/admin-login");
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 ml-2" />
              {t('logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar - exact copy from VetsVan Shifts */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="mt-4 px-2">
            {/* Home Page */}
            <button
              onClick={() => setLocation('/admin-home')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Home className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'الصفحة الرئيسية' : 'Home Page'}</span>
            </button>
            
            {/* Administration Module */}
            <div className="mb-2">
              <button
                onClick={() => {
                  const newState = !isAdministrationExpanded;
                  setIsAdministrationExpanded(newState);
                  localStorage.setItem('isAdministrationExpanded', JSON.stringify(newState));
                }}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <Users className="h-6 w-6 flex-shrink-0" />
                <span className="flex-1 text-left">
                  {language === 'ar' ? 'الإدارة' : 'Administration'}
                </span>
                {isAdministrationExpanded ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
              </button>
              
              {/* Administration Submenu */}
              {isAdministrationExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  <button
                    onClick={() => setLocation('/administration/users')}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <User className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'المستخدمين' : 'Users'}</span>
                  </button>
                  <button
                    onClick={() => setLocation('/administration/authorization')}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'التصريح' : 'Authorization'}</span>
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={currentUserPermissions && (currentUserPermissions as any).vetsVanHidden === true ? undefined : () => setLocation('/admin-dashboard')}
              disabled={permissionsLoading || !currentUserPermissions || (currentUserPermissions && (currentUserPermissions as any).vetsVanHidden === true)}
              className={`group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full ${
                permissionsLoading || !currentUserPermissions || (currentUserPermissions && (currentUserPermissions as any).vetsVanHidden === true)
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Car className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'إدارة VETS VAN' : 'Vets Van Management'}</span>
              {permissionsLoading && <div className="ml-auto w-3 h-3 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />}
            </button>
            <button
              onClick={() => setLocation('/vets-van-shifts')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Clock className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'مناوبات VETS VAN' : 'Vets Van Shifts'}</span>
            </button>
            <button
              onClick={() => setLocation('/admin-dashboard?tab=reports')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <BarChart3 className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'التقارير' : 'Reports'}</span>
            </button>
            
            {/* New Reports & Analytics Dropdown - positioned after Reports */}
            <div className="mt-2">
              <button
                onClick={() => setIsNewReportsExpanded(!isNewReportsExpanded)}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <TrendingUp className="h-6 w-6 flex-shrink-0" />
                <span className="flex-1 text-left whitespace-nowrap">
                  {language === 'ar' ? 'تقارير وتحليلات جديدة' : 'New Reports & Analytics'}
                </span>
                {isNewReportsExpanded ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
              </button>
              
              {/* Dropdown Items */}
              {isNewReportsExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  <button
                    onClick={() => setLocation('/new-reports-analytics/sales-report')}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <BarChart3 className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}</span>
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setLocation('/admin-vetsvan-requests')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FileText className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'طلبات VETS VAN' : 'Vets Van Requests'}</span>
            </button>
            <button
              onClick={() => setLocation('/admin-dashboard/import')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Upload className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'استيراد البيانات' : 'Import'}</span>
            </button>
            <button
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 bg-purple-600 text-purple-600"
            >
              <Stethoscope className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'الخدمات' : 'Services'}</span>
            </button>
            <button
              onClick={() => setLocation('/admin-dashboard/products')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Package className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'المنتجات' : 'Products'}</span>
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-3 pl-1 pr-6 lg:pr-8">
            <div className="px-1 py-3 sm:px-0">
              <ServicesManagementTable language={language} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}