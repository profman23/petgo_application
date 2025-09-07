import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Shield, LogOut, Car, Clock, BarChart3, FileText, User, Users, Upload, Package, Stethoscope, ChevronDown, ChevronUp, TrendingUp, Volume2, VolumeX, Bell, Home, Menu, DollarSign, Receipt } from "lucide-react";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";

export default function FinancialCreditNote() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const [isAdministrationExpanded, setIsAdministrationExpanded] = useState(() => {
    const savedState = localStorage.getItem('isAdministrationExpanded');
    return savedState !== null ? JSON.parse(savedState) : false;
  });
  const [isFinancialExpanded, setIsFinancialExpanded] = useState(() => {
    const savedState = localStorage.getItem('isFinancialExpanded');
    return savedState !== null ? JSON.parse(savedState) : true; // Default to expanded since we're on Financial page
  });
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(false);

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation]);

  const adminToken = localStorage.getItem("adminToken");
  
  // Fetch current user permissions
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

  const [currentRequestCount, setCurrentRequestCount] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const savedState = localStorage.getItem('audioNotificationsEnabled');
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  // Update request count when data changes
  useEffect(() => {
    if (allVetsVanRequests && Array.isArray(allVetsVanRequests)) {
      const currentCount = allVetsVanRequests.filter((req: any) => req.status === 'pending_review').length;
      setCurrentRequestCount(currentCount);
    }
  }, [allVetsVanRequests]);

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    localStorage.setItem('audioNotificationsEnabled', JSON.stringify(newState));
  };

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
              onClick={toggleAudio}
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
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 ml-2" />
              {t('logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu sheet */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetTrigger asChild>
          {/* Hidden trigger - mobile menu would be opened programmatically if needed */}
          <button className="hidden">
            <Menu className="h-6 w-6" />
          </button>
        </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex flex-col h-full bg-white">
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-2">
                      <img src={vetsVanLogo} alt="VetsVan Logo" className="h-8 w-8" />
                      <span className="text-lg font-semibold text-purple-800">VetsVan</span>
                    </div>
                  </div>
                  <nav className="flex-1 px-2 py-4 space-y-1">
                    {/* Home Page */}
                    <button
                      onClick={() => {
                        setLocation('/admin-home');
                        setIsMobileSidebarOpen(false);
                      }}
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

                      {isAdministrationExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          <button
                            onClick={() => {
                              setLocation('/administration/users');
                              setIsMobileSidebarOpen(false);
                            }}
                            className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          >
                            <User className="h-5 w-5 flex-shrink-0" />
                            <span>{language === 'ar' ? 'المستخدمين' : 'Users'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setLocation('/administration/authorization');
                              setIsMobileSidebarOpen(false);
                            }}
                            className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          >
                            <Shield className="h-5 w-5 flex-shrink-0" />
                            <span>{language === 'ar' ? 'التصريح' : 'Authorization'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Financial Section */}
                    <div className="mb-2">
                      <button
                        onClick={() => {
                          const newState = !isFinancialExpanded;
                          setIsFinancialExpanded(newState);
                          localStorage.setItem('isFinancialExpanded', JSON.stringify(newState));
                        }}
                        className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <DollarSign className="h-6 w-6 flex-shrink-0" />
                        <span className="flex-1 text-left">
                          {language === 'ar' ? 'المالية' : 'Financial'}
                        </span>
                        {isFinancialExpanded ? (
                          <ChevronUp className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 flex-shrink-0" />
                        )}
                      </button>

                      {isFinancialExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          <button
                            onClick={() => {
                              setLocation('/sales-reports');
                              setIsMobileSidebarOpen(false);
                            }}
                            className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          >
                            <BarChart3 className="h-5 w-5 flex-shrink-0" />
                            <span>{language === 'ar' ? 'التقارير المالية' : 'Financial Reports'}</span>
                          </button>
                          <button
                            className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full bg-purple-50 border-l-4 border-purple-600"
                          >
                            <Receipt className="h-5 w-5 flex-shrink-0 text-purple-600" />
                            <span className="text-purple-600">{language === 'ar' ? 'مذكرة الائتمان' : 'Credit Note'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* VetsVan Management */}
                    <button
                      onClick={() => {
                        setLocation('/admin-dashboard');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Car className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'إدارة الفيتس فان' : 'VetsVan Management'}</span>
                    </button>

                    {/* Vets Van Shifts */}
                    <button
                      onClick={() => {
                        setLocation('/vets-van-shifts');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Clock className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'مناوبات VETS VAN' : 'Vets Van Shifts'}</span>
                    </button>

                    {/* Reports */}
                    <button
                      onClick={() => {
                        setLocation('/admin-dashboard?tab=reports');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <BarChart3 className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'التقارير' : 'Reports'}</span>
                    </button>

                    {/* New Reports & Analytics Dropdown */}
                    <div className="mb-2">
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
                            onClick={() => {
                              setLocation('/new-reports-analytics/sales-report');
                              setIsMobileSidebarOpen(false);
                            }}
                            className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          >
                            <BarChart3 className="h-5 w-5 flex-shrink-0" />
                            <span>{language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* VetsVan Requests */}
                    <button
                      onClick={() => {
                        setLocation('/admin-vetsvan-requests');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 relative"
                    >
                      <FileText className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'طلبات VETS VAN' : 'Vets Van Requests'}</span>
                      {currentRequestCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {currentRequestCount > 99 ? '99+' : currentRequestCount}
                        </span>
                      )}
                    </button>

                    {/* Import */}
                    <button
                      onClick={() => {
                        setLocation('/admin-dashboard/import');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Upload className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'استيراد البيانات' : 'Import'}</span>
                    </button>

                    {/* Services */}
                    <button
                      onClick={() => {
                        setLocation('/admin-dashboard/services');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Stethoscope className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'الخدمات' : 'Services'}</span>
                    </button>

                    {/* Products */}
                    <button
                      onClick={() => {
                        setLocation('/admin-dashboard/products');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Package className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'المنتجات' : 'Products'}</span>
                    </button>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="mt-4 px-2">
            {/* Home Page */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-home');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Home className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'الصفحة الرئيسية' : 'Home Page'}</span>
            </button>
            
            {/* Administration Module */}
            <div className="mb-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/administration/users');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <User className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'المستخدمين' : 'Users'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/administration/authorization');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'التصريح' : 'Authorization'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Financial Section */}
            <div className="mb-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newState = !isFinancialExpanded;
                  setIsFinancialExpanded(newState);
                  localStorage.setItem('isFinancialExpanded', JSON.stringify(newState));
                }}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <DollarSign className="h-6 w-6 flex-shrink-0" />
                <span className="flex-1 text-left">
                  {language === 'ar' ? 'المالية' : 'Financial'}
                </span>
                {isFinancialExpanded ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
              </button>

              {isFinancialExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/sales-reports');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <BarChart3 className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'التقارير المالية' : 'Financial Reports'}</span>
                  </button>
                  <button
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full bg-purple-50 border-l-4 border-purple-600"
                  >
                    <Receipt className="h-5 w-5 flex-shrink-0 text-purple-600" />
                    <span className="text-purple-600">{language === 'ar' ? 'مذكرة الائتمان' : 'Credit Note'}</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* VetsVan Management */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-dashboard');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Car className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'إدارة الفيتس فان' : 'VetsVan Management'}</span>
            </button>

            {/* Vets Van Shifts */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/vets-van-shifts');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Clock className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'مناوبات VETS VAN' : 'Vets Van Shifts'}</span>
            </button>
            
            {/* Reports */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-dashboard?tab=reports');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <BarChart3 className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'التقارير' : 'Reports'}</span>
            </button>
            
            {/* New Reports & Analytics Dropdown */}
            <div className="mb-2">
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

            {/* VetsVan Requests */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-vetsvan-requests');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 relative"
            >
              <FileText className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'طلبات VETS VAN' : 'Vets Van Requests'}</span>
              {currentRequestCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {currentRequestCount > 99 ? '99+' : currentRequestCount}
                </span>
              )}
            </button>
            
            {/* Import */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-dashboard/import');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Upload className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'استيراد البيانات' : 'Import'}</span>
            </button>
            
            {/* Services */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-dashboard/services');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Stethoscope className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'الخدمات' : 'Services'}</span>
            </button>
            
            {/* Products */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-dashboard/products');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Package className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'المنتجات' : 'Products'}</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="flex items-center gap-4 mb-8">
            {/* Lord Icon */}
            <div className="flex-shrink-0">
              <lord-icon
                src="https://cdn.lordicon.com/lbrbofig.json"
                trigger="hover"
                colors="primary:#852085,secondary:#848484"
                style={{width: '80px', height: '80px'}}
              />
            </div>
            
            {/* Credit Note Title */}
            <h1 className="text-2xl font-bold text-gray-600" style={{fontFamily: 'Arimo'}}>
              {language === 'ar' ? 'مذكرة الائتمان' : 'Credit Note'}
            </h1>
          </div>
        </div>
      </div>

      {/* Load lord-icon script */}
      <script src="https://cdn.lordicon.com/lordicon.js"></script>
    </div>
  );
}