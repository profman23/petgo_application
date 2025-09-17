import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Edit, Loader2, Plus, X, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import { PaginationControls } from "@/components/ui/pagination-controls";

// Services Management Component
const ServicesManagementTable = ({ language, isReadOnly }: { language: 'ar' | 'en'; isReadOnly: boolean }) => {
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
      return apiRequest('/api/admin/services/bulk-delete', {
        method: 'DELETE',
        body: JSON.stringify({ serviceIds }),
      });
    },
    onSuccess: (result, serviceIds) => {
      // Remove deleted services from display array
      setDisplayServices(prev => prev.filter(service => !serviceIds.includes(service.id)));
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/services'] });
      toast({
        title: language === 'ar' ? "تم الحذف بنجاح" : "Deleted Successfully",
        description: language === 'ar' 
          ? `تم حذف ${serviceIds.length} خدمة` 
          : `${serviceIds.length} service(s) deleted`,
      });
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

  const handlePriceEdit = (serviceId: number, currentPrice: string) => {
    setEditingService({ id: serviceId, price: currentPrice });
    setEditedServices({ [serviceId]: currentPrice });
  };

  const handlePriceUpdate = () => {
    if (!editingService) return;
    
    const newPrice = editedServices[editingService.id];
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      toast({
        title: language === 'ar' ? "خطأ في السعر" : "Price Error",
        description: language === 'ar' ? "يرجى إدخال سعر صحيح" : "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    updateServiceMutation.mutate({ id: editingService.id, price: newPrice });
  };

  const handleServiceSelection = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAll = () => {
    if (areAllVisibleSelected) {
      setSelectedServices([]);
    } else {
      const visibleServiceIds = paginatedServices.map((service: any) => service.id);
      setSelectedServices(visibleServiceIds);
    }
  };

  const handleBulkDelete = () => {
    if (selectedServices.length === 0) return;
    deleteServicesMutation.mutate(selectedServices);
  };

  const handleFilterChange = (value: string) => {
    setFilterText(value);
    setCurrentPage(1); // Reset to first page when filtering
    setSelectedServices([]); // Clear selections when filtering
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedServices([]); // Clear selections when changing pages
  };

  const handleAddService = () => {
    if (!newService.name || !newService.price) {
      toast({
        title: language === 'ar' ? "حقول مطلوبة" : "Required Fields",
        description: language === 'ar' ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(parseFloat(newService.price))) {
      toast({
        title: language === 'ar' ? "خطأ في السعر" : "Price Error",
        description: language === 'ar' ? "يرجى إدخال سعر صحيح" : "Please enter a valid price",
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
        <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-600" style={{ 
          direction: getDirection(language), 
          textAlign: getTextAlign(language),
          fontFamily: 'Arimo'
        }}>
          <lord-icon
            src="https://cdn.lordicon.com/ngjmdtwg.json"
            trigger="loop"
            delay="2000"
            colors="primary:#852085,secondary:#848484"
            style={{width: '90px', height: '90px'}}
          />
          {language === 'ar' ? 'إدارة الخدمات' : 'Services Management'}
        </h2>
        
        <div className="flex flex-col gap-2 items-end">
          <Button
            data-testid="button-add-service"
            onClick={() => setShowAddForm(true)}
            disabled={isReadOnly}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            style={{ direction: 'ltr' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
          
          <Button
            data-testid="button-select-all"
            onClick={handleSelectAll}
            disabled={isReadOnly}
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
                  data-testid="button-delete-selected"
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
            data-testid="input-search-services"
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
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4" style={{ 
            direction: getDirection(language), 
            textAlign: getTextAlign(language) 
          }}>
            {language === 'ar' ? 'إضافة خدمة جديدة' : 'Add New Service'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'ar' ? 'اسم الخدمة (إنجليزي)' : 'Service Name (English)'}
              </label>
              <Input
                data-testid="input-service-name-en"
                type="text"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                placeholder="Enter service name in English"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'ar' ? 'اسم الخدمة (عربي)' : 'Service Name (Arabic)'}
              </label>
              <Input
                data-testid="input-service-name-ar"
                type="text"
                value={newService.nameAr}
                onChange={(e) => setNewService({ ...newService, nameAr: e.target.value })}
                className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                placeholder="أدخل اسم الخدمة بالعربية"
                style={{ direction: 'rtl' }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'ar' ? 'السعر' : 'Price'}
              </label>
              <Input
                data-testid="input-service-price"
                type="number"
                step="0.01"
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              data-testid="button-save-service"
              onClick={handleAddService}
              disabled={addServiceMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {addServiceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : (
                language === 'ar' ? 'حفظ' : 'Save'
              )}
            </Button>
            <Button
              data-testid="button-cancel-service"
              onClick={cancelAddService}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </div>
      )}

      {/* Services Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Checkbox
                    checked={areAllVisibleSelected}
                    onCheckedChange={handleSelectAll}
                    disabled={isReadOnly}
                    className="border-purple-300 data-[state=checked]:bg-purple-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الاسم' : 'Name'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'السعر' : 'Price'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الفئة' : 'Category'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedServices.map((service: any) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={() => handleServiceSelection(service.id)}
                      disabled={isReadOnly}
                      className="border-purple-300 data-[state=checked]:bg-purple-600"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900">{service.name}</div>
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
                          step="0.01"
                          value={editedServices[service.id] || ''}
                          onChange={(e) => setEditedServices({ ...editedServices, [service.id]: e.target.value })}
                          className="w-20 h-8 text-sm border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                        <Button
                          size="sm"
                          onClick={handlePriceUpdate}
                          disabled={updateServiceMutation.isPending}
                          className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                          ✓
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
                        data-testid={`button-edit-service-${service.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() => handlePriceEdit(service.id, service.price.toString())}
                        disabled={isReadOnly}
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
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        currentCount={paginatedServices.length}
        filteredCount={filteredServices.length}
        totalCount={Array.isArray(services) ? services.length : 0}
        itemType="services"
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

// Main Admin Services Page
export default function AdminServices() {
  const [, setLocation] = useLocation();
  const { language, t } = useTranslation();
  
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
  });

  // Permission check - redirect users with "No Permission" for Services
  useEffect(() => {
    if (currentUserPermissions && currentUserPermissions.servicesHidden === true) {
      console.log('🚫 User has no permission for Services - redirecting to admin home');
      setLocation('/admin-home');
    }
  }, [currentUserPermissions, setLocation]);

  // Check if user has read-only access (can view but not modify)
  const isReadOnly = currentUserPermissions && 
    currentUserPermissions.servicesRead === true && 
    currentUserPermissions.servicesFullControl === false;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-3 pl-1 pr-6 lg:pr-8">
        <div className="px-1 py-3 sm:px-0">
          <ServicesManagementTable language={language} isReadOnly={isReadOnly} />
        </div>
      </div>
    </AdminLayout>
  );
}