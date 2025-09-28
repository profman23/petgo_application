import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { Shield, User, FilePlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SearchActionBar } from "@/components/ui/search-action-bar";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";

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
  
  // Search state
  const [searchInput, setSearchInput] = useState("");
  
  // Search handlers
  const handleSearchClick = () => {
    console.log('Search clicked with:', searchInput);
  };
  
  const handleExportClick = () => {
    console.log('Export clicked');
  };

  const handleCreateAuthorization = () => {
    console.log('Create authorization clicked');
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

  // Check authorization permissions on page load
  useEffect(() => {
    if (!permissionsLoading && currentUserPermissions) {
      const permissions = currentUserPermissions as any;
      
      // Check if user has any authorization permissions
      const hasAuthRead = permissions.authRead === true;
      const hasAuthFullControl = permissions.authFullControl === true;
      const hasAuthHidden = permissions.authHidden === true;
      
      if (hasAuthHidden || (!hasAuthRead && !hasAuthFullControl)) {
        console.log('User does not have authorization permissions, redirecting to admin home');
        setLocation('/admin-home');
        return;
      }
    }
  }, [currentUserPermissions, permissionsLoading, setLocation]);

  // Determine if page is in read-only mode
  const isReadOnly = currentUserPermissions && (currentUserPermissions as any).authRead === true && !(currentUserPermissions as any).authFullControl;

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
        </div>

        {/* Search Action Bar */}
        <div className="mb-6">
          <SearchActionBar
            placeholder={language === 'ar' ? 'البحث بحسب اسم الصلاحية أو المعرف' : 'Search by authorization name or ID'}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchClick={handleSearchClick}
            onExportClick={handleExportClick}
            exportDisabled={false}
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
        ) : (authorizations as any[]).length === 0 ? (
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
            {(authorizations as any[]).map((auth: any) => (
              <div
                key={auth.id}
                className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900" dir={getDirection(language)}>
                        {auth.name}
                      </h3>
                      <p className="text-sm text-gray-500" dir={getDirection(language)}>
                        {language === 'ar' ? `المعرف: ${auth.id}` : `ID: ${auth.id}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500" dir={getDirection(language)}>
                    {language === 'ar' ? 'صلاحية محفوظة' : 'Saved Authorization'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}