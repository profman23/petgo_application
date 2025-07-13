import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, Car, Calendar, Bell, Settings, Plus, Edit, Trash, MapPin, Send, Volume2, VolumeX, MessageSquare, TrendingUp, BarChart3, FileText } from 'lucide-react';
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';
import { useToast } from '@/hooks/use-toast';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";

interface VetsVanRequest {
  id: number;
  customerName: string;
  customerPhone: string;
  vetsvanCode: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  selectedPets: any[];
  serviceType: string;
}

interface Driver {
  id: number;
  vetsvanCode: string;
  name: string;
  phone: string;
  model: string;
  color: string;
  plateNumber: string;
  isAvailable: boolean;
  latitude?: number;
  longitude?: number;
}

interface Shift {
  id: number;
  vetsvanId: number;
  date: string;
  timeSlots: string[];
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const t = useTranslation();
  const dir = getDirection(language);
  const textAlign = getTextAlign(language);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [isEditDriverOpen, setIsEditDriverOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [selectedDriverForLocation, setSelectedDriverForLocation] = useState<Driver | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const lastRequestCountRef = useRef(0);

  // Check if admin is authenticated
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    navigate('/admin-login');
    return null;
  }

  // Fetch VetsVan requests with notifications
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['/api/admin/vetsvan-requests'],
    queryFn: async () => {
      const response = await fetch('/api/admin/vetsvan-requests', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin-login');
          return [];
        }
        throw new Error('Failed to fetch requests');
      }
      
