import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation, getDirection } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Shield, LogOut, Car, Clock, BarChart3, FileText, User, Users, Upload, Package, Stethoscope, ChevronDown, ChevronUp, TrendingUp, Volume2, VolumeX, Bell, X, Plus, Edit, Home, Menu, DollarSign, Receipt, FilePlus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";

// Declare lord-icon custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any;
    }
  }
}

export default function FinancialOutgoingPayment() {
  const [location, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(false);
  
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
    return false; // Default to collapsed to maintain consistency
  });
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // State for tracking notifications and audio
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastRequestCountRef = useRef(0);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);

  // Lord-icon animation trigger state
  const [triggerAnimation, setTriggerAnimation] = useState("hover");

  // Effect to trigger lord-icon animation every 1.5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setTriggerAnimation("loop");
      // Reset to hover after a brief moment
      setTimeout(() => setTriggerAnimation("hover"), 1000);
    }, 90000); // 90 seconds = 1.5 minutes

    return () => clearInterval(interval);
  }, []);

  // Handle click on Financial menu
  const handleFinancialClick = () => {
    const newState = !isFinancialExpanded;
    setIsFinancialExpanded(newState);
    localStorage.setItem('isFinancialExpanded', JSON.stringify(newState));
  };

  // Handle click on Administration menu
  const handleAdministrationClick = () => {
    const newState = !isAdministrationExpanded;
    setIsAdministrationExpanded(newState);
    localStorage.setItem('isAdministrationExpanded', JSON.stringify(newState));
  };

  // Logout functionality
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setLocation('/admin-login');
    } catch (error) {
      console.error('Logout error:', error);
      setLocation('/admin-login');
    }
  };

  // Create Outgoing Payment handler
  const handleCreateOutgoingPayment = () => {
    console.log('Create Outgoing Payment clicked');
    // Functionality will be implemented later
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={vetsVanLogo} alt="VetsVan Logo" className="h-8 w-8" />
              <span className="text-xl font-semibold text-purple-800">VetsVan</span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Audio Toggle */}
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-2 rounded-md ${
                  audioEnabled ? 'text-purple-600 bg-purple-50' : 'text-gray-400 bg-gray-100'
                }`}
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
                      onClick={() => {
                        setLocation('/financial/credit-note');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    >
                      <Receipt className="h-5 w-5 flex-shrink-0" />
                      <span>{language === 'ar' ? 'مذكرة الائتمان' : 'Credit Note'}</span>
                    </button>
                    <button
                      className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full bg-purple-50 border-l-4 border-purple-600"
                    >
                      <DollarSign className="h-5 w-5 flex-shrink-0 text-purple-600" />
                      <span className="text-purple-600">{language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment'}</span>
                    </button>
                  </div>
                )}
              </div>
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/financial/credit-note');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <Receipt className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'مذكرة الائتمان' : 'Credit Note'}</span>
                  </button>
                  <button
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full bg-purple-50 border-l-4 border-purple-600"
                  >
                    <DollarSign className="h-5 w-5 flex-shrink-0 text-purple-600" />
                    <span className="text-purple-600">{language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment'}</span>
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
              <span>{language === 'ar' ? 'إدارة الفيتس فان' : 'Vets Van Management'}</span>
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

            {/* Vets Van Requests */}
            <button
              onClick={() => setLocation('/admin-vetsvan-requests')}
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
        <div className="flex items-center justify-between mb-8">
          {/* Left side - Lord Icon and Title */}
          <div className="flex items-center gap-4">
            {/* Lord Icon */}
            <div className="flex-shrink-0">
              <lord-icon 
                src="https://cdn.lordicon.com/uemybdyy.json" 
                trigger={triggerAnimation}
                colors="primary:#852085,secondary:#848484" 
                style={{ width: '80px', height: '80px' }}
              />
            </div>
            
            {/* Outgoing Payment Title */}
            <h1 className="text-2xl font-bold text-gray-600" style={{fontFamily: 'Arimo'}}>
              {language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment'}
            </h1>
          </div>

          {/* Right side - Create Outgoing Payment Button */}
          <button
            onClick={handleCreateOutgoingPayment}
            className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
            data-testid="button-create-outgoing-payment"
          >
            <FilePlus className="h-4 w-4" style={{ color: '#852085' }} />
            {language === 'ar' ? 'إنشاء دفع صادر' : 'Create Outgoing Payment'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}