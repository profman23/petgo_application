import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { Shield, User, FilePlus, Pencil } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SearchActionBar } from "@/components/ui/search-action-bar";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import { AuthorizationModal } from "@/components/AuthorizationModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useScreenPermissions } from "@/hooks/useScreenPermissions";

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
  
  // Search state
  const [searchInput, setSearchInput] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authorizationName, setAuthorizationName] = useState("");
  const [editingRole, setEditingRole] = useState<any>(null);
  const [initialPermissions, setInitialPermissions] = useState<Record<string, any>>({});
  
  // Create authorization role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; permissions: any }) => {
      return await apiRequest('/api/admin/authorization-roles', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/authorization-roles'] });
      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم حفظ الصلاحية بنجاح' : 'Authorization saved successfully',
      });
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error saving authorization:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في حفظ الصلاحية' : 'Failed to save authorization',
        variant: 'destructive',
      });
    }
  });

  // Update authorization role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; permissions: any }) => {
      return await apiRequest(`/api/admin/authorization-roles/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: data.name, permissions: data.permissions })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/authorization-roles'] });
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث الصلاحية بنجاح' : 'Authorization updated successfully',
      });
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error updating authorization:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحديث الصلاحية' : 'Failed to update authorization',
        variant: 'destructive',
      });
    }
  });
  
  // Search handlers
  const handleSearchClick = () => {
    console.log('Search clicked with:', searchInput);
  };
  
  const handleExportClick = () => {
    console.log('Export clicked');
  };

  const handleCreateAuthorization = () => {
    setEditingRole(null);
    setAuthorizationName("");
    setInitialPermissions({});
    setIsModalOpen(true);
  };

  const handleEditAuthorization = (role: any) => {
    setEditingRole(role);
    setAuthorizationName(role.name);
    setInitialPermissions(role.permissions || {});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAuthorizationName("");
    setEditingRole(null);
    setInitialPermissions({});
  };

  const handleSaveAuthorization = (name: string, permissions: Record<string, any>) => {
    console.log('Saving authorization:', name, permissions);
    
    if (!name.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'الرجاء إدخال اسم الصلاحية' : 'Please enter authorization name',
        variant: 'destructive',
      });
      return;
    }
    
    if (editingRole) {
      // Update existing authorization
      updateRoleMutation.mutate({ id: editingRole.id, name, permissions });
    } else {
      // Create new authorization
      createRoleMutation.mutate({ name, permissions });
    }
  };

  // Add lord-icon script to head when component mounts
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.lordicon.com/lordicon.js';
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script when component unmounts
      const existingScript = document.querySelector('script[src="https://cdn.lordicon.com/lordicon.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  // Fetch authorization roles from API (JSON-based)
  const {
    data: authorizationRoles = [],
    isLoading: authorizationsLoading,
    error: authorizationsError
  } = useQuery({
    queryKey: ['/api/admin/authorization-roles'],
    retry: false,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Use centralized permission hook
  const { hasAccess, canEdit, canExport, isLoading: permissionsLoading } = useScreenPermissions('authorization');

  // Check permissions on page load and redirect if no access
  useEffect(() => {
    if (!permissionsLoading && !hasAccess) {
      console.log('User does not have authorization permissions, redirecting to admin home');
      setLocation('/admin-home');
    }
  }, [hasAccess, permissionsLoading, setLocation]);

  // Determine if page is in read-only mode
  const isReadOnly = !canEdit;

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          {/* Left side - Lord Icon and Title */}
          <div className="flex items-center gap-4">
            {/* Lord Icon */}
            <div className="flex-shrink-0">
              <div 
                dangerouslySetInnerHTML={{
                  __html: '<lord-icon src="https://cdn.lordicon.com/gjlzobte.json" trigger="loop" delay="1500" colors="primary:#852085,secondary:#848484" style="width:80px;height:80px"></lord-icon>'
                }}
              />
            </div>
            
            {/* Authorization Title */}
            <h1 className="text-2xl font-bold text-gray-600" style={{fontFamily: 'Arimo'}}>
              {language === 'ar' ? 'إدارة الصلاحيات' : 'Authorization'}
            </h1>
          </div>

          {/* Right side - Create Authorization Button */}
          {canEdit && (
            <button
              onClick={handleCreateAuthorization}
              className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 bg-white hover:bg-purple-50"
              style={{ 
                borderColor: '#852085', 
                color: '#852085'
              }}
              data-testid="button-create-authorization"
            >
              <FilePlus className="h-4 w-4" style={{ color: '#852085' }} />
              {language === 'ar' ? 'إنشاء صلاحية' : 'Create Authorization'}
            </button>
          )}
        </div>

        {/* Search Action Bar */}
        <div className="mb-6">
          <SearchActionBar
            placeholder={language === 'ar' ? 'البحث بحسب اسم الصلاحية أو المعرف' : 'Search by authorization name or ID'}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchClick={handleSearchClick}
            onExportClick={handleExportClick}
            exportDisabled={!canExport}
            inputTestId="input-search-authorizations"
            searchButtonTestId="button-search-authorizations"
            exportButtonTestId="button-export-authorizations"
          />
        </div>

        {/* Authorization Content */}
        {authorizationsLoading ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 mt-4" dir={getDirection(language)}>
              {language === 'ar' ? 'جاري التحميل...' : 'Loading authorizations...'}
            </p>
          </div>
        ) : (authorizationRoles as any[]).length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900" dir={getDirection(language)}>
              {language === 'ar' ? 'لا توجد صلاحيات' : 'No authorizations'}
            </h3>
            <p className="mt-1 text-sm text-gray-500" dir={getDirection(language)}>
              {language === 'ar' ? 'لم يتم إنشاء أي صلاحيات حتى الآن' : 'No authorizations have been created yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 bg-white rounded-lg shadow p-4">
            {(authorizationRoles as any[]).map((role: any) => (
              <div
                key={role.id}
                className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield className="h-5 w-5" style={{ color: '#852085' }} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900" dir={getDirection(language)}>
                        {role.name}
                      </h3>
                      <p className="text-sm text-gray-500" dir={getDirection(language)}>
                        {language === 'ar' ? `المعرف: ${role.id}` : `ID: ${role.id}`}
                      </p>
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleEditAuthorization(role)}
                      className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                      data-testid={`button-edit-authorization-${role.id}`}
                      title={language === 'ar' ? 'تعديل' : 'Edit'}
                    >
                      <Pencil className="h-5 w-5" style={{ color: '#852085' }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Authorization Modal */}
      <AuthorizationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAuthorization}
        editMode={!!editingRole}
        authorizationName={authorizationName}
        onNameChange={setAuthorizationName}
        initialPermissions={initialPermissions}
      />
    </AdminLayout>
  );
}