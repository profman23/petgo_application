import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { Shield, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SearchActionBar } from "@/components/ui/search-action-bar";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";

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
      <div className="flex-1 relative">
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto relative">
          {/* Top Header Section */}
          <div className="bg-white border-b border-gray-200 px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900" dir={getDirection(language)}>
                    {language === 'ar' ? 'إدارة الصلاحيات' : 'Authorization Management'}
                  </h1>
                  <p className="text-sm text-gray-500" dir={getDirection(language)}>
                    {language === 'ar' ? 'إدارة صلاحيات المستخدمين والوصول للنظام' : 'Manage user permissions and system access'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar Section */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <SearchActionBar
              searchInput={searchInput}
              setSearchInput={setSearchInput}
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
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                {(authorizations as any[]).map((auth: any) => (
                  <div
                    key={auth.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
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
        </div>
      </div>
    </AdminLayout>
  );
}