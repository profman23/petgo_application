import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Calendar, X, Bell, Volume2, LogOut, VolumeX, Car, Clock, BarChart3, TrendingUp, ChevronDown, ChevronUp, FileText, Stethoscope, Package, Users, User, Shield, Upload, Loader2 } from "lucide-react";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";

interface Driver {
  id: number;
  vetsvanCode: string;
  vetsvanName: string;
  username: string;
  phone: string;
  plateNumber: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

export default function AdminVetsVanRequests() {
  const [, setLocation] = useLocation();
  const { language, t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for tracking notifications and audio - matches other admin pages
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastRequestCountRef = useRef(0);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(false);
  const [isAdministrationExpanded, setIsAdministrationExpanded] = useState(true);

  // Requests-specific state - extracted from admin dashboard
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [requestFilterDateFrom, setRequestFilterDateFrom] = useState<Date | undefined>(undefined);
  const [requestFilterDateTo, setRequestFilterDateTo] = useState<Date | undefined>(undefined);
  const [selectedVetsVanIds, setSelectedVetsVanIds] = useState<number[]>([]);
  
  // Pagination State for VetsVan Requests
  const [requestCurrentPage, setRequestCurrentPage] = useState(1);
  const [requestItemsPerPage, setRequestItemsPerPage] = useState(10);

  // Fetch admin token for API calls
  const adminToken = localStorage.getItem("adminToken");

  // Fetch drivers data for filtering - exact copy from admin dashboard
  const { data: drivers } = useQuery({
    queryKey: ["/api/admin/drivers"],
    refetchInterval: 30000, // Refresh drivers every 30 seconds
  });

  // Fetch all VetsVan requests - exact copy from admin dashboard
  const { data: allVetsVanRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['/api/admin/vetsvan-requests'],
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  // Clear Request Filters function - exact copy from admin dashboard
  const clearRequestFilters = () => {
    setRequestSearchTerm('');
    setRequestFilterDateFrom(undefined);
    setRequestFilterDateTo(undefined);
    setSelectedVetsVanIds([]);
    setRequestCurrentPage(1); // Reset to first page when clearing filters
  };

  // Filter VetsVan requests - exact copy from admin dashboard
  const filteredVetsVanRequests = allVetsVanRequests?.filter(request => {
    // Search filter - check name, phone, email, pets, vetsvan
    const searchMatch = !requestSearchTerm || 
      request.customerName.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
      request.customerPhone.includes(requestSearchTerm) ||
      request.customerEmail.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
      request.vetsvanCode.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
      request.vetsvanName.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
      request.pets?.some(pet => 
        pet.name.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
        pet.type.toLowerCase().includes(requestSearchTerm.toLowerCase())
      );

    // Date filter - check appointment date within range (compare dates only, ignore time)
    const appointmentDate = new Date(request.appointmentDate);
    const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    
    let dateMatch = true;
    if (requestFilterDateFrom || requestFilterDateTo) {
      const fromDateOnly = requestFilterDateFrom ? new Date(requestFilterDateFrom.getFullYear(), requestFilterDateFrom.getMonth(), requestFilterDateFrom.getDate()) : null;
      const toDateOnly = requestFilterDateTo ? new Date(requestFilterDateTo.getFullYear(), requestFilterDateTo.getMonth(), requestFilterDateTo.getDate()) : null;
      
      dateMatch = (!fromDateOnly || appointmentDateOnly >= fromDateOnly) &&
                  (!toDateOnly || appointmentDateOnly <= toDateOnly);
    }

    // VetsVan filter - check if request belongs to selected VetsVan vehicles
    const vetsVanMatch = selectedVetsVanIds.length === 0 || 
      selectedVetsVanIds.includes(request.driverId);

    return searchMatch && dateMatch && vetsVanMatch;
  });

  // Pagination calculations - exact copy from admin dashboard
  const totalRequestsCount = filteredVetsVanRequests?.length || 0;
  const totalRequestPages = Math.ceil(totalRequestsCount / requestItemsPerPage);
  const requestStartIndex = (requestCurrentPage - 1) * requestItemsPerPage;
  const requestEndIndex = requestStartIndex + requestItemsPerPage;
  const vetsVanRequests = filteredVetsVanRequests?.slice(requestStartIndex, requestEndIndex) || [];

  // Pagination handlers - exact copy from admin dashboard
  const handleRequestPageChange = (newPage: number) => {
    setRequestCurrentPage(newPage);
  };

  const handleRequestItemsPerPageChange = (newItemsPerPage: number) => {
    setRequestItemsPerPage(newItemsPerPage);
    setRequestCurrentPage(1); // Reset to first page
  };

  // Reset to first page when filters change - exact copy from admin dashboard
  useEffect(() => {
    setRequestCurrentPage(1);
  }, [requestSearchTerm, requestFilterDateFrom, requestFilterDateTo, selectedVetsVanIds]);

  // Monitor for new requests and update notification count - exact copy from admin dashboard
  useEffect(() => {
    if (allVetsVanRequests && allVetsVanRequests.length > 0) {
      const currentCount = allVetsVanRequests.length;
      
      lastRequestCountRef.current = currentCount;
      setCurrentRequestCount(currentCount);
    }
  }, [allVetsVanRequests]);

  // Booking status update mutation - exact copy from admin dashboard
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      const response = await fetch(`/api/admin/booking/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update booking status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vetsvan-requests"] });
      toast({
        title: language === 'ar' ? 'تم تحديث الحالة' : 'Status Updated',
        description: language === 'ar' ? 'تم تحديث حالة الحجز بنجاح' : 'Booking status updated successfully',
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: language === 'ar' ? 'فشل في تحديث حالة الحجز' : 'Failed to update booking status',
        variant: "destructive",
      });
    },
  });

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
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 bg-purple-600 text-purple-600"
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
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-3 pl-1 pr-6 lg:pr-8">
            <div className="px-1 py-3 sm:px-0">
              {/* VetsVan Requests Section - exact copy from admin dashboard */}
              <div className="space-y-3" dir={getDirection(language)}>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ textAlign: getTextAlign(language) }}>
                    {language === 'ar' ? 'جميع طلبات VETS VAN' : 'All VetsVan Requests'}
                  </h2>
                  <p className="text-gray-600" style={{ textAlign: getTextAlign(language) }}>
                    {language === 'ar' ? 'عرض جميع طلبات العملاء لكل سيارات VETS VAN' : 'View all customer requests for all VetsVan vehicles'}
                  </p>
                </div>

                {/* Filters Section */}
                <div className="bg-white p-4 rounded-lg border-2 shadow-sm" style={{ borderColor: '#852085' }}>
                  <h3 className="text-lg font-medium text-gray-900 mb-3" style={{ textAlign: getTextAlign(language) }}>
                    {language === 'ar' ? 'فلاتر البحث' : 'Search Filters'}
                  </h3>
                  
                  <div className="space-y-2">
                    {/* Search Field - Full Width */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700" style={{ textAlign: getTextAlign(language) }}>
                        {language === 'ar' ? 'البحث (اسم، هاتف، إيميل، حيوانات أليفة، VetsVan)' : 'Search (Name, Phone, Email, Pets, VetsVan)'}
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={requestSearchTerm}
                          onChange={(e) => setRequestSearchTerm(e.target.value)}
                          placeholder={language === 'ar' ? 'ابحث في جميع الحقول...' : 'Search all fields...'}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                          style={{ textAlign: getTextAlign(language) }}
                        />
                      </div>
                    </div>

                    {/* Date Range Filter - Full Width Below Search */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700" style={{ textAlign: getTextAlign(language) }}>
                        {language === 'ar' ? 'فلتر بتاريخ الموعد (من - إلى)' : 'Filter by Appointment Date (From - To)'}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* From Date */}
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">
                            {language === 'ar' ? 'من تاريخ' : 'From Date'}
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal border-gray-300 hover:border-purple-600 h-10"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {requestFilterDateFrom ? (
                                  format(requestFilterDateFrom, language === 'ar' ? 'dd/MM/yyyy' : 'MM/dd/yyyy')
                                ) : (
                                  <span className="text-gray-500">
                                    {language === 'ar' ? 'من' : 'From'}
                                  </span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={requestFilterDateFrom}
                                onSelect={(date) => {
                                  // If "To Date" is selected and new "From Date" is after "To Date", reset "To Date"
                                  if (date && requestFilterDateTo && date > requestFilterDateTo) {
                                    setRequestFilterDateTo(undefined);
                                  }
                                  setRequestFilterDateFrom(date);
                                }}
                                disabled={(date) => requestFilterDateTo ? date > requestFilterDateTo : false}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* To Date */}
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">
                            {language === 'ar' ? 'إلى تاريخ' : 'To Date'}
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal border-gray-300 hover:border-purple-600 h-10"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {requestFilterDateTo ? (
                                  format(requestFilterDateTo, language === 'ar' ? 'dd/MM/yyyy' : 'MM/dd/yyyy')
                                ) : (
                                  <span className="text-gray-500">
                                    {language === 'ar' ? 'إلى' : 'To'}
                                  </span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={requestFilterDateTo}
                                onSelect={(date) => {
                                  // If "From Date" is selected and new "To Date" is before "From Date", reset "From Date"
                                  if (date && requestFilterDateFrom && date < requestFilterDateFrom) {
                                    setRequestFilterDateFrom(undefined);
                                  }
                                  setRequestFilterDateTo(date);
                                }}
                                disabled={(date) => requestFilterDateFrom ? date < requestFilterDateFrom : false}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>

                    {/* VetsVan Filter Section */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700" style={{ textAlign: getTextAlign(language) }}>
                        {language === 'ar' ? 'فلتر بسيارات VetsVan' : 'Filter by VetsVan Vehicles'}
                      </label>
                      <div className="border border-gray-300 rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
                        {drivers && drivers.length > 0 ? (
                          <div className="space-y-2">
                            {drivers.map((driver) => (
                              <div key={driver.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`vetsvan-${driver.id}`}
                                  checked={selectedVetsVanIds.includes(driver.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedVetsVanIds([...selectedVetsVanIds, driver.id]);
                                    } else {
                                      setSelectedVetsVanIds(selectedVetsVanIds.filter(id => id !== driver.id));
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`vetsvan-${driver.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  style={{ textAlign: getTextAlign(language) }}
                                >
                                  {driver.vetsvanCode} - {driver.vetsvanName}
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500" style={{ textAlign: getTextAlign(language) }}>
                            {language === 'ar' ? 'لا توجد سيارات VETS VAN متاحة' : 'No VetsVan vehicles available'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={clearRequestFilters}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600"
                      >
                        <X className="h-4 w-4 mr-1" />
                        {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
                      </button>
                    </div>

                    {/* Applied Filters Summary */}
                    {(requestSearchTerm || requestFilterDateFrom || requestFilterDateTo || selectedVetsVanIds.length > 0) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
                        <h4 className="text-sm font-medium text-blue-900 mb-2" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' ? 'الفلاتر المطبقة:' : 'Applied Filters:'}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {requestSearchTerm && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {language === 'ar' ? 'البحث: ' : 'Search: '}{requestSearchTerm}
                            </span>
                          )}
                          {requestFilterDateFrom && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {language === 'ar' ? 'من: ' : 'From: '}{format(requestFilterDateFrom, 'dd/MM/yyyy')}
                            </span>
                          )}
                          {requestFilterDateTo && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {language === 'ar' ? 'إلى: ' : 'To: '}{format(requestFilterDateTo, 'dd/MM/yyyy')}
                            </span>
                          )}
                          {selectedVetsVanIds.length > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {language === 'ar' ? `سيارات VetsVan: ${selectedVetsVanIds.length}` : `VetsVan Vehicles: ${selectedVetsVanIds.length}`}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Results Summary */}
                {vetsVanRequests && vetsVanRequests.length > 0 && (
                  <div className="bg-white p-3 rounded-lg border shadow-sm">
                    <p className="text-sm text-gray-600" style={{ textAlign: getTextAlign(language) }}>
                      {language === 'ar'
                        ? `عرض ${vetsVanRequests.length} من ${totalRequestsCount} طلب`
                        : `Showing ${vetsVanRequests.length} of ${totalRequestsCount} requests`
                      }
                      {(requestSearchTerm || requestFilterDateFrom || requestFilterDateTo || selectedVetsVanIds.length > 0) && (
                        <span className="text-blue-600 font-medium">
                          {language === 'ar' ? ' (مفلترة)' : ' (filtered)'}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Loading State */}
                {isLoadingRequests && (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                )}

                {/* Requests Grid - exact copy from admin dashboard */}
                {vetsVanRequests && vetsVanRequests.length > 0 ? (
                  <div className="grid gap-4">
                    {vetsVanRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className="bg-white rounded-lg shadow-md border-2 p-4"
                        style={{ borderColor: '#852085' }}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* Left Column - Customer Info */}
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg text-gray-900" style={{ textAlign: getTextAlign(language) }}>
                              {request.customerName}
                            </h3>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p style={{ textAlign: getTextAlign(language) }}>
                                <span className="font-medium">{language === 'ar' ? 'الهاتف:' : 'Phone:'}</span> {request.customerPhone}
                              </p>
                              <p style={{ textAlign: getTextAlign(language) }}>
                                <span className="font-medium">{language === 'ar' ? 'الإيميل:' : 'Email:'}</span> {request.customerEmail}
                              </p>
                              <p style={{ textAlign: getTextAlign(language) }}>
                                <span className="font-medium">{language === 'ar' ? 'العنوان:' : 'Address:'}</span> {request.location}
                              </p>
                            </div>
                          </div>

                          {/* Middle Column - Appointment & Service Info */}
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600 space-y-1">
                              <p style={{ textAlign: getTextAlign(language) }}>
                                <span className="font-medium">{language === 'ar' ? 'تاريخ الموعد:' : 'Appointment:'}</span>
                                <br />
                                {new Date(request.appointmentDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p style={{ textAlign: getTextAlign(language) }}>
                                <span className="font-medium">{language === 'ar' ? 'نوع الخدمة:' : 'Service Type:'}</span> {request.serviceType}
                              </p>
                              <p style={{ textAlign: getTextAlign(language) }}>
                                <span className="font-medium">VetsVan:</span> {request.vetsvanCode} - {request.vetsvanName}
                              </p>
                              {request.pets && request.pets.length > 0 && (
                                <p style={{ textAlign: getTextAlign(language) }}>
                                  <span className="font-medium">{language === 'ar' ? 'الحيوانات الأليفة:' : 'Pets:'}</span>
                                  <br />
                                  {request.pets.map((pet, index) => (
                                    <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded-full mr-1 mb-1 inline-block">
                                      {pet.name} ({pet.type})
                                    </span>
                                  ))}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right Column - Status & Actions */}
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-700" style={{ textAlign: getTextAlign(language) }}>
                                {language === 'ar' ? 'الحالة:' : 'Status:'}
                              </span>
                              <select
                                value={request.status}
                                onChange={(e) => updateBookingStatusMutation.mutate({
                                  bookingId: request.id,
                                  status: e.target.value
                                })}
                                disabled={updateBookingStatusMutation.isPending}
                                className="ml-2 text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                                style={{ textAlign: getTextAlign(language) }}
                              >
                                <option value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                                <option value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</option>
                                <option value="in_progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
                                <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                                <option value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
                              </select>
                            </div>
                            
                            {/* Status indicator */}
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${
                                request.status === 'completed' ? 'bg-green-500' :
                                request.status === 'confirmed' || request.status === 'in_progress' ? 'bg-blue-500' :
                                request.status === 'cancelled' ? 'bg-red-500' :
                                'bg-yellow-500'
                              }`}></div>
                              <span className="text-sm text-gray-600" style={{ textAlign: getTextAlign(language) }}>
                                {request.status === 'pending' && (language === 'ar' ? 'في انتظار التأكيد' : 'Awaiting confirmation')}
                                {request.status === 'confirmed' && (language === 'ar' ? 'تم التأكيد' : 'Confirmed')}
                                {request.status === 'in_progress' && (language === 'ar' ? 'جاري التنفيذ' : 'In progress')}
                                {request.status === 'completed' && (language === 'ar' ? 'تم الإنجاز' : 'Completed')}
                                {request.status === 'cancelled' && (language === 'ar' ? 'تم الإلغاء' : 'Cancelled')}
                              </span>
                            </div>

                            <div className="text-xs text-gray-500" style={{ textAlign: getTextAlign(language) }}>
                              {language === 'ar' ? 'تم الإنشاء:' : 'Created:'} {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !isLoadingRequests ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2" style={{ textAlign: getTextAlign(language) }}>
                      {(requestSearchTerm || requestFilterDateFrom || requestFilterDateTo || selectedVetsVanIds.length > 0)
                        ? (language === 'ar' ? 'لا توجد طلبات تطابق المعايير المحددة' : 'No requests match the selected criteria')
                        : (language === 'ar' ? 'لم يتم تقديم أي طلبات VETS VAN بعد' : 'No VetsVan requests have been made yet')
                      }
                    </p>
                  </div>
                ) : null}

                {/* Pagination Controls for VetsVan Requests - exact copy from admin dashboard */}
                {vetsVanRequests && totalRequestsCount > 0 && (
                  <div className="bg-white border-t px-4 py-3 flex items-center justify-between sm:px-6 mt-4">
                    <div className="flex-1 flex justify-between sm:hidden">
                      {/* Mobile Previous/Next */}
                      <button
                        onClick={() => handleRequestPageChange(requestCurrentPage - 1)}
                        disabled={requestCurrentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          requestCurrentPage === 1
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {language === 'ar' ? 'السابق' : 'Previous'}
                      </button>
                      <button
                        onClick={() => handleRequestPageChange(requestCurrentPage + 1)}
                        disabled={requestCurrentPage === totalRequestPages}
                        className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          requestCurrentPage === totalRequestPages
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {language === 'ar' ? 'التالي' : 'Next'}
                      </button>
                    </div>

                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between" style={{ direction: getDirection(language) }}>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-700">
                          {language === 'ar'
                            ? `عرض ${requestStartIndex + 1} إلى ${Math.min(requestEndIndex, totalRequestsCount)} من ${totalRequestsCount} طلب`
                            : `Showing ${requestStartIndex + 1} to ${Math.min(requestEndIndex, totalRequestsCount)} of ${totalRequestsCount} requests`
                          }
                        </div>
                        
                        {/* Items per page selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">
                            {language === 'ar' ? 'عرض:' : 'Show:'}
                          </span>
                          <select
                            value={requestItemsPerPage}
                            onChange={(e) => handleRequestItemsPerPageChange(Number(e.target.value))}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                          >
                            <option value={10}>10</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                          <span className="text-sm text-gray-700">
                            {language === 'ar' ? 'طلب في الصفحة' : 'per page'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Previous Button */}
                        <button
                          onClick={() => handleRequestPageChange(requestCurrentPage - 1)}
                          disabled={requestCurrentPage === 1}
                          className={`relative inline-flex items-center px-3 py-2 rounded-md border text-sm font-medium ${
                            requestCurrentPage === 1
                              ? 'bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-purple-600'
                          }`}
                        >
                          <ChevronDown className={`h-4 w-4 ${language === 'ar' ? 'rotate-90' : '-rotate-90'}`} />
                          <span className="ml-1">{language === 'ar' ? 'السابق' : 'Previous'}</span>
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalRequestPages }, (_, i) => i + 1)
                            .filter(page => {
                              // Show first page, last page, current page, and pages around current
                              return page === 1 || 
                                     page === totalRequestPages || 
                                     Math.abs(page - requestCurrentPage) <= 1;
                            })
                            .map((page, index, array) => {
                              // Add ellipsis if there's a gap
                              const showEllipsis = index > 0 && page - array[index - 1] > 1;
                              return (
                                <div key={page} className="flex items-center">
                                  {showEllipsis && (
                                    <span className="px-2 py-1 text-gray-500">...</span>
                                  )}
                                  <button
                                    onClick={() => handleRequestPageChange(page)}
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                                      page === requestCurrentPage
                                        ? 'bg-purple-600 text-white border border-purple-600'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-purple-600'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                </div>
                              );
                            })}
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() => handleRequestPageChange(requestCurrentPage + 1)}
                          disabled={requestCurrentPage === totalRequestPages}
                          className={`relative inline-flex items-center px-3 py-2 rounded-md border text-sm font-medium ${
                            requestCurrentPage === totalRequestPages
                              ? 'bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-purple-600'
                          }`}
                        >
                          <span className="mr-1">{language === 'ar' ? 'التالي' : 'Next'}</span>
                          <ChevronDown className={`h-4 w-4 ${language === 'ar' ? '-rotate-90' : 'rotate-90'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}