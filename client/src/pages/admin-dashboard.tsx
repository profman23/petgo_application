import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, Car, Calendar, Bell, Settings, Plus, Edit, Trash, MapPin, Send, Volume2, VolumeX, MessageSquare, TrendingUp, BarChart3, FileText, Globe, LogOut, Menu } from 'lucide-react';
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
  const [activeSection, setActiveSection] = useState('vetsvan-management');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Forms state
  const [newDriver, setNewDriver] = useState({
    vetsvanCode: '',
    name: '',
    phone: '',
    model: '',
    color: '',
    plateNumber: ''
  });
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [locationDialog, setLocationDialog] = useState<Driver | null>(null);

  // Notification system
  const requestCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/audio/notification.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin-login');
  };

  // Data fetching
  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/admin/vetsvan-requests'],
    refetchInterval: 3000,
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['/api/admin/drivers'],
    refetchInterval: 5000,
  });

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['/api/admin/shifts'],
    refetchInterval: 10000,
  });

  // Notification effect
  useEffect(() => {
    if (!requestsLoading && requests.length > 0) {
      const currentCount = requests.length;
      if (requestCountRef.current > 0 && currentCount > requestCountRef.current) {
        setNotificationCount(prev => prev + 1);
        if (isAudioEnabled && audioRef.current) {
          audioRef.current.play().catch(console.error);
        }
        toast({
          title: language === 'ar' ? 'طلب جديد!' : 'New Request!',
          description: language === 'ar' ? 'تم استلام طلب حجز جديد' : 'New booking request received',
        });
      }
      requestCountRef.current = currentCount;
    }
  }, [requests, requestsLoading, isAudioEnabled, language, toast]);

  // Mutations
  const addDriverMutation = useMutation({
    mutationFn: async (driver: any) => {
      return await apiRequest('/api/admin/drivers', {
        method: 'POST',
        body: JSON.stringify(driver),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      setNewDriver({ vetsvanCode: '', name: '', phone: '', model: '', color: '', plateNumber: '' });
      toast({
        title: language === 'ar' ? 'تم الإضافة' : 'Added Successfully',
        description: language === 'ar' ? 'تم إضافة VetsVan جديد بنجاح' : 'New VetsVan added successfully',
      });
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/drivers/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted Successfully',
        description: language === 'ar' ? 'تم حذف VetsVan بنجاح' : 'VetsVan deleted successfully',
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, latitude, longitude }: { id: number; latitude: number; longitude: number }) => {
      return await apiRequest(`/api/admin/drivers/${id}/location`, {
        method: 'PUT',
        body: JSON.stringify({ latitude, longitude }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      setLocationDialog(null);
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated Successfully',
        description: language === 'ar' ? 'تم تحديث الموقع بنجاح' : 'Location updated successfully',
      });
    },
  });

  const sendSMSMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/send-sms', {
        method: 'POST',
        body: JSON.stringify({
          message: "test sms from Taqnyat.sa , for testing internet sms service",
          phoneNumber: "966548336693"
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم الإرسال' : 'SMS Sent',
        description: language === 'ar' ? 'تم إرسال الرسالة بنجاح' : 'Test SMS sent successfully',
      });
    },
  });

  // Sidebar navigation items
  const sidebarItems = [
    {
      id: 'vetsvan-management',
      label: language === 'ar' ? 'إدارة VetsVan' : 'VetsVan Management',
      icon: Car,
    },
    {
      id: 'vetsvan-shifts',
      label: language === 'ar' ? 'مناوبات VetsVan' : 'VetsVan Shifts',
      icon: Calendar,
    },
    {
      id: 'reports',
      label: language === 'ar' ? 'التقارير' : 'Reports',
      icon: FileText,
    },
    {
      id: 'vetsvan-requests',
      label: language === 'ar' ? 'طلبات VetsVan' : 'VetsVan Requests',
      icon: MessageSquare,
    },
    {
      id: 'statistics',
      label: language === 'ar' ? 'الإحصائيات' : 'Statistics',
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: language === 'ar' ? 'الإعدادات' : 'Settings',
      icon: Settings,
    },
  ];

  // Render sidebar
  const renderSidebar = () => (
    <div className={`fixed inset-y-0 ${language === 'ar' ? 'right-0' : 'left-0'} z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : language === 'ar' ? 'translate-x-full' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-purple-600 to-purple-800">
          <img src={logoImage} alt="VetsVan Logo" className="h-10 w-10 rounded-lg" />
          <span className="ml-3 text-white font-bold text-lg">VetsVan Admin</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-purple-100 text-purple-700 border-r-2 border-purple-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                style={{ textAlign: 'start' }}
              >
                <Icon className={`${language === 'ar' ? 'ml-3' : 'mr-3'} h-5 w-5`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {language === 'ar' ? 'المدير' : 'Admin'}
              </p>
              <p className="text-xs text-gray-500">admin@vetsvan.com</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render main content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'vetsvan-management':
        return renderVetsVanManagement();
      case 'vetsvan-shifts':
        return renderVetsVanShifts();
      case 'reports':
        return renderReports();
      case 'vetsvan-requests':
        return renderVetsVanRequests();
      case 'statistics':
        return renderStatistics();
      case 'settings':
        return renderSettings();
      default:
        return renderVetsVanManagement();
    }
  };

  // VetsVan Management content
  const renderVetsVanManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {language === 'ar' ? 'إدارة VetsVan' : 'VetsVan Management'}
        </h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'إضافة VetsVan' : 'Add VetsVan'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إضافة VetsVan جديد' : 'Add New VetsVan'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'رمز VetsVan' : 'VetsVan Code'}</Label>
                <Input
                  value={newDriver.vetsvanCode}
                  onChange={(e) => setNewDriver({ ...newDriver, vetsvanCode: e.target.value })}
                  placeholder="V001"
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                <Input
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  placeholder={language === 'ar' ? 'اسم السائق' : 'Driver Name'}
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                <Input
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'الموديل' : 'Model'}</Label>
                <Input
                  value={newDriver.model}
                  onChange={(e) => setNewDriver({ ...newDriver, model: e.target.value })}
                  placeholder="Mercedes Sprinter"
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'اللون' : 'Color'}</Label>
                <Input
                  value={newDriver.color}
                  onChange={(e) => setNewDriver({ ...newDriver, color: e.target.value })}
                  placeholder={language === 'ar' ? 'أبيض' : 'White'}
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'رقم اللوحة' : 'Plate Number'}</Label>
                <Input
                  value={newDriver.plateNumber}
                  onChange={(e) => setNewDriver({ ...newDriver, plateNumber: e.target.value })}
                  placeholder="ABC-1234"
                />
              </div>
              <Button
                onClick={() => addDriverMutation.mutate(newDriver)}
                disabled={addDriverMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {addDriverMutation.isPending
                  ? (language === 'ar' ? 'جاري الإضافة...' : 'Adding...')
                  : (language === 'ar' ? 'إضافة' : 'Add')
                }
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'قائمة VetsVan' : 'VetsVan List'}</CardTitle>
        </CardHeader>
        <CardContent>
          {driversLoading ? (
            <div className="text-center py-4">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers.map((driver: Driver) => (
                <Card key={driver.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={driver.isAvailable ? "default" : "secondary"}>
                        {driver.vetsvanCode}
                      </Badge>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setLocationDialog(driver)}>
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{language === 'ar' ? 'تحديد الموقع' : 'Set Location'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>{language === 'ar' ? 'خط العرض' : 'Latitude'}</Label>
                                <Input
                                  type="number"
                                  step="any"
                                  defaultValue={driver.latitude || ''}
                                  id="latitude"
                                />
                              </div>
                              <div>
                                <Label>{language === 'ar' ? 'خط الطول' : 'Longitude'}</Label>
                                <Input
                                  type="number"
                                  step="any"
                                  defaultValue={driver.longitude || ''}
                                  id="longitude"
                                />
                              </div>
                              <Button
                                onClick={() => {
                                  const lat = parseFloat((document.getElementById('latitude') as HTMLInputElement).value);
                                  const lng = parseFloat((document.getElementById('longitude') as HTMLInputElement).value);
                                  updateLocationMutation.mutate({ id: driver.id, latitude: lat, longitude: lng });
                                }}
                                className="w-full"
                              >
                                {language === 'ar' ? 'حفظ الموقع' : 'Save Location'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDriverMutation.mutate(driver.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg">{driver.name}</h3>
                    <p className="text-sm text-gray-600">{driver.phone}</p>
                    <p className="text-sm text-gray-600">{driver.model} - {driver.color}</p>
                    <p className="text-sm text-gray-600">{driver.plateNumber}</p>
                    {driver.latitude && driver.longitude && (
                      <p className="text-xs text-gray-500 mt-2">
                        {language === 'ar' ? 'الموقع:' : 'Location:'} {driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // VetsVan Shifts content
  const renderVetsVanShifts = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {language === 'ar' ? 'مناوبات VetsVan' : 'VetsVan Shifts'}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'جدول المناوبات' : 'Shifts Schedule'}</CardTitle>
        </CardHeader>
        <CardContent>
          {shiftsLoading ? (
            <div className="text-center py-4">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'VetsVan' : 'VetsVan'}</TableHead>
                  <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الأوقات المتاحة' : 'Available Times'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift: Shift) => {
                  const driver = drivers.find((d: Driver) => d.id === shift.vetsvanId);
                  return (
                    <TableRow key={shift.id}>
                      <TableCell>{driver?.vetsvanCode || 'N/A'}</TableCell>
                      <TableCell>{shift.date}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {shift.timeSlots.map((time, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {time}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Reports content
  const renderReports = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {language === 'ar' ? 'التقارير' : 'Reports'}
      </h1>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-purple-100 to-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-purple-800 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
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
        
        <Card className="bg-gradient-to-br from-blue-100 to-blue-200">
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

        <Card className="bg-gradient-to-br from-green-100 to-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-green-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {language === 'ar' ? 'معدل النجاح' : 'Success Rate'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-700">
              {requests.length > 0 
                ? Math.round((requests.filter((r: VetsVanRequest) => r.status === 'confirmed').length / requests.length) * 100)
                : 0
              }%
            </div>
            <p className="text-sm text-green-600 mt-1">
              {language === 'ar' ? 'طلبات مؤكدة' : 'Confirmed requests'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SMS Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {language === 'ar' ? 'اختبار الرسائل القصيرة' : 'SMS Testing'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => sendSMSMutation.mutate()}
            disabled={sendSMSMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {sendSMSMutation.isPending 
              ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
              : (language === 'ar' ? 'إرسال رسالة تجريبية' : 'Send Test SMS')
            }
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Statistics content
  const renderStatistics = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {language === 'ar' ? 'الإحصائيات' : 'Statistics'}
      </h1>
      
      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {language === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{requests.length}</div>
            <p className="text-sm text-purple-100 mt-1">
              {language === 'ar' ? 'جميع الطلبات' : 'All requests'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Car className="h-5 w-5" />
              {language === 'ar' ? 'إجمالي VetsVan' : 'Total VetsVans'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{drivers.length}</div>
            <p className="text-sm text-blue-100 mt-1">
              {language === 'ar' ? 'مركبات مسجلة' : 'Registered vehicles'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {language === 'ar' ? 'معدل النجاح' : 'Success Rate'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {requests.length > 0 
                ? Math.round((requests.filter((r: VetsVanRequest) => r.status === 'confirmed').length / requests.length) * 100)
                : 0
              }%
            </div>
            <p className="text-sm text-green-100 mt-1">
              {language === 'ar' ? 'طلبات مؤكدة' : 'Confirmed requests'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-700 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5" />
              {language === 'ar' ? 'VetsVan متاحة' : 'Available VetsVans'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {drivers.filter((d: Driver) => d.isAvailable).length}
            </div>
            <p className="text-sm text-orange-100 mt-1">
              {language === 'ar' ? 'جاهزة للخدمة' : 'Ready for service'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'توزيع حالة الطلبات' : 'Request Status Distribution'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['confirmed', 'pending', 'cancelled'].map((status) => {
                const count = requests.filter((r: VetsVanRequest) => r.status === status).length;
                const percentage = requests.length > 0 ? (count / requests.length) * 100 : 0;
                const statusLabel = status === 'confirmed' ? 
                  (language === 'ar' ? 'مؤكد' : 'Confirmed') :
                  status === 'pending' ? 
                  (language === 'ar' ? 'قيد الانتظار' : 'Pending') :
                  (language === 'ar' ? 'ملغي' : 'Cancelled');
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{statusLabel}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            status === 'confirmed' ? 'bg-green-600' :
                            status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'أداء VetsVan' : 'VetsVan Performance'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {drivers.map((driver: Driver) => {
                const driverRequests = requests.filter((r: VetsVanRequest) => r.vetsvanCode === driver.vetsvanCode);
                return (
                  <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{driver.vetsvanCode}</span>
                      <p className="text-sm text-gray-600">{driver.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-purple-600">{driverRequests.length}</span>
                      <p className="text-xs text-gray-500">
                        {language === 'ar' ? 'طلب' : 'requests'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Settings content
  const renderSettings = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {language === 'ar' ? 'الإعدادات' : 'Settings'}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audio Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              {language === 'ar' ? 'إعدادات الصوت' : 'Audio Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>{language === 'ar' ? 'تفعيل الإشعارات الصوتية' : 'Enable Audio Notifications'}</span>
              <Button
                variant={isAudioEnabled ? "default" : "outline"}
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={isAudioEnabled ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.play().catch(console.error);
                }
              }}
              className="w-full"
            >
              {language === 'ar' ? 'اختبار الصوت' : 'Test Audio'}
            </Button>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {language === 'ar' ? 'معلومات النظام' : 'System Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {language === 'ar' ? 'إجمالي الطلبات:' : 'Total Requests:'}
                </span>
                <span className="font-medium">{requests.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {language === 'ar' ? 'إجمالي VetsVan:' : 'Total VetsVans:'}
                </span>
                <span className="font-medium">{drivers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {language === 'ar' ? 'الإشعارات المرسلة:' : 'Notifications Sent:'}
                </span>
                <span className="font-medium">{notificationCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {language === 'ar' ? 'اللغة الحالية:' : 'Current Language:'}
                </span>
                <span className="font-medium">
                  {language === 'ar' ? 'العربية' : 'English'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {language === 'ar' ? 'إدارة البيانات' : 'Data Management'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              {language === 'ar' 
                ? 'إدارة البيانات والنسخ الاحتياطية للنظام'
                : 'Manage system data and backups'
              }
            </p>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" className="w-full">
                {language === 'ar' ? 'تصدير البيانات' : 'Export Data'}
              </Button>
              <Button variant="outline" className="w-full">
                {language === 'ar' ? 'نسخة احتياطية' : 'Create Backup'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => sendSMSMutation.mutate()}
              disabled={sendSMSMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendSMSMutation.isPending 
                ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                : (language === 'ar' ? 'إرسال رسالة تجريبية' : 'Send Test SMS')
              }
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries();
                toast({
                  title: language === 'ar' ? 'تم التحديث' : 'Refreshed',
                  description: language === 'ar' ? 'تم تحديث جميع البيانات' : 'All data refreshed',
                });
              }}
              className="w-full"
            >
              {language === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // VetsVan Requests content
  const renderVetsVanRequests = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {language === 'ar' ? 'طلبات VetsVan' : 'VetsVan Requests'}
        </h1>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={isAudioEnabled ? 'bg-green-50 text-green-600' : ''}
          >
            {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Badge className="bg-blue-600 text-white">
            {notificationCount}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'قائمة الطلبات' : 'Requests List'}</CardTitle>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="text-center py-4">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'العميل' : 'Customer'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الهاتف' : 'Phone'}</TableHead>
                  <TableHead>{language === 'ar' ? 'VetsVan' : 'VetsVan'}</TableHead>
                  <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الوقت' : 'Time'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الخدمة' : 'Service'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request: VetsVanRequest) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.customerName}</TableCell>
                    <TableCell>{request.customerPhone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.vetsvanCode}</Badge>
                    </TableCell>
                    <TableCell>{request.appointmentDate}</TableCell>
                    <TableCell>{request.appointmentTime}</TableCell>
                    <TableCell>
                      <Badge variant={
                        request.status === 'confirmed' ? 'default' :
                        request.status === 'pending' ? 'secondary' :
                        request.status === 'cancelled' ? 'destructive' : 'outline'
                      }>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.serviceType}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" style={{ direction: dir }}>
      {/* Sidebar */}
      {renderSidebar()}

      {/* Main content */}
      <div className={`flex-1 ${language === 'ar' ? 'lg:mr-64' : 'lg:ml-64'}`}>
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <Button variant="ghost" size="sm" onClick={() => navigate('/user-type-selection')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'رجوع' : 'Back'}
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}