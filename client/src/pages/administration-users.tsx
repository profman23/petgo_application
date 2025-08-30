import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation, getDirection } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { Shield, LogOut, Car, Clock, BarChart3, FileText, User, Users, Upload, Package, Stethoscope, ChevronDown, ChevronUp, TrendingUp, Volume2, VolumeX, Bell, Plus, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";

export default function AdministrationUsers() {
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
  const [showCreateUserPopup, setShowCreateUserPopup] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAuthorization, setSelectedAuthorization] = useState('');

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation]);

  // Fetch current user's authorization permissions for route guard
  const {
    data: currentUserPermissions,
    isLoading: permissionsLoading,
    error: permissionsError
  } = useQuery({
    queryKey: ['/api/admin/current-user-permissions'],
    retry: false,
  });

  // Route guard - redirect silently if user doesn't have permission to access Users page
  useEffect(() => {
    if (!permissionsLoading && currentUserPermissions && currentUserPermissions.usersHidden) {
      // Silent redirect without popup (popup is handled by sidebar)
      setLocation('/administration/authorization');
    }
  }, [currentUserPermissions, permissionsLoading, setLocation]);

  const adminToken = localStorage.getItem("adminToken");
  const admin = JSON.parse(localStorage.getItem("admin") || "{}");

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

  // Fetch authorizations for dropdown
  const {
    data: authorizations = [],
    isLoading: authorizationsLoading,
    error: authorizationsError
  } = useQuery({
    queryKey: ['/api/admin/authorizations'],
    retry: false,
    refetchInterval: 30000, // Refetch every 30 seconds
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

  // Reset form function
  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setSelectedAuthorization('');
  };

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Fetch admin users from API
  const {
    data: adminUsers = [],
    isLoading: usersLoading,
    error: usersError
  } = useQuery<any[]>({
    queryKey: ['/api/admin/admin-users'],
    retry: false,
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!adminToken,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return apiRequest('/api/admin/admin-users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/admin-users'] });
      toast({
        title: language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved Successfully',
        description: language === 'ar' ? 'تم إنشاء المستخدم بنجاح' : 'User has been created successfully',
      });
      resetForm();
      setShowCreateUserPopup(false);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'حدث خطأ أثناء إنشاء المستخدم' : 'An error occurred while creating user'),
        variant: 'destructive',
      });
    },
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest(`/api/admin/admin-users/${id}/toggle-status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/admin-users'] });
      toast({
        title: language === 'ar' ? 'تم التحديث بنجاح' : 'Updated Successfully',
        description: language === 'ar' ? 'تم تحديث حالة المستخدم بنجاح' : 'User status has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'حدث خطأ أثناء التحديث' : 'An error occurred while updating'),
        variant: 'destructive',
      });
    },
  });

  // Handle close popup
  const handleClosePopup = () => {
    setShowCreateUserPopup(false);
    resetForm();
  };

  // Handle save user
  const handleSaveUser = () => {
    // Validation
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !username.trim() || !password.trim() || !confirmPassword.trim() || !selectedAuthorization) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      username: username.trim(),
      password: password,
      authorizationId: parseInt(selectedAuthorization),
      isActive: true
    };

    createUserMutation.mutate(userData);
  };

  // Handle toggle user status
  const handleToggleUserStatus = (userId: number, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({
      id: userId,
      isActive: !currentStatus
    });
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
                  <button
                    onClick={() => setLocation('/administration/users')}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full bg-purple-100 text-purple-700 hover:bg-purple-200"
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
              onClick={() => setLocation('/admin-vetsvan-management')}
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
                      {language === 'ar' ? 'إدارة المستخدمين' : 'Users Management'}
                    </h1>
                    <button
                      onClick={() => setShowCreateUserPopup(true)}
                      className="px-4 py-2 border-2 border-purple-600 bg-white text-purple-600 font-medium rounded-md hover:bg-purple-50 transition-colors duration-200"
                    >
                      {language === 'ar' ? 'إنشاء مستخدم جديد' : 'Create New User'}
                    </button>
                  </div>
                  {/* Users List */}
                  {usersLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">
                        {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                      </p>
                    </div>
                  ) : usersError ? (
                    <div className="text-center py-12">
                      <User className="mx-auto h-12 w-12 text-red-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {language === 'ar' ? 'خطأ في التحميل' : 'Loading Error'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {language === 'ar' ? 'فشل في تحميل المستخدمين' : 'Failed to load users'}
                      </p>
                    </div>
                  ) : adminUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <User className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {language === 'ar' ? 'لا يوجد مستخدمين' : 'No Users'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {language === 'ar' ? 'ابدأ بإنشاء مستخدم جديد' : 'Start by creating a new user'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'المستخدم' : 'User'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'التصريح' : 'Authorization'}
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
                          {adminUsers.map((user: any) => (
                            <tr key={user.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                      <User className="h-5 w-5 text-purple-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {user.firstName} {user.lastName}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.username}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.authorizationName || user.authorizationId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.isActive 
                                    ? (language === 'ar' ? 'نشط' : 'Active')
                                    : (language === 'ar' ? 'معطل' : 'Disabled')
                                  }
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  {language === 'ar' ? 'تعديل' : 'Edit'}
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                                  disabled={toggleUserStatusMutation.isPending}
                                  className={`${
                                    user.isActive 
                                      ? 'text-red-600 hover:text-red-900' 
                                      : 'text-green-600 hover:text-green-900'
                                  } disabled:opacity-50`}
                                >
                                  {user.isActive 
                                    ? (language === 'ar' ? 'تعطيل' : 'Disable')
                                    : (language === 'ar' ? 'تفعيل' : 'Enable')
                                  }
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create New User Popup */}
      {showCreateUserPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ left: '256px', top: '82px' }}>
          <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-2xl mx-4">
            {/* Popup Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {language === 'ar' ? 'إنشاء مستخدم جديد' : 'Create New User'}
              </h2>
              <button
                onClick={handleClosePopup}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Popup Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'الاسم الأول:' : 'First Name:'}
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder={language === 'ar' ? 'أدخل الاسم الأول' : 'Enter first name'}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'اسم العائلة:' : 'Last Name:'}
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder={language === 'ar' ? 'أدخل اسم العائلة' : 'Enter last name'}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
                  />
                </div>

                {/* User Name */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'اسم المستخدم:' : 'User Name:'}
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'كلمة المرور:' : 'Password:'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'تأكيد كلمة المرور:' : 'Confirm Password:'}
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
                  />
                </div>

                {/* Authorization */}
                <div>
                  <label htmlFor="authorization" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'التصريح:' : 'Authorization:'}
                  </label>
                  <select
                    id="authorization"
                    value={selectedAuthorization}
                    onChange={(e) => setSelectedAuthorization(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    disabled={authorizationsLoading}
                  >
                    <option value="">
                      {authorizationsLoading 
                        ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...')
                        : (language === 'ar' ? 'اختر التصريح' : 'Select Authorization')
                      }
                    </option>
                    {authorizations && authorizations.map((authorization: any) => (
                      <option key={authorization.id} value={authorization.id}>
                        {authorization.name}
                      </option>
                    ))}
                  </select>
                  {authorizationsError && (
                    <p className="mt-1 text-sm text-red-600">
                      {language === 'ar' ? 'خطأ في تحميل التصريحات' : 'Error loading authorizations'}
                    </p>
                  )}
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
                onClick={handleSaveUser}
                disabled={createUserMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {createUserMutation.isPending 
                  ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...')
                  : (language === 'ar' ? 'إنشاء' : 'Create')
                }
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}