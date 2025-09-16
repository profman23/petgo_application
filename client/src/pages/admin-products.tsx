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

// Products Management Component
const ProductsManagementTable = ({ language, isReadOnly }: { language: 'ar' | 'en'; isReadOnly: boolean }) => {
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

  // Delete Products Mutation - Individual deletion calls
  const deleteProductsMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      // Delete each product individually since no bulk-delete endpoint exists
      const deletePromises = productIds.map(id => 
        apiRequest(`/api/admin/products/${id}`, {
          method: 'DELETE'
        })
      );
      return Promise.all(deletePromises);
    },
    onSuccess: (result, productIds) => {
      // Remove deleted products from display array
      setDisplayProducts(prev => prev.filter(product => !productIds.includes(product.id)));
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({
        title: language === 'ar' ? "تم الحذف بنجاح" : "Deleted Successfully",
        description: language === 'ar' 
          ? `تم حذف ${productIds.length} منتج` 
          : `${productIds.length} product(s) deleted`,
      });
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

  const handleEditClick = (product: any) => {
    setEditingProduct({ id: product.id, price: product.price.toString() });
    setEditedProducts({ [product.id]: product.price.toString() });
  };

  const handleSaveClick = (productId: number) => {
    const newPrice = editedProducts[productId];
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      toast({
        title: language === 'ar' ? "خطأ في السعر" : "Price Error",
        description: language === 'ar' ? "يرجى إدخال سعر صحيح" : "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    updateProductMutation.mutate({ id: productId, price: newPrice });
  };

  const handleCancelClick = () => {
    setEditingProduct(null);
    setEditedProducts({});
  };

  const handleProductSelection = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleFilterChange = (value: string) => {
    setFilterText(value);
    setCurrentPage(1); // Reset to first page when filtering
    setSelectedProducts([]); // Clear selections when filtering
  };

  // Filter products based on search text using display products to maintain order
  const filteredProducts = displayProducts.filter(product => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.nameAr?.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower) ||
      product.categoryAr?.toLowerCase().includes(searchLower) ||
      product.price.toString().includes(searchLower)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);
  const currentProductIds = currentProducts.map((product: any) => product.id);

  const toggleSelectAll = () => {
    if (areAllVisibleSelected) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(currentProductIds);
    }
  };

  // Check if all visible products are selected (matching Services logic)
  const areAllVisibleSelected = currentProducts.length > 0 && 
    currentProducts.every((product: any) => selectedProducts.includes(product.id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-600" style={{ 
          direction: getDirection(language), 
          textAlign: getTextAlign(language),
          fontFamily: 'Arimo'
        }}>
          <lord-icon
            src="https://cdn.lordicon.com/nppnalch.json"
            trigger="loop"
            delay="2000"
            colors="primary:#852085,secondary:#848484"
            style={{width: '90px', height: '90px'}}
          />
          {language === 'ar' ? 'إدارة المنتجات' : 'Products Management'}
        </h2>
        
        <div className="flex flex-col gap-2 items-end">
          <Button
            data-testid="button-add-product"
            onClick={() => setShowAddForm(true)}
            disabled={isReadOnly}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            style={{ direction: 'ltr' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          
          <Button
            data-testid="button-select-all"
            onClick={toggleSelectAll}
            disabled={isReadOnly}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
            style={{ direction: 'ltr' }}
          >
            {areAllVisibleSelected ? (language === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All') : (language === 'ar' ? 'تحديد الكل' : 'Select All')}
          </Button>
          
          {selectedProducts.length > 0 && (
            <Button
              data-testid="button-delete-selected"
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

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            data-testid="input-search-products"
            type="text"
            placeholder={language === 'ar' ? 'البحث في المنتجات...' : 'Search products...'}
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
              ? `عرض ${filteredProducts.length} من ${displayProducts.length} منتج`
              : `Showing ${filteredProducts.length} of ${displayProducts.length} products`
            }
          </div>
        )}
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
                data-testid="input-product-name-en"
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
                data-testid="input-product-name-ar"
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
                data-testid="input-product-price"
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
              data-testid="button-cancel-product"
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
              data-testid="button-save-product"
              onClick={() => {
                if (newProduct.name && newProduct.nameAr && newProduct.price) {
                  addProductMutation.mutate(newProduct);
                }
              }}
              disabled={addProductMutation.isPending || !newProduct.name || !newProduct.nameAr || !newProduct.price}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {addProductMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : (
                language === 'ar' ? 'حفظ' : 'Save'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Checkbox
                    checked={areAllVisibleSelected}
                    onCheckedChange={toggleSelectAll}
                    disabled={isReadOnly}
                    className="border-purple-300 data-[state=checked]:bg-purple-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الاسم' : 'Name'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الفئة' : 'Category'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'السعر (ريال)' : 'Price (SAR)'}
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
              {currentProducts.map((product: any) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => handleProductSelection(product.id)}
                      disabled={isReadOnly}
                      className="border-purple-300 data-[state=checked]:bg-purple-600"
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900">{product.category}</div>
                      {product.categoryAr && (
                        <div className="text-xs text-gray-500" style={{ direction: 'rtl' }}>
                          {product.categoryAr}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingProduct?.id === product.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={editedProducts[product.id] || ''}
                          onChange={(e) => setEditedProducts({ ...editedProducts, [product.id]: e.target.value })}
                          className="w-20 h-8 text-sm border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveClick(product.id)}
                          disabled={updateProductMutation.isPending}
                          className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
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
                          className="h-8 px-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="font-medium">{product.price}</span>
                    )}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingProduct?.id !== product.id && (
                      <Button
                        data-testid={`button-edit-product-${product.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(product)}
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

        {/* Enhanced Pagination */}
        <div className="bg-white px-4 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-4">
          {/* Results Info & Items Per Page */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="text-sm text-gray-700" style={{ 
              direction: getDirection(language), 
              textAlign: getTextAlign(language) 
            }}>
              {language === 'ar' 
                ? `عرض ${currentProducts.length} من أصل ${filteredProducts.length} منتج (المجموع: ${Array.isArray(products) ? products.length : 0})`
                : `Showing ${currentProducts.length} of ${filteredProducts.length} products (Total: ${Array.isArray(products) ? products.length : 0})`
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
              
              <div className="flex items-center gap-1">
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

  // Permission check - redirect users with "No Permission" for Products
  useEffect(() => {
    if (currentUserPermissions && currentUserPermissions.productsHidden === true) {
      console.log('🚫 User has no permission for Products - redirecting to admin home');
      setLocation('/admin-home');
    }
  }, [currentUserPermissions, setLocation]);

  // Check if user has read-only access (can view but not modify)
  const isReadOnly = currentUserPermissions && 
    currentUserPermissions.productsRead === true && 
    currentUserPermissions.productsFullControl === false;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-3 pl-1 pr-6 lg:pr-8">
        <div className="px-1 py-3 sm:px-0">
          <ProductsManagementTable language={language} isReadOnly={isReadOnly} />
        </div>
      </div>
    </AdminLayout>
  );
}