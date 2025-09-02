import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PermissionDeniedModal } from "@/components/PermissionDeniedModal";
import { ArrowLeft, Edit, Loader2, Plus, X, Search, Trash2, Bell, Volume2, LogOut, VolumeX, Car, Clock, BarChart3, TrendingUp, ChevronDown, ChevronUp, FileText, Upload, Stethoscope, Package, Users, User, Shield, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";

// Products Management Component
const ProductsManagementTable = ({ language }: { language: 'ar' | 'en' }) => {
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<{ id: number; price: string } | null>(null);
  const [editedProducts, setEditedProducts] = useState<{ [key: number]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter State
  const [filterText, setFilterText] = useState('');
  
  // Selection State - only for currently visible products
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Add Product State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    nameAr: '',
    price: ''
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/products'],
    staleTime: 5 * 60 * 1000,
  });

  // Maintain display order to prevent reordering after updates
  const [displayProducts, setDisplayProducts] = useState<any[]>([]);
  
  useEffect(() => {
    if (products && Array.isArray(products)) {
      // Only update display order if it's different from current products
      if (displayProducts.length === 0 || products.length !== displayProducts.length) {
        setDisplayProducts([...products]);
      }
    }
  }, [products]);

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, price }: { id: number; price: string }) => {
      return apiRequest(`/api/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ price }),
      });
    },
    onSuccess: (updatedProduct, variables) => {
      // Update the product in the display array to maintain position
      setDisplayProducts(prev => 
        prev.map(product => 
          product.id === variables.id 
            ? { ...product, price: parseFloat(variables.price) }
            : product
        )
      );
      
      // Also invalidate the cache for fresh data on next load
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      
      toast({
        title: language === 'ar' ? "تم التحديث بنجاح" : "Updated Successfully",
        description: language === 'ar' ? "تم تحديث سعر المنتج" : "Product price updated",
      });
      setEditingProduct(null);
      setEditedProducts({});
    },
    onError: (error) => {
      console.error('Error updating product price:', error);
      toast({
        title: language === 'ar' ? "خطأ في التحديث" : "Update Error",
        description: language === 'ar' ? "فشل في تحديث سعر المنتج" : "Failed to update product price",
        variant: "destructive",
      });
    }
  });

  // Add Product Mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: { name: string; nameAr: string; price: string }) => {
      return apiRequest('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
    },
    onSuccess: (newProduct) => {
      // Add the new product to the display array at the beginning
      setDisplayProducts(prev => [newProduct, ...prev]);
      
      // Invalidate cache to get fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      
      toast({
        title: language === 'ar' ? "تمت الإضافة بنجاح" : "Added Successfully",
        description: language === 'ar' ? "تم إضافة المنتج الجديد" : "New product added",
      });
      
      // Reset form
      setNewProduct({ name: '', nameAr: '', price: '' });
      setShowAddForm(false);
    },
    onError: (error) => {
      console.error('Error adding product:', error);
      toast({
        title: language === 'ar' ? "خطأ في الإضافة" : "Add Error",
        description: language === 'ar' ? "فشل في إضافة المنتج" : "Failed to add product",
        variant: "destructive",
      });
    }
  });

  // Delete Products Mutation
  const deleteProductsMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      // Delete products one by one
      for (const id of productIds) {
        await apiRequest(`/api/admin/products/${id}`, {
          method: 'DELETE',
        });
      }
      return productIds;
    },
    onSuccess: (deletedIds) => {
      // Remove deleted products from display array
      setDisplayProducts(prev => prev.filter(product => !deletedIds.includes(product.id)));
      
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      
      toast({
        title: language === 'ar' ? "تم الحذف بنجاح" : "Deleted Successfully",
        description: language === 'ar' ? `تم حذف ${deletedIds.length} منتج` : `${deletedIds.length} product(s) deleted`,
      });
      
      // Reset selection
      setSelectedProducts([]);
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      console.error('Error deleting products:', error);
      toast({
        title: language === 'ar' ? "خطأ في الحذف" : "Delete Error",
        description: language === 'ar' ? "فشل في حذف المنتجات" : "Failed to delete products",
        variant: "destructive",
      });
    }
  });

  // Helper functions
  const handleEditClick = (product: any) => {
    setEditingProduct({ id: product.id, price: product.price.toString() });
    setEditedProducts({ [product.id]: product.price.toString() });
  };

  const handleSaveClick = (productId: number) => {
    const newPrice = editedProducts[productId];
    if (newPrice && !isNaN(parseFloat(newPrice))) {
      updateProductMutation.mutate({ id: productId, price: newPrice });
    }
  };

  const handleCancelClick = () => {
    setEditingProduct(null);
    setEditedProducts({});
  };

  const handlePriceChange = (productId: number, value: string) => {
    setEditedProducts(prev => ({ ...prev, [productId]: value }));
  };

  // Filter products based on search text
  const filteredProducts = displayProducts.filter(product => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.nameAr?.toLowerCase().includes(searchLower) ||
      product.price?.toString().includes(searchLower)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Selection handlers
  const toggleProductSelection = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    const currentProductIds = currentProducts.map(p => p.id);
    if (selectedProducts.length === currentProductIds.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(currentProductIds);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ 
          direction: getDirection(language), 
          textAlign: getTextAlign(language) 
        }}>
          {language === 'ar' ? 'إدارة المنتجات' : 'Products Management'}
        </h2>
        
        <div className="flex flex-col gap-2 items-end">
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            style={{ direction: 'ltr' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          
          {selectedProducts.length > 0 && (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="destructive"
              size="sm"
              style={{ direction: 'ltr' }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedProducts.length})
            </Button>
          )}
        </div>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-purple-200">
          <h3 className="text-lg font-semibold mb-4" style={{ 
            direction: getDirection(language), 
            textAlign: getTextAlign(language) 
          }}>
            {language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}
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
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
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
                value={newProduct.nameAr}
                onChange={(e) => setNewProduct({ ...newProduct, nameAr: e.target.value })}
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
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل السعر' : 'Enter price'}
                className="border-purple-300 focus:border-purple-500"
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => {
                setShowAddForm(false);
                setNewProduct({ name: '', nameAr: '', price: '' });
              }}
              variant="outline"
              className="border-gray-300"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={() => {
                if (newProduct.name && newProduct.nameAr && newProduct.price) {
                  addProductMutation.mutate(newProduct);
                }
              }}
              disabled={!newProduct.name || !newProduct.nameAr || !newProduct.price || addProductMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {addProductMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mt-6 mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={language === 'ar' ? 'البحث في المنتجات...' : 'Search products...'}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="pl-10 border-gray-300 focus:border-purple-500"
            style={{ 
              direction: getDirection(language), 
              textAlign: getTextAlign(language) 
            }}
          />
        </div>
        
        <div className="text-sm text-gray-600">
          {language === 'ar' 
            ? `عرض ${currentProducts.length} من ${filteredProducts.length} منتج`
            : `Showing ${currentProducts.length} of ${filteredProducts.length} products`
          }
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
                    onCheckedChange={toggleSelectAll}
                    className="border-gray-400"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'المعرف' : 'ID'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'السعر (ريال)' : 'Price (SAR)'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                      className="border-gray-400"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" style={{ direction: 'rtl' }}>
                    {product.nameAr}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingProduct?.id === product.id ? (
                      <Input
                        type="number"
                        value={editedProducts[product.id] || ''}
                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                        className="w-20 border-purple-300 focus:border-purple-500"
                        style={{ direction: 'ltr' }}
                      />
                    ) : (
                      `${parseFloat(product.price).toFixed(2)} SAR`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingProduct?.id === product.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveClick(product.id)}
                          disabled={updateProductMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {updateProductMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            '✓'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelClick}
                          className="border-gray-300"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(product)}
                        className="border-purple-300 hover:bg-purple-50"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {language === 'ar' ? 'عناصر لكل صفحة:' : 'Items per page:'}
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="border-gray-300"
            >
              {language === 'ar' ? 'السابق' : 'Previous'}
            </Button>
            
            <span className="text-sm text-gray-600">
              {language === 'ar' 
                ? `صفحة ${currentPage} من ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`
              }
            </span>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="border-gray-300"
            >
              {language === 'ar' ? 'التالي' : 'Next'}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? `هل أنت متأكد من حذف ${selectedProducts.length} منتج؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete ${selectedProducts.length} product(s)? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProductsMutation.mutate(selectedProducts)}
              disabled={deleteProductsMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProductsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default function AdminProducts() {
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

  // Import toast at component level
  const { toast } = useToast();

  // Handle Users navigation with permission check
  const handleUsersNavigation = () => {
    // Check if user has permission to access Users
    if (currentUserPermissions && (currentUserPermissions as any).usersHidden === true) {
      // Show modal popup
      setShowPermissionModal(true);

      // Check current location to determine navigation behavior
      const currentPath = window.location.pathname;
      
      // If not on admin-home, redirect to admin-home
      if (currentPath !== '/admin-home') {
        setLocation('/admin-home');
      }
      // If already on admin-home, do nothing (just show the popup)
      return;
    }

    // User has permission, proceed with normal navigation
    setLocation('/administration/users');
  };

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
          <div className="flex-shrink-0 -ml-6">
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
                    onClick={handleUsersNavigation}
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
              onClick={() => setLocation('/admin-dashboard/services')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Stethoscope className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'الخدمات' : 'Services'}</span>
            </button>
            <button
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 bg-purple-50 border-l-4 border-purple-600"
            >
              <Package className="h-6 w-6 flex-shrink-0 text-purple-600" />
              <span className="text-purple-600">{language === 'ar' ? 'المنتجات' : 'Products'}</span>
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-3 pl-1 pr-6 lg:pr-8">
            <div className="px-1 py-3 sm:px-0">
              <ProductsManagementTable language={language} />
            </div>
          </div>
        </div>
      </div>

      {/* Permission Denied Modal */}
      <PermissionDeniedModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        title="Access Denied"
        description="You do not have permission to access Users."
      />
    </div>
  );
}