      return response.json();
    },
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Fetch drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['/api/admin/drivers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/drivers', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }
      
      return response.json();
    },
  });

  // Notification system for new requests
  useEffect(() => {
    if (requests.length > lastRequestCountRef.current && lastRequestCountRef.current > 0) {
      const newRequestsCount = requests.length - lastRequestCountRef.current;
      setNotificationCount(prev => prev + newRequestsCount);
      
      // Show toast notification
      toast({
        title: language === 'ar' ? 'طلب جديد!' : 'New Request!',
        description: language === 'ar' 
          ? `تم استلام ${newRequestsCount} طلب جديد` 
          : `${newRequestsCount} new request(s) received`,
        duration: 5000,
      });

      // Play audio notification if enabled
      if (isAudioEnabled) {
        try {
          const audio = new Audio('/رسائل-الايفون_1751699547648.mp3');
          audio.play().catch(console.error);
        } catch (error) {
          console.error('Audio notification failed:', error);
        }
      }
    }
    lastRequestCountRef.current = requests.length;
  }, [requests.length, language, toast, isAudioEnabled]);

  // Mutations
  const addDriverMutation = useMutation({
    mutationFn: async (driverData: Omit<Driver, 'id'>) => {
      return apiRequest('/api/admin/drivers', {
        method: 'POST',
        body: driverData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      setIsAddDriverOpen(false);
      toast({
        title: language === 'ar' ? 'تم إضافة السائق' : 'Driver Added',
        description: language === 'ar' ? 'تم إضافة السائق بنجاح' : 'Driver added successfully'
      });
    }
  });

  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, ...driverData }: Driver) => {
      return apiRequest(`/api/admin/drivers/${id}`, {
        method: 'PUT',
        body: driverData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      setIsEditDriverOpen(false);
      setEditingDriver(null);
      toast({
        title: language === 'ar' ? 'تم تحديث السائق' : 'Driver Updated',
        description: language === 'ar' ? 'تم تحديث بيانات السائق بنجاح' : 'Driver updated successfully'
      });
    }
  });

  const deleteDriverMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/drivers/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      toast({
        title: language === 'ar' ? 'تم حذف السائق' : 'Driver Deleted',
        description: language === 'ar' ? 'تم حذف السائق بنجاح' : 'Driver deleted successfully'
      });
    }
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, latitude, longitude }: { id: number; latitude: number; longitude: number }) => {
      return apiRequest(`/api/admin/drivers/${id}/location`, {
        method: 'PUT',
        body: { latitude, longitude }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      setIsLocationDialogOpen(false);
      setSelectedDriverForLocation(null);
      toast({
        title: language === 'ar' ? 'تم تحديث الموقع' : 'Location Updated',
        description: language === 'ar' ? 'تم تحديث موقع VetsVan بنجاح' : 'VetsVan location updated successfully'
      });
    }
  });

  const sendSMSMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/send-sms', {
        method: 'POST',
        body: {
          to: '966548336693',
          message: 'test sms from Taqnyat.sa , for testing internet sms service'
        }
      });
    },
    onSuccess: (data) => {
      toast({
        title: language === 'ar' ? 'تم إرسال الرسالة' : 'SMS Sent',
        description: language === 'ar' 
          ? `تم إرسال الرسالة بنجاح - ID: ${data.messageId}` 
          : `SMS sent successfully - ID: ${data.messageId}`
      });
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? 'خطأ في الإرسال' : 'Send Error',
        description: language === 'ar' ? 'فشل في إرسال الرسالة' : 'Failed to send SMS',
        variant: 'destructive'
      });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin-login');
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setIsEditDriverOpen(true);
  };

  const handleSetLocation = (driver: Driver) => {
    setSelectedDriverForLocation(driver);
    setIsLocationDialogOpen(true);
  };

  const testAudio = () => {
    try {
      const audio = new Audio('/رسائل-الايفون_1751699547648.mp3');
      audio.play().catch(console.error);
      toast({
        title: language === 'ar' ? 'اختبار الصوت' : 'Audio Test',
        description: language === 'ar' ? 'تم تشغيل صوت الاختبار' : 'Test audio played'
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ في الصوت' : 'Audio Error',
        description: language === 'ar' ? 'فشل في تشغيل الصوت' : 'Failed to play audio',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: language === 'ar' ? 'في الانتظار' : 'Pending',
      confirmed: language === 'ar' ? 'مؤكد' : 'Confirmed',
      cancelled: language === 'ar' ? 'ملغي' : 'Cancelled',
      completed: language === 'ar' ? 'مكتمل' : 'Completed'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50" dir={dir}>
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6 rtl:space-x-reverse">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl border-2 border-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <img
                    src={logoImage}
                    alt="VETS VAN Logo"
                    className="w-12 h-12 object-contain"
                  />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent" style={{ textAlign }}>
                    {language === 'ar' ? 'لوحة التحكم الإدارية' : 'Administrative Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'إدارة VetsVan والطلبات' : 'VetsVan & Request Management'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {/* Audio Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`${isAudioEnabled ? 'text-green-600 bg-green-50' : 'text-gray-400'} hover:bg-green-100 transition-colors`}
              >
                {isAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
              
              {/* Test Audio Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={testAudio}
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                {language === 'ar' ? 'اختبار الصوت' : 'Test Audio'}
              </Button>
              
              {/* Notification Bell */}
              <div className="relative">
                <div className="p-2 rounded-full bg-purple-50 border border-purple-200">
                  <Bell className="h-5 w-5 text-purple-600" />
                  {notificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
                      {notificationCount}
                    </Badge>
                  )}
                </div>
              </div>
              
              <LanguageSelector />
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-red-600 border-red-300 hover:bg-red-50 shadow-md"
              >
                <ArrowLeft className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2" />
                {language === 'ar' ? 'تسجيل خروج' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-14 bg-white shadow-lg rounded-xl border border-purple-100">
            <TabsTrigger 
              value="requests" 
              className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs font-medium">
                {language === 'ar' ? 'طلبات VetsVan' : 'VetsVan Requests'}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="drivers" 
              className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <Car className="h-5 w-5" />
              <span className="text-xs font-medium">
                {language === 'ar' ? 'إدارة VetsVan' : 'VetsVan Management'}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="statistics" 
              className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs font-medium">
                {language === 'ar' ? 'الإحصائيات' : 'Statistics'}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs font-medium">
                {language === 'ar' ? 'التقارير' : 'Reports'}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs font-medium">
                {language === 'ar' ? 'الإعدادات' : 'Settings'}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6 mt-8">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center justify-between" style={{ textAlign }}>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-6 w-6" />
                    <span className="text-xl font-bold">
                      {language === 'ar' ? 'طلبات العملاء' : 'Customer Requests'}
                    </span>
                  </div>
                  <Badge className="bg-white text-purple-600 px-4 py-2 text-lg font-bold">
                    {requests.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">
                      {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                    </p>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-xl text-gray-500">
                      {language === 'ar' ? 'لا توجد طلبات' : 'No requests found'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-purple-50">
                          <TableHead className="font-bold text-purple-800">
                            {language === 'ar' ? 'العميل' : 'Customer'}
                          </TableHead>
                          <TableHead className="font-bold text-purple-800">
                            {language === 'ar' ? 'الهاتف' : 'Phone'}
                          </TableHead>
                          <TableHead className="font-bold text-purple-800">
                            {language === 'ar' ? 'VetsVan' : 'VetsVan'}
                          </TableHead>
                          <TableHead className="font-bold text-purple-800">
                            {language === 'ar' ? 'التاريخ' : 'Date'}
                          </TableHead>
                          <TableHead className="font-bold text-purple-800">
                            {language === 'ar' ? 'الوقت' : 'Time'}
                          </TableHead>
                          <TableHead className="font-bold text-purple-800">
                            {language === 'ar' ? 'الخدمة' : 'Service'}
                          </TableHead>
                          <TableHead className="font-bold text-purple-800">
                            {language === 'ar' ? 'الحالة' : 'Status'}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((request: VetsVanRequest, index: number) => (
                          <TableRow 
                            key={request.id} 
                            className={`hover:bg-purple-25 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                          >
                            <TableCell className="font-semibold text-gray-900">
                              {request.customerName}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {request.customerPhone}
                            </TableCell>
                            <TableCell className="font-medium text-purple-700">
                              {request.vetsvanCode}
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {request.appointmentDate}
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {request.appointmentTime}
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {request.serviceType}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(request.status)} font-medium px-3 py-1`}>
                                {getStatusText(request.status)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-6 mt-8">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3" style={{ textAlign }}>
                    <Car className="h-6 w-6" />
                    <span className="text-xl font-bold">
                      {language === 'ar' ? 'إدارة VetsVan' : 'VetsVan Management'}
                    </span>
                  </CardTitle>
                  <Dialog open={isAddDriverOpen} onOpenChange={setIsAddDriverOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-2 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
                        <Plus className="h-5 w-5 mr-2" />
                        {language === 'ar' ? 'إضافة VetsVan' : 'Add VetsVan'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-blue-600">
                          {language === 'ar' ? 'إضافة VetsVan جديد' : 'Add New VetsVan'}
                        </DialogTitle>
                      </DialogHeader>
                      <AddDriverForm onSubmit={addDriverMutation.mutate} language={language} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6">
                  {drivers.map((driver: Driver) => (
                    <div key={driver.id} className="bg-gradient-to-r from-white to-blue-50 border-2 border-blue-100 rounded-xl p-6 flex items-center justify-between hover:shadow-lg transition-all duration-300 hover:border-blue-200">
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <Car className="h-5 w-5 text-blue-600" />
                          {driver.vetsvanCode} - {driver.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {driver.phone}
                          </span>
                          <span className="text-gray-400">|</span>
                          <span>{driver.model} - {driver.color}</span>
                          <span className="text-gray-400">|</span>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {driver.plateNumber}
                          </span>
                        </div>
                        <Badge 
                          variant={driver.isAvailable ? 'default' : 'secondary'}
                          className={`${driver.isAvailable ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-600'} px-3 py-1 text-sm font-medium`}
                        >
                          {driver.isAvailable 
                            ? (language === 'ar' ? '✓ متاح' : '✓ Available')
                            : (language === 'ar' ? '✕ غير متاح' : '✕ Unavailable')
                          }
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetLocation(driver)}
                          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 p-3 rounded-lg"
                          title={language === 'ar' ? 'تحديد الموقع' : 'Set Location'}
                        >
                          <MapPin className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDriver(driver)}
                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 p-3 rounded-lg"
                          title={language === 'ar' ? 'تعديل' : 'Edit'}
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDriverMutation.mutate(driver.id)}
                          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 p-3 rounded-lg"
                          title={language === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {drivers.length === 0 && (
                    <div className="text-center py-12">
                      <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-xl text-gray-500">
                        {language === 'ar' ? 'لا توجد مركبات VetsVan' : 'No VetsVan vehicles found'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-xl border-0 transform hover:scale-105 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    {language === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}
                  </CardTitle>
                  <Calendar className="h-8 w-8 opacity-75" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2">{requests.length}</div>
                  <p className="text-xs opacity-75">
                    {language === 'ar' ? 'جميع الطلبات المسجلة' : 'All registered requests'}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white shadow-xl border-0 transform hover:scale-105 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    {language === 'ar' ? 'الطلبات المؤكدة' : 'Confirmed Requests'}
                  </CardTitle>
                  <TrendingUp className="h-8 w-8 opacity-75" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2">
                    {requests.filter((r: VetsVanRequest) => r.status === 'confirmed').length}
                  </div>
                  <p className="text-xs opacity-75">
                    {language === 'ar' ? 'طلبات تم تأكيدها' : 'Successfully confirmed'}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl border-0 transform hover:scale-105 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    {language === 'ar' ? 'الطلبات المعلقة' : 'Pending Requests'}
                  </CardTitle>
                  <Bell className="h-8 w-8 opacity-75" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2">
                    {requests.filter((r: VetsVanRequest) => r.status === 'pending').length}
                  </div>
                  <p className="text-xs opacity-75">
                    {language === 'ar' ? 'في انتظار المعالجة' : 'Awaiting processing'}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl border-0 transform hover:scale-105 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">
                    {language === 'ar' ? 'إجمالي VetsVan' : 'Total VetsVan'}
                  </CardTitle>
                  <Car className="h-8 w-8 opacity-75" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2">{drivers.length}</div>
                  <p className="text-xs opacity-75">
                    {language === 'ar' ? 'مركبات متاحة' : 'Available vehicles'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6" />
                    {language === 'ar' ? 'أداء الطلبات' : 'Request Performance'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        {language === 'ar' ? 'معدل النجاح' : 'Success Rate'}
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {requests.length > 0 
                          ? Math.round((requests.filter(r => r.status === 'confirmed').length / requests.length) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000"
                        style={{ 
                          width: requests.length > 0 
                            ? `${(requests.filter(r => r.status === 'confirmed').length / requests.length) * 100}%`
                            : '0%'
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-3">
                    <Users className="h-6 w-6" />
                    {language === 'ar' ? 'نشاط اليوم' : 'Today\'s Activity'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {requests.filter(r => {
                        const today = new Date().toISOString().split('T')[0];
                        return r.appointmentDate === today;
                      }).length}
                    </div>
                    <p className="text-gray-600">
                      {language === 'ar' ? 'طلبات اليوم' : 'Requests Today'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6 mt-8">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3" style={{ textAlign }}>
                  <FileText className="h-6 w-6" />
                  <span className="text-xl font-bold">
                    {language === 'ar' ? 'التقارير والإشعارات' : 'Reports & Notifications'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* SMS Test Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      {language === 'ar' ? 'اختبار الرسائل القصيرة' : 'SMS Testing'}
                    </h3>
                    <Button 
                      onClick={() => sendSMSMutation.mutate()}
                      disabled={sendSMSMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 px-8 py-3 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl flex items-center gap-3"
                    >
                      <Send className="h-5 w-5" />
                      {sendSMSMutation.isPending 
                        ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                        : (language === 'ar' ? 'إرسال رسالة تجريبية' : 'Send Test SMS')
                      }
                    </Button>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-300 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold text-purple-800 flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {language === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-purple-700">{requests.length}</div>
                        <p className="text-sm text-purple-600 mt-1">
                          {language === 'ar' ? 'جميع الطلبات' : 'All requests'}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
                          <Car className="h-5 w-5" />
                          {language === 'ar' ? 'إجمالي VetsVan' : 'Total VetsVan'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-blue-700">{drivers.length}</div>
                        <p className="text-sm text-blue-600 mt-1">
                          {language === 'ar' ? 'مركبات مسجلة' : 'Registered vehicles'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 shadow-lg">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold text-green-800 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          {language === 'ar' ? 'معدل النجاح' : 'Success Rate'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-green-700">
                          {requests.length > 0 
                            ? Math.round((requests.filter(r => r.status === 'confirmed').length / requests.length) * 100)
                            : 0
                          }%
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          {language === 'ar' ? 'طلبات مؤكدة' : 'Confirmed requests'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-8">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3" style={{ textAlign }}>
                  <Settings className="h-6 w-6" />
                  <span className="text-xl font-bold">
                    {language === 'ar' ? 'إعدادات النظام' : 'System Settings'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Audio Settings */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-green-800 mb-2">
                          {language === 'ar' ? 'إعدادات الصوت' : 'Audio Settings'}
                        </h3>
                        <p className="text-sm text-green-600">
                          {language === 'ar' 
                            ? 'تفعيل التنبيهات الصوتية عند وصول طلبات جديدة'
                            : 'Enable audio alerts when new requests arrive'
                          }
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                        className={`${isAudioEnabled ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-500'} px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-lg`}
                      >
                        {isAudioEnabled ? (
                          <>
                            <Volume2 className="h-5 w-5 mr-2" />
                            {language === 'ar' ? 'مفعل' : 'Enabled'}
                          </>
                        ) : (
                          <>
                            <VolumeX className="h-5 w-5 mr-2" />
                            {language === 'ar' ? 'معطل' : 'Disabled'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Notification Settings */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      {language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-700 font-medium">
                          {language === 'ar' ? 'عدد الإشعارات الحالية' : 'Current Notifications'}
                        </span>
                        <Badge className="bg-blue-600 text-white px-3 py-1 text-lg">
                          {notificationCount}
                        </Badge>
                      </div>
                      <div className="text-sm text-blue-600">
                        {language === 'ar' 
                          ? 'سيتم إرسال إشعار صوتي ومرئي عند وصول طلب جديد من العملاء'
                          : 'Audio and visual notifications will be sent when new customer requests arrive'
                        }
                      </div>
                    </div>
                  </div>

                  {/* System Information */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      {language === 'ar' ? 'معلومات النظام' : 'System Information'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-purple-700">
                          {language === 'ar' ? 'اللغة النشطة:' : 'Active Language:'}
                        </span>
                        <p className="text-purple-600">
                          {language === 'ar' ? 'العربية' : 'English'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-purple-700">
                          {language === 'ar' ? 'حالة التحديث:' : 'Update Status:'}
                        </span>
                        <p className="text-purple-600">
                          {language === 'ar' ? 'تحديث تلقائي كل 3 ثواني' : 'Auto-refresh every 3 seconds'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Location Dialog */}
        <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'تحديد موقع VetsVan' : 'Set VetsVan Location'}
              </DialogTitle>
            </DialogHeader>
            {selectedDriverForLocation && (
              <LocationForm 
                driver={selectedDriverForLocation}
                onSubmit={updateLocationMutation.mutate}
                language={language}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Driver Dialog */}
        <Dialog open={isEditDriverOpen} onOpenChange={setIsEditDriverOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'تعديل بيانات VetsVan' : 'Edit VetsVan Details'}
              </DialogTitle>
            </DialogHeader>
            {editingDriver && (
              <EditDriverForm 
                driver={editingDriver}
                onSubmit={updateDriverMutation.mutate}
                language={language}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Component for adding new driver
function AddDriverForm({ onSubmit, language }: { onSubmit: (data: Omit<Driver, 'id'>) => void; language: string }) {
  const [formData, setFormData] = useState({
    vetsvanCode: '',
    name: '',
    phone: '',
    model: '',
    color: '',
    plateNumber: '',
    isAvailable: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{language === 'ar' ? 'كود VetsVan' : 'VetsVan Code'}</Label>
        <Input
          value={formData.vetsvanCode}
          onChange={(e) => setFormData({...formData, vetsvanCode: e.target.value})}
          required
        />
      </div>
      <div>
        <Label>{language === 'ar' ? 'اسم السائق' : 'Driver Name'}</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      <div>
        <Label>{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          required
        />
      </div>
      <div>
        <Label>{language === 'ar' ? 'موديل السيارة' : 'Vehicle Model'}</Label>
        <Input
          value={formData.model}
          onChange={(e) => setFormData({...formData, model: e.target.value})}
          required
        />
      </div>
      <div>
        <Label>{language === 'ar' ? 'لون السيارة' : 'Vehicle Color'}</Label>
        <Input
          value={formData.color}
          onChange={(e) => setFormData({...formData, color: e.target.value})}
          required
        />
      </div>
      <div>
        <Label>{language === 'ar' ? 'رقم اللوحة' : 'Plate Number'}</Label>
        <Input
          value={formData.plateNumber}
          onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        {language === 'ar' ? 'إضافة' : 'Add'}
      </Button>
    </form>
  );
}

// Component for editing driver
function EditDriverForm({ driver, onSubmit, language }: { driver: Driver; onSubmit: (data: Driver) => void; language: string }) {
  const [formData, setFormData] = useState(driver);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{language === 'ar' ? 'كود VetsVan' : 'VetsVan Code'}</Label>
        <Input
          value={formData.vetsvanCode}
          onChange={(e) => setFormData({...formData, vetsvanCode: e.target.value})}
          required
        />
      </div>
      <div>
        <Label>{language === 'ar' ? 'اسم السائق' : 'Driver Name'}</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      <div>
        <Label>{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          required
        />
      </div>
      <div>
        <Label>{language === 'ar' ? 'موديل السيارة' : 'Vehicle Model'}</Label>
        <Input
          value={formData.model}
          onChange={(e) => setFormData({...formData, model: e.target.value})}
          required
        />
      </div>
      <div>
        <Label>{language === 'ar' ? 'لون السيارة' : 'Vehicle Color'}</Label>
        <Input
          value={formData.color}
          onChange={(e) => setFormData({...formData, color: e.target.value})}
          required
        />
      </div>
      <div>
        <Label>{language === 'ar' ? 'رقم اللوحة' : 'Plate Number'}</Label>
        <Input
          value={formData.plateNumber}
          onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
          required
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.isAvailable}
          onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
        />
        <Label>{language === 'ar' ? 'متاح' : 'Available'}</Label>
      </div>
      <Button type="submit" className="w-full">
        {language === 'ar' ? 'تحديث' : 'Update'}
      </Button>
    </form>
  );
}

// Component for setting location
function LocationForm({ driver, onSubmit, language }: { driver: Driver; onSubmit: (data: { id: number; latitude: number; longitude: number }) => void; language: string }) {
  const [latitude, setLatitude] = useState(driver.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(driver.longitude?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: driver.id,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{language === 'ar' ? 'خط العرض (Latitude)' : 'Latitude'}</Label>
        <Input
          type="number"
          step="any"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="24.7136"
          required
        />
      </div>
      <div>
        <Label>{language === 'ar' ? 'خط الطول (Longitude)' : 'Longitude'}</Label>
        <Input
          type="number"
          step="any"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="46.6753"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        {language === 'ar' ? 'تحديث الموقع' : 'Update Location'}
      </Button>
    </form>
  );
}