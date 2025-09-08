import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Shield, LogOut, Car, Clock, BarChart3, FileText, User, Users, Upload, Package, Stethoscope, ChevronDown, ChevronUp, TrendingUp, Volume2, VolumeX, Bell, Home, Menu, DollarSign, Receipt, Search } from "lucide-react";
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
  const [isCreateCreditNoteModalOpen, setIsCreateCreditNoteModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

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

  // Fetch generated invoices for search
  const { data: allInvoices } = useQuery({
    queryKey: ["/api/admin/generated-invoices"],
    queryFn: async () => {
      const response = await fetch("/api/admin/generated-invoices", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch invoices");
      return response.json();
    },
    enabled: !!adminToken,
  });

  const [currentRequestCount, setCurrentRequestCount] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const savedState = localStorage.getItem('audioNotificationsEnabled');
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  // Update request count when data changes - match admin-home.tsx logic
  useEffect(() => {
    if (allVetsVanRequests && Array.isArray(allVetsVanRequests) && allVetsVanRequests.length > 0) {
      const currentCount = allVetsVanRequests.length; // Use total count like other admin pages
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

  // Handle invoice search
  const handleInvoiceSearch = () => {
    if (!invoiceNumber.trim()) return;

    setIsSearching(true);
    
    if (!allInvoices) {
      setIsSearching(false);
      return;
    }
    
    // Filter invoices by invoice number (partial match)
    const results = allInvoices.filter((invoice: any) => {
      const invoiceNum = invoice.invoiceNumber || '';
      const searchTerm = invoiceNumber.toLowerCase();
      return invoiceNum.toLowerCase().includes(searchTerm);
    });
    
    setTimeout(() => {
      setSearchResults(results);
      setIsSearching(false);
    }, 500); // Small delay for better UX
  };

  // Handle selecting an invoice for credit note creation
  const handleSelectInvoice = async (invoice: any) => {
    setSelectedInvoice(invoice);
    setSearchResults([]); // Hide search results
    setInvoiceNumber(""); // Clear search field
    
    // Fetch invoice items from database
    if (invoice.bookingId) {
      setLoadingItems(true);
      try {
        const response = await fetch(`/api/invoice-items/${invoice.bookingId}`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        if (response.ok) {
          const items = await response.json();
          setInvoiceItems(items);
        }
      } catch (error) {
        console.error('Failed to fetch invoice items:', error);
        setInvoiceItems([]);
      } finally {
        setLoadingItems(false);
      }
    }
  };

  // Handle going back to search
  const handleBackToSearch = () => {
    setSelectedInvoice(null);
    setInvoiceNumber("");
    setSearchResults([]);
    setInvoiceItems([]);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsCreateCreditNoteModalOpen(false);
    setSelectedInvoice(null);
    setInvoiceNumber("");
    setSearchResults([]);
    setInvoiceItems([]);
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
                      <span>{language === 'ar' ? 'إدارة الفيتس فان' : 'Vets Van Management'}</span>
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
                  src="https://cdn.lordicon.com/lbrbofig.json"
                  trigger="loop"
                  delay="1500"
                  colors="primary:#852085,secondary:#848484"
                  style={{width: '80px', height: '80px'}}
                />
              </div>
              
              {/* Credit Note Title */}
              <h1 className="text-2xl font-bold text-gray-600" style={{fontFamily: 'Arimo'}}>
                {language === 'ar' ? 'مذكرة الائتمان' : 'Credit Note'}
              </h1>
            </div>

            {/* Right side - Create New Credit Note Button */}
            <button
              onClick={() => setIsCreateCreditNoteModalOpen(true)}
              className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
            >
              {language === 'ar' ? 'إنشاء مذكرة ائتمان جديدة' : 'Create New Credit Note'}
            </button>
          </div>
        </div>
      </div>

      {/* Create New Credit Note Modal */}
      <Dialog open={isCreateCreditNoteModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto" dir={getDirection(language)}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-600" style={{fontFamily: 'Arimo', textAlign: getTextAlign(language)}}>
              {language === 'ar' ? 'إنشاء مذكرة ائتمان جديدة' : 'Create New Credit Note'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4" dir={getDirection(language)}>
            <div className="space-y-2">
              <label htmlFor="invoice-search" className="text-sm font-medium text-gray-700" style={{textAlign: getTextAlign(language)}}>
                {language === 'ar' ? 'البحث برقم الفاتورة' : 'Search by Invoice Number'}
              </label>
              <div className="relative">
                <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4`} />
                <Input
                  id="invoice-search"
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل رقم الفاتورة...' : 'Enter invoice number...'}
                  className={language === 'ar' ? 'pr-10' : 'pl-10'}
                  style={{textAlign: getTextAlign(language)}}
                  dir={getDirection(language)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleInvoiceSearch();
                    }
                  }}
                />
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2" dir={getDirection(language)}>
                <label className="text-sm font-medium text-gray-700" style={{textAlign: getTextAlign(language)}}>
                  {language === 'ar' ? 'نتائج البحث' : 'Search Results'}
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2 bg-gray-50">
                  {searchResults.map((invoice: any) => (
                    <div 
                      key={invoice.id} 
                      className="bg-white p-3 rounded border cursor-pointer hover:bg-purple-50 transition-colors"
                      onClick={() => handleSelectInvoice(invoice)}
                    >
                      <div className="flex justify-between items-start mb-2" style={{textAlign: getTextAlign(language)}}>
                        <div>
                          <div className="font-semibold text-purple-600">
                            {invoice.invoiceNumber}
                          </div>
                          <div className="text-sm text-gray-600">
                            {invoice.customerName}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          {invoice.finalTotal} SAR
                        </div>
                      </div>
                      <div className="text-xs text-gray-500" style={{textAlign: getTextAlign(language)}}>
                        {language === 'ar' ? 'التاريخ: ' : 'Date: '}
                        {new Date(invoice.appointmentDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results Message */}
            {!isSearching && searchResults.length === 0 && invoiceNumber.trim() && (
              <div className="text-center py-4 text-gray-500" style={{textAlign: getTextAlign(language)}}>
                {language === 'ar' ? 'لم يتم العثور على فواتير' : 'No invoices found'}
              </div>
            )}

            {/* Selected Invoice Display */}
            {selectedInvoice && (
              <div className="space-y-4" dir={getDirection(language)}>
                {/* Back Button */}
                <div className={`flex ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                  <Button
                    variant="outline"
                    onClick={handleBackToSearch}
                    className="text-purple-600 border-purple-600 hover:bg-purple-50"
                  >
                    {language === 'ar' ? '← العودة للبحث' : '← Back to Search'}
                  </Button>
                </div>

                {/* Invoice Details */}
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Invoice Information */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-purple-800 mb-3" style={{textAlign: getTextAlign(language)}}>
                        {language === 'ar' ? 'معلومات الفاتورة' : 'Invoice Information'}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between" style={{textAlign: getTextAlign(language)}}>
                          <span className="font-medium text-gray-700">
                            {language === 'ar' ? 'رقم الفاتورة:' : 'Invoice Number:'}
                          </span>
                          <span className="text-purple-600 font-semibold">{selectedInvoice.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between" style={{textAlign: getTextAlign(language)}}>
                          <span className="font-medium text-gray-700">
                            {language === 'ar' ? 'التاريخ:' : 'Date:'}
                          </span>
                          <span className="text-gray-600">
                            {new Date(selectedInvoice.appointmentDate).toLocaleDateString(
                              language === 'ar' ? 'ar-SA' : 'en-US'
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between" style={{textAlign: getTextAlign(language)}}>
                          <span className="font-medium text-gray-700">
                            {language === 'ar' ? 'المجموع النهائي:' : 'Final Total:'}
                          </span>
                          <span className="text-green-600 font-bold">{selectedInvoice.finalTotal} SAR</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-purple-800 mb-3" style={{textAlign: getTextAlign(language)}}>
                        {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between" style={{textAlign: getTextAlign(language)}}>
                          <span className="font-medium text-gray-700">
                            {language === 'ar' ? 'اسم العميل:' : 'Customer Name:'}
                          </span>
                          <span className="text-gray-600">{selectedInvoice.customerName}</span>
                        </div>
                        <div className="flex justify-between" style={{textAlign: getTextAlign(language)}}>
                          <span className="font-medium text-gray-700">
                            {language === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}
                          </span>
                          <span className="text-gray-600">{selectedInvoice.customerPhone}</span>
                        </div>
                        <div className="flex justify-between" style={{textAlign: getTextAlign(language)}}>
                          <span className="font-medium text-gray-700">
                            {language === 'ar' ? 'العنوان:' : 'Address:'}
                          </span>
                          <span className="text-gray-600">{selectedInvoice.customerAddress}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items and Services */}
                  <div className="space-y-4">
                    {/* Loading Items */}
                    {loadingItems && (
                      <div className="text-center py-4">
                        <div className="text-gray-600" style={{textAlign: getTextAlign(language)}}>
                          {language === 'ar' ? 'جاري تحميل عناصر الفاتورة...' : 'Loading invoice items...'}
                        </div>
                      </div>
                    )}

                    {/* Items and Services Table */}
                    {!loadingItems && invoiceItems.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-purple-800 mb-3" style={{textAlign: getTextAlign(language)}}>
                          {language === 'ar' ? 'المنتجات والخدمات' : 'Items and Services'}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full mb-4">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-2" style={{textAlign: getTextAlign(language), width: '35%'}}>
                                  {language === 'ar' ? 'الوصف' : 'Description'}
                                </th>
                                <th className="text-center py-2 px-2 w-24">
                                  {language === 'ar' ? 'الكمية' : 'Quantity'}
                                </th>
                                <th className="text-center py-2 px-2 w-32">
                                  {language === 'ar' ? 'سعر الوحدة (ر.س)' : 'Unit Price (SAR)'}
                                </th>
                                <th className="text-center py-2 px-2 w-28">
                                  {language === 'ar' ? 'الخصم' : 'Discount'}
                                </th>
                                <th className="text-center py-2 px-2 w-24">
                                  {language === 'ar' ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)'}
                                </th>
                                <th className="text-center py-2 px-2 w-32">
                                  {language === 'ar' ? 'المجموع قبل الضريبة (ر.س)' : 'Total Before VAT (SAR)'}
                                </th>
                                <th className="text-center py-2 px-2 w-32">
                                  {language === 'ar' ? 'المجموع بعد الضريبة (ر.س)' : 'Total After VAT (SAR)'}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoiceItems.map((item: any, index: number) => {
                                // Debug: Log item data to see ALL available fields
                                console.log('Invoice item data (full):', JSON.stringify(item, null, 2));
                                
                                // Use the correct field names from the database
                                const unitPrice = parseFloat(item.unitPrice || item.price || 0);
                                const quantity = parseInt(item.quantity || 1);
                                // Try different possible field names for discount
                                const discount = parseFloat(item.discount || item.discountPercentage || item.discountAmount || item.discountValue || 0);
                                const itemName = item.description || item.name || item.itemName || 'Unknown Item';
                                
                                const totalBeforeDiscount = unitPrice * quantity;
                                const discountAmount = totalBeforeDiscount * (discount / 100);
                                const totalAfterDiscount = totalBeforeDiscount - discountAmount;
                                const vatAmount = totalAfterDiscount * 0.15;
                                const totalAfterVat = totalAfterDiscount + vatAmount;
                                
                                return (
                                  <tr key={index} className="border-b">
                                    <td className="py-2 px-2" style={{width: '35%'}}>
                                      <div className="bg-gray-100 p-2 rounded text-gray-700" style={{textAlign: getTextAlign(language)}}>
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${
                                          item.type === 'product' 
                                            ? 'bg-blue-100 text-blue-800' 
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                          {item.type === 'product' 
                                            ? (language === 'ar' ? 'منتج' : 'Product')
                                            : (language === 'ar' ? 'خدمة' : 'Service')
                                          }
                                        </span>
                                        {itemName}
                                      </div>
                                    </td>
                                    <td className="py-2 px-2">
                                      <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                                        {quantity}
                                      </div>
                                    </td>
                                    <td className="py-2 px-2">
                                      <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                                        {unitPrice.toFixed(2)}
                                      </div>
                                    </td>
                                    <td className="py-2 px-2">
                                      <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                                        {discount > 0 
                                          ? `${discount.toFixed(1)}%` 
                                          : (language === 'ar' ? 'لا يوجد خصم' : 'No Discount')
                                        }
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <div className="bg-green-100 p-2 rounded text-green-700">
                                        {vatAmount.toFixed(2)}
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <div className="bg-gray-100 p-2 rounded text-gray-700">
                                        {totalAfterDiscount.toFixed(2)}
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <div className="bg-gray-100 p-2 rounded text-gray-700 font-semibold">
                                        {totalAfterVat.toFixed(2)}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* No Items Message */}
                    {!loadingItems && invoiceItems.length === 0 && selectedInvoice && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-lg mb-2">📋</div>
                        <div style={{textAlign: getTextAlign(language)}}>
                          {language === 'ar' ? 'لا توجد عناصر في هذه الفاتورة' : 'No items found for this invoice'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className={`flex gap-3 pt-6 border-t ${language === 'ar' ? 'justify-start' : 'justify-end'}`}>
                    <Button
                      variant="outline"
                      onClick={handleBackToSearch}
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => {
                        // TODO: Implement credit note creation
                        console.log('Creating credit note for invoice:', selectedInvoice.invoiceNumber);
                      }}
                    >
                      {language === 'ar' ? 'إنشاء مذكرة ائتمان' : 'Create Credit Note'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className={`flex gap-2 pt-4 ${language === 'ar' ? 'justify-start' : 'justify-end'}`}>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateCreditNoteModalOpen(false);
                  setInvoiceNumber("");
                }}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleInvoiceSearch}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!invoiceNumber.trim() || isSearching}
              >
                {isSearching ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {language === 'ar' ? 'جارٍ البحث...' : 'Searching...'}
                  </div>
                ) : (
                  language === 'ar' ? 'بحث' : 'Search'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load lord-icon script */}
      <script src="https://cdn.lordicon.com/lordicon.js"></script>
    </div>
  );
}