import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Shield, LogOut, Car, Clock, Trash2, MapPin, BarChart3, MessageSquare, FileText, User, Users, Phone, Calendar, Mail, Volume2, VolumeX, Bell, Upload, Download, Edit, ChevronDown, ChevronUp, Search, Package, Stethoscope, X, TrendingUp, ChevronLeft, ChevronRight, Plus, AlertTriangle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { playBookingNotification, testAudioNotification, audioNotification } from "@/utils/audio";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";
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

export default function AdminVetsVanManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const t = useTranslation();
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'ar');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDriver, setNewDriver] = useState({
    vetsvanCode: '',
    vetsvanName: '',
    phone: '',
    username: '',
    password: ''
  });

  const [selectedDriverLocation, setSelectedDriverLocation] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([24.7136, 46.6753]);
  const [clickPosition, setClickPosition] = useState<[number, number] | null>(null);
  const [selectedRedZonesDriver, setSelectedRedZonesDriver] = useState<any>(null);
  const [redZones, setRedZones] = useState<any[]>([]);
  const [newRedZone, setNewRedZone] = useState<any>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isRedZonesModalOpen, setIsRedZonesModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          setLocation('/admin-login');
          return;
        }
        
        const data = await response.json();
        if (!data.user || data.user.role !== 'admin') {
          setLocation('/admin-login');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setLocation('/admin-login');
      }
    };

    checkAuth();
  }, [setLocation]);

  // Fetch drivers
  const { data: drivers, isLoading: isLoadingDrivers, refetch: refetchDrivers } = useQuery({
    queryKey: ['/api/admin/drivers'],
    staleTime: 30000,
  });

  // Add driver mutation
  const addDriverMutation = useMutation({
    mutationFn: async (driverData: any) => {
      return apiRequest('/api/admin/drivers', {
        method: 'POST',
        body: JSON.stringify(driverData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      toast({
        title: language === 'ar' ? "تم إضافة VetsVan بنجاح" : "VetsVan Added Successfully",
        description: language === 'ar' ? "تم إضافة VetsVan الجديد" : "New VetsVan has been added",
      });
      setShowAddForm(false);
      setNewDriver({ vetsvanCode: '', vetsvanName: '', phone: '', username: '', password: '' });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message || (language === 'ar' ? "فشل في إضافة VetsVan" : "Failed to add VetsVan"),
        variant: "destructive",
      });
    },
  });

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ driverId, isAvailable }: { driverId: number; isAvailable: boolean }) => {
      return apiRequest(`/api/admin/drivers/${driverId}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      toast({
        title: language === 'ar' ? "تم تحديث الحالة" : "Status Updated",
        description: language === 'ar' ? "تم تحديث حالة التوفر" : "Availability status updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message || (language === 'ar' ? "فشل في تحديث الحالة" : "Failed to update status"),
        variant: "destructive",
      });
    },
  });

  // Delete driver mutation
  const deleteDriverMutation = useMutation({
    mutationFn: async (driverId: number) => {
      return apiRequest(`/api/admin/drivers/${driverId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      toast({
        title: language === 'ar' ? "تم حذف VetsVan" : "VetsVan Deleted",
        description: language === 'ar' ? "تم حذف VetsVan بنجاح" : "VetsVan has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message || (language === 'ar' ? "فشل في حذف VetsVan" : "Failed to delete VetsVan"),
        variant: "destructive",
      });
    },
  });

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver.vetsvanCode || !newDriver.vetsvanName || !newDriver.phone || !newDriver.username || !newDriver.password) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "جميع الحقول مطلوبة" : "All fields are required",
        variant: "destructive",
      });
      return;
    }
    addDriverMutation.mutate(newDriver);
  };

  const handleLocationClick = (driver: any) => {
    setSelectedDriverLocation(driver);
    if (driver.lat && driver.lng) {
      setMapCenter([driver.lat, driver.lng]);
      setClickPosition([driver.lat, driver.lng]);
    } else {
      setMapCenter([24.7136, 46.6753]);
      setClickPosition(null);
    }
    setIsLocationModalOpen(true);
  };

  const handleRedZonesClick = (driver: any) => {
    setSelectedRedZonesDriver(driver);
    // Fetch red zones for this driver
    fetchRedZones(driver.id);
    setIsRedZonesModalOpen(true);
  };

  const handleEditClick = (driver: any) => {
    setEditingDriver({
      ...driver,
      vetsvanCode: (driver as any).vetsvanCode || driver.username,
      vetsvanName: (driver as any).vetsvanName || driver.name,
    });
    setIsEditModalOpen(true);
  };

  const fetchRedZones = async (driverId: number) => {
    try {
      const zones = await apiRequest(`/api/admin/drivers/${driverId}/red-zones`);
      setRedZones(zones || []);
    } catch (error) {
      console.error('Failed to fetch red zones:', error);
      setRedZones([]);
    }
  };

  const saveLocationMutation = useMutation({
    mutationFn: async ({ driverId, lat, lng }: { driverId: number; lat: number; lng: number }) => {
      return apiRequest(`/api/admin/drivers/${driverId}/location`, {
        method: 'PATCH',
        body: JSON.stringify({ lat, lng }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      toast({
        title: language === 'ar' ? "تم حفظ الموقع" : "Location Saved",
        description: language === 'ar' ? "تم تحديث موقع VetsVan" : "VetsVan location updated",
      });
      setIsLocationModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message || (language === 'ar' ? "فشل في حفظ الموقع" : "Failed to save location"),
        variant: "destructive",
      });
    },
  });

  const updateDriverMutation = useMutation({
    mutationFn: async (driverData: any) => {
      return apiRequest(`/api/admin/drivers/${driverData.id}`, {
        method: 'PUT',
        body: JSON.stringify(driverData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      toast({
        title: language === 'ar' ? "تم تحديث البيانات" : "Data Updated",
        description: language === 'ar' ? "تم تحديث بيانات VetsVan" : "VetsVan data updated",
      });
      setIsEditModalOpen(false);
      setEditingDriver(null);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message || (language === 'ar' ? "فشل في تحديث البيانات" : "Failed to update data"),
        variant: "destructive",
      });
    },
  });

  const handleSaveLocation = () => {
    if (selectedDriverLocation && clickPosition) {
      saveLocationMutation.mutate({
        driverId: selectedDriverLocation.id,
        lat: clickPosition[0],
        lng: clickPosition[1],
      });
    }
  };

  const handleSaveDriver = () => {
    if (editingDriver) {
      updateDriverMutation.mutate(editingDriver);
    }
  };

  if (isLoadingDrivers) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={getDirection(language)}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src={vetsVanLogo} alt="Vets Van Logo" className="h-12 w-12 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900" style={{ textAlign: getTextAlign(language) }}>
                  {language === 'ar' ? 'إدارة VETS VAN' : 'Vets Van Management'}
                </h1>
                <p className="text-sm text-gray-500">
                  {language === 'ar' ? 'إدارة سيارات العيادة المتنقلة' : 'Mobile Clinic Vehicle Management'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <button
                onClick={() => setLocation('/admin-login')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition"
              >
                <LogOut className="h-4 w-4 ml-1" />
                {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-3">
            <nav className="flex space-x-4" dir={getDirection(language)}>
              <button
                onClick={() => setLocation('/admin-dashboard')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                {language === 'ar' ? 'الرئيسية' : 'Dashboard'}
              </button>
              <button
                onClick={() => setLocation('/admin-vetsvan-requests')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                {language === 'ar' ? 'طلبات VETS VAN' : 'VetsVan Requests'}
              </button>
              <span className="bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium">
                {language === 'ar' ? 'إدارة VETS VAN' : 'Vets Van Management'}
              </span>
              <button
                onClick={() => setLocation('/vets-van-shifts')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                {language === 'ar' ? 'مناوبات VETS VAN' : 'Vets Van Shifts'}
              </button>
            </nav>
          </div>
        </div>

        {/* Add Driver Section */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{t('vetsVanManagement')}</h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-600"
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-#852085 focus:border-purple-600 sm:text-sm"
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-#852085 focus:border-purple-600 sm:text-sm"
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-#852085 focus:border-purple-600 sm:text-sm"
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-#852085 focus:border-purple-600 sm:text-sm"
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-#852085 focus:border-purple-600 sm:text-sm"
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
                      <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-600">
                          {driver.name?.charAt(0) || 'V'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{(driver as any).vetsvanName || driver.name}</div>
                      <div className="text-sm text-gray-500">{driver.phone}</div>
                      <div className="text-sm text-gray-500">@{(driver as any).vetsvanCode || driver.username}</div>
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
                      className="text-sm text-purple-600 hover:text-purple-600"
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
                    <button
                      onClick={() => handleRedZonesClick(driver)}
                      className="text-sm text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {language === 'ar' ? 'المناطق الحمراء' : 'Red Zones'}
                    </button>
                    <button
                      onClick={() => handleEditClick(driver)}
                      className="text-sm text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      {language === 'ar' ? 'تعديل' : 'Edit'}
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

      {/* Modals would be implemented here for location setting, red zones, and editing */}
      {/* These are complex modal components that would require additional imports and setup */}
    </div>
  );
}