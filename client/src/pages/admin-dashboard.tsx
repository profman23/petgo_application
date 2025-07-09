import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Shield, LogOut, Car, Clock, Trash2, MapPin, BarChart3, MessageSquare, FileText, User, Phone, Calendar, Mail, Volume2, VolumeX, Bell, Upload } from "lucide-react";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { playBookingNotification, testAudioNotification, audioNotification } from "@/utils/audio";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as UIBadge } from '@/components/ui/badge';

interface Driver {
  id: number;
  name: string;
  phone: string;
  username: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  createdAt: string;
  vetsvanCode: string;
  vetsvanName: string;
}

interface NewDriverData {
  vetsvanCode: string;
  vetsvanName: string;
  phone: string;
  username: string;
  password: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('management'); // 'management', 'shifts', 'reports', 'requests', or 'import'
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [newLocation, setNewLocation] = useState({ latitude: '', longitude: '' });
  const [showReviewsDialog, setShowReviewsDialog] = useState(false);
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newDriver, setNewDriver] = useState<NewDriverData>({
    vetsvanCode: "",
    vetsvanName: "",
    phone: "",
    username: "",
    password: "",
  });

  // State for tracking notifications and audio
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastRequestCountRef = useRef(0);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);

  // Template download function
  const downloadTemplate = async (type: 'products' | 'services') => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/download-template/${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_template.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: language === 'ar' ? 'تم التحميل' : 'Downloaded',
        description: language === 'ar' 
          ? `تم تحميل نموذج ${type === 'products' ? 'المنتجات' : 'الخدمات'} بنجاح` 
          : `${type === 'products' ? 'Products' : 'Services'} template downloaded successfully`,
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل النموذج' : 'Failed to download template',
        variant: 'destructive',
      });
    }
  };

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadingFile(true);

    try {
      // Read file content
      const text = await file.text();
      
      // Parse CSV data
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const item: any = {};
          
          headers.forEach((header, index) => {
            if (header === 'price') {
              item[header] = parseFloat(values[index]) || 0;
            } else {
              item[header] = values[index] || '';
            }
          });
          
          data.push(item);
        }
      }

      // Determine file type based on content or filename
      const fileName = file.name.toLowerCase();
      const type = fileName.includes('product') ? 'products' : 
                   fileName.includes('service') ? 'services' : 'products';

      // Send to server
      const token = localStorage.getItem("adminToken");
      const response = await fetch('/api/import-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          data,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to import data');
      }

      const result = await response.json();

      toast({
        title: language === 'ar' ? 'تم الاستيراد بنجاح' : 'Import Successful',
        description: language === 'ar' 
          ? `تم استيراد ${result.importedCount} عنصر من ${file.name}`
          : `Imported ${result.importedCount} items from ${file.name}`,
      });

      // Reset file input
      event.target.value = '';
      setSelectedFile(null);

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: language === 'ar' ? 'خطأ في الاستيراد' : 'Import Error',
        description: language === 'ar' ? 'فشل في استيراد البيانات' : 'Failed to import data',
        variant: 'destructive',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  // Check admin authentication and prevent doctors access
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const regularToken = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // إذا كان المستخدم طبيب، منعه من دخول admin dashboard
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

  const adminToken = localStorage.getItem("adminToken");
  const adminData = localStorage.getItem("admin");
  let admin = {};
  try {
    if (adminData && adminData !== "undefined" && adminData !== "null") {
      admin = JSON.parse(adminData);
    }
  } catch (error) {
    console.error('Error parsing admin data:', error);
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
  }

  // Fetch drivers
  const { data: drivers, isLoading } = useQuery({
    queryKey: ["/api/admin/drivers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/drivers", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch drivers");
      return await response.json() as Driver[];
    },
    enabled: !!adminToken,
  });

  // Fetch reports statistics
  const { data: reportsStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/admin/reports"],
    queryFn: async () => {
      const response = await fetch("/api/admin/reports", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch reports stats");
      return await response.json() as {
        totalBookings: number;
        completedBookings: number;
        averageRating: number;
        totalReviews: number;
        totalVetsVans: number;
        availableVetsVans: number;
      };
    },
    enabled: !!adminToken && activeTab === 'reports',
  });

  // Fetch detailed reviews when dialog is open
  const { data: detailedReviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["/api/admin/reviews-details"],
    queryFn: async () => {
      const response = await fetch("/api/admin/reviews-details", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch detailed reviews");
      return await response.json() as Array<{
        id: number;
        rating: number;
        comment: string;
        createdAt: string;
        userName: string;
        userPhone: string;
        vetsvanName: string;
        vetsvanCode: string;
      }>;
    },
    enabled: !!adminToken && showReviewsDialog,
  });

  // Fetch all VetsVan requests with real-time notifications
  const { data: vetsVanRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/admin/vetsvan-requests"],
    queryFn: async () => {
      const response = await fetch("/api/admin/vetsvan-requests", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch VetsVan requests");
      return await response.json() as Array<{
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
      }>;
    },
    enabled: !!adminToken,
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
    refetchIntervalInBackground: true,
  });

  // Monitor for new requests and trigger notifications
  useEffect(() => {
    if (vetsVanRequests && vetsVanRequests.length > 0) {
      const currentCount = vetsVanRequests.length;
      
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
  }, [vetsVanRequests, audioEnabled, language, toast]);

  // Request browser notification permission on component mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Add driver mutation
  const addDriverMutation = useMutation({
    mutationFn: async (data: NewDriverData) => {
      const response = await fetch("/api/admin/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add driver");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      setNewDriver({ vetsvanCode: "", vetsvanName: "", phone: "", username: "", password: "" });
      setShowAddForm(false);
      toast({
        title: t('vetsVanAddedSuccess'),
        description: t('vetsVanAddedDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToAddVetsVan'),
        variant: "destructive",
      });
    },
  });

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ driverId, isAvailable }: { driverId: number; isAvailable: boolean }) => {
      await apiRequest(`/api/admin/drivers/${driverId}/availability`, {
        method: "PUT",
        body: JSON.stringify({ isAvailable }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      toast({
        title: t('statusUpdated'),
        description: t('driverStatusChanged'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToUpdateStatus'),
        variant: "destructive",
      });
    },
  });

  // Delete driver mutation
  const deleteDriverMutation = useMutation({
    mutationFn: async (driverId: number) => {
      await apiRequest(`/api/admin/drivers/${driverId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      toast({
        title: t('vetsVanDeleted'),
        description: t('vetsVanDeletedDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToDeleteVetsVan'),
        variant: "destructive",
      });
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ driverId, latitude, longitude }: { driverId: number; latitude: number; longitude: number }) => {
      await apiRequest(`/api/admin/drivers/${driverId}/location`, {
        method: "PUT",
        body: JSON.stringify({ latitude, longitude }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      setShowLocationDialog(false);
      setSelectedDriver(null);
      setNewLocation({ latitude: '', longitude: '' });
      toast({
        title: language === 'ar' ? 'تم تحديث الموقع' : 'Location Updated',
        description: language === 'ar' ? 'تم تحديث موقع المركبة بنجاح' : 'VetsVan location updated successfully',
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: language === 'ar' ? 'فشل في تحديث الموقع' : 'Failed to update location',
        variant: "destructive",
      });
    },
  });

  // Send SMS mutation
  const sendSmsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/admin/send-sms", {
        method: "POST",
        body: JSON.stringify({ 
          message: "test sms from Taqnyat.sa , for testing internet sms service",
          phoneNumber: "966548336693" // Test number
        }),
      });
    },
    onSuccess: () => {
      setShowSmsDialog(false);
      toast({
        title: language === 'ar' ? 'تم إرسال الرسالة' : 'SMS Sent',
        description: language === 'ar' ? 'تم إرسال الرسالة النصية بنجاح للرقم 966548336693' : 'SMS message sent successfully to 966548336693',
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: language === 'ar' ? 'فشل في إرسال الرسالة النصية' : 'Failed to send SMS message',
        variant: "destructive",
      });
    },
  });

  // Update booking status mutation
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

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    setLocation("/admin-login");
  };

  const handleLocationClick = (driver: Driver) => {
    setSelectedDriver(driver);
    setNewLocation({
      latitude: driver.latitude.toString(),
      longitude: driver.longitude.toString()
    });
    setShowLocationDialog(true);
  };

  const handleLocationUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver || !newLocation.latitude || !newLocation.longitude) return;

    const latitude = parseFloat(newLocation.latitude);
    const longitude = parseFloat(newLocation.longitude);

    if (isNaN(latitude) || isNaN(longitude)) {
      toast({
        title: t('error'),
        description: language === 'ar' ? 'يرجى إدخال أرقام صحيحة للموقع' : 'Please enter valid location numbers',
        variant: "destructive",
      });
      return;
    }

    updateLocationMutation.mutate({
      driverId: selectedDriver.id,
      latitude,
      longitude
    });
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    sendSmsMutation.mutate();
  };

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver.vetsvanCode || !newDriver.vetsvanName || !newDriver.phone || !newDriver.username || !newDriver.password) {
      toast({
        title: t('error'),
        description: t('fillAllFields'),
        variant: "destructive",
      });
      return;
    }
    addDriverMutation.mutate(newDriver);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={getDirection(language)}>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className={`flex items-center ${language === 'ar' ? 'ml-auto' : 'mr-auto'}`}>
              <Shield className="h-8 w-8 text-purple-600 ml-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('adminDashboard')}</h1>
                <p className="text-sm text-gray-500">{t('welcome')} {admin.name}</p>
              </div>
            </div>
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
              {currentRequestCount > 0 && (
                <div className="relative">
                  <Bell className="h-6 w-6 text-purple-600" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {currentRequestCount > 99 ? '99+' : currentRequestCount}
                  </span>
                </div>
              )}
              
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

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="mt-5 px-2">
            <button
              onClick={() => setActiveTab('management')}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full ${
                activeTab === 'management'
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Car className="ml-3 h-6 w-6" />
              {language === 'ar' ? 'إدارة VETS VAN' : 'Vets Van Management'}
            </button>
            <button
              onClick={() => setLocation('/vets-van-shifts')}
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Clock className="ml-3 h-6 w-6" />
              {language === 'ar' ? 'مناوبات VETS VAN' : 'Vets Van Shifts'}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full mt-2 ${
                activeTab === 'reports'
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="ml-3 h-6 w-6" />
              {language === 'ar' ? 'التقارير' : 'Reports'}
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full mt-2 ${
                activeTab === 'requests'
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <FileText className="ml-3 h-6 w-6" />
              {language === 'ar' ? 'طلبات VETS VAN' : 'Vets Van Requests'}
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full mt-2 ${
                activeTab === 'import'
                  ? 'bg-purple-100 text-purple-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Upload className="ml-3 h-6 w-6" />
              {language === 'ar' ? 'استيراد البيانات' : 'Import'}
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {activeTab === 'management' && (
                <div>
                  {/* Add Driver Section */}
                  <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">{t('vetsVanManagement')}</h3>
                        <button
                          onClick={() => setShowAddForm(!showAddForm)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                        >
                          <UserPlus className="h-4 w-4 ml-2" />
                          {t('addNewVetsVan')}
                        </button>
                      </div>

                      {showAddForm && (
                        <form onSubmit={handleAddDriver} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">VetsVan Code</label>
                            <input
                              type="text"
                              value={newDriver.vetsvanCode}
                              onChange={(e) => setNewDriver({ ...newDriver, vetsvanCode: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              placeholder="V001"
                              style={{ textAlign: getTextAlign(language) }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">VetsVan Name</label>
                            <input
                              type="text"
                              value={newDriver.vetsvanName}
                              onChange={(e) => setNewDriver({ ...newDriver, vetsvanName: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              placeholder="VETS VAN 1"
                              style={{ textAlign: getTextAlign(language) }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('phoneNumber')}</label>
                            <input
                              type="tel"
                              value={newDriver.phone}
                              onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              placeholder="05xxxxxxxx"
                              style={{ textAlign: getTextAlign(language) }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('username')}</label>
                            <input
                              type="text"
                              value={newDriver.username}
                              onChange={(e) => setNewDriver({ ...newDriver, username: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              placeholder={t('username')}
                              style={{ textAlign: getTextAlign(language) }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('password')}</label>
                            <input
                              type="password"
                              value={newDriver.password}
                              onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              placeholder={t('password')}
                              style={{ textAlign: getTextAlign(language) }}
                            />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-5">
                            <button
                              type="submit"
                              disabled={addDriverMutation.isPending}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            >
                              {addDriverMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                              ) : (
                                t('addVetsVan')
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Drivers List */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">{t('currentVetsVans')}</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">{t('totalVetsVans')}: {drivers?.length || 0}</p>
                    </div>
                    <ul className="divide-y divide-gray-200">
                      {drivers?.map((driver) => (
                        <li key={driver.id} className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-purple-600">
                                    {driver.name?.charAt(0) || 'V'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                                <div className="text-sm text-gray-500">{driver.phone}</div>
                                <div className="text-sm text-gray-500">@{driver.username}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  driver.isAvailable
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {driver.isAvailable ? t('available') : t('notAvailable')}
                              </span>
                              <button
                                onClick={() =>
                                  toggleAvailabilityMutation.mutate({
                                    driverId: driver.id,
                                    isAvailable: !driver.isAvailable,
                                  })
                                }
                                className="text-sm text-purple-600 hover:text-purple-900"
                              >
                                {t('changeStatus')}
                              </button>
                              <button
                                onClick={() => handleLocationClick(driver)}
                                className="text-sm text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                              >
                                <MapPin className="w-3 h-3" />
                                {language === 'ar' ? 'تحديد الموقع' : 'Set Location'}
                              </button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button className="text-sm text-red-600 hover:text-red-900 inline-flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" />
                                    {t('delete')}
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('deleteVetsVanConfirm')} {(driver as any).vetsvanCode} - {(driver as any).vetsvanName}?
                                      <br />
                                      {t('deleteWarning')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteDriverMutation.mutate(driver.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {t('deleteConfirm')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div>
                  {/* Reports Section */}
                  <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                        {language === 'ar' ? 'التقارير والإحصائيات' : 'Reports & Analytics'}
                      </h3>
                      
                      {isLoadingStats ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                      ) : (
                        <>
                          {/* Stats Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-6 text-white">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium opacity-90">
                                    {language === 'ar' ? 'إجمالي VETS VAN' : 'Total Vets Vans'}
                                  </h4>
                                  <p className="text-2xl font-bold">{reportsStats?.totalVetsVans || 0}</p>
                                </div>
                                <Car className="h-8 w-8 opacity-80" />
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-6 text-white">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium opacity-90">
                                    {language === 'ar' ? 'VETS VAN متاحة' : 'Available Vets Vans'}
                                  </h4>
                                  <p className="text-2xl font-bold">{reportsStats?.availableVetsVans || 0}</p>
                                </div>
                                <Shield className="h-8 w-8 opacity-80" />
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg p-6 text-white">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium opacity-90">
                                    {language === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}
                                  </h4>
                                  <p className="text-2xl font-bold">{reportsStats?.totalBookings || 0}</p>
                                </div>
                                <Clock className="h-8 w-8 opacity-80" />
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg p-6 text-white">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium opacity-90">
                                    {language === 'ar' ? 'الحجوزات المكتملة' : 'Completed Bookings'}
                                  </h4>
                                  <p className="text-2xl font-bold">{reportsStats?.completedBookings || 0}</p>
                                </div>
                                <BarChart3 className="h-8 w-8 opacity-80" />
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-6 text-white">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium opacity-90">
                                    {language === 'ar' ? 'متوسط التقييم' : 'Average Rating'}
                                  </h4>
                                  <p className="text-2xl font-bold">{reportsStats?.averageRating || 0}</p>
                                </div>
                                <div className="text-yellow-200 text-2xl">★</div>
                              </div>
                            </div>

                            <div 
                              className="bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-lg p-6 text-white cursor-pointer hover:shadow-lg transition-shadow duration-200"
                              onClick={() => setShowReviewsDialog(true)}
                            >
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium opacity-90">
                                    {language === 'ar' ? 'إجمالي التقييمات' : 'Total Reviews'}
                                  </h4>
                                  <p className="text-2xl font-bold">{reportsStats?.totalReviews || 0}</p>
                                  <p className="text-xs opacity-75 mt-1">
                                    {language === 'ar' ? 'اضغط لرؤية التفاصيل' : 'Click to view details'}
                                  </p>
                                </div>
                                <div className="text-indigo-200 text-2xl">💬</div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* Performance Summary */}
                      {!isLoadingStats && reportsStats && (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">
                            {language === 'ar' ? 'ملخص الأداء' : 'Performance Summary'}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                {language === 'ar' ? 'معدل إتمام الحجوزات' : 'Booking Completion Rate'}
                              </h5>
                              <div className="bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-green-500 h-3 rounded-full" 
                                  style={{ 
                                    width: `${reportsStats.totalBookings > 0 ? (reportsStats.completedBookings / reportsStats.totalBookings) * 100 : 0}%` 
                                  }}
                                ></div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {reportsStats.totalBookings > 0 ? Math.round((reportsStats.completedBookings / reportsStats.totalBookings) * 100) : 0}%
                              </p>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                {language === 'ar' ? 'معدل توفر VETS VAN' : 'Vets Van Availability'}
                              </h5>
                              <div className="bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-blue-500 h-3 rounded-full" 
                                  style={{ 
                                    width: `${reportsStats.totalVetsVans > 0 ? (reportsStats.availableVetsVans / reportsStats.totalVetsVans) * 100 : 0}%` 
                                  }}
                                ></div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {reportsStats.totalVetsVans > 0 ? Math.round((reportsStats.availableVetsVans / reportsStats.totalVetsVans) * 100) : 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* SMS Communication Section */}
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
                        <button
                          onClick={() => setShowSmsDialog(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                        >
                          <MessageSquare className="h-4 w-4 ml-2" />
                          {language === 'ar' ? 'إرسال رسالة نصية' : 'Send SMS Message'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VetsVan Requests Tab - Cards Layout */}
              {activeTab === 'requests' && (
                <div className="space-y-6" dir={getDirection(language)}>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ textAlign: getTextAlign(language) }}>
                      {language === 'ar' ? 'جميع طلبات VETS VAN' : 'All VetsVan Requests'}
                    </h2>
                    <p className="text-gray-600" style={{ textAlign: getTextAlign(language) }}>
                      {language === 'ar' ? 'عرض جميع طلبات العملاء لكل سيارات VETS VAN' : 'View all customer requests for all VetsVan vehicles'}
                    </p>
                  </div>

                  {isLoadingRequests ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                      <span className="ml-2 text-purple-600">
                        {language === 'ar' ? 'جارٍ تحميل الطلبات...' : 'Loading requests...'}
                      </span>
                    </div>
                  ) : vetsVanRequests && vetsVanRequests.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {vetsVanRequests.map((request) => (
                        <Card key={request.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <User className="h-5 w-5 text-purple-600" />
                                  <span className="text-gray-900">{request.customerName}</span>
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                  <Phone className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{request.customerPhone}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Mail className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">{request.customerEmail}</span>
                                </div>
                              </div>
                              <UIBadge 
                                variant={
                                  request.status === 'confirmed' ? 'default' :
                                  request.status === 'pending_review' ? 'secondary' :
                                  request.status === 'cancelled' ? 'destructive' : 'outline'
                                }
                                className="text-xs"
                              >
                                {request.status === 'confirmed' && (language === 'ar' ? 'مؤكد' : 'Confirmed')}
                                {request.status === 'pending_review' && (language === 'ar' ? 'قيد المراجعة' : 'Pending Review')}
                                {request.status === 'cancelled' && (language === 'ar' ? 'ملغي' : 'Cancelled')}
                                {!['confirmed', 'pending_review', 'cancelled'].includes(request.status) && request.status}
                              </UIBadge>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-4">
                            {/* VetsVan Info */}
                            <div className="bg-purple-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                <span className="font-medium text-purple-900">
                                  {request.vetsvanCode}
                                </span>
                              </div>
                              <p className="text-sm text-purple-700">{request.vetsvanName}</p>
                            </div>

                            {/* Appointment Details */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">
                                  {language === 'ar' ? 'التاريخ:' : 'Date:'}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {new Date(request.appointmentDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">
                                  {language === 'ar' ? 'الوقت:' : 'Time:'}
                                </span>
                                <span className="text-sm text-gray-600">{request.appointmentTime}</span>
                              </div>
                            </div>

                            {/* Service Type */}
                            <div className="bg-blue-50 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <span className="text-sm font-medium text-blue-900">
                                  {language === 'ar' ? 'نوع الخدمة:' : 'Service Type:'}
                                </span>
                              </div>
                              <p className="text-sm text-blue-700 mt-1">
                                {request.serviceType === 'general_checkup' && (language === 'ar' ? 'كشف عام' : 'General Check Up')}
                                {request.serviceType === 'grooming' && (language === 'ar' ? 'تنظيف' : 'Grooming')}
                                {!['general_checkup', 'grooming'].includes(request.serviceType) && request.serviceType}
                              </p>
                            </div>

                            {/* Pets */}
                            {request.pets && request.pets.length > 0 && (
                              <div className="bg-green-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                  <span className="text-sm font-medium text-green-900">
                                    {language === 'ar' ? 'الحيوانات الأليفة:' : 'Pets:'}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {request.pets.map((pet, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-green-800">{pet.name}</span>
                                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                        {pet.type === 'cat' && (language === 'ar' ? 'قطة' : 'Cat')}
                                        {pet.type === 'dog' && (language === 'ar' ? 'كلب' : 'Dog')}
                                        {pet.type === 'bird' && (language === 'ar' ? 'طائر' : 'Bird')}
                                        {!['cat', 'dog', 'bird'].includes(pet.type) && pet.type}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Status Update */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-900">
                                  {language === 'ar' ? 'تحديث الحالة:' : 'Update Status:'}
                                </span>
                              </div>
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
                                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
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
                            <div className="border-t pt-3 mt-4">
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{language === 'ar' ? 'تاريخ الطلب:' : 'Created:'}</span>
                                <span>{new Date(request.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
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
                </div>
              )}

              {/* Import Tab */}
              {activeTab === 'import' && (
                <div>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6" style={{ textAlign: getTextAlign(language) }}>
                        {language === 'ar' ? 'استيراد المنتجات والخدمات' : 'Import Products & Services'}
                      </h3>
                      
                      {/* Upload Section */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' ? 'ارفع ملف البيانات' : 'Upload Data File'}
                        </p>
                        <p className="text-sm text-gray-500 mb-4" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' 
                            ? 'يمكنك رفع ملفات Excel أو CSV تحتوي على بيانات المنتجات والخدمات' 
                            : 'Upload Excel or CSV files containing products and services data'
                          }
                        </p>
                        
                        <div className="flex flex-col items-center gap-4">
                          <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                            id="import-file"
                            onChange={handleFileUpload}
                            disabled={uploadingFile}
                          />
                          <label
                            htmlFor="import-file"
                            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white cursor-pointer transition-colors ${
                              uploadingFile 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                          >
                            {uploadingFile ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                {language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
                              </>
                            ) : (
                              <>
                                <Upload className="h-5 w-5 mr-2" />
                                {language === 'ar' ? 'اختيار الملف' : 'Choose File'}
                              </>
                            )}
                          </label>
                          
                          {selectedFile && (
                            <div className="text-sm text-gray-600 mt-2" style={{ textAlign: getTextAlign(language) }}>
                              {language === 'ar' ? 'الملف المحدد: ' : 'Selected file: '}
                              <span className="font-medium">{selectedFile.name}</span>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500" style={{ textAlign: getTextAlign(language) }}>
                            {language === 'ar' 
                              ? 'الصيغ المدعومة: .xlsx, .xls, .csv - الحد الأقصى: 10 ميجابايت'
                              : 'Supported formats: .xlsx, .xls, .csv - Max size: 10MB'
                            }
                          </div>
                        </div>
                      </div>

                      {/* Template Download Section */}
                      <div className="mt-8">
                        <h4 className="text-md font-medium text-gray-900 mb-4" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' ? 'نماذج للتحميل' : 'Download Templates'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-2" style={{ textAlign: getTextAlign(language) }}>
                              {language === 'ar' ? 'نموذج المنتجات' : 'Products Template'}
                            </h5>
                            <p className="text-sm text-gray-600 mb-3" style={{ textAlign: getTextAlign(language) }}>
                              {language === 'ar' 
                                ? 'نموذج CSV يحتوي على الأعمدة المطلوبة لاستيراد المنتجات (الاسم، السعر، الفئة، الوصف)'
                                : 'CSV template with required columns for importing products (name, price, category, description)'
                              }
                            </p>
                            <button 
                              onClick={() => downloadTemplate('products')}
                              className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 hover:underline"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              {language === 'ar' ? 'تحميل نموذج المنتجات' : 'Download Products Template'}
                            </button>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-2" style={{ textAlign: getTextAlign(language) }}>
                              {language === 'ar' ? 'نموذج الخدمات' : 'Services Template'}
                            </h5>
                            <p className="text-sm text-gray-600 mb-3" style={{ textAlign: getTextAlign(language) }}>
                              {language === 'ar' 
                                ? 'نموذج CSV يحتوي على الأعمدة المطلوبة لاستيراد الخدمات (الاسم، السعر، الفئة، الوصف)'
                                : 'CSV template with required columns for importing services (name, price, category, description)'
                              }
                            </p>
                            <button 
                              onClick={() => downloadTemplate('services')}
                              className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 hover:underline"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              {language === 'ar' ? 'تحميل نموذج الخدمات' : 'Download Services Template'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Import Instructions */}
                      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <FileText className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-blue-800" style={{ textAlign: getTextAlign(language) }}>
                              {language === 'ar' ? 'تعليمات الاستيراد' : 'Import Instructions'}
                            </h4>
                            <div className="mt-2 text-sm text-blue-700" style={{ textAlign: getTextAlign(language) }}>
                              <ul className="list-disc list-inside space-y-1">
                                <li>
                                  {language === 'ar' 
                                    ? 'قم بتحميل النموذج المناسب (منتجات أو خدمات)'
                                    : 'Download the appropriate template (products or services)'
                                  }
                                </li>
                                <li>
                                  {language === 'ar' 
                                    ? 'املأ البيانات في الأعمدة المطلوبة: الاسم، السعر، الفئة، الوصف'
                                    : 'Fill in the required columns: name, price, category, description'
                                  }
                                </li>
                                <li>
                                  {language === 'ar' 
                                    ? 'احفظ الملف بصيغة CSV وارفعه هنا'
                                    : 'Save the file as CSV and upload it here'
                                  }
                                </li>
                                <li>
                                  {language === 'ar' 
                                    ? 'ستتم إضافة البيانات إلى قاعدة البيانات تلقائياً'
                                    : 'Data will be automatically added to the database'
                                  }
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Import History */}
                      <div className="mt-8">
                        <h4 className="text-md font-medium text-gray-900 mb-4" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' ? 'سجل عمليات الاستيراد' : 'Import History'}
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-6 text-center">
                          <p className="text-gray-500" style={{ textAlign: getTextAlign(language) }}>
                            {language === 'ar' 
                              ? 'لا توجد عمليات استيراد سابقة'
                              : 'No previous imports found'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Location Update Dialog */}
      {showLocationDialog && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir={getDirection(language)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {language === 'ar' ? 'تحديد موقع المركبة' : 'Set Vehicle Location'}
              </h3>
              <button
                onClick={() => setShowLocationDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {language === 'ar' ? 'المركبة: ' : 'Vehicle: '} 
                {selectedDriver.vetsvanCode} - {selectedDriver.vetsvanName}
              </p>
            </div>

            <form onSubmit={handleLocationUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'خط العرض (Latitude)' : 'Latitude'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={newLocation.latitude}
                  onChange={(e) => setNewLocation({ ...newLocation, latitude: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="24.7136"
                  required
                  style={{ textAlign: getTextAlign(language) }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'خط الطول (Longitude)' : 'Longitude'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={newLocation.longitude}
                  onChange={(e) => setNewLocation({ ...newLocation, longitude: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="46.6753"
                  required
                  style={{ textAlign: getTextAlign(language) }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLocationDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={updateLocationMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateLocationMutation.isPending 
                    ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...')
                    : (language === 'ar' ? 'تحديث الموقع' : 'Update Location')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews Details Dialog */}
      {showReviewsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir={getDirection(language)}>
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {language === 'ar' ? 'تفاصيل التقييمات حسب المركبات' : 'Reviews Details by Vehicle'}
              </h3>
              <button
                onClick={() => setShowReviewsDialog(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingReviews ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : detailedReviews && detailedReviews.length > 0 ? (
                <div className="space-y-6">
                  {/* Group reviews by VetsVan */}
                  {Object.entries(
                    detailedReviews.reduce((groups, review) => {
                      const key = `${review.vetsvanCode} - ${review.vetsvanName}`;
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(review);
                      return groups;
                    }, {} as Record<string, typeof detailedReviews>)
                  ).map(([vetsvanInfo, reviews]) => (
                    <div key={vetsvanInfo} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-purple-900">
                          {vetsvanInfo}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {language === 'ar' ? 'عدد التقييمات:' : 'Reviews:'} {reviews.length}
                          </span>
                          <span className="text-sm text-gray-600">|</span>
                          <span className="text-sm text-gray-600">
                            {language === 'ar' ? 'المتوسط:' : 'Average:'} 
                            <span className="font-bold text-yellow-600 ml-1">
                              {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} ★
                            </span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {reviews.map((review) => (
                          <div key={review.id} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {review.userName}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  {review.userPhone}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={`text-lg ${
                                        i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(review.createdAt).toLocaleDateString(
                                    language === 'ar' ? 'ar-SA' : 'en-US'
                                  )}
                                </p>
                              </div>
                            </div>
                            
                            {review.comment && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-700" style={{ textAlign: getTextAlign(language) }}>
                                  "{review.comment}"
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {language === 'ar' ? 'لا توجد تقييمات' : 'No Reviews Yet'}
                  </h3>
                  <p className="text-gray-600">
                    {language === 'ar' 
                      ? 'سيتم عرض التقييمات هنا عندما يقوم العملاء بتقييم الخدمة'
                      : 'Customer reviews will appear here once services are rated'
                    }
                  </p>
                </div>
              )}
            </div>
            
            <div className="border-t p-4">
              <button
                onClick={() => setShowReviewsDialog(false)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Dialog */}
      {showSmsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir={getDirection(language)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {language === 'ar' ? 'إرسال رسالة نصية' : 'Send SMS Message'}
              </h3>
              <button
                onClick={() => setShowSmsDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {language === 'ar' ? 'رقم الهاتف: ' : 'Phone Number: '} 
                <span className="font-medium">966548336693</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar' ? 'رقم تجريبي لاختبار النظام' : 'Test number for system testing'}
              </p>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                {language === 'ar' ? 'نص الرسالة التجريبية:' : 'Test Message Text:'}
              </h4>
              <p className="text-sm text-gray-700 font-mono">
                test sms from Taqnyat.sa , for testing internet sms service
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {language === 'ar' ? 'رسالة ثابتة للاختبار - لا يمكن تعديلها' : 'Fixed test message - cannot be edited'}
              </p>
            </div>

            <form onSubmit={handleSendSms} className="space-y-4">

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSmsDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={sendSmsMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendSmsMutation.isPending 
                    ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                    : (language === 'ar' ? 'إرسال الرسالة' : 'Send Message')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}