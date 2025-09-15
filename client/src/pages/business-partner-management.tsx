import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation, getDirection } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Shield, LogOut, Car, Clock, BarChart3, FileText, User, Users, Upload, Package, Stethoscope, ChevronDown, ChevronUp, TrendingUp, Home, Menu, DollarSign, Receipt, FilePlus, Bell, Volume2, VolumeX, Truck, ArrowDownLeft, Calendar, Handshake } from "lucide-react";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";

// Declare lord-icon custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any;
    }
  }
}

export default function BusinessPartnerManagement() {
  const [location, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const [selectedPartnerType, setSelectedPartnerType] = useState<'customer' | 'supplier'>('customer');
  const [triggerAnimation, setTriggerAnimation] = useState('hover');
  
  // Audio notification state - matches other admin pages
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastRequestCountRef = useRef(0);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);
  
  // Administration menu state - persist across navigation
  const [isAdministrationExpanded, setIsAdministrationExpanded] = useState(() => {
    const savedState = localStorage.getItem('isAdministrationExpanded');
    if (savedState !== null) {
      return JSON.parse(savedState);
    }
    return false; // Default to collapsed to maintain consistency
  });
  
  // Financial menu state - persist across navigation
  const [isFinancialExpanded, setIsFinancialExpanded] = useState(() => {
    const savedState = localStorage.getItem('isFinancialExpanded');
    if (savedState !== null) {
      return JSON.parse(savedState);
    }
    return false; // Default collapsed
  });
  
  // Business Partner menu state - persist across navigation
  const [isBusinessPartnerExpanded, setIsBusinessPartnerExpanded] = useState(() => {
    const savedState = localStorage.getItem('isBusinessPartnerExpanded');
    if (savedState !== null) {
      return JSON.parse(savedState);
    }
    return false; // Default collapsed
  });
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // New Reports menu state - persist across navigation
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(() => {
    const savedState = localStorage.getItem('isNewReportsExpanded');
    return savedState !== null ? JSON.parse(savedState) : false;
  });

  // Animate icon every 1.5 minutes (90 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setTriggerAnimation('morph');
      setTimeout(() => setTriggerAnimation('hover'), 1000);
    }, 90000); // 1.5 minutes = 90,000 milliseconds

    return () => clearInterval(interval);
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setLocation("/admin-login");
  };

  const getButtonText = () => {
    if (selectedPartnerType === 'customer') {
      return language === 'ar' 
        ? 'إنشاء البيانات الرئيسية لعميل الأعمال' 
        : 'Create Customer Business Master Data';
    } else {
      return language === 'ar' 
        ? 'إنشاء البيانات الرئيسية لمورد الأعمال' 
        : 'Create Supplier Business Master Data';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={getDirection(language)}>
      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetTrigger asChild>
          <button className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 fixed top-4 right-4 z-50">
            <Menu className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="p-4 border-b border-gray-200">
            <img 
              src={vetsVanLogo} 
              alt="VETS VAN" 
              className="h-12 w-auto object-contain"
            />
          </div>
          <nav className="mt-4 px-2">
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
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <User className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'المستخدمين' : 'Users'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setLocation('/administration/authorization');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'التفويضات' : 'Authorization'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Financial Module */}
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
                      setLocation('/financial/income-payment');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <ArrowDownLeft className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'الدفع الوارد' : 'Income Payment'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setLocation('/financial/outgoing-payment');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <TrendingUp className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setLocation('/financial/credit-note');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <Receipt className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'إشعار الائتمان' : 'Credit Note'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Business Partner Module */}
            <div className="mb-2">
              <button
                onClick={() => {
                  const newState = !isBusinessPartnerExpanded;
                  setIsBusinessPartnerExpanded(newState);
                  localStorage.setItem('isBusinessPartnerExpanded', JSON.stringify(newState));
                }}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <Handshake className="h-6 w-6 flex-shrink-0" />
                <span className="flex-1 text-left">
                  {language === 'ar' ? 'شريك الأعمال' : 'Business Partner'}
                </span>
                {isBusinessPartnerExpanded ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
              </button>
              
              {isBusinessPartnerExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setLocation('/business-partner/partner-management');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-purple-600 bg-purple-50 hover:bg-purple-100"
                  >
                    <Users className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'إدارة الشريك' : 'Partner Management'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* New Reports */}
            <div className="mb-2">
              <button
                onClick={() => {
                  const newState = !isNewReportsExpanded;
                  setIsNewReportsExpanded(newState);
                  localStorage.setItem('isNewReportsExpanded', JSON.stringify(newState));
                }}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <BarChart3 className="h-6 w-6 flex-shrink-0" />
                <span className="flex-1 text-left">
                  {language === 'ar' ? 'التقارير الجديدة' : 'New Reports'}
                </span>
                {isNewReportsExpanded ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
              </button>
              
              {isNewReportsExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setLocation('/admin-dashboard/sales-report');
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

            {/* VetsVan Management */}
            <button
              onClick={() => {
                setLocation('/admin-dashboard');
                setIsMobileSidebarOpen(false);
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Car className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'إدارة VETS VAN' : 'VetsVan Management'}</span>
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
              <span>{language === 'ar' ? 'نوبات VETS VAN' : 'Vets Van Shifts'}</span>
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

            {/* Other navigation items */}
            <button
              onClick={() => {
                setLocation('/admin-vetsvan-requests');
                setIsMobileSidebarOpen(false);
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FileText className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'طلبات VETS VAN' : 'Vets Van Requests'}</span>
            </button>
            
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
        </SheetContent>
      </Sheet>

      {/* Full-width Header with logo and controls */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4" dir="ltr">
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
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">99+</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex" dir="ltr">
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
                    <span>{language === 'ar' ? 'التفويضات' : 'Authorization'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Financial Module */}
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
                      setLocation('/financial/income-payment');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <ArrowDownLeft className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'الدفع الوارد' : 'Income Payment'}</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/financial/outgoing-payment');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <TrendingUp className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment'}</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/financial/credit-note');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <Receipt className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'إشعار الائتمان' : 'Credit Note'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Business Partner Module */}
            <div className="mb-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newState = !isBusinessPartnerExpanded;
                  setIsBusinessPartnerExpanded(newState);
                  localStorage.setItem('isBusinessPartnerExpanded', JSON.stringify(newState));
                }}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <Handshake className="h-6 w-6 flex-shrink-0" />
                <span className="flex-1 text-left">
                  {language === 'ar' ? 'شريك الأعمال' : 'Business Partner'}
                </span>
                {isBusinessPartnerExpanded ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
              </button>
              
              {isBusinessPartnerExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/business-partner/partner-management');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-purple-600 bg-purple-50 hover:bg-purple-100"
                  >
                    <Users className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'إدارة الشريك' : 'Partner Management'}</span>
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
              <span>{language === 'ar' ? 'إدارة VETS VAN' : 'VetsVan Management'}</span>
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
              <span>{language === 'ar' ? 'نوبات VETS VAN' : 'Vets Van Shifts'}</span>
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

            {/* New Reports */}
            <div className="mb-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newState = !isNewReportsExpanded;
                  setIsNewReportsExpanded(newState);
                  localStorage.setItem('isNewReportsExpanded', JSON.stringify(newState));
                }}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <BarChart3 className="h-6 w-6 flex-shrink-0" />
                <span className="flex-1 text-left">
                  {language === 'ar' ? 'التقارير الجديدة' : 'New Reports'}
                </span>
                {isNewReportsExpanded ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
              </button>
              
              {isNewReportsExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/admin-dashboard/sales-report');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <BarChart3 className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Vets Van Requests */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-vetsvan-requests');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FileText className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'طلبات VETS VAN' : 'Vets Van Requests'}</span>
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
          {/* Content Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              {/* Lord Icon */}
              <script src="https://cdn.lordicon.com/lordicon.js"></script>
              <lord-icon
                src="https://cdn.lordicon.com/rcuovkuy.json"
                trigger={triggerAnimation}
                colors="primary:#852085,secondary:#545454"
                style={{width:'80px',height:'80px'}}
              />
              
              {/* Page Title */}
              <div>
                <h1 
                  className="text-2xl font-bold text-gray-600"
                  style={{ fontFamily: 'Arimo' }}
                >
                  {language === 'ar' ? 'إدارة شريك الأعمال' : 'Business Partner Management'}
                </h1>
              </div>
            </div>

            {/* Right side - Create Button and Dropdown */}
            <div className="flex flex-col items-end gap-3">
              {/* Create Button */}
              <button
                className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
                data-testid="button-create-partner"
              >
                <FilePlus className="h-4 w-4" style={{ color: 'rgb(133, 32, 133)' }} />
                {getButtonText()}
              </button>

              {/* Business Partner Type Selection */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  {language === 'ar' ? 'شريك الأعمال:' : 'Business Partner:'}
                </span>
                <select
                  value={selectedPartnerType}
                  onChange={(e) => setSelectedPartnerType(e.target.value as 'customer' | 'supplier')}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-600 focus:border-purple-600 bg-white"
                  data-testid="select-partner-type"
                >
                  <option value="customer">
                    {language === 'ar' ? 'عميل' : 'Customer'}
                  </option>
                  <option value="supplier">
                    {language === 'ar' ? 'مورد' : 'Supplier'}
                  </option>
                </select>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}