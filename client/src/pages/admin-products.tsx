import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Car, Clock, Shield, Users, User, FileText, Upload, Download, Edit, ChevronDown, ChevronUp, Search, Package, Stethoscope, X, TrendingUp, ChevronLeft, ChevronRight, Plus, AlertTriangle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

  const handlePriceSave = (productId: number) => {
    const newPrice = editedProducts[productId];
    if (newPrice && !isNaN(parseFloat(newPrice))) {
      updateProductMutation.mutate({ id: productId, price: newPrice });
    }
  };

  const handlePriceCancel = () => {
    setEditingProduct(null);
    setEditedProducts({});
  };

  // Add Product Mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: { name: string; nameAr: string; price: string }) => {
      return apiRequest('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setNewProduct({ name: '', nameAr: '', price: '' });
      setShowAddForm(false);
      toast({
        title: language === 'ar' ? "تم الإضافة بنجاح" : "Added Successfully",
        description: language === 'ar' ? "تم إضافة المنتج الجديد" : "New product added",
      });
    },
    onError: () => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "فشل في إضافة المنتج" : "Failed to add product",
        variant: "destructive",
      });
    },
  });

  // Delete Products Mutation
  const deleteProductsMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      return apiRequest('/api/admin/products/bulk-delete', {
        method: 'DELETE',
        body: JSON.stringify({ productIds }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setSelectedProducts([]);
      setShowDeleteConfirm(false);
      toast({
        title: language === 'ar' ? "تم الحذف بنجاح" : "Deleted Successfully",
        description: language === 'ar' ? "تم حذف المنتجات المحددة" : "Selected products deleted",
      });
    },
    onError: () => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "فشل في حذف المنتجات" : "Failed to delete products",
        variant: "destructive",
      });
    },
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.name && newProduct.price) {
      addProductMutation.mutate(newProduct);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedProducts.length > 0) {
      deleteProductsMutation.mutate(selectedProducts);
    }
  };

  // Filter products based on search
  const filteredProducts = displayProducts.filter(product => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.nameAr?.toLowerCase().includes(searchLower) ||
      product.price.toString().includes(searchLower)
    );
  });

  // Pagination
  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      const visibleProductIds = currentProducts.map(product => product.id);
      setSelectedProducts(visibleProductIds);
    } else {
      setSelectedProducts([]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6" style={{ direction: getDirection(language) }}>
        <h2 className="text-2xl font-bold text-gray-900" style={{ textAlign: getTextAlign(language) }}>
          {language === 'ar' ? 'إدارة المنتجات' : 'Products Management'}
        </h2>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
        </Button>
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
          
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                required
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
                style={{ direction: getDirection(language), textAlign: getTextAlign(language) }}
                required
              />
            </div>
          </form>

          <div className="flex gap-2">
            <Button
              type="submit" 
              onClick={handleAddProduct}
              disabled={addProductMutation.isPending || !newProduct.name || !newProduct.price}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {addProductMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddForm(false)}
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <X className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6" style={{ direction: getDirection(language) }}>
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={language === 'ar' ? 'البحث في المنتجات...' : 'Search products...'}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-10 border-purple-300 focus:border-purple-500"
              style={{ direction: getDirection(language), textAlign: getTextAlign(language) }}
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {language === 'ar' ? `حذف (${selectedProducts.length})` : `Delete (${selectedProducts.length})`}
            </Button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Checkbox
                  checked={currentProducts.length > 0 && currentProducts.every(product => selectedProducts.includes(product.id))}
                  onCheckedChange={handleSelectAllVisible}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ textAlign: getTextAlign(language) }}>
                {language === 'ar' ? 'المنتج' : 'Product'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ textAlign: getTextAlign(language) }}>
                {language === 'ar' ? 'السعر (ريال)' : 'Price (SAR)'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ textAlign: getTextAlign(language) }}>
                {language === 'ar' ? 'الفئة' : 'Category'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ textAlign: getTextAlign(language) }}>
                {language === 'ar' ? 'الحالة' : 'Status'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ textAlign: getTextAlign(language) }}>
                {language === 'ar' ? 'الإجراءات' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentProducts.map((product) => (
              <tr key={product.id} className={selectedProducts.includes(product.id) ? 'bg-purple-50' : 'hover:bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={() => handleSelectProduct(product.id)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    {product.nameAr && (
                      <div className="text-xs text-gray-500" style={{ direction: 'rtl' }}>
                        {product.nameAr}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingProduct?.id === product.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editedProducts[product.id] || ''}
                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                        className="w-24 h-8 text-sm border-purple-300 focus:border-purple-500"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handlePriceSave(product.id)}
                        disabled={updateProductMutation.isPending}
                        className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {updateProductMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePriceCancel}
                        className="h-8 px-2 border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <span className="font-medium">{product.price}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="space-y-1">
                    <div>{product.category}</div>
                    {product.categoryAr && (
                      <div className="text-xs text-gray-500" style={{ direction: 'rtl' }}>
                        {product.categoryAr}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.isActive 
                      ? (language === 'ar' ? 'نشط' : 'Active')
                      : (language === 'ar' ? 'غير نشط' : 'Inactive')
                    }
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingProduct?.id !== product.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePriceEdit(product.id, product.price.toString())}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700" style={{ textAlign: getTextAlign(language) }}>
            {language === 'ar' 
              ? `عرض ${startIndex + 1} إلى ${Math.min(endIndex, totalProducts)} من ${totalProducts} منتج`
              : `Showing ${startIndex + 1} to ${Math.min(endIndex, totalProducts)} of ${totalProducts} products`
            }
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <ChevronLeft className="h-4 w-4" />
              {language === 'ar' ? 'السابق' : 'Previous'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              {language === 'ar' ? 'التالي' : 'Next'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4" style={{ textAlign: getTextAlign(language) }}>
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
            </h3>
            <p className="text-gray-600 mb-6" style={{ textAlign: getTextAlign(language) }}>
              {language === 'ar' 
                ? `هل أنت متأكد من حذف ${selectedProducts.length} منتج؟ هذا الإجراء لا يمكن التراجع عنه.`
                : `Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`
              }
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={deleteProductsMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteProductsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {language === 'ar' ? 'حذف' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminProducts() {
  const [, setLocation] = useLocation();
  const { language } = useTranslation();

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gray-50" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <img src={vetsVanLogo} alt="VETS VAN Logo" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ textAlign: getTextAlign(language) }}>
                {language === 'ar' ? 'لوحة التحكم الإدارية' : 'Admin Dashboard'}
              </h1>
              <p className="text-sm text-gray-600" style={{ textAlign: getTextAlign(language) }}>
                {language === 'ar' ? 'إدارة المنتجات' : 'Products Management'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Button
              onClick={() => {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("admin");
                setLocation("/admin-login");
              }}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'تسجيل خروج' : 'Logout'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <nav className="mt-5 px-2">
            <button
              onClick={() => setLocation('/admin-dashboard')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Car className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'إدارة VETS VAN' : 'Vets Van Management'}</span>
            </button>
            <button
              onClick={() => setLocation('/vets-van-shifts')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Clock className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'مناوبات VETS VAN' : 'Vets Van Shifts'}</span>
            </button>
            <button
              onClick={() => setLocation('/admin-dashboard')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FileText className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'طلبات VETS VAN' : 'Vets Van Requests'}</span>
            </button>
            <button
              onClick={() => setLocation('/admin-dashboard?tab=import')}
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
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 bg-purple-600 text-purple-600"
            >
              <Package className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'المنتجات' : 'Products'}</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <ProductsManagementTable language={language} />
          </div>
        </div>
      </div>
    </div>
  );
}