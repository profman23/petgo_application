import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useTranslation, getDirection } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Shield, LogOut, Car, Clock, BarChart3, FileText, User, Users, Upload, Package, Stethoscope, ChevronDown, ChevronUp, TrendingUp, Home, Menu, DollarSign, Receipt, FilePlus, Bell, Volume2, VolumeX, Truck, ArrowDownLeft, Calendar } from "lucide-react";
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

export default function FinancialIncomePayment() {
  const [location, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(() => {
    const savedState = localStorage.getItem('isNewReportsExpanded');
    return savedState !== null ? JSON.parse(savedState) : false;
  });
  
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
    return true; // Default expanded for financial pages
  });
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [businessPartnerType, setBusinessPartnerType] = useState('customer');
  const [paymentMethods, setPaymentMethods] = useState({
    cash: { checked: false, amount: 0 },
    card: { checked: false, amount: 0 },
    bank: { checked: false, amount: 0 }
  });

  const handlePaymentMethodChange = (method: string, field: 'checked' | 'amount', value: boolean | number) => {
    setPaymentMethods(prev => ({
      ...prev,
      [method]: {
        ...prev[method as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const calculateTotal = () => {
    return Object.values(paymentMethods).reduce((total, method) => {
      return total + (method.checked ? method.amount : 0);
    }, 0);
  };
  const isMobile = useIsMobile();
  

  // Lord-icon animation trigger state
  const [lordIconKey, setLordIconKey] = useState(0);

  // Initialize lord-icon auto-animation
  useEffect(() => {
    const interval = setInterval(() => {
      setLordIconKey(prev => prev + 1);
    }, 90000); // 1.5 minutes = 90,000 milliseconds

    return () => clearInterval(interval);
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setLocation("/admin-login");
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
                    onClick={() => {
                      setLocation('/financial/outgoing-payment');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <DollarSign className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment'}</span>
                  </button>
                  <button
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full bg-purple-50 border-l-4 border-purple-600"
                  >
                    <DollarSign className="h-5 w-5 flex-shrink-0 text-purple-600" />
                    <span className="text-purple-600">{language === 'ar' ? 'الدفع الوارد' : 'Income Payment'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setLocation('/financial/ar-balance');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <DollarSign className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'رصيد الحسابات المدينة' : 'A/R Balance'}</span>
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
              <span>{language === 'ar' ? 'إدارة VETS VAN' : 'Vets Van Management'}</span>
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newState = !isNewReportsExpanded;
                  setIsNewReportsExpanded(newState);
                  localStorage.setItem('isNewReportsExpanded', JSON.stringify(newState));
                }}
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/new-reports-analytics/sales-report');
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
              onClick={() => {
                setLocation('/admin-vetsvan-requests');
                setIsMobileSidebarOpen(false);
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FileText className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'طلبات VETS VAN' : 'Vets Van Requests'}</span>
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/financial/outgoing-payment');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <DollarSign className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment'}</span>
                  </button>
                  <button
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full bg-purple-50 border-l-4 border-purple-600"
                  >
                    <DollarSign className="h-5 w-5 flex-shrink-0 text-purple-600" />
                    <span className="text-purple-600">{language === 'ar' ? 'الدفع الوارد' : 'Income Payment'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/financial/ar-balance');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <DollarSign className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'رصيد الحسابات المدينة' : 'A/R Balance'}</span>
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newState = !isNewReportsExpanded;
                  setIsNewReportsExpanded(newState);
                  localStorage.setItem('isNewReportsExpanded', JSON.stringify(newState));
                }}
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/new-reports-analytics');
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
                key={lordIconKey}
                src="https://cdn.lordicon.com/uemybdyy.json"
                trigger="hover"
                colors="primary:#852085,secondary:#848484"
                style={{width:'80px',height:'80px'}}
              />
              
              {/* Page Title */}
              <div>
                <h1 
                  className="text-2xl font-bold text-gray-600"
                  style={{ fontFamily: 'Arimo' }}
                >
                  {language === 'ar' ? 'الدفع الوارد' : 'Income Payment'}
                </h1>
              </div>
            </div>

            {/* Create Income Payment Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
              data-testid="button-create-income-payment"
            >
              <FilePlus className="h-4 w-4" style={{ color: 'rgb(133, 32, 133)' }} />
              {language === 'ar' ? 'إنشاء دفع وارد' : 'Create Income Payment'}
            </button>
          </div>

        </div>
      </div>

      {/* Create Income Payment Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            {/* Top Row - Title on Left */}
            <div className="mb-6" dir="ltr">
              {/* Title and Customer/Posting Info */}
              <div className="space-y-4" dir={getDirection(language)}>
                <div className="flex items-center gap-4">
                  <lord-icon 
                    src="https://cdn.lordicon.com/uemybdyy.json" 
                    trigger="hover" 
                    colors="primary:#852085,secondary:#848484" 
                    style={{ width: '80px', height: '80px' }}>
                  </lord-icon>
                  <h1 className="text-2xl font-bold text-gray-600" style={{ fontFamily: 'Arimo' }}>
                    {language === 'ar' ? 'الدفع الوارد' : 'Income Payment'}
                  </h1>
                </div>
                
                {/* Business Partner Selection and Payment No. Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Select Business Partner Master Data */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'تحديد بيانات شريك العمل الرئيسية:' : 'Select Business Partner Master Data:'}
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="businessPartnerType" 
                          value="customer" 
                          checked={businessPartnerType === 'customer'}
                          onChange={(e) => setBusinessPartnerType(e.target.value)}
                          className="text-purple-600 focus:ring-purple-500"
                          data-testid="radio-partner-customer"
                        />
                        <span className="text-sm text-gray-700">
                          {language === 'ar' ? 'عميل' : 'Customer'}
                        </span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="businessPartnerType" 
                          value="supplier" 
                          checked={businessPartnerType === 'supplier'}
                          onChange={(e) => setBusinessPartnerType(e.target.value)}
                          className="text-purple-600 focus:ring-purple-500"
                          data-testid="radio-partner-supplier"
                        />
                        <span className="text-sm text-gray-700">
                          {language === 'ar' ? 'مورد' : 'Supplier'}
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Right: Income Payment No. */}
                  <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {language === 'ar' ? 'رقم الدفع الوارد:' : 'Income Payment No.:'}
                    </label>
                    <input 
                      type="text" 
                      className="w-[170px] px-2 input-compact-20 border border-gray-300 bg-gray-100 cursor-not-allowed"
                      disabled
                      value="IPN001"
                      data-testid="input-payment-no"
                    />
                  </div>
                </div>
                
                {/* Customer Fields and Posting Date in same row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Customer Fields */}
                  <div className="space-y-3">
                    {/* Customer Phone - Horizontal Layout */}
                    <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                        {businessPartnerType === 'supplier' 
                          ? (language === 'ar' ? 'هاتف المورد:' : 'Supplier Phone:') 
                          : (language === 'ar' ? 'هاتف العميل:' : 'Customer Phone:')}
                      </label>
                      <input 
                        type="text" 
                        className="w-[170px] px-2 input-compact-20 border border-gray-300"
                        data-testid="input-partner-phone"
                        placeholder={businessPartnerType === 'supplier' 
                          ? (language === 'ar' ? 'أدخل هاتف المورد' : 'Enter supplier phone') 
                          : (language === 'ar' ? 'أدخل هاتف العميل' : 'Enter customer phone')}
                      />
                    </div>
                    
                    {/* Customer Name - Horizontal Layout */}
                    <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                        {businessPartnerType === 'supplier' 
                          ? (language === 'ar' ? 'اسم المورد:' : 'Supplier Name:') 
                          : (language === 'ar' ? 'اسم العميل:' : 'Customer Name:')}
                      </label>
                      <input 
                        type="text" 
                        className="w-[170px] px-2 input-compact-20 border border-gray-300"
                        data-testid="input-partner-name"
                        placeholder={businessPartnerType === 'supplier' 
                          ? (language === 'ar' ? 'أدخل اسم المورد' : 'Enter supplier name') 
                          : (language === 'ar' ? 'أدخل اسم العميل' : 'Enter customer name')}
                      />
                    </div>
                  </div>
                  
                  {/* Right: Posting Date - Aligned with Customer Phone level */}
                  <div className={`flex items-center gap-3 mt-1 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <label className={`text-sm font-medium text-gray-700 flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <Calendar className="h-4 w-4" />
                      {language === 'ar' ? 'تاريخ الترحيل:' : 'Posting Date:'}
                    </label>
                    <input 
                      type="date" 
                      className="w-[170px] px-2 input-compact-20 border border-gray-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          {/* Modal Content */}
          <div className="space-y-6">
            {/* Transaction Type and Document No. Section - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="ltr">
              <div dir={getDirection(language)}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'نوع المعاملة' : 'Transaction Type'}
                </label>
                <select 
                  className="w-[170px] px-2 input-compact-20 select-reset border border-gray-300"
                >
                  <option value="invoice">
                    {language === 'ar' ? 'فاتورة' : 'Invoice'}
                  </option>
                </select>
              </div>
              <div dir={getDirection(language)}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'رقم الوثيقة' : 'Document No.'}
                </label>
                <input 
                  type="text" 
                  className="w-[170px] px-2 input-compact-20 select-reset border border-gray-300"
                  placeholder={language === 'ar' ? 'أدخل رقم الوثيقة' : 'Enter document number'}
                />
              </div>
            </div>
            
            {/* Payment Method Section */}
            <div>
              <div dir={getDirection(language)}>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                </label>
                <div className="space-y-3">
                  {/* Cash Option */}
                  <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <label className="flex items-center min-w-[120px]">
                      <input 
                        type="checkbox" 
                        name="paymentMethod" 
                        value="cash"
                        checked={paymentMethods.cash.checked}
                        onChange={(e) => handlePaymentMethodChange('cash', 'checked', e.target.checked)}
                        className="mr-2 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">
                        {language === 'ar' ? 'نقداً' : 'Cash'}
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        {language === 'ar' ? 'المبلغ:' : 'Amount:'}
                      </label>
                      <input 
                        type="number" 
                        className="w-[170px] px-2 input-compact-20 border border-gray-300"
                        placeholder={language === 'ar' ? 'المبلغ' : 'Amount'}
                        value={paymentMethods.cash.amount || ''}
                        onChange={(e) => handlePaymentMethodChange('cash', 'amount', parseFloat(e.target.value) || 0)}
                        disabled={!paymentMethods.cash.checked}
                      />
                    </div>
                  </div>
                  
                  {/* Card Option */}
                  <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <label className="flex items-center min-w-[120px]">
                      <input 
                        type="checkbox" 
                        name="paymentMethod" 
                        value="card"
                        checked={paymentMethods.card.checked}
                        onChange={(e) => handlePaymentMethodChange('card', 'checked', e.target.checked)}
                        className="mr-2 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">
                        {language === 'ar' ? 'بطاقة' : 'Card'}
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        {language === 'ar' ? 'المبلغ:' : 'Amount:'}
                      </label>
                      <input 
                        type="number" 
                        className="w-[170px] px-2 input-compact-20 border border-gray-300"
                        placeholder={language === 'ar' ? 'المبلغ' : 'Amount'}
                        value={paymentMethods.card.amount || ''}
                        onChange={(e) => handlePaymentMethodChange('card', 'amount', parseFloat(e.target.value) || 0)}
                        disabled={!paymentMethods.card.checked}
                      />
                    </div>
                  </div>
                  
                  {/* Bank Transfer Option */}
                  <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <label className="flex items-center min-w-[120px]">
                      <input 
                        type="checkbox" 
                        name="paymentMethod" 
                        value="bank"
                        checked={paymentMethods.bank.checked}
                        onChange={(e) => handlePaymentMethodChange('bank', 'checked', e.target.checked)}
                        className="mr-2 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">
                        {language === 'ar' ? 'تحويل مصرفي' : 'Bank Transfer'}
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        {language === 'ar' ? 'المبلغ:' : 'Amount:'}
                      </label>
                      <input 
                        type="number" 
                        className="w-[170px] px-2 input-compact-20 border border-gray-300"
                        placeholder={language === 'ar' ? 'المبلغ' : 'Amount'}
                        value={paymentMethods.bank.amount || ''}
                        onChange={(e) => handlePaymentMethodChange('bank', 'amount', parseFloat(e.target.value) || 0)}
                        disabled={!paymentMethods.bank.checked}
                      />
                    </div>
                  </div>
                  
                  {/* Total Amount */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <label className="flex items-center min-w-[120px] font-semibold">
                        <span className="text-sm text-gray-800">
                          {language === 'ar' ? 'المبلغ الإجمالي:' : 'Total Amount:'}
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          className="w-[170px] px-2 input-compact-20 border border-gray-300 bg-gray-50 font-semibold"
                          placeholder={language === 'ar' ? 'الإجمالي' : 'Total'}
                          value={calculateTotal()}
                          readOnly
                          data-testid="input-total-amount"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Description Section - Moved below Payment Method */}
            <div>
              <div dir={getDirection(language)}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </label>
                <textarea 
                  className="description-field border border-gray-300"
                  placeholder={language === 'ar' ? 'أدخل الوصف' : 'Enter description'}
                />
              </div>
            </div>
            
            {/* Footer with Payment Icon */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-green-600">
                <ArrowDownLeft className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {language === 'ar' ? 'دفع وارد' : 'Income Payment'}
                </span>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}