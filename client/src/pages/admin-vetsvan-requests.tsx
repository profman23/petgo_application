import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, ChevronDown, ChevronUp, Search, Phone, Mail, Clock, FileText } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { playBookingNotification } from "@/utils/audio";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default function AdminVetsVanRequests() {
  const [, setLocation] = useLocation();
  const { language, t } = useTranslation();
  const { toast } = useToast();
  
  // State for tracking notifications and audio - matches other admin pages
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastRequestCountRef = useRef(0);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);

  // State for VetsVan Requests Filters - exact copy from admin dashboard
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [requestFilterDateFrom, setRequestFilterDateFrom] = useState<Date | undefined>(undefined);
  const [requestFilterDateTo, setRequestFilterDateTo] = useState<Date | undefined>(undefined);
  const [selectedVetsVanIds, setSelectedVetsVanIds] = useState<number[]>([]);
  
  // Pagination State for VetsVan Requests - exact copy from admin dashboard
  const [requestCurrentPage, setRequestCurrentPage] = useState(1);
  const [requestItemsPerPage, setRequestItemsPerPage] = useState(10);

  // Clear Request Filters - exact copy from admin dashboard
  const clearRequestFilters = () => {
    setRequestSearchTerm('');
    setRequestFilterDateFrom(undefined);
    setRequestFilterDateTo(undefined);
    setSelectedVetsVanIds([]);
    setRequestCurrentPage(1); // Reset to first page when clearing filters
  };

  // Admin token for API calls
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

  // Authentication check - redirect if not admin
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const regularToken = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (user.membershipType === "doctor" || regularToken) {
      toast({
        title: language === 'ar' ? 'غير مسموح' : 'Access Denied',
        description: language === 'ar' ? 'لا يمكن للأطباء الوصول إلى لوحة إدارة النظام' : 'Doctors cannot access admin dashboard',
        variant: 'destructive',
      });
      setLocation("/doctor-dashboard");
      return;
    }
    
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation, toast, language]);

  // Route guard - redirect if user doesn't have permission to access VetsVan Requests page
  useEffect(() => {
    if (!permissionsLoading && currentUserPermissions?.rolePermissions?.VetsVanRequests?.noPermission === true) {
      setLocation('/admin-home');
    }
  }, [currentUserPermissions, permissionsLoading, setLocation]);

  // Fetch VetsVan Requests - exact copy from admin dashboard
  const { data: allVetsVanRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/admin/vetsvan-requests"],
    queryFn: async () => {
      console.log("Admin VetsVan requests called - starting data fetch...");
      const response = await fetch("/api/admin/vetsvan-requests", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch VetsVan requests");
      const data = await response.json() as Array<{
        id: number;
        customerName: string;
        customerPhone: string;
        customerEmail: string;
        vetsvanCode: string;
        vetsvanName: string;
        appointmentDate: string;
        appointmentTime: string;
        status: string;
        location: any;
        pets: Array<{
          name: string;
          type: string;
        }>;
        serviceType: string;
        createdAt: string;
        driverId: number;
        paidAmount?: string | null;
      }>;
      console.log("VetsVan requests data fetched successfully:", data.length, "requests");
      return data;
    },
    enabled: !!adminToken,
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  // Fetch Drivers/VetsVans for filtering - exact copy from admin dashboard
  const { data: allDrivers } = useQuery({
    queryKey: ["/api/admin/drivers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/drivers", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch drivers");
      return await response.json();
    },
    enabled: !!adminToken,
    staleTime: 5 * 60 * 1000,
  });

  // Filter VetsVan requests based on search term, date, and selected VetsVan vehicles - exact copy from admin dashboard
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

  // Pagination calculations for VetsVan requests - exact copy from admin dashboard
  const totalRequestsCount = filteredVetsVanRequests?.length || 0;
  const totalRequestPages = Math.ceil(totalRequestsCount / requestItemsPerPage);
  const requestStartIndex = (requestCurrentPage - 1) * requestItemsPerPage;
  const requestEndIndex = requestStartIndex + requestItemsPerPage;
  const vetsVanRequests = filteredVetsVanRequests?.slice(requestStartIndex, requestEndIndex) || [];

  // Pagination handlers for VetsVan requests - exact copy from admin dashboard
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

  // Monitor for new requests and trigger notifications - exact copy from admin dashboard
  useEffect(() => {
    if (allVetsVanRequests && allVetsVanRequests.length > 0) {
      const currentCount = allVetsVanRequests.length;
      
      // Check if there are new requests
      if (lastRequestCountRef.current > 0 && currentCount > lastRequestCountRef.current) {
        const newRequestsCount = currentCount - lastRequestCountRef.current;
        
        // Play audio notification if enabled
        if (audioEnabled) {
          playBookingNotification();
        }
        
        // Show toast notification for new requests
        toast({
          title: language === 'ar' ? '🔔 طلب جديد!' : '🔔 New Request!',
          description: language === 'ar' 
            ? `تم استلام ${newRequestsCount} طلب جديد من العملاء` 
            : `${newRequestsCount} new customer request(s) received`,
          duration: 5000,
        });
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(
            language === 'ar' ? 'VETS VAN - طلب جديد' : 'VETS VAN - New Request',
            {
              body: language === 'ar' 
                ? `${newRequestsCount} طلب جديد من العملاء` 
                : `${newRequestsCount} new customer request(s)`,
              icon: '/favicon.ico'
            }
          );
        }
      }
      
      lastRequestCountRef.current = currentCount;
      setCurrentRequestCount(currentCount);
    }
  }, [allVetsVanRequests, audioEnabled, language, toast]);

  // Request browser notification permission on component mount - exact copy from admin dashboard
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Update booking status mutation - exact copy from admin dashboard
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
    <AdminLayout>
      <div 
        className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8" 
        dir={getDirection(language)} 
        style={{ textAlign: getTextAlign(language) }}
      >
        {/* VetsVan Requests Section - exact copy from admin dashboard */}
        <div className="space-y-3" dir={getDirection(language)}>
          <div className="text-center">
            <div className="flex items-center justify-start gap-3 mb-2">
              <lord-icon
                src="https://cdn.lordicon.com/nwwurnnq.json"
                trigger="loop"
                delay="2000"
                colors="primary:#852085,secondary:#848484"
                style={{width: '80px', height: '80px'}}
              />
              <h2 className="text-2xl font-bold text-gray-600" style={{ fontFamily: 'Arimo' }}>
                {language === 'ar' ? 'جميع طلبات VETS VAN' : 'All VetsVan Requests'}
              </h2>
            </div>
            <p className="text-gray-600" style={{ textAlign: getTextAlign(language) }}>
              {language === 'ar' ? 'عرض جميع طلبات العملاء لكل سيارات VETS VAN' : 'View all customer requests for all VetsVan vehicles'}
            </p>
          </div>

                {/* Filters Section - exact copy from admin dashboard */}
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
                          data-testid="search-input"
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
                                className="w-full justify-start text-left font-normal"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {requestFilterDateFrom ? format(requestFilterDateFrom, "PPP") : (
                                  <span>{language === 'ar' ? 'اختر التاريخ' : 'Pick a date'}</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={requestFilterDateFrom}
                                onSelect={setRequestFilterDateFrom}
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
                                className="w-full justify-start text-left font-normal"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {requestFilterDateTo ? format(requestFilterDateTo, "PPP") : (
                                  <span>{language === 'ar' ? 'اختر التاريخ' : 'Pick a date'}</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={requestFilterDateTo}
                                onSelect={setRequestFilterDateTo}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>

                    {/* VetsVan Selection Filter */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700" style={{ textAlign: getTextAlign(language) }}>
                        {language === 'ar' ? 'فلتر بسيارات VETS VAN' : 'Filter by VetsVan Vehicles'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {allDrivers?.map((driver: any) => (
                          <label key={driver.id} className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded">
                            <input
                              type="checkbox"
                              checked={selectedVetsVanIds.includes(driver.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedVetsVanIds([...selectedVetsVanIds, driver.id]);
                                } else {
                                  setSelectedVetsVanIds(selectedVetsVanIds.filter(id => id !== driver.id));
                                }
                              }}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                            />
                            <span className="text-sm text-gray-700">
                              {driver.vetsvanCode} - {driver.vetsvanName}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={clearRequestFilters}
                        className="px-4 py-2 text-sm text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50 transition-colors"
                      >
                        {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {isLoadingRequests ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : vetsVanRequests && vetsVanRequests.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {vetsVanRequests.map((request) => (
                      <Card key={request.id} className="h-fit border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2 px-3 pt-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1 min-w-0">
                              <CardTitle className="text-sm font-medium text-gray-900 truncate">
                                {request.customerName}
                              </CardTitle>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-600 truncate">{request.customerPhone}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-600 truncate">{request.customerEmail}</span>
                              </div>
                            </div>
                            <Badge
                              className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                                request.status === 'confirmed' 
                                  ? 'bg-green-100 text-green-700 border border-green-300' 
                                  : request.status === 'pending_review'
                                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                  : request.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700 border border-red-300'
                                  : 'bg-blue-100 text-blue-700 border border-blue-300'
                              }`}
                            >
                              {request.status === 'confirmed' && (language === 'ar' ? 'مؤكد' : 'Confirmed')}
                              {request.status === 'pending_review' && (language === 'ar' ? 'قيد المراجعة' : 'Pending')}
                              {request.status === 'cancelled' && (language === 'ar' ? 'ملغي' : 'Cancelled')}
                              {!['confirmed', 'pending_review', 'cancelled'].includes(request.status) && request.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-2 px-3 pb-3">
                          {/* VetsVan Info */}
                          <div className="bg-purple-50 rounded p-1">
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-purple-600 rounded-full"></div>
                              <span className="text-xs font-medium text-purple-700">
                                {request.vetsvanCode}
                              </span>
                            </div>
                          </div>

                          {/* Appointment Details */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-blue-600" />
                              <span className="text-xs text-gray-600 truncate">
                                {new Date(request.appointmentDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-600" />
                              <span className="text-xs text-gray-600">{request.appointmentTime}</span>
                            </div>
                          </div>

                          {/* Service Type */}
                          <div className="bg-blue-50 rounded p-1">
                            <span className="text-xs text-blue-700">
                              {request.serviceType === 'general_checkup' && (language === 'ar' ? 'كشف' : 'Check')}
                              {request.serviceType === 'grooming' && (language === 'ar' ? 'تنظيف' : 'Groom')}
                              {!['general_checkup', 'grooming'].includes(request.serviceType) && request.serviceType}
                            </span>
                          </div>

                          {/* Paid Amount */}
                          {request.paidAmount && (
                            <div className="bg-emerald-50 rounded p-1.5 border border-emerald-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-emerald-700">
                                  {language === 'ar' ? 'المبلغ المدفوع' : 'Paid Amount'}
                                </span>
                                <span className="text-xs font-bold text-emerald-800">
                                  {request.paidAmount} {language === 'ar' ? 'ريال' : 'SAR'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Pets */}
                          {request.pets && request.pets.length > 0 && (
                            <div className="bg-green-50 rounded p-1">
                              <div className="flex flex-wrap gap-1">
                                {request.pets.map((pet, index) => (
                                  <span key={index} className="text-xs text-green-700 bg-green-100 px-1 rounded">
                                    {pet.name}
                                    {pet.type === 'cat' && ' 🐱'}
                                    {pet.type === 'dog' && ' 🐶'}
                                    {pet.type === 'bird' && ' 🐦'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Status Update */}
                          <div className="bg-gray-50 rounded p-1">
                            <select
                              value={request.status}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                updateBookingStatusMutation.mutate({ 
                                  bookingId: request.id, 
                                  status: newStatus 
                                });
                              }}
                              disabled={updateBookingStatusMutation.isPending}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-600 bg-white"
                              style={{ textAlign: getTextAlign(language) }}
                            >
                              <option value="pending_review">
                                {language === 'ar' ? 'قيد المراجعة' : 'Pending Review'}
                              </option>
                              <option value="confirmed">
                                {language === 'ar' ? 'مؤكد' : 'Confirmed'}
                              </option>
                              <option value="cancelled">
                                {language === 'ar' ? 'ملغي' : 'Cancelled'}
                              </option>
                            </select>
                          </div>

                          {/* Created Date */}
                          <div className="border-t pt-1 mt-1">
                            <div className="text-xs text-gray-400 text-center">
                              {new Date(request.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                      {language === 'ar' ? 'لا توجد طلبات حتى الآن' : 'No requests found'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {language === 'ar' ? 'لم يتم تقديم أي طلبات VETS VAN بعد' : 'No VetsVan requests have been made yet'}
                    </p>
                  </div>
                )}

                {/* Pagination Controls for VetsVan Requests */}
                {vetsVanRequests && totalRequestsCount > 0 && (
                  <PaginationControls
                    currentCount={vetsVanRequests.length}
                    filteredCount={totalRequestsCount}
                    totalCount={allVetsVanRequests?.length || 0}
                    itemType="requests"
                    itemsPerPage={requestItemsPerPage}
                    onItemsPerPageChange={handleRequestItemsPerPageChange}
                    currentPage={requestCurrentPage}
                    totalPages={totalRequestPages}
                    onPageChange={handleRequestPageChange}
                  />
                )}
              </div>
        </div>
    </AdminLayout>
  );
}