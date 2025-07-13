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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, Car, Calendar, Bell, Settings, Plus, Edit, Trash, MapPin, Send, Volume2, VolumeX } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50" dir={dir}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin-login')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2" />
                {language === 'ar' ? 'رجوع' : 'Back'}
              </Button>
              
              <div className="w-12 h-12 bg-white rounded-lg border-2 border-purple-600 shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300">
                <img
                  src={logoImage}
                  alt="VETS VAN Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>
              
              <h1 className="text-xl font-bold text-gray-900" style={{ textAlign }}>
                {language === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {/* Audio Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`${isAudioEnabled ? 'text-green-600' : 'text-gray-400'}`}
              >
                {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              
              {/* Test Audio Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={testAudio}
              >
                {language === 'ar' ? 'اختبار الصوت' : 'Test Audio'}
              </Button>
              
              {/* Notification Bell */}
              <div className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {notificationCount}
                  </Badge>
                )}
              </div>
              
              <LanguageSelector />
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {language === 'ar' ? 'تسجيل خروج' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {language === 'ar' ? 'طلبات VetsVan' : 'VetsVan Requests'}
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              {language === 'ar' ? 'إدارة VetsVan' : 'VetsVan Management'}
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {language === 'ar' ? 'الإحصائيات' : 'Statistics'}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {language === 'ar' ? 'التقارير' : 'Reports'}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {language === 'ar' ? 'الإعدادات' : 'Settings'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ textAlign }}>
                  <Bell className="h-5 w-5" />
                  {language === 'ar' ? 'طلبات العملاء' : 'Customer Requests'}
                  <Badge variant="secondary" className="ml-auto rtl:ml-0 rtl:mr-auto">
                    {requests.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {language === 'ar' ? 'لا توجد طلبات' : 'No requests found'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request: VetsVanRequest) => (
                      <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg" style={{ textAlign }}>
                              {request.customerName}
                            </h3>
                            <p className="text-gray-600" style={{ textAlign }}>
                              {request.customerPhone}
                            </p>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusText(request.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">
                              {language === 'ar' ? 'VetsVan:' : 'VetsVan:'}
                            </span>
                            <p>{request.vetsvanCode}</p>
                          </div>
                          <div>
                            <span className="font-medium">
                              {language === 'ar' ? 'التاريخ:' : 'Date:'}
                            </span>
                            <p>{request.appointmentDate}</p>
                          </div>
                          <div>
                            <span className="font-medium">
                              {language === 'ar' ? 'الوقت:' : 'Time:'}
                            </span>
                            <p>{request.appointmentTime}</p>
                          </div>
                          <div>
                            <span className="font-medium">
                              {language === 'ar' ? 'الخدمة:' : 'Service:'}
                            </span>
                            <p>{request.serviceType}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle style={{ textAlign }}>
                    {language === 'ar' ? 'إدارة VetsVan' : 'VetsVan Management'}
                  </CardTitle>
                  <Dialog open={isAddDriverOpen} onOpenChange={setIsAddDriverOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {language === 'ar' ? 'إضافة VetsVan' : 'Add VetsVan'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {language === 'ar' ? 'إضافة VetsVan جديد' : 'Add New VetsVan'}
                        </DialogTitle>
                      </DialogHeader>
                      <AddDriverForm onSubmit={addDriverMutation.mutate} language={language} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {drivers.map((driver: Driver) => (
                    <div key={driver.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{driver.vetsvanCode} - {driver.name}</h3>
                        <p className="text-sm text-gray-600">{driver.phone}</p>
                        <p className="text-sm text-gray-500">
                          {driver.model} - {driver.color} - {driver.plateNumber}
                        </p>
                        <Badge variant={driver.isAvailable ? 'default' : 'secondary'}>
                          {driver.isAvailable 
                            ? (language === 'ar' ? 'متاح' : 'Available')
                            : (language === 'ar' ? 'غير متاح' : 'Unavailable')
                          }
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetLocation(driver)}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDriver(driver)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDriverMutation.mutate(driver.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{requests.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'ar' ? 'الطلبات المؤكدة' : 'Confirmed Requests'}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {requests.filter((r: VetsVanRequest) => r.status === 'confirmed').length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'ar' ? 'الطلبات المعلقة' : 'Pending Requests'}
                  </CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {requests.filter((r: VetsVanRequest) => r.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle style={{ textAlign }}>
                  {language === 'ar' ? 'التقارير والإشعارات' : 'Reports & Notifications'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={() => sendSMSMutation.mutate()}
                    disabled={sendSMSMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sendSMSMutation.isPending 
                      ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                      : (language === 'ar' ? 'إرسال رسالة تجريبية' : 'Send Test SMS')
                    }
                  </Button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {language === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{requests.length}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {language === 'ar' ? 'إجمالي VetsVan' : 'Total VetsVan'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{drivers.length}</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle style={{ textAlign }}>
                  {language === 'ar' ? 'إعدادات النظام' : 'System Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>{language === 'ar' ? 'تفعيل الإشعارات الصوتية' : 'Enable Audio Notifications'}</span>
                    <Button
                      variant="outline"
                      onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                      className={isAudioEnabled ? 'bg-green-50 text-green-600' : ''}
                    >
                      {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">
                      {language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' 
                        ? 'سيتم إرسال إشعار صوتي عند وصول طلب جديد'
                        : 'Audio notification will play when new requests arrive'
                      }
                    </p>
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