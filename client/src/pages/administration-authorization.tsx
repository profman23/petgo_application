import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation, getDirection } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { Shield, LogOut, Car, Clock, BarChart3, FileText, User, Users, Upload, Package, Stethoscope, ChevronDown, ChevronUp, TrendingUp, Volume2, VolumeX, Bell, X, Plus, Edit } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";

export default function AdministrationAuthorization() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(false);
  const [isAdministrationExpanded, setIsAdministrationExpanded] = useState(true); // Keep expanded since we're in administration
  
  // State for tracking notifications and audio
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastRequestCountRef = useRef(0);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);
  
  // State for popup
  const [showAddAuthorizationPopup, setShowAddAuthorizationPopup] = useState(false);
  
  // State for checkboxes - Users section
  const [hiddenUsersChecked, setHiddenUsersChecked] = useState(false);
  const [readUsersChecked, setReadUsersChecked] = useState(false);
  const [fullControlChecked, setFullControlChecked] = useState(false);
  
  // State for checkboxes - Authorization section
  const [authHiddenUsersChecked, setAuthHiddenUsersChecked] = useState(false);
  const [authReadUsersChecked, setAuthReadUsersChecked] = useState(false);
  const [authFullControlChecked, setAuthFullControlChecked] = useState(false);
  
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

  // Create authorization mutation
  const createAuthorizationMutation = useMutation({
    mutationFn: async (authData: any) => {
      return apiRequest('/api/admin/authorizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
  };

  // Handle save authorization
  const handleSaveAuthorization = () => {
    if (!authorizationName.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'اسم التصريح مطلوب' : 'Authorization name is required',
        variant: 'destructive',
      });
      return;
    }

    const authData = {
      name: authorizationName.trim(),
      usersHidden: hiddenUsersChecked,
      usersRead: readUsersChecked,
      usersFullControl: fullControlChecked,
      authHidden: authHiddenUsersChecked,
      authRead: authReadUsersChecked,
      authFullControl: authFullControlChecked,
    };

    if (editingAuthorization) {
      updateAuthorizationMutation.mutate({ id: editingAuthorization.id, authData });
    } else {
      createAuthorizationMutation.mutate(authData);
    }
  };

  // Handle edit authorization
  const handleEditAuthorization = (auth: any) => {
    setEditingAuthorization(auth);
    setAuthorizationName(auth.name);
    setHiddenUsersChecked(auth.usersHidden);
    setReadUsersChecked(auth.usersRead);
    setFullControlChecked(auth.usersFullControl);
    setAuthHiddenUsersChecked(auth.authHidden);
    setAuthReadUsersChecked(auth.authRead);
    setAuthFullControlChecked(auth.authFullControl);
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
      // If Hidden is checked, uncheck and disable Read and Full Control
      setReadUsersChecked(false);
      setFullControlChecked(false);
    }
  };

  const handleReadUsersChange = (checked: boolean) => {
    setReadUsersChecked(checked);
    if (!checked) {
      // If Read is unchecked, also uncheck Full Control
      setFullControlChecked(false);
    }
  };

  const handleFullControlChange = (checked: boolean) => {
    setFullControlChecked(checked);
    if (checked) {
      // If Full Control is checked, automatically check Read
      setReadUsersChecked(true);
    }
  };

  // Handlers for Authorization section
  const handleAuthHiddenUsersChange = (checked: boolean) => {
    setAuthHiddenUsersChecked(checked);
    if (checked) {
      // If Hidden is checked, uncheck and disable Read and Full Control
      setAuthReadUsersChecked(false);
      setAuthFullControlChecked(false);
    }
  };

  const handleAuthReadUsersChange = (checked: boolean) => {
    setAuthReadUsersChecked(checked);
    if (!checked) {
      // If Read is unchecked, also uncheck Full Control
      setAuthFullControlChecked(false);
    }
  };

  const handleAuthFullControlChange = (checked: boolean) => {
    setAuthFullControlChecked(checked);
    if (checked) {
      // If Full Control is checked, automatically check Read
      setAuthReadUsersChecked(true);
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

  const adminToken = localStorage.getItem("adminToken");
  const admin = JSON.parse(localStorage.getItem("admin") || "{}");
  
  // Check if the current admin has the "Hidden Users" permission
  const hasHiddenUsersPermission = admin?.authorization?.usersHidden || false;

  // Fetch all VetsVan requests for notification counter
  const { data: allVetsVanRequests } = useQuery({
    queryKey: ["/api/admin/vetsvan-requests"],
    queryFn: async () => {
      const response = await fetch("/api/admin/vetsvan-requests", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch requests");
      return response.json();
    },
    refetchInterval: 3000,
    enabled: !!adminToken,
  });

  // Monitor for new requests and update counter
  useEffect(() => {
    if (allVetsVanRequests && allVetsVanRequests.length > 0) {
      const currentCount = allVetsVanRequests.length;
      lastRequestCountRef.current = currentCount;
      setCurrentRequestCount(currentCount);
    }
  }, [allVetsVanRequests]);

  // Request browser notification permission on component mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    setLocation("/admin-login");
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={getDirection(language)}>
      {/* Full-width Header with logo and controls */}
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

            {/* Notifications counter */}
            {currentRequestCount > 0 && (
              <div className="relative">
                <Bell className="h-6 w-6 text-purple-600" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {currentRequestCount > 99 ? '99+' : currentRequestCount}
                </span>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 ml-2" />
              {t('logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="mt-4 px-2">
            {/* Administration Module */}
            <div className="mb-2">
              <button
                onClick={() => setIsAdministrationExpanded(!isAdministrationExpanded)}
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
                  {/* Conditionally render Users menu item based on authorization */}
                  {!hasHiddenUsersPermission && (
                    <button
                      onClick={() => setLocation('/administration/users')}
                      className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    >
                      <User className="h-5 w-5 flex-shrink-0" />
                      <span>{language === 'ar' ? 'المستخدمين' : 'Users'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setLocation('/administration/authorization')}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full bg-purple-100 text-purple-700 hover:bg-purple-200"
                  >
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'التصريح' : 'Authorization'}</span>
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setLocation('/admin-dashboard')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
              <BarChart3 className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'التقارير' : 'Reports'}</span>
            </button>
            {/* New Reports & Analytics Dropdown */}
            <div className="mt-2">
              <button
                onClick={() => setIsNewReportsExpanded(!isNewReportsExpanded)}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <TrendingUp className="h-6 w-6 flex-shrink-0" />
                <span className="flex-1 text-left">
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
              onClick={() => setLocation('/admin-dashboard')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FileText className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'طلبات VETS VAN' : 'Vets Van Requests'}</span>
            </button>
            <button
              onClick={() => setLocation('/admin-dashboard')}
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
              onClick={() => setLocation('/admin-dashboard')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Package className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'المنتجات' : 'Products'}</span>
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {language === 'ar' ? 'إدارة التصريحات' : 'Authorization Management'}
                    </h1>
                    <button
                      onClick={() => setShowAddAuthorizationPopup(true)}
                      className="px-4 py-2 border-2 border-purple-600 bg-white text-purple-600 font-medium rounded-md hover:bg-purple-50 transition-colors duration-200"
                    >
                      {language === 'ar' ? 'إضافة تصريح جديد' : 'Add New Authorization'}
                    </button>
                  </div>
                  {authorizationsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">
                        {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                      </p>
                    </div>
                  ) : authorizations.length === 0 ? (
                    <div className="text-center py-12">
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
                    <div className="space-y-4">
                      {authorizations.map((auth: any) => (
                        <div
                          key={auth.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {auth.name}
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Users Permissions */}
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    {language === 'ar' ? 'المستخدمين:' : 'Users:'}
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {auth.usersHidden && (
                                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                        {language === 'ar' ? 'مخفي' : 'Hidden'}
                                      </span>
                                    )}
                                    {auth.usersRead && (
                                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                        {language === 'ar' ? 'قراءة' : 'Read'}
                                      </span>
                                    )}
                                    {auth.usersFullControl && (
                                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                        {language === 'ar' ? 'تحكم كامل' : 'Full Control'}
                                      </span>
                                    )}
                                    {!auth.usersHidden && !auth.usersRead && !auth.usersFullControl && (
                                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                                        {language === 'ar' ? 'لا توجد صلاحيات' : 'No permissions'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* Authorization Permissions */}
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    {language === 'ar' ? 'التصريحات:' : 'Authorization:'}
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {auth.authHidden && (
                                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                        {language === 'ar' ? 'مخفي' : 'Hidden'}
                                      </span>
                                    )}
                                    {auth.authRead && (
                                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                        {language === 'ar' ? 'قراءة' : 'Read'}
                                      </span>
                                    )}
                                    {auth.authFullControl && (
                                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                        {language === 'ar' ? 'تحكم كامل' : 'Full Control'}
                                      </span>
                                    )}
                                    {!auth.authHidden && !auth.authRead && !auth.authFullControl && (
                                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                                        {language === 'ar' ? 'لا توجد صلاحيات' : 'No permissions'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              <button
                                onClick={() => handleEditAuthorization(auth)}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                                title={language === 'ar' ? 'تعديل' : 'Edit'}
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-gray-500">
                            {language === 'ar' ? 'تم الإنشاء في:' : 'Created:'} {new Date(auth.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                            {auth.updated_at && new Date(auth.updated_at) > new Date(auth.created_at) && (
                              <span className="mx-2">•</span>
                            )}
                            {auth.updated_at && new Date(auth.updated_at) > new Date(auth.created_at) && (
                              <span>
                                {language === 'ar' ? 'تم التحديث:' : 'Updated:'} {new Date(auth.updated_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Authorization Popup */}
      {showAddAuthorizationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ left: '256px', top: '82px' }}>
          <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-2xl mx-4">
            {/* Popup Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingAuthorization 
                  ? (language === 'ar' ? 'تعديل التصريح' : 'Edit Authorization')
                  : (language === 'ar' ? 'إضافة تصريح جديد' : 'Add New Authorization')
                }
              </h2>
              <button
                onClick={handleClosePopup}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Popup Content */}
            <div className="p-4">
              {/* Authorization Name Field */}
              <div className="mb-6">
                <label htmlFor="authorizationName" className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'اسم التصريح:' : 'Authorization Name:'}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="authorizationName"
                  value={authorizationName}
                  onChange={(e) => setAuthorizationName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder={language === 'ar' ? 'أدخل اسم التصريح' : 'Enter authorization name'}
                />
              </div>
              
              {/* Administration Tab */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  {language === 'ar' ? 'الإدارة' : 'Administration'}
                </h3>
                
                {/* Users Section */}
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    {language === 'ar' ? 'المستخدمين' : 'Users'}
                  </h4>
                  
                  {/* Permission Items */}
                  <div className="ml-4 space-y-2">
                    {/* Hidden Users */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="hiddenUsers"
                        checked={hiddenUsersChecked}
                        onChange={(e) => handleHiddenUsersChange(e.target.checked)}
                        className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="hiddenUsers" className="ml-2 text-sm text-gray-600">
                        {language === 'ar' ? 'المستخدمين المخفيين' : 'Hidden Users'}
                      </label>
                    </div>
                    
                    {/* Read Users */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="readUsers"
                        checked={readUsersChecked}
                        disabled={hiddenUsersChecked}
                        onChange={(e) => handleReadUsersChange(e.target.checked)}
                        className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${hiddenUsersChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      <label htmlFor="readUsers" className={`ml-2 text-sm ${hiddenUsersChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'ar' ? 'قراءة المستخدمين' : 'Read Users'}
                      </label>
                    </div>
                    
                    {/* Full Control */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="fullControl"
                        checked={fullControlChecked}
                        disabled={hiddenUsersChecked}
                        onChange={(e) => handleFullControlChange(e.target.checked)}
                        className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${hiddenUsersChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      <label htmlFor="fullControl" className={`ml-2 text-sm ${hiddenUsersChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'ar' ? 'تحكم كامل' : 'Full Control'}
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Authorization Section */}
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    {language === 'ar' ? 'التصريح' : 'Authorization'}
                  </h4>
                  
                  {/* Permission Items */}
                  <div className="ml-4 space-y-2">
                    {/* Hidden Users */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="authHiddenUsers"
                        checked={authHiddenUsersChecked}
                        onChange={(e) => handleAuthHiddenUsersChange(e.target.checked)}
                        className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="authHiddenUsers" className="ml-2 text-sm text-gray-600">
                        {language === 'ar' ? 'المستخدمين المخفيين' : 'Hidden Users'}
                      </label>
                    </div>
                    
                    {/* Read Users */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="authReadUsers"
                        checked={authReadUsersChecked}
                        disabled={authHiddenUsersChecked}
                        onChange={(e) => handleAuthReadUsersChange(e.target.checked)}
                        className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${authHiddenUsersChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      <label htmlFor="authReadUsers" className={`ml-2 text-sm ${authHiddenUsersChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'ar' ? 'قراءة المستخدمين' : 'Read Users'}
                      </label>
                    </div>
                    
                    {/* Full Control */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="authFullControl"
                        checked={authFullControlChecked}
                        disabled={authHiddenUsersChecked}
                        onChange={(e) => handleAuthFullControlChange(e.target.checked)}
                        className={`h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 ${authHiddenUsersChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      <label htmlFor="authFullControl" className={`ml-2 text-sm ${authHiddenUsersChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'ar' ? 'تحكم كامل' : 'Full Control'}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Popup Footer */}
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={handleClosePopup}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
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
    </div>
  );
}