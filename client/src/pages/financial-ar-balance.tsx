import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Home, Users, User, Shield, DollarSign, Car, Clock, 
  Upload, Stethoscope, Package, BarChart3, TrendingUp, FileText, Receipt,
  ChevronDown, ChevronUp, Bell, Volume2, VolumeX, LogOut, Menu, FilePlus, BanknoteArrowUp, ArrowDown 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation, getDirection } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { LanguageSelector } from '@/components/language-selector';
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";

export default function FinancialARBalance() {
  const [location, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(() => {
    const savedState = localStorage.getItem('isNewReportsExpanded');
    return savedState !== null ? JSON.parse(savedState) : false;
  });
  const [isAdministrationExpanded, setIsAdministrationExpanded] = useState(() => {
    const savedState = localStorage.getItem('isAdministrationExpanded');
    return savedState !== null ? JSON.parse(savedState) : false;
  });
  const [isFinancialExpanded, setIsFinancialExpanded] = useState(() => {
    const savedState = localStorage.getItem('isFinancialExpanded');
    return savedState !== null ? JSON.parse(savedState) : true; // Default expanded for financial pages
  });
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('audioNotificationsEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [lordIconKey, setLordIconKey] = useState(0);

  useEffect(() => {
    localStorage.setItem('audioNotificationsEnabled', JSON.stringify(audioEnabled));
  }, [audioEnabled]);

  useEffect(() => {
    setLordIconKey(prev => prev + 1);
  }, []);

  const handleLogout = () => {
    // Logout logic here
    toast({
      title: language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Successfully logged out',
      description: language === 'ar' ? 'وداعاً!' : 'Goodbye!',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={getDirection(language)}>
      {/* Mobile Sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
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
                    <ArrowDown className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setLocation('/financial/income-payment');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <BanknoteArrowUp className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'الدفع الوارد' : 'Income Payment'}</span>
                  </button>
                  <button
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full bg-purple-50 border-l-4 border-purple-600"
                  >
                    <DollarSign className="h-5 w-5 flex-shrink-0 text-purple-600" />
                    <span className="text-purple-600">{language === 'ar' ? 'رصيد الحسابات المدينة' : 'A/R Balance'}</span>
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
                    <ArrowDown className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/financial/income-payment');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <BanknoteArrowUp className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'الدفع الوارد' : 'Income Payment'}</span>
                  </button>
                  <button
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full bg-purple-50 border-l-4 border-purple-600"
                  >
                    <DollarSign className="h-5 w-5 flex-shrink-0 text-purple-600" />
                    <span className="text-purple-600">{language === 'ar' ? 'رصيد الحسابات المدينة' : 'A/R Balance'}</span>
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
                src="https://cdn.lordicon.com/mrniyolg.json"
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
                  {language === 'ar' ? 'رصيد الحسابات المدينة' : 'A/R Balance'}
                </h1>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}