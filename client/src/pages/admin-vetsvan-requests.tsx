import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Loader2, Bell, Volume2, LogOut, VolumeX, Car, Clock, BarChart3, TrendingUp, ChevronDown, ChevronUp, FileText, Stethoscope, Package, Users, User, Shield, Search, Calendar, X, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Validation function for phone numbers
const validatePhoneNumber = (phoneNumber: string) => {
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  if (!cleaned) {
    return { 
      isValid: false, 
      error: 'Phone number is required' 
    };
  }
  
  // Saudi phone number patterns
  if (cleaned.startsWith('+966')) {
    const withoutCountryCode = cleaned.substring(4);
    if (withoutCountryCode.length === 9 && withoutCountryCode.startsWith('5')) {
      return { isValid: true, normalized: cleaned };
    }
  } else if (cleaned.startsWith('966')) {
    const withoutCountryCode = cleaned.substring(3);
    if (withoutCountryCode.length === 9 && withoutCountryCode.startsWith('5')) {
      return { isValid: true, normalized: `+${cleaned}` };
    }
  } else if (cleaned.startsWith('05')) {
    if (cleaned.length === 10) {
      return { isValid: true, normalized: `+966${cleaned.substring(1)}` };
    }
  } else if (cleaned.startsWith('5')) {
    if (cleaned.length === 9) {
      return { isValid: true, normalized: `+966${cleaned}` };
    }
  }
  
  return { 
    isValid: false, 
    error: 'Invalid Saudi phone number format' 
  };
};

// Function to play notification sound
const playBookingNotification = () => {
  try {
    const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBDmE2/LLeSdBHHXJ8d6QRAM3Ubrt9mwdBjaJ2e/QfiQFHWy98/D/fSQCMVa48u1xHQU5cNftmDQIInLK7O6FNgcVXKnq9eeVTQRSpeTx3qBQ++KS7sHtgDHdSaHq8qpT+Oz+vPK5ek7Z+J/O3nAq2kOV6u6rQek6sN/5wHYtytlPqezxr2YaAzap0erBhzfdVJPr3qJb+u3GqP3ykk7VarH26YBB6TCL6duhWPN4iL/y+3Qo0TN7qODwsGf8YZfh3JJu8Tn+qfK4dEfXRZPj46pa7yJ/otnt06Ve8SqF5dKhafJlh7vy8HUiziNj2dT35Y1P7zSh4eqdYfZBe+Xdm1XuJYng5L9ZwPJRnN3fmLqfYfJNceDevkBBLXPgzu9U8k7I5sLqZy7kOYfn0J1r5DOs5uGLaMhJ3U+T3s2GHCNMf7b+VZfQ6FjQ6+7JnUXOAGfNvPb/oVXYz5/N6Gvb1Uq+2emLe+A/gu/g47tb1V2s2+WKc+BVjt3gmnPgUojf4pvs5UmB2da3j2LeSazP6ezGpkvaQJLg19uj5yiS3+aR+tNLg9/VjJnjUMH+nEfMFG7Ux4VBdqyJ3O2T+d1J3tOK0fRjVGNhYTfhxI5ZPwqJ59+IeOKV2Ow3J8zFJy7Z1UGf+HBvfKVhPT+J3PWA7tJR2MuD8/E4Ks7K6W1gdPFBeeXekWjhP4rnJ/EcP+nVu5vw3p5K5PahtpxW7TBn0+mQquD/pO/D8R0oNa7Q8L5p8s2J3u2G4eBB1NGDytJEb+81d8Lwrm7c0b3R7Z=");
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio notification failed:', e));
  } catch (error) {
    console.log('Audio notification not supported');
  }
};

export default function AdminVetsVanRequests() {
  const [, setLocation] = useLocation();
  const { language, t } = useTranslation();
  const { toast } = useToast();
  
  // State for tracking notifications and audio - matches other admin pages
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastRequestCountRef = useRef(0);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(false);
  const [isAdministrationExpanded, setIsAdministrationExpanded] = useState(true);

  // VetsVan Requests specific state - extracted from admin dashboard
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [requestFilterDateFrom, setRequestFilterDateFrom] = useState<Date | undefined>(undefined);
  const [requestFilterDateTo, setRequestFilterDateTo] = useState<Date | undefined>(undefined);
  const [selectedVetsVanIds, setSelectedVetsVanIds] = useState<number[]>([]);
  const [requestCurrentPage, setRequestCurrentPage] = useState(1);
  const [requestItemsPerPage, setRequestItemsPerPage] = useState(10);

  // SMS Communication state
  const [smsPhoneNumber, setSmsPhoneNumber] = useState('');
  const [smsPhoneError, setSmsPhoneError] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Fetch all VetsVan requests
  const { data: allVetsVanRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['/api/admin/vetsvan-requests'],
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  // Fetch all drivers for filtering
  const { data: allDrivers } = useQuery({
    queryKey: ['/api/admin/drivers'],
  });

  // Get admin token
  const adminToken = localStorage.getItem("adminToken");

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

  // Request browser notification permission on component mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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

  // Handle SMS sending with phone number validation - exact copy from admin dashboard
  const handleSendSms = async () => {
    const validation = validatePhoneNumber(smsPhoneNumber);
    
    if (!validation.isValid) {
      setSmsPhoneError(validation.error || '');
      return;
    }
    
    setSmsPhoneError('');
    setIsSendingSms(true);
    
    try {
      await apiRequest("/api/admin/send-sms", {
        method: "POST",
        body: JSON.stringify({ 
          message: language === 'ar' 
            ? "رسالة تجريبية من خدمة Vets Van للطب البيطري المتنقل. تم إرسال هذه الرسالة للتأكد من عمل الخدمة بشكل صحيح."
            : "Test message from Vets Van mobile veterinary service. This message was sent to verify the service is working correctly.",
          phoneNumber: validation.normalized
        }),
      });
      
      toast({
        title: language === 'ar' ? 'تم إرسال الرسالة' : 'SMS Sent',
        description: language === 'ar' 
          ? `تم إرسال الرسالة النصية بنجاح إلى ${validation.normalized}` 
          : `SMS message sent successfully to ${validation.normalized}`,
      });
      
      // Clear the phone number after successful send
      setSmsPhoneNumber('');
      
    } catch (error) {
      toast({
        title: t('error'),
        description: language === 'ar' ? 'فشل في إرسال الرسالة النصية' : 'Failed to send SMS message',
        variant: "destructive",
      });
    } finally {
      setIsSendingSms(false);
    }
  };

  // Clear filters function
  const clearFilters = () => {
    setRequestSearchTerm('');
    setRequestFilterDateFrom(undefined);
    setRequestFilterDateTo(undefined);
    setSelectedVetsVanIds([]);
  };

  // Helper function to format status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to format status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return language === 'ar' ? 'قيد الانتظار' : 'Pending';
      case 'confirmed':
        return language === 'ar' ? 'مؤكد' : 'Confirmed';
      case 'in_progress':
        return language === 'ar' ? 'قيد التنفيذ' : 'In Progress';
      case 'completed':
        return language === 'ar' ? 'مكتمل' : 'Completed';
      case 'cancelled':
        return language === 'ar' ? 'ملغي' : 'Cancelled';
      default:
        return status;
    }
  };

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

                    {/* Clear Filters Button */}
                    {(requestSearchTerm || requestFilterDateFrom || requestFilterDateTo || selectedVetsVanIds.length > 0) && (
                      <div className="pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-8 px-2 lg:px-3"
                        >
                          <X className="h-4 w-4" />
                          <span className="ml-1 text-xs">
                            {language === 'ar' ? 'مسح جميع الفلاتر' : 'Clear All Filters'}
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Results Summary */}
                <div className="bg-gray-50 px-4 py-2 rounded-lg">
                  <p className="text-sm text-gray-600" style={{ textAlign: getTextAlign(language) }}>
                    {language === 'ar' 
                      ? `عرض ${vetsVanRequests.length} من أصل ${totalRequestsCount} طلب`
                      : `Showing ${vetsVanRequests.length} of ${totalRequestsCount} requests`
                    }
                  </p>
                </div>

                {/* Loading State */}
                {isLoadingRequests && (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                )}

                {/* Requests Cards */}
                {!isLoadingRequests && vetsVanRequests && vetsVanRequests.length > 0 ? (
                  <div className="space-y-4">
                    {vetsVanRequests.map((request) => (
                      <div key={request.id} className="bg-white border-l-4 border-purple-600 rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {request.customerName}
                                </h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                                  {getStatusText(request.status)}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-sm text-gray-600">
                                    <strong>{language === 'ar' ? 'الهاتف:' : 'Phone:'}</strong> {request.customerPhone}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <strong>{language === 'ar' ? 'الإيميل:' : 'Email:'}</strong> {request.customerEmail}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <strong>{language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> {format(new Date(request.appointmentDate), 'dd/MM/yyyy HH:mm')}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">
                                    <strong>{language === 'ar' ? 'المركبة:' : 'Vehicle:'}</strong> {request.vetsvanCode} - {request.vetsvanName}
                                  </p>
                                  {request.pets && request.pets.length > 0 && (
                                    <p className="text-sm text-gray-600">
                                      <strong>{language === 'ar' ? 'الحيوانات الأليفة:' : 'Pets:'}</strong> {request.pets.map(pet => `${pet.name} (${pet.type})`).join(', ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {request.specialRequests && (
                                <div className="mt-2 p-2 bg-gray-50 rounded">
                                  <p className="text-sm text-gray-700">
                                    <strong>{language === 'ar' ? 'طلبات خاصة:' : 'Special Requests:'}</strong> {request.specialRequests}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="ml-4 flex flex-col gap-2">
                              <select
                                value={request.status}
                                onChange={(e) => updateBookingStatusMutation.mutate({ 
                                  bookingId: request.id, 
                                  status: e.target.value 
                                })}
                                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                                disabled={updateBookingStatusMutation.isPending}
                              >
                                <option value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                                <option value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</option>
                                <option value="in_progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
                                <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                                <option value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !isLoadingRequests ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {language === 'ar' ? 'لا توجد طلبات' : 'No Requests'}
                    </h3>
                    <p className="text-gray-500">
                      {language === 'ar' ? 'لم يتم العثور على طلبات تطابق معايير البحث' : 'No requests found matching the search criteria'}
                    </p>
                  </div>
                ) : null}

                {/* Pagination - exact copy from admin dashboard */}
                {!isLoadingRequests && totalRequestPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
                    <div className="flex-1 flex justify-between sm:hidden">
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
                    
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-700">
                          {language === 'ar' 
                            ? `عرض ${requestStartIndex + 1} إلى ${Math.min(requestEndIndex, totalRequestsCount)} من أصل ${totalRequestsCount}`
                            : `Showing ${requestStartIndex + 1} to ${Math.min(requestEndIndex, totalRequestsCount)} of ${totalRequestsCount} results`
                          }
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                            {language === 'ar' ? 'عدد العناصر:' : 'Items per page:'}
                          </label>
                          <select
                            id="itemsPerPage"
                            value={requestItemsPerPage}
                            onChange={(e) => handleRequestItemsPerPageChange(Number(e.target.value))}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
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
                          <ChevronLeft className={`h-4 w-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                          <span className="ml-1">{language === 'ar' ? 'السابق' : 'Previous'}</span>
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalRequestPages) }, (_, i) => {
                              const page = i + Math.max(1, Math.min(requestCurrentPage - 2, totalRequestPages - 4));
                              if (page > totalRequestPages) return null;
                              
                              return (
                                <div key={page}>
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
                          <ChevronRight className={`h-4 w-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SMS Communication Section - exact copy from admin dashboard */}
                <div className="bg-white border rounded-lg p-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      {language === 'ar' ? 'إرسال الرسائل النصية' : 'SMS Communication'}
                    </h4>
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {language === 'ar' ? 'إرسال رسائل نصية للعملاء باستخدام منصة تقنيات' : 'Send SMS messages to customers using Taqnyat platform'}
                  </p>
                  
                  {/* Phone Number Input Field */}
                  <div className="mb-4">
                    <label 
                      htmlFor="sms-phone-number" 
                      className="block text-sm font-medium text-gray-700 mb-2"
                      style={{ textAlign: getTextAlign(language) }}
                    >
                      {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                    </label>
                    <input
                      id="sms-phone-number"
                      type="tel"
                      value={smsPhoneNumber}
                      onChange={(e) => {
                        setSmsPhoneNumber(e.target.value);
                        // Clear error when user starts typing
                        if (smsPhoneError) setSmsPhoneError('');
                      }}
                      placeholder={language === 'ar' ? '05xxxxxxxx أو +9665xxxxxxxx' : '05xxxxxxxx or +9665xxxxxxxx'}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 ${
                        smsPhoneError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{ textAlign: getTextAlign(language) }}
                      dir={getDirection(language)}
                      disabled={isSendingSms}
                    />
                    {smsPhoneError && (
                      <p className="text-red-500 text-xs mt-1" style={{ textAlign: getTextAlign(language) }}>
                        {smsPhoneError}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={handleSendSms}
                    disabled={isSendingSms || !smsPhoneNumber.trim()}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                      isSendingSms || !smsPhoneNumber.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {isSendingSms ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4 ml-2" />
                    )}
                    {isSendingSms 
                      ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                      : (language === 'ar' ? 'إرسال رسالة نصية' : 'Send SMS Message')
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}