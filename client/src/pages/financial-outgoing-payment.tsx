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

  const Sidebar = () => (
    <div className="bg-white border-r border-gray-200 w-64 flex flex-col" style={{ fontFamily: 'Arimo' }}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <img
          src={vetsVanLogo}
          alt="VetsVan Logo"
          className="h-12 w-auto mx-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {/* Admin Home */}
        <button
          onClick={() => setLocation('/admin-home')}
          className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <Home className="h-6 w-6 flex-shrink-0" />
          <span>{language === 'ar' ? 'الصفحة الرئيسية' : 'Admin Home'}</span>
        </button>

        {/* VetsVan Requests */}
        <button
          onClick={() => setLocation('/admin-dashboard/vetsvan-requests')}
          className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <Car className="h-6 w-6 flex-shrink-0" />
          <span>{language === 'ar' ? 'طلبات الطبيب البيطري' : 'VetsVan Requests'}</span>
        </button>

        {/* Financial */}
        <div className="mb-2">
          <button
            onClick={handleFinancialClick}
            className="group flex items-center justify-between px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'المالية' : 'Financial'}</span>
            </div>
            {isFinancialExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {isFinancialExpanded && (
            <div className="ml-8 mt-2 space-y-1">
              <button
                onClick={() => setLocation('/financial/credit-note')}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <Receipt className="h-6 w-6 flex-shrink-0" />
                <span>{language === 'ar' ? 'مذكرة الائتمان' : 'Credit Note'}</span>
              </button>
              <button
                onClick={() => setLocation('/financial/outgoing-payment')}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <DollarSign className="h-6 w-6 flex-shrink-0" />
                <span>{language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Administration */}
        <div className="mb-2">
          <button
            onClick={handleAdministrationClick}
            className="group flex items-center justify-between px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'الإدارة' : 'Administration'}</span>
            </div>
            {isAdministrationExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {isAdministrationExpanded && (
            <div className="ml-8 mt-2 space-y-1">
              <button
                onClick={() => setLocation('/administration/authorization')}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <Shield className="h-6 w-6 flex-shrink-0" />
                <span>{language === 'ar' ? 'التصريحات' : 'Authorization'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Products */}
        <button
          onClick={() => setLocation('/admin-dashboard/products')}
          className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <Package className="h-6 w-6 flex-shrink-0" />
          <span>{language === 'ar' ? 'المنتجات' : 'Products'}</span>
        </button>
      </nav>

      {/* Bottom section with Language Selector and Logout */}
      <div className="p-4 border-t border-gray-200 space-y-4">
        <LanguageSelector />
        <button
          onClick={handleLogout}
          className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-6 w-6 flex-shrink-0" />
          <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetTrigger asChild>
            <button className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-lg lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between">
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
  );
}