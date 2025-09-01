import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Bell, Volume2, VolumeX, Car, Clock, BarChart3, TrendingUp, ChevronDown, ChevronUp, FileText, Stethoscope, Package, Users, User, Shield, Home, Upload } from "lucide-react";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";
import welcomeImage from "@assets/freepik__background__61417_1753095390676.png";

export default function AdminHome() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  
  // State management to match other admin pages
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);
  const [isAdministrationExpanded, setIsAdministrationExpanded] = useState(() => {
    const saved = localStorage.getItem('isAdministrationExpanded');
    return saved ? JSON.parse(saved) : false;
  });
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(false);
  const lastRequestCountRef = useRef(0);

  // Get admin info for welcome message
  const adminInfo = JSON.parse(localStorage.getItem("admin") || '{"username": "Admin"}');

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation]);

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

  // Fetch VetsVan requests to match the notification count behavior
  const { data: allVetsVanRequests } = useQuery({
    queryKey: ['/api/admin/vetsvan-requests'],
    staleTime: 30 * 1000,
    refetchInterval: 3000,
  });

  // Monitor for new requests and update notification count - exact same logic as other admin pages
  useEffect(() => {
    if (allVetsVanRequests && Array.isArray(allVetsVanRequests) && allVetsVanRequests.length > 0) {
      const currentCount = allVetsVanRequests.length;
      
      lastRequestCountRef.current = currentCount;
      setCurrentRequestCount(currentCount);
    }
  }, [allVetsVanRequests]);

  return (
    <div 
      className="min-h-screen bg-gray-50"
      dir={getDirection(language)}
      style={{ textAlign: getTextAlign(language) }}
    >
      {/* Full-width Header with logo and controls - exact copy from other admin pages */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4">
          {/* Logo */}
          <div className="flex-shrink-0 -ml-2">
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

      {/* Main Content with Sidebar - exact copy from other admin pages */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="mt-4 px-2">
            {/* Home Page */}
            <button
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 bg-purple-50 border-l-4 border-purple-600"
            >
              <Home className="h-6 w-6 flex-shrink-0 text-purple-600" />
              <span className="text-purple-600">{language === 'ar' ? 'الصفحة الرئيسية' : 'Home Page'}</span>
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
                    onClick={() => setLocation('/administration/users')}
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
              onClick={() => setLocation('/admin-dashboard/products')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Package className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'المنتجات' : 'Products'}</span>
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Message - Top Left with Image */}
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <img 
                  src={welcomeImage} 
                  alt="Welcome Background" 
                  className="w-16 h-16 object-cover rounded-lg shadow-md"
                />
                <h1 className="text-2xl font-bold text-gray-900">
                  {language === 'ar' 
                    ? `مرحباً ${adminInfo.username} إلى Vets Van` 
                    : `Welcome ${adminInfo.username} to Vets Van`
                  }
                </h1>
              </div>
            </div>

            {/* Home Page Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Home className="h-24 w-24 text-purple-600" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {language === 'ar' ? 'الصفحة الرئيسية' : 'Home Page'}
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                {language === 'ar' 
                  ? 'نظام إدارة VETS VAN' 
                  : 'VETS VAN Management System'
                }
              </p>
            </div>

            {/* Quick Stats or Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === 'ar' ? 'الطلبات النشطة' : 'Active Requests'}
                </h3>
                <p className="text-3xl font-bold text-blue-600">{currentRequestCount}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 text-center">
                <Car className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === 'ar' ? 'العيادات المتنقلة' : 'VetsVan Units'}
                </h3>
                <p className="text-3xl font-bold text-green-600">6</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6 text-center">
                <Stethoscope className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === 'ar' ? 'الخدمات المتاحة' : 'Available Services'}
                </h3>
                <p className="text-3xl font-bold text-purple-600">1000+</p>
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setLocation('/admin-dashboard')}
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                  </span>
                </button>

                <button
                  onClick={() => setLocation('/vets-van-shifts')}
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Car className="h-8 w-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {language === 'ar' ? 'إدارة العيادات' : 'Manage VetsVans'}
                  </span>
                </button>

                <button
                  onClick={() => setLocation('/admin-vetsvan-requests')}
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Clock className="h-8 w-8 text-orange-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {language === 'ar' ? 'عرض الطلبات' : 'View Requests'}
                  </span>
                </button>

                <button
                  onClick={() => setLocation('/new-reports-analytics')}
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {language === 'ar' ? 'التحليلات' : 'Analytics'}
                  </span>
                </button>
              </div>
            </div>

            {/* Information Section */}
            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                {language === 'ar' ? 'معلومات مهمة' : 'Important Information'}
              </h3>
              <p className="text-blue-800">
                {language === 'ar'
                  ? 'هذه الصفحة الرئيسية جاهزة للتوسع المستقبلي. يمكنك الوصول إلى جميع الوظائف الإدارية من الشريط الجانبي أو الإجراءات السريعة أعلاه.'
                  : 'This home page is ready for future expansion. You can access all administrative functions from the sidebar navigation or the quick actions above.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}