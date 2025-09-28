import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { Shield, Car, Clock, BarChart3, FileText, User, Users, Upload, Package, Stethoscope, DollarSign, Receipt, FilePlus, X, Plus, Edit, Settings, Building } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SearchActionBar } from "@/components/ui/search-action-bar";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import { usePermissionsStore, fromAuthData, toAuthData } from "@/hooks/usePermissionsStore";
import { NoPermissionToggle, PermissionToggle, PermissionGroup } from "@/components/NoPermissionToggle";

// Declare lord-icon custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any;
    }
  }
}

// Helper function for text direction 
const getDirection = (lang: string) => lang === 'ar' ? 'rtl' : 'ltr';

export default function AdministrationAuthorization() {
  const [location, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { state: permissionsState, loadAuthorization, resetAll } = usePermissionsStore();
  
  // State for popup
  const [showAddAuthorizationPopup, setShowAddAuthorizationPopup] = useState(false);
  const [showNoPermissionPopup, setShowNoPermissionPopup] = useState(false);
  const [isNoPermissionDialogOpen, setIsNoPermissionDialogOpen] = useState(false);
  
  // Search state
  const [searchInput, setSearchInput] = useState("");
  
  // Search handlers
  const handleSearchClick = () => {
    // Search functionality can be implemented here
    console.log('Search clicked with:', searchInput);
  };
  
  
  const handleExportClick = () => {
    // Export functionality can be implemented here
    console.log('Export clicked');
  };
  
  // State for checkboxes - Users section
  const [hiddenUsersChecked, setHiddenUsersChecked] = useState(false);
  const [readUsersChecked, setReadUsersChecked] = useState(false);
  const [fullControlChecked, setFullControlChecked] = useState(false);
  
  // State for checkboxes - Authorization section
  const [authHiddenUsersChecked, setAuthHiddenUsersChecked] = useState(false);
  const [authReadUsersChecked, setAuthReadUsersChecked] = useState(false);
  const [authFullControlChecked, setAuthFullControlChecked] = useState(false);
  
  // State for checkboxes - Vets Van Management section
  const [vetsVanHiddenChecked, setVetsVanHiddenChecked] = useState(false);
  const [vetsVanReadChecked, setVetsVanReadChecked] = useState(false);
  const [vetsVanFullControlChecked, setVetsVanFullControlChecked] = useState(false);
  
  // State for checkboxes - Vets Van Shifts section
  const [vetsVanShiftsHiddenChecked, setVetsVanShiftsHiddenChecked] = useState(true);
  const [vetsVanShiftsReadChecked, setVetsVanShiftsReadChecked] = useState(false);
  const [vetsVanShiftsFullControlChecked, setVetsVanShiftsFullControlChecked] = useState(false);
  
  // State for checkboxes - Import section
  const [importHiddenChecked, setImportHiddenChecked] = useState(false);
  const [importFullControlChecked, setImportFullControlChecked] = useState(false);
  
  // State for checkboxes - Services section
  const [servicesHiddenChecked, setServicesHiddenChecked] = useState(false);
  const [servicesReadChecked, setServicesReadChecked] = useState(false);
  const [servicesFullControlChecked, setServicesFullControlChecked] = useState(false);
  
  // State for checkboxes - Products section
  const [productsHiddenChecked, setProductsHiddenChecked] = useState(false);
  const [productsReadChecked, setProductsReadChecked] = useState(false);
  const [productsFullControlChecked, setProductsFullControlChecked] = useState(false);
  
  // Credit Notes now use permission store - no local state needed

  // State for checkboxes - Financial Outgoing Payment section
  const [outgoingPaymentNoPermissionChecked, setOutgoingPaymentNoPermissionChecked] = useState(false);
  const [outgoingPaymentReadChecked, setOutgoingPaymentReadChecked] = useState(false);
  const [outgoingPaymentFullControlChecked, setOutgoingPaymentFullControlChecked] = useState(false);
  const [outgoingPaymentExportChecked, setOutgoingPaymentExportChecked] = useState(false);

  // State for checkboxes - Financial Income Payment section
  const [incomePaymentNoPermissionChecked, setIncomePaymentNoPermissionChecked] = useState(false);
  const [incomePaymentReadChecked, setIncomePaymentReadChecked] = useState(false);
  const [incomePaymentFullControlChecked, setIncomePaymentFullControlChecked] = useState(false);
  const [incomePaymentExportChecked, setIncomePaymentExportChecked] = useState(false);

  // State for checkboxes - Financial A/R Invoice section
  const [arInvoiceNoPermissionChecked, setArInvoiceNoPermissionChecked] = useState(false);
  const [arInvoiceReadChecked, setArInvoiceReadChecked] = useState(false);
  const [arInvoiceFullControlChecked, setArInvoiceFullControlChecked] = useState(false);
  const [arInvoiceExportChecked, setArInvoiceExportChecked] = useState(false);

  // State for checkboxes - Administration Users Management Export
  const [usersExportChecked, setUsersExportChecked] = useState(false);

  // State for checkboxes - Administration Authorization Management section
  const [authorizationMgmtNoPermissionChecked, setAuthorizationMgmtNoPermissionChecked] = useState(false);
  const [authorizationMgmtReadChecked, setAuthorizationMgmtReadChecked] = useState(false);
  const [authorizationMgmtFullControlChecked, setAuthorizationMgmtFullControlChecked] = useState(false);
  const [authorizationMgmtExportChecked, setAuthorizationMgmtExportChecked] = useState(false);

  // State for checkboxes - Business Partner Management section
  const [partnerMgmtNoPermissionChecked, setPartnerMgmtNoPermissionChecked] = useState(false);
  const [partnerMgmtReadChecked, setPartnerMgmtReadChecked] = useState(false);
  const [partnerMgmtFullControlChecked, setPartnerMgmtFullControlChecked] = useState(false);
  const [partnerMgmtExportChecked, setPartnerMgmtExportChecked] = useState(false);
  
  // State for authorization name field
  const [authorizationName, setAuthorizationName] = useState('');
  
  // State for editing
  const [editingAuthorization, setEditingAuthorization] = useState<any>(null);
  
  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Fetch authorizations from API
  const {
    data: authorizations = [],
    isLoading: authorizationsLoading,
    error: authorizationsError
  } = useQuery({
    queryKey: ['/api/admin/authorizations'],
    retry: false,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch current user's authorization permissions with proper cache management
  const {
    data: currentUserPermissions,
    isLoading: permissionsLoading,
    error: permissionsError
  } = useQuery({
    queryKey: ['/api/admin/current-user-permissions'],
    retry: false,
    staleTime: 0, // Always fetch fresh permissions
    gcTime: 0, // Don't cache to avoid stale data (replaces cacheTime)
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary calls
  });

  // Create authorization mutation
  const createAuthorizationMutation = useMutation({
    mutationFn: async (authData: any) => {
      return apiRequest('/api/admin/authorizations', {
        method: 'POST',
        body: JSON.stringify(authData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/authorizations'] });
      toast({
        title: language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved Successfully',
        description: language === 'ar' ? 'تم حفظ التصريح بنجاح' : 'Authorization has been saved successfully',
      });
      resetForm();
      setShowAddAuthorizationPopup(false);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'An error occurred while saving'),
        variant: 'destructive',
      });
    },
  });

  // Update authorization mutation
  const updateAuthorizationMutation = useMutation({
    mutationFn: async ({ id, authData }: { id: number; authData: any }) => {
      return apiRequest(`/api/admin/authorizations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(authData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/authorizations'] });
      toast({
        title: language === 'ar' ? 'تم التحديث بنجاح' : 'Updated Successfully',
        description: language === 'ar' ? 'تم تحديث التصريح بنجاح' : 'Authorization has been updated successfully',
      });
      resetForm();
      setShowAddAuthorizationPopup(false);
      setEditingAuthorization(null);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'حدث خطأ أثناء التحديث' : 'An error occurred while updating'),
        variant: 'destructive',
      });
    },
  });

  // Reset form function
  const resetForm = () => {
    setAuthorizationName('');
    setHiddenUsersChecked(false);
    setReadUsersChecked(false);
    setFullControlChecked(false);
    setAuthHiddenUsersChecked(false);
    setAuthReadUsersChecked(false);
    setAuthFullControlChecked(false);
    setVetsVanHiddenChecked(false);
    setVetsVanReadChecked(false);
    setVetsVanFullControlChecked(false);
    setVetsVanShiftsHiddenChecked(true);
    setVetsVanShiftsReadChecked(false);
    setVetsVanShiftsFullControlChecked(false);
    setImportHiddenChecked(false);
    setImportFullControlChecked(false);
    setServicesHiddenChecked(false);
    setServicesReadChecked(false);
    setServicesFullControlChecked(false);
    setProductsHiddenChecked(false);
    setProductsReadChecked(false);
    setProductsFullControlChecked(false);
    // Credit Notes state reset handled by permission store
    resetAll(); // Reset all permission store state
    setOutgoingPaymentNoPermissionChecked(false);
    setOutgoingPaymentReadChecked(false);
    setOutgoingPaymentFullControlChecked(false);
    setOutgoingPaymentExportChecked(false);
    setIncomePaymentNoPermissionChecked(false);
    setIncomePaymentReadChecked(false);
    setIncomePaymentFullControlChecked(false);
    setIncomePaymentExportChecked(false);
    setArInvoiceNoPermissionChecked(false);
    setArInvoiceReadChecked(false);
    setArInvoiceFullControlChecked(false);
    setArInvoiceExportChecked(false);
    setUsersExportChecked(false);
    setAuthorizationMgmtNoPermissionChecked(false);
    setAuthorizationMgmtReadChecked(false);
    setAuthorizationMgmtFullControlChecked(false);
    setAuthorizationMgmtExportChecked(false);
    setPartnerMgmtNoPermissionChecked(false);
    setPartnerMgmtReadChecked(false);
    setPartnerMgmtFullControlChecked(false);
    setPartnerMgmtExportChecked(false);
  };

  // Handle save authorization - Get data from permission store
  const handleSaveAuthorization = () => {
    if (!authorizationName.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'اسم التصريح مطلوب' : 'Authorization name is required',
        variant: 'destructive',
      });
      return;
    }

    // Get permission data from the store
    const permissionData = toAuthData(permissionsState);

    const authData = {
      name: authorizationName.trim(),
      // Legacy fields (not yet migrated)
      usersHidden: hiddenUsersChecked,
      usersRead: readUsersChecked,
      usersFullControl: fullControlChecked,
      authHidden: authHiddenUsersChecked,
      authRead: authReadUsersChecked,
      authFullControl: authFullControlChecked,
      vetsVanHidden: vetsVanHiddenChecked,
      vetsVanRead: vetsVanReadChecked,
      vetsVanFullControl: vetsVanFullControlChecked,
      vetsVanShiftsHidden: vetsVanShiftsHiddenChecked,
      vetsVanShiftsRead: vetsVanShiftsReadChecked,
      vetsVanShiftsFullControl: vetsVanShiftsFullControlChecked,
      importHidden: importHiddenChecked,
      importFullControl: importFullControlChecked,
      usersExport: usersExportChecked,
      // Permission store data
      ...permissionData,
    };


    if (editingAuthorization) {
      updateAuthorizationMutation.mutate({ id: editingAuthorization.id, authData });
    } else {
      createAuthorizationMutation.mutate(authData);
    }
  };

  // Handle edit authorization - Load data into permission store
  const handleEditAuthorization = (auth: any) => {
    setEditingAuthorization(auth);
    setAuthorizationName(auth.name);
    
    // Load authorization data into the permission store
    const permissionsData = fromAuthData(auth);
    loadAuthorization(permissionsData);
    
    // Continue with legacy state for non-permission fields
    setHiddenUsersChecked(auth.usersHidden);
    setReadUsersChecked(auth.usersRead);
    setFullControlChecked(auth.usersFullControl);
    setAuthHiddenUsersChecked(auth.authHidden);
    setAuthReadUsersChecked(auth.authRead);
    setAuthFullControlChecked(auth.authFullControl);
    setVetsVanHiddenChecked(auth.vetsVanHidden || false);
    setVetsVanReadChecked(auth.vetsVanRead || false);
    setVetsVanFullControlChecked(auth.vetsVanFullControl || false);
    setVetsVanShiftsHiddenChecked(auth.vetsVanShiftsHidden !== undefined ? auth.vetsVanShiftsHidden : true);
    setVetsVanShiftsReadChecked(auth.vetsVanShiftsRead || false);
    setVetsVanShiftsFullControlChecked(auth.vetsVanShiftsFullControl || false);
    setImportHiddenChecked(auth.importHidden || false);
    setImportFullControlChecked(auth.importFullControl || false);
    setUsersExportChecked(auth.usersExport || false);
    
    setShowAddAuthorizationPopup(true);
  };

  // Handle cancel/close popup
  const handleClosePopup = () => {
    setShowAddAuthorizationPopup(false);
    setEditingAuthorization(null);
    resetForm();
  };

  // Handlers for Users section
  const handleHiddenUsersChange = (checked: boolean) => {
    setHiddenUsersChecked(checked);
    if (checked) {
      setReadUsersChecked(false);
      setFullControlChecked(false);
    }
  };

  const handleReadUsersChange = (checked: boolean) => {
    setReadUsersChecked(checked);
    if (!checked) {
      setFullControlChecked(false);
    }
  };

  const handleFullControlChange = (checked: boolean) => {
    setFullControlChecked(checked);
    if (checked) {
      setReadUsersChecked(true);
    }
  };

  // Handlers for Authorization section
  const handleAuthHiddenUsersChange = (checked: boolean) => {
    setAuthHiddenUsersChecked(checked);
    if (checked) {
      setAuthReadUsersChecked(false);
      setAuthFullControlChecked(false);
    }
  };

  const handleAuthReadUsersChange = (checked: boolean) => {
    setAuthReadUsersChecked(checked);
    if (!checked) {
      setAuthFullControlChecked(false);
    }
  };

  const handleAuthFullControlChange = (checked: boolean) => {
    setAuthFullControlChecked(checked);
    if (checked) {
      setAuthReadUsersChecked(true);
    }
  };

  // Handlers for Vets Van Management section
  const handleVetsVanHiddenChange = (checked: boolean) => {
    setVetsVanHiddenChecked(checked);
    if (checked) {
      setVetsVanReadChecked(false);
      setVetsVanFullControlChecked(false);
    }
  };

  const handleVetsVanReadChange = (checked: boolean) => {
    setVetsVanReadChecked(checked);
    if (!checked) {
      setVetsVanFullControlChecked(false);
    }
  };

  const handleVetsVanFullControlChange = (checked: boolean) => {
    setVetsVanFullControlChecked(checked);
    if (checked) {
      setVetsVanReadChecked(true);
    }
  };

  // Vets Van Shifts handlers
  const handleVetsVanShiftsHiddenChange = (checked: boolean) => {
    setVetsVanShiftsHiddenChecked(checked);
    if (checked) {
      setVetsVanShiftsReadChecked(false);
      setVetsVanShiftsFullControlChecked(false);
    }
  };

  const handleVetsVanShiftsReadChange = (checked: boolean) => {
    setVetsVanShiftsReadChecked(checked);
    if (!checked) {
      setVetsVanShiftsFullControlChecked(false);
    }
  };

  const handleVetsVanShiftsFullControlChange = (checked: boolean) => {
    setVetsVanShiftsFullControlChecked(checked);
    if (checked) {
      setVetsVanShiftsReadChecked(true);
    }
  };

  // Handlers for Import section
  const handleImportHiddenChange = (checked: boolean) => {
    setImportHiddenChecked(checked);
    if (checked) {
      setImportFullControlChecked(false);
    }
  };

  const handleImportFullControlChange = (checked: boolean) => {
    setImportFullControlChecked(checked);
  };

  // Handlers for Services section
  const handleServicesHiddenChange = (checked: boolean) => {
    setServicesHiddenChecked(checked);
    if (checked) {
      setServicesReadChecked(false);
      setServicesFullControlChecked(false);
    }
  };

  const handleServicesReadChange = (checked: boolean) => {
    setServicesReadChecked(checked);
    if (!checked) {
      setServicesFullControlChecked(false);
    }
  };

  const handleServicesFullControlChange = (checked: boolean) => {
    setServicesFullControlChecked(checked);
    if (checked) {
      setServicesReadChecked(true);
    }
  };

  // Handlers for Products section
  const handleProductsHiddenChange = (checked: boolean) => {
    setProductsHiddenChecked(checked);
    if (checked) {
      setProductsReadChecked(false);
      setProductsFullControlChecked(false);
    }
  };

  const handleProductsReadChange = (checked: boolean) => {
    setProductsReadChecked(checked);
    if (!checked) {
      setProductsFullControlChecked(false);
    }
  };

  const handleProductsFullControlChange = (checked: boolean) => {
    setProductsFullControlChecked(checked);
    if (checked) {
      setProductsReadChecked(true);
    }
  };

  // Credit Notes handlers removed - now using permission store

  // Handlers for Outgoing Payment section
  const handleOutgoingPaymentNoPermissionChange = (checked: boolean) => {
    setOutgoingPaymentNoPermissionChecked(checked);
    if (checked) {
      setOutgoingPaymentReadChecked(false);
      setOutgoingPaymentFullControlChecked(false);
      setOutgoingPaymentExportChecked(false);
    }
  };

  const handleOutgoingPaymentReadChange = (checked: boolean) => {
    setOutgoingPaymentReadChecked(checked);
    if (!checked) {
      setOutgoingPaymentFullControlChecked(false);
      setOutgoingPaymentExportChecked(false);
    }
  };

  const handleOutgoingPaymentFullControlChange = (checked: boolean) => {
    setOutgoingPaymentFullControlChecked(checked);
    if (checked) {
      setOutgoingPaymentReadChecked(true);
    }
  };

  const handleOutgoingPaymentExportChange = (checked: boolean) => {
    setOutgoingPaymentExportChecked(checked);
    if (checked) {
      setOutgoingPaymentReadChecked(true);
    }
  };

  // Handlers for Income Payment section
  const handleIncomePaymentNoPermissionChange = (checked: boolean) => {
    setIncomePaymentNoPermissionChecked(checked);
    if (checked) {
      setIncomePaymentReadChecked(false);
      setIncomePaymentFullControlChecked(false);
      setIncomePaymentExportChecked(false);
    }
  };

  const handleIncomePaymentReadChange = (checked: boolean) => {
    setIncomePaymentReadChecked(checked);
    if (!checked) {
      setIncomePaymentFullControlChecked(false);
      setIncomePaymentExportChecked(false);
    }
  };

  const handleIncomePaymentFullControlChange = (checked: boolean) => {
    setIncomePaymentFullControlChecked(checked);
    if (checked) {
      setIncomePaymentReadChecked(true);
    }
  };

  const handleIncomePaymentExportChange = (checked: boolean) => {
    setIncomePaymentExportChecked(checked);
    if (checked) {
      setIncomePaymentReadChecked(true);
    }
  };

  // Handlers for A/R Invoice section
  const handleArInvoiceNoPermissionChange = (checked: boolean) => {
    setArInvoiceNoPermissionChecked(checked);
    if (checked) {
      setArInvoiceReadChecked(false);
      setArInvoiceFullControlChecked(false);
      setArInvoiceExportChecked(false);
    }
  };

  const handleArInvoiceReadChange = (checked: boolean) => {
    setArInvoiceReadChecked(checked);
    if (!checked) {
      setArInvoiceFullControlChecked(false);
      setArInvoiceExportChecked(false);
    }
  };

  const handleArInvoiceFullControlChange = (checked: boolean) => {
    setArInvoiceFullControlChecked(checked);
    if (checked) {
      setArInvoiceReadChecked(true);
    }
  };

  const handleArInvoiceExportChange = (checked: boolean) => {
    setArInvoiceExportChecked(checked);
    if (checked) {
      setArInvoiceReadChecked(true);
    }
  };

  // Handler for Users Export permission
  const handleUsersExportChange = (checked: boolean) => {
    setUsersExportChecked(checked);
    if (checked) {
      setReadUsersChecked(true);
    }
  };

  // Handlers for Authorization Management section
  const handleAuthorizationMgmtNoPermissionChange = (checked: boolean) => {
    setAuthorizationMgmtNoPermissionChecked(checked);
    if (checked) {
      setAuthorizationMgmtReadChecked(false);
      setAuthorizationMgmtFullControlChecked(false);
      setAuthorizationMgmtExportChecked(false);
    }
  };

  const handleAuthorizationMgmtReadChange = (checked: boolean) => {
    setAuthorizationMgmtReadChecked(checked);
    if (!checked) {
      setAuthorizationMgmtFullControlChecked(false);
      setAuthorizationMgmtExportChecked(false);
    }
  };

  const handleAuthorizationMgmtFullControlChange = (checked: boolean) => {
    setAuthorizationMgmtFullControlChecked(checked);
    if (checked) {
      setAuthorizationMgmtReadChecked(true);
    }
  };

  const handleAuthorizationMgmtExportChange = (checked: boolean) => {
    setAuthorizationMgmtExportChecked(checked);
    if (checked) {
      setAuthorizationMgmtReadChecked(true);
    }
  };

  // Handlers for Partner Management section
  const handlePartnerMgmtNoPermissionChange = (checked: boolean) => {
    setPartnerMgmtNoPermissionChecked(checked);
    if (checked) {
      setPartnerMgmtReadChecked(false);
      setPartnerMgmtFullControlChecked(false);
      setPartnerMgmtExportChecked(false);
    }
  };

  const handlePartnerMgmtReadChange = (checked: boolean) => {
    setPartnerMgmtReadChecked(checked);
    if (!checked) {
      setPartnerMgmtFullControlChecked(false);
      setPartnerMgmtExportChecked(false);
    }
  };

  const handlePartnerMgmtFullControlChange = (checked: boolean) => {
    setPartnerMgmtFullControlChecked(checked);
    if (checked) {
      setPartnerMgmtReadChecked(true);
    }
  };

  const handlePartnerMgmtExportChange = (checked: boolean) => {
    setPartnerMgmtExportChecked(checked);
    if (checked) {
      setPartnerMgmtReadChecked(true);
    }
  };

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation]);

  // Route guard - redirect if user doesn't have permission to access Authorization page
  useEffect(() => {
    if (!permissionsLoading && currentUserPermissions && (currentUserPermissions as any).authHidden === true) {
      // User should not reach this page with hidden permission, redirect immediately
      console.log('User has no authorization permission, redirecting');
      setLocation('/admin-home');
    }
  }, [currentUserPermissions, permissionsLoading, setLocation]);

  // Determine if page is in read-only mode
  const isReadOnly = currentUserPermissions && (currentUserPermissions as any).authRead === true && !(currentUserPermissions as any).authFullControl;

  return (
    <AdminLayout>
      <div className="flex-1 relative">
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto relative">
        {/* Top Header Section */}
        <div className="flex items-center justify-between p-8">
          {/* Authorization Management Header - aligned to far left */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <lord-icon 
                src="https://cdn.lordicon.com/gjlzobte.json" 
                trigger="hover" 
                colors="primary:#852085,secondary:#545454" 
                style={{ width: '80px', height: '80px' }}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-600" style={{ fontFamily: 'Arimo' }}>
              {language === 'ar' ? 'إدارة التصريحات' : 'Authorization Management'}
            </h1>
          </div>

          {/* Add Authorization Button - top-right corner */}
          <button
            data-testid="button-add-authorization"
            onClick={isReadOnly ? undefined : () => setShowAddAuthorizationPopup(true)}
            disabled={!!isReadOnly}
            className={`px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 ${
              isReadOnly 
                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                : 'border-purple-600 bg-white text-purple-600 hover:bg-purple-50'
            }`}
          >
            <FilePlus style={{ color: '#852085' }} className="w-5 h-5" />
            {language === 'ar' ? 'إضافة تصريح جديد' : 'Add New Authorization'}
          </button>
        </div>

        {/* Search Action Bar */}
        <div className="px-8 mb-6">
          <SearchActionBar
            placeholder={language === 'ar' ? 'البحث بحسب اسم التصريح أو المستخدم' : 'Search by authorization name or user'}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchClick={handleSearchClick}
            onExportClick={handleExportClick}
            inputTestId="input-search-authorizations"
            searchButtonTestId="button-search-authorizations"
            exportButtonTestId="button-export-authorizations"
          />
        </div>

        {/* Authorization Content */}
        <div className="px-4 mb-6">
          {authorizationsLoading ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </p>
            </div>
          ) : (authorizations as any[]).length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {language === 'ar' ? 'لا توجد تصريحات' : 'No Authorizations'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {language === 'ar' 
                  ? 'اضغط على "إضافة تصريح جديد" لإنشاء تصريح جديد' 
                  : 'Click "Add New Authorization" to create your first authorization'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              {(authorizations as any[]).map((auth: any) => (
                <div
                  key={auth.id}
                  data-testid={`card-authorization-${auth.id}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex items-center gap-3">
                      <Shield className="h-6 w-6" style={{ color: '#852085' }} />
                      <p className="text-lg font-medium" style={{ fontFamily: 'Arimo', color: '#26282b' }} data-testid={`text-auth-name-${auth.id}`}>
                        {language === 'ar' ? 'اسم التصريح: ' : 'Authorization Name: '}{auth.name}
                      </p>
                    </div>
                    <div className="ml-4">
                      <button
                        data-testid={`button-edit-${auth.id}`}
                        onClick={isReadOnly ? undefined : () => handleEditAuthorization(auth)}
                        disabled={!!isReadOnly}
                        className={`p-2 rounded-full transition-colors ${
                          isReadOnly 
                            ? 'text-gray-300 cursor-not-allowed opacity-50'
                            : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                        }`}
                        title={language === 'ar' ? 'تعديل' : 'Edit'}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Add New Authorization Popup */}
      {showAddAuthorizationPopup && !isReadOnly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[1000px] max-w-6xl mx-4 flex flex-col max-h-[85vh]">
            {/* Popup Header */}
            <div className="flex justify-between items-center p-4 border-b">
              {editingAuthorization ? (
                <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <lord-icon 
                    src="https://cdn.lordicon.com/exymduqj.json" 
                    trigger="loop" 
                    delay="1500" 
                    state="hover-line" 
                    colors="primary:#852085,secondary:#545454" 
                    style={{ width: '80px', height: '80px' }}
                  />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {language === 'ar' ? 'تعديل التصريح' : 'Edit Authorization'}
                  </h2>
                </div>
              ) : (
                <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <lord-icon 
                    src="https://cdn.lordicon.com/avbhqgrw.json" 
                    trigger="loop" 
                    delay="1500" 
                    colors="primary:#852085,secondary:#545454" 
                    style={{ width: '80px', height: '80px' }}
                  />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {language === 'ar' ? 'إضافة تصريح جديد' : 'Add New Authorization'}
                  </h2>
                </div>
              )}
              <button
                data-testid="button-close-popup"
                onClick={handleClosePopup}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Popup Content with Custom Scrollbar */}
            <div className="relative flex-1 overflow-hidden">
              <div className="p-4 pb-6 h-full overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                {/* Authorization Name */}
                <div className="mb-6">
                  <label htmlFor="authorizationName" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'اسم التصريح:' : 'Authorization Name:'}
                  </label>
                  <input
                    type="text"
                    id="authorizationName"
                    data-testid="input-authorization-name"
                    value={authorizationName}
                    onChange={(e) => setAuthorizationName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder={language === 'ar' ? 'أدخل اسم التصريح' : 'Enter authorization name'}
                  />
                </div>

                {/* Administration Tab */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    {language === 'ar' ? 'الإدارة' : 'Administration'}
                  </h3>
                  
                  {/* Users Management Sub-tab */}
                  <div className="ml-8 mb-4">
                    <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                      <Users className="h-3 w-3 text-gray-500" />
                      {language === 'ar' ? 'إدارة المستخدمين' : 'Users Management'}
                    </h4>
                    <div className="ml-4 flex flex-row gap-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hiddenUsers"
                          data-testid="checkbox-users-hidden"
                          checked={hiddenUsersChecked}
                          onChange={(e) => handleHiddenUsersChange(e.target.checked)}
                          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="hiddenUsers" className="ml-2 text-sm text-gray-600">
                          No Permission
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="readUsers"
                          data-testid="checkbox-users-read"
                          checked={readUsersChecked}
                          disabled={hiddenUsersChecked}
                          onChange={(e) => handleReadUsersChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${hiddenUsersChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="readUsers" className={`ml-2 text-sm ${hiddenUsersChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          Read
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="fullControl"
                          data-testid="checkbox-users-full-control"
                          checked={fullControlChecked}
                          disabled={hiddenUsersChecked}
                          onChange={(e) => handleFullControlChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${hiddenUsersChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="fullControl" className={`ml-2 text-sm ${hiddenUsersChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          Full Control
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="usersExport"
                          data-testid="checkbox-users-export"
                          checked={usersExportChecked}
                          disabled={hiddenUsersChecked}
                          onChange={(e) => handleUsersExportChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${hiddenUsersChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="usersExport" className={`ml-2 text-sm ${hiddenUsersChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          Export
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Authorization Management Sub-tab */}
                  <div className="ml-8 mb-4">
                    <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-2">
                      <Shield className="h-3 w-3 text-gray-500" />
                      {language === 'ar' ? 'إدارة التصريحات' : 'Authorization Management'}
                    </h4>
                    <div className="ml-4 flex flex-row gap-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="authorizationMgmtNoPermission"
                          data-testid="checkbox-authorization-mgmt-no-permission"
                          checked={authorizationMgmtNoPermissionChecked}
                          onChange={(e) => handleAuthorizationMgmtNoPermissionChange(e.target.checked)}
                          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="authorizationMgmtNoPermission" className="ml-2 text-sm text-gray-600">
                          No Permission
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="authorizationMgmtRead"
                          data-testid="checkbox-authorization-mgmt-read"
                          checked={authorizationMgmtReadChecked}
                          disabled={authorizationMgmtNoPermissionChecked}
                          onChange={(e) => handleAuthorizationMgmtReadChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${authorizationMgmtNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="authorizationMgmtRead" className={`ml-2 text-sm ${authorizationMgmtNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          Read
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="authorizationMgmtFullControl"
                          data-testid="checkbox-authorization-mgmt-full-control"
                          checked={authorizationMgmtFullControlChecked}
                          disabled={authorizationMgmtNoPermissionChecked}
                          onChange={(e) => handleAuthorizationMgmtFullControlChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${authorizationMgmtNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="authorizationMgmtFullControl" className={`ml-2 text-sm ${authorizationMgmtNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          Full Control
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="authorizationMgmtExport"
                          data-testid="checkbox-authorization-mgmt-export"
                          checked={authorizationMgmtExportChecked}
                          disabled={authorizationMgmtNoPermissionChecked}
                          onChange={(e) => handleAuthorizationMgmtExportChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${authorizationMgmtNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="authorizationMgmtExport" className={`ml-2 text-sm ${authorizationMgmtNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          Export
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Purple divider line */}
                  <div className="border-b border-purple-600 mt-3 mb-4"></div>
                </div>

                {/* Financial Tab */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    {language === 'ar' ? 'المالية' : 'Financial'}
                  </h3>
                  
                  {/* Credit Note Section with Sub-tabs */}
                  <div className="ml-8">
                    
                    {/* Credit Notes Sub-tab */}
                    <div className="ml-4 mb-4">
                      <h5 className="text-xs font-medium text-gray-600 mb-2">
                        {language === 'ar' ? 'إشعارات الخصم' : 'Credit Notes'}
                      </h5>
                      <div className="ml-4 flex flex-row gap-6">
                        <NoPermissionToggle 
                          groupKey="creditNote"
                          data-testid="checkbox-credit-notes-no-permission"
                        />
                        <PermissionToggle 
                          groupKey="creditNote"
                          permissionType="read"
                          label="Read"
                          data-testid="checkbox-credit-notes-read"
                        />
                        <PermissionToggle 
                          groupKey="creditNote"
                          permissionType="fullControl"
                          label="Full Control"
                          data-testid="checkbox-credit-notes-full-control"
                        />
                        <PermissionToggle 
                          groupKey="creditNote"
                          permissionType="export"
                          label="Export"
                          data-testid="checkbox-credit-notes-export"
                        />
                      </div>
                    </div>

                    {/* Outgoing Payment Sub-tab */}
                    <div className="ml-4 mb-4">
                      <h5 className="text-xs font-medium text-gray-600 mb-2">
                        {language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment'}
                      </h5>
                      <div className="ml-4 flex flex-row gap-6">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="outgoingPaymentNoPermission"
                            data-testid="checkbox-outgoing-payment-no-permission"
                            checked={outgoingPaymentNoPermissionChecked}
                            onChange={(e) => handleOutgoingPaymentNoPermissionChange(e.target.checked)}
                            className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="outgoingPaymentNoPermission" className="ml-2 text-sm text-gray-600">
                            No Permission
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="outgoingPaymentRead"
                            data-testid="checkbox-outgoing-payment-read"
                            checked={outgoingPaymentReadChecked}
                            disabled={outgoingPaymentNoPermissionChecked}
                            onChange={(e) => handleOutgoingPaymentReadChange(e.target.checked)}
                            className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${outgoingPaymentNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                          <label htmlFor="outgoingPaymentRead" className={`ml-2 text-sm ${outgoingPaymentNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                            Read
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="outgoingPaymentFullControl"
                            data-testid="checkbox-outgoing-payment-full-control"
                            checked={outgoingPaymentFullControlChecked}
                            disabled={outgoingPaymentNoPermissionChecked}
                            onChange={(e) => handleOutgoingPaymentFullControlChange(e.target.checked)}
                            className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${outgoingPaymentNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                          <label htmlFor="outgoingPaymentFullControl" className={`ml-2 text-sm ${outgoingPaymentNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                            Full Control
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="outgoingPaymentExport"
                            data-testid="checkbox-outgoing-payment-export"
                            checked={outgoingPaymentExportChecked}
                            disabled={outgoingPaymentNoPermissionChecked}
                            onChange={(e) => handleOutgoingPaymentExportChange(e.target.checked)}
                            className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${outgoingPaymentNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                          <label htmlFor="outgoingPaymentExport" className={`ml-2 text-sm ${outgoingPaymentNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                            Export
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Income Payment Sub-tab */}
                    <div className="ml-4 mb-4">
                      <h5 className="text-xs font-medium text-gray-600 mb-2">
                        {language === 'ar' ? 'الدفع الوارد' : 'Income Payment'}
                      </h5>
                      <div className="ml-4 flex flex-row gap-6">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="incomePaymentNoPermission"
                            data-testid="checkbox-income-payment-no-permission"
                            checked={incomePaymentNoPermissionChecked}
                            onChange={(e) => handleIncomePaymentNoPermissionChange(e.target.checked)}
                            className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="incomePaymentNoPermission" className="ml-2 text-sm text-gray-600">
                            No Permission
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="incomePaymentRead"
                            data-testid="checkbox-income-payment-read"
                            checked={incomePaymentReadChecked}
                            disabled={incomePaymentNoPermissionChecked}
                            onChange={(e) => handleIncomePaymentReadChange(e.target.checked)}
                            className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${incomePaymentNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                          <label htmlFor="incomePaymentRead" className={`ml-2 text-sm ${incomePaymentNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                            Read
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="incomePaymentFullControl"
                            data-testid="checkbox-income-payment-full-control"
                            checked={incomePaymentFullControlChecked}
                            disabled={incomePaymentNoPermissionChecked}
                            onChange={(e) => handleIncomePaymentFullControlChange(e.target.checked)}
                            className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${incomePaymentNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                          <label htmlFor="incomePaymentFullControl" className={`ml-2 text-sm ${incomePaymentNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                            Full Control
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="incomePaymentExport"
                            data-testid="checkbox-income-payment-export"
                            checked={incomePaymentExportChecked}
                            disabled={incomePaymentNoPermissionChecked}
                            onChange={(e) => handleIncomePaymentExportChange(e.target.checked)}
                            className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${incomePaymentNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                          <label htmlFor="incomePaymentExport" className={`ml-2 text-sm ${incomePaymentNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                            Export
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* A/R Invoice Sub-tab */}
                    <div className="ml-4 mb-4">
                      <h5 className="text-xs font-medium text-gray-600 mb-2">
                        {language === 'ar' ? 'فاتورة الحسابات المدينة' : 'A/R Invoice'}
                      </h5>
                      <div className="ml-4 flex flex-row gap-6">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="arInvoiceNoPermission"
                            data-testid="checkbox-ar-invoice-no-permission"
                            checked={arInvoiceNoPermissionChecked}
                            onChange={(e) => handleArInvoiceNoPermissionChange(e.target.checked)}
                            className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="arInvoiceNoPermission" className="ml-2 text-sm text-gray-600">
                            No Permission
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="arInvoiceRead"
                            data-testid="checkbox-ar-invoice-read"
                            checked={arInvoiceReadChecked}
                            disabled={arInvoiceNoPermissionChecked}
                            onChange={(e) => handleArInvoiceReadChange(e.target.checked)}
                            className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${arInvoiceNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                          <label htmlFor="arInvoiceRead" className={`ml-2 text-sm ${arInvoiceNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                            Read
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="arInvoiceFullControl"
                            data-testid="checkbox-ar-invoice-full-control"
                            checked={arInvoiceFullControlChecked}
                            disabled={arInvoiceNoPermissionChecked}
                            onChange={(e) => handleArInvoiceFullControlChange(e.target.checked)}
                            className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${arInvoiceNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                          <label htmlFor="arInvoiceFullControl" className={`ml-2 text-sm ${arInvoiceNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                            Full Control
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="arInvoiceExport"
                            data-testid="checkbox-ar-invoice-export"
                            checked={arInvoiceExportChecked}
                            disabled={arInvoiceNoPermissionChecked}
                            onChange={(e) => handleArInvoiceExportChange(e.target.checked)}
                            className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${arInvoiceNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                          <label htmlFor="arInvoiceExport" className={`ml-2 text-sm ${arInvoiceNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                            Export
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Purple divider line */}
                    <div className="border-b border-purple-600 mt-3 mb-4"></div>
                  </div>
                </div>
                
                {/* Vets Van Management Section */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Car className="h-4 w-4 text-gray-500" />
                    {language === 'ar' ? 'إدارة VETS VAN' : 'Vets Van Management'}
                  </h3>
                  
                  {/* Vets Van Management Section */}
                  <div className="ml-8">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      {language === 'ar' ? 'إدارة VETS VAN' : 'Vets Van Management'}
                    </h4>
                    
                    {/* Permission Items */}
                    <div className="ml-4 flex flex-row gap-6">
                      {/* Hidden Vets Van */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="vetsVanHidden"
                          data-testid="checkbox-vets-van-hidden"
                          checked={vetsVanHiddenChecked}
                          onChange={(e) => handleVetsVanHiddenChange(e.target.checked)}
                          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="vetsVanHidden" className="ml-2 text-sm text-gray-600">
                          No Permission
                        </label>
                      </div>
                      
                      {/* Read Vets Van */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="vetsVanRead"
                          data-testid="checkbox-vets-van-read"
                          checked={vetsVanReadChecked}
                          disabled={vetsVanHiddenChecked}
                          onChange={(e) => handleVetsVanReadChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${vetsVanHiddenChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="vetsVanRead" className={`ml-2 text-sm ${vetsVanHiddenChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          Read
                        </label>
                      </div>
                      
                      {/* Full Control Vets Van */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="vetsVanFullControl"
                          data-testid="checkbox-vets-van-full-control"
                          checked={vetsVanFullControlChecked}
                          disabled={vetsVanHiddenChecked}
                          onChange={(e) => handleVetsVanFullControlChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${vetsVanHiddenChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="vetsVanFullControl" className={`ml-2 text-sm ${vetsVanHiddenChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          {language === 'ar' ? 'تحكم كامل' : 'Full Control'}
                        </label>
                      </div>
                    </div>
                    
                    {/* Purple divider line */}
                    <div className="border-b border-purple-600 mt-3 mb-4"></div>
                  </div>
                </div>

                {/* Vets Van Shifts Section */}
                <div className="mb-4">
                  <div className="ml-8">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      {language === 'ar' ? 'نوبات VETS VAN' : 'Vets Van Shifts'}
                    </h4>
                    
                    {/* Permission Items */}
                    <div className="ml-4 flex flex-row gap-6">
                      {/* Hidden Vets Van Shifts */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="vetsVanShiftsHidden"
                          data-testid="checkbox-vets-van-shifts-hidden"
                          checked={vetsVanShiftsHiddenChecked}
                          onChange={(e) => handleVetsVanShiftsHiddenChange(e.target.checked)}
                          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="vetsVanShiftsHidden" className="ml-2 text-sm text-gray-600">
                          No Permission
                        </label>
                      </div>
                      
                      {/* Read Vets Van Shifts */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="vetsVanShiftsRead"
                          data-testid="checkbox-vets-van-shifts-read"
                          checked={vetsVanShiftsReadChecked}
                          disabled={vetsVanShiftsHiddenChecked}
                          onChange={(e) => handleVetsVanShiftsReadChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${vetsVanShiftsHiddenChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="vetsVanShiftsRead" className={`ml-2 text-sm ${vetsVanShiftsHiddenChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          Read
                        </label>
                      </div>
                      
                      {/* Full Control Vets Van Shifts */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="vetsVanShiftsFullControl"
                          data-testid="checkbox-vets-van-shifts-full-control"
                          checked={vetsVanShiftsFullControlChecked}
                          disabled={vetsVanShiftsHiddenChecked}
                          onChange={(e) => handleVetsVanShiftsFullControlChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${vetsVanShiftsHiddenChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="vetsVanShiftsFullControl" className={`ml-2 text-sm ${vetsVanShiftsHiddenChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          {language === 'ar' ? 'تحكم كامل' : 'Full Control'}
                        </label>
                      </div>
                    </div>
                    
                    {/* Purple divider line */}
                    <div className="border-b border-purple-600 mt-3 mb-4"></div>
                  </div>
                  
                  {/* Import Section */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Upload className="h-4 w-4 text-gray-500" />
                      {language === 'ar' ? 'استيراد' : 'Import'}
                    </h3>
                    
                    {/* Import Sub-section */}
                    <div className="ml-8">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        {language === 'ar' ? 'استيراد' : 'Import'}
                      </h4>
                      
                      {/* Permission Items */}
                      <div className="ml-4 flex flex-row gap-6">
                      {/* No Permission Import */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="importHidden"
                          data-testid="checkbox-import-hidden"
                          checked={importHiddenChecked}
                          onChange={(e) => handleImportHiddenChange(e.target.checked)}
                          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="importHidden" className="ml-2 text-sm text-gray-600">
                          No Permission
                        </label>
                      </div>
                      
                      {/* Full Control Import */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="importFullControl"
                          data-testid="checkbox-import-full-control"
                          checked={importFullControlChecked}
                          disabled={importHiddenChecked}
                          onChange={(e) => handleImportFullControlChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${importHiddenChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="importFullControl" className={`ml-2 text-sm ${importHiddenChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          {language === 'ar' ? 'تحكم كامل' : 'Full Control'}
                        </label>
                      </div>
                      </div>
                      
                      {/* Purple divider line */}
                      <div className="border-b border-purple-600 mt-3 mb-4"></div>
                    </div>
                  </div>
                  
                  {/* Services Section */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-gray-500" />
                      {language === 'ar' ? 'الخدمات' : 'Services'}
                    </h3>
                    
                    {/* Services Sub-section */}
                    <div className="ml-8">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        {language === 'ar' ? 'الخدمات' : 'Services'}
                      </h4>
                      
                      {/* Permission Items */}
                      <div className="ml-4 flex flex-row gap-6">
                      {/* No Permission Services */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="servicesHidden"
                          data-testid="checkbox-services-hidden"
                          checked={servicesHiddenChecked}
                          onChange={(e) => handleServicesHiddenChange(e.target.checked)}
                          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="servicesHidden" className="ml-2 text-sm text-gray-600">
                          No Permission
                        </label>
                      </div>
                      
                      {/* Read Services */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="servicesRead"
                          data-testid="checkbox-services-read"
                          checked={servicesReadChecked}
                          disabled={servicesHiddenChecked}
                          onChange={(e) => handleServicesReadChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${servicesHiddenChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="servicesRead" className={`ml-2 text-sm ${servicesHiddenChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          Read
                        </label>
                      </div>
                      
                      {/* Full Control Services */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="servicesFullControl"
                          data-testid="checkbox-services-full-control"
                          checked={servicesFullControlChecked}
                          disabled={servicesHiddenChecked}
                          onChange={(e) => handleServicesFullControlChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${servicesHiddenChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="servicesFullControl" className={`ml-2 text-sm ${servicesHiddenChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          {language === 'ar' ? 'تحكم كامل' : 'Full Control'}
                        </label>
                      </div>
                      </div>
                      
                      {/* Purple divider line */}
                      <div className="border-b border-purple-600 mt-3 mb-4"></div>
                    </div>
                  </div>
                  
                  {/* Products Section */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      {language === 'ar' ? 'المنتجات' : 'Products'}
                    </h3>
                    
                    {/* Products Sub-section */}
                    <div className="ml-8">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        {language === 'ar' ? 'المنتجات' : 'Products'}
                      </h4>
                      
                      {/* Permission Items */}
                      <div className="ml-4 flex flex-row gap-6">
                      {/* No Permission Products */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="productsHidden"
                          data-testid="checkbox-products-hidden"
                          checked={productsHiddenChecked}
                          onChange={(e) => handleProductsHiddenChange(e.target.checked)}
                          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="productsHidden" className="ml-2 text-sm text-gray-600">
                          No Permission
                        </label>
                      </div>
                      
                      {/* Read Products */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="productsRead"
                          data-testid="checkbox-products-read"
                          checked={productsReadChecked}
                          disabled={productsHiddenChecked}
                          onChange={(e) => handleProductsReadChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${productsHiddenChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="productsRead" className={`ml-2 text-sm ${productsHiddenChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          Read
                        </label>
                      </div>
                      
                      {/* Full Control Products */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="productsFullControl"
                          data-testid="checkbox-products-full-control"
                          checked={productsFullControlChecked}
                          disabled={productsHiddenChecked}
                          onChange={(e) => handleProductsFullControlChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${productsHiddenChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="productsFullControl" className={`ml-2 text-sm ${productsHiddenChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          {language === 'ar' ? 'تحكم كامل' : 'Full Control'}
                        </label>
                      </div>
                      
                      {/* Purple divider line */}
                      <div className="border-b border-purple-600 mt-3 mb-4"></div>
                    </div>
                  </div>
                </div>

                {/* Business Partner Tab */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    {language === 'ar' ? 'شريك الأعمال' : 'Business Partner'}
                  </h3>
                  
                  {/* Partner Management Sub-tab */}
                  <div className="ml-8 mb-4">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">
                      {language === 'ar' ? 'إدارة الشركاء' : 'Partner Management'}
                    </h4>
                    <div className="ml-4 flex flex-row gap-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="partnerMgmtNoPermission"
                          data-testid="checkbox-partner-mgmt-no-permission"
                          checked={partnerMgmtNoPermissionChecked}
                          onChange={(e) => handlePartnerMgmtNoPermissionChange(e.target.checked)}
                          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="partnerMgmtNoPermission" className="ml-2 text-sm text-gray-600">
                          No Permission
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="partnerMgmtRead"
                          data-testid="checkbox-partner-mgmt-read"
                          checked={partnerMgmtReadChecked}
                          disabled={partnerMgmtNoPermissionChecked}
                          onChange={(e) => handlePartnerMgmtReadChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${partnerMgmtNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="partnerMgmtRead" className={`ml-2 text-sm ${partnerMgmtNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          Read
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="partnerMgmtFullControl"
                          data-testid="checkbox-partner-mgmt-full-control"
                          checked={partnerMgmtFullControlChecked}
                          disabled={partnerMgmtNoPermissionChecked}
                          onChange={(e) => handlePartnerMgmtFullControlChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${partnerMgmtNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="partnerMgmtFullControl" className={`ml-2 text-sm ${partnerMgmtNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          Full Control
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="partnerMgmtExport"
                          data-testid="checkbox-partner-mgmt-export"
                          checked={partnerMgmtExportChecked}
                          disabled={partnerMgmtNoPermissionChecked}
                          onChange={(e) => handlePartnerMgmtExportChange(e.target.checked)}
                          className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${partnerMgmtNoPermissionChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label htmlFor="partnerMgmtExport" className={`ml-2 text-sm ${partnerMgmtNoPermissionChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          Export
                        </label>
                      </div>
                    </div>
                    
                    {/* Purple divider line */}
                    <div className="border-b border-purple-600 mt-3 mb-8"></div>
                  </div>
                </div>
                </div>
              </div>
            </div>
            
            {/* Popup Footer */}
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                data-testid="button-cancel"
                onClick={handleClosePopup}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                data-testid="button-save-authorization"
                onClick={handleSaveAuthorization}
                disabled={createAuthorizationMutation.isPending || updateAuthorizationMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createAuthorizationMutation.isPending || updateAuthorizationMutation.isPending 
                  ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                  : editingAuthorization 
                    ? (language === 'ar' ? 'تحديث' : 'Update')
                    : (language === 'ar' ? 'حفظ' : 'Save')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Permission Popup */}
      {showNoPermissionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Popup Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {language === 'ar' ? 'ليس لديك صلاحية' : 'No permission'}
              </h2>
              <button
                data-testid="button-close-no-permission"
                onClick={() => {
                  setShowNoPermissionPopup(false);
                  setIsNoPermissionDialogOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Popup Body */}
            <div className="p-4">
              <p className="text-sm text-gray-600">
                {language === 'ar' 
                  ? 'ليس لديك صلاحية للوصول إلى هذا القسم. يُرجى التواصل مع المشرف.' 
                  : "You don't have access to this section. Please contact the administrator."
                }
              </p>
            </div>
            
            {/* Popup Footer */}
            <div className="flex justify-end p-4 border-t">
              <button
                data-testid="button-ok"
                onClick={() => {
                  setShowNoPermissionPopup(false);
                  setIsNoPermissionDialogOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
              >
                {language === 'ar' ? 'موافق' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}