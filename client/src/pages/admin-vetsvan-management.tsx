import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Shield, LogOut, Car, Clock, Trash2, MapPin, BarChart3, MessageSquare, FileText, User, Users, Phone, Calendar, Mail, Volume2, VolumeX, Bell, Upload, Download, Edit, ChevronDown, ChevronUp, Search, Package, Stethoscope, X, TrendingUp, ChevronLeft, ChevronRight, Plus, AlertTriangle, Save } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { MapContainer, TileLayer, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { playBookingNotification, testAudioNotification, audioNotification } from "@/utils/audio";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Types
interface Driver {
  id: number;
  name: string;
  phone: string;
  username: string;
  isAvailable: boolean;
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

// Map Click Handler Component for Red Zones
const MapClickHandler = ({ zones, setZones }: { zones: any[], setZones: (zones: any[]) => void }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const zoneName = `Zone ${zones.length + 1}`;
      const newZone = {
        lat,
        lng,
        radius: 1000, // 1km radius
        name: zoneName
      };
      setZones([...zones, newZone]);
    },
  });
  return null;
};

export default function AdminVetsVanManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(false);
  const [isAdministrationExpanded, setIsAdministrationExpanded] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [newLocation, setNewLocation] = useState({ latitude: '', longitude: '' });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editDriverData, setEditDriverData] = useState<{vetsvanCode: string, vetsvanName: string, username: string, phone: string, plateNumber: string}>({
    vetsvanCode: "",
    vetsvanName: "",
    username: "",
    phone: "",
    plateNumber: ""
  });
  
  // Red Zones state
  const [showRedZonesDialog, setShowRedZonesDialog] = useState(false);
  const [selectedVetsVanForZones, setSelectedVetsVanForZones] = useState<Driver | null>(null);
  const [redZones, setRedZones] = useState<{id?: number, lat: number, lng: number, radius: number, name?: string}[]>([]);
  const [isSavingZones, setIsSavingZones] = useState(false);
  const [newDriver, setNewDriver] = useState<NewDriverData>({
    vetsvanCode: "",
    vetsvanName: "",
    phone: "",
    username: "",
    password: ""
  });

  // Get admin token for authenticated requests
  const adminToken = localStorage.getItem('adminToken');

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setLocation('/admin-login');
  };

  // Fetch drivers
  const { data: drivers, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ['/api/admin/drivers'],
    enabled: !!adminToken,
  });

  // Add driver mutation
  const addDriverMutation = useMutation({
    mutationFn: async (driverData: NewDriverData) => {
      return apiRequest('/api/admin/drivers', {
        method: 'POST',
        body: JSON.stringify(driverData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      setNewDriver({
        vetsvanCode: "",
        vetsvanName: "",
        phone: "",
        username: "",
        password: ""
      });
      setShowAddForm(false);
      toast({
        title: language === 'ar' ? "تم إضافة المركبة بنجاح" : "Vehicle added successfully",
        description: language === 'ar' ? "تم إضافة مركبة VETS VAN جديدة" : "New VETS VAN vehicle has been added",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? "خطأ في الإضافة" : "Addition Error",
        description: error.message || (language === 'ar' ? "فشل في إضافة المركبة" : "Failed to add vehicle"),
        variant: "destructive",
      });
    },
  });

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ driverId, isAvailable }: { driverId: number; isAvailable: boolean }) => {
      return apiRequest(`/api/admin/drivers/${driverId}/availability`, {
        method: 'PUT',
        body: JSON.stringify({ isAvailable }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      toast({
        title: language === 'ar' ? "تم تحديث الحالة" : "Status Updated",
        description: language === 'ar' ? "تم تحديث حالة المركبة بنجاح" : "Vehicle status updated successfully",
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
        title: language === 'ar' ? "تم حذف المركبة" : "Vehicle Deleted",
        description: language === 'ar' ? "تم حذف مركبة VETS VAN بنجاح" : "VETS VAN vehicle deleted successfully",
      });
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async (locationData: { driverId: number; latitude: string; longitude: string }) => {
      return apiRequest(`/api/admin/drivers/${locationData.driverId}/location`, {
        method: 'PUT',
        body: JSON.stringify({ 
          latitude: parseFloat(locationData.latitude), 
          longitude: parseFloat(locationData.longitude) 
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      setShowLocationDialog(false);
      setSelectedDriver(null);
      setNewLocation({ latitude: '', longitude: '' });
      toast({
        title: language === 'ar' ? "تم تحديث الموقع" : "Location Updated",
        description: language === 'ar' ? "تم تحديث موقع المركبة بنجاح" : "Vehicle location updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? "خطأ في التحديث" : "Update Error",
        description: error.message || (language === 'ar' ? "فشل في تحديث الموقع" : "Failed to update location"),
        variant: "destructive",
      });
    },
  });

  // Edit driver mutation
  const editDriverMutation = useMutation({
    mutationFn: async (editData: { id: number; vetsvanCode: string; vetsvanName: string; username: string; phone: string; plateNumber: string }) => {
      return apiRequest(`/api/admin/drivers/${editData.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          vetsvanCode: editData.vetsvanCode,
          vetsvanName: editData.vetsvanName,
          username: editData.username,
          phone: editData.phone,
          plateNumber: editData.plateNumber
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      setShowEditDialog(false);
      setEditingDriver(null);
      toast({
        title: language === 'ar' ? "تم تحديث البيانات" : "Data Updated",
        description: language === 'ar' ? "تم تحديث بيانات المركبة بنجاح" : "Vehicle data updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? "خطأ في التحديث" : "Update Error",
        description: error.message || (language === 'ar' ? "فشل في تحديث البيانات" : "Failed to update data"),
        variant: "destructive",
      });
    },
  });

  // Form handlers
  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver.vetsvanCode || !newDriver.vetsvanName || !newDriver.phone || !newDriver.username || !newDriver.password) {
      toast({
        title: language === 'ar' ? "بيانات ناقصة" : "Incomplete Data",
        description: language === 'ar' ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addDriverMutation.mutate(newDriver);
  };

  const handleLocationClick = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowLocationDialog(true);
  };

  const handleLocationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver || !newLocation.latitude || !newLocation.longitude) {
      toast({
        title: language === 'ar' ? "بيانات ناقصة" : "Incomplete Data",
        description: language === 'ar' ? "يرجى ملء خط العرض وخط الطول" : "Please fill in latitude and longitude",
        variant: "destructive",
      });
      return;
    }
    updateLocationMutation.mutate({
      driverId: selectedDriver.id,
      latitude: newLocation.latitude,
      longitude: newLocation.longitude
    });
  };

  const handleEditClick = (driver: Driver) => {
    setEditingDriver(driver);
    setEditDriverData({
      vetsvanCode: (driver as any).vetsvanCode || "",
      vetsvanName: (driver as any).vetsvanName || "",
      username: driver.username || "",
      phone: driver.phone || "",
      plateNumber: (driver as any).plateNumber || ""
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    
    editDriverMutation.mutate({
      id: editingDriver.id,
      ...editDriverData
    });
  };

  const handleRedZonesClick = (driver: Driver) => {
    setSelectedVetsVanForZones(driver);
    // Load existing red zones for this VetsVan
    // For now, we'll start with empty zones
    setRedZones([]);
    setShowRedZonesDialog(true);
  };

  const handleSaveRedZones = async () => {
    if (!selectedVetsVanForZones) return;
    
    setIsSavingZones(true);
    try {
      // Save red zones to backend
      await apiRequest(`/api/admin/drivers/${selectedVetsVanForZones.id}/red-zones`, {
        method: 'PUT',
        body: JSON.stringify({ redZones }),
      });
      
      toast({
        title: language === 'ar' ? "تم حفظ المناطق" : "Zones Saved",
        description: language === 'ar' ? "تم حفظ المناطق الحمراء بنجاح" : "Red zones saved successfully",
      });
      setShowRedZonesDialog(false);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ في الحفظ" : "Save Error",
        description: error.message || (language === 'ar' ? "فشل في حفظ المناطق" : "Failed to save zones"),
        variant: "destructive",
      });
    } finally {
      setIsSavingZones(false);
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
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src={vetsVanLogo} alt="Vets Van" className="h-12 w-auto mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'ar' ? 'إدارة VETS VAN' : 'Vets Van Management'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
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
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full bg-purple-600 text-purple-600"
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
            
            {/* New Reports & Analytics Dropdown - positioned after Reports */}
            <div className="mt-2">
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
            
            <button
              onClick={() => setLocation('/admin-vetsvan-requests')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FileText className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'طلبات VETS VAN' : 'Vets Van Requests'}</span>
            </button>
            <button
              onClick={() => setLocation('/admin-import')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Upload className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'استيراد البيانات' : 'Import'}</span>
            </button>
            <button
              onClick={() => setLocation('/admin-services')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Stethoscope className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'الخدمات' : 'Services'}</span>
            </button>
            <button
              onClick={() => setLocation('/admin-products')}
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
                {(selectedDriver as any).vetsvanCode} - {(selectedDriver as any).vetsvanName}
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
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
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Edit VetsVan Dialog */}
      {showEditDialog && editingDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir={getDirection(language)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {language === 'ar' ? 'تعديل بيانات VETS VAN' : 'Edit VETS VAN Data'}
              </h3>
              <button
                onClick={() => setShowEditDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'كود VETS VAN' : 'VETS VAN Code'}
                </label>
                <input
                  type="text"
                  value={editDriverData.vetsvanCode}
                  onChange={(e) => setEditDriverData({ ...editDriverData, vetsvanCode: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  style={{ textAlign: getTextAlign(language) }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'اسم VETS VAN' : 'VETS VAN Name'}
                </label>
                <input
                  type="text"
                  value={editDriverData.vetsvanName}
                  onChange={(e) => setEditDriverData({ ...editDriverData, vetsvanName: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  style={{ textAlign: getTextAlign(language) }}
                />
              </div>

              {/* Username field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'اسم المستخدم' : 'User Name'}
                </label>
                <input
                  type="text"
                  value={editDriverData.username}
                  onChange={(e) => setEditDriverData({ ...editDriverData, username: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  style={{ textAlign: getTextAlign(language) }}
                />
              </div>

              {/* Phone field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={editDriverData.phone}
                  onChange={(e) => setEditDriverData({ ...editDriverData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  style={{ textAlign: getTextAlign(language) }}
                />
              </div>

              {/* Plate Number field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'رقم اللوحة' : 'Plate Number'}
                </label>
                <input
                  type="text"
                  value={editDriverData.plateNumber}
                  onChange={(e) => setEditDriverData({ ...editDriverData, plateNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  style={{ textAlign: getTextAlign(language) }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={editDriverMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editDriverMutation.isPending 
                    ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...')
                    : (language === 'ar' ? 'تحديث البيانات' : 'Update Data')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Red Zones Management Modal */}
      {showRedZonesDialog && selectedVetsVanForZones && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold" style={{ textAlign: getTextAlign(language) }}>
                {language === 'ar' ? `إدارة المناطق الحمراء - ${(selectedVetsVanForZones as any).vetsvanName}` : `Red Zones Management - ${(selectedVetsVanForZones as any).vetsvanName}`}
              </h2>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600" style={{ textAlign: getTextAlign(language) }}>
                  {language === 'ar' ? 'انقر على الخريطة لإضافة منطقة حمراء جديدة. المناطق الحمراء هي مناطق محظورة لطلبات الرحلات.' : 'Click on the map to add a new red zone. Red zones are restricted areas for ride requests.'}
                </p>
              </div>
              
              <div className="h-96 border border-gray-300 rounded-lg overflow-hidden">
                <MapContainer
                  center={[24.7136, 46.6753]} // Riyadh coordinates
                  zoom={11}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  <MapClickHandler zones={redZones} setZones={setRedZones} />
                  
                  {redZones.map((zone, index) => (
                    <Circle
                      key={index}
                      center={[zone.lat, zone.lng]}
                      radius={zone.radius}
                      pathOptions={{
                        color: 'red',
                        fillColor: 'red',
                        fillOpacity: 0.2,
                      }}
                    />
                  ))}
                </MapContainer>
              </div>
              
              {redZones.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2" style={{ textAlign: getTextAlign(language) }}>
                    {language === 'ar' ? 'المناطق الحمراء:' : 'Red Zones:'}
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {redZones.map((zone, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">
                          {zone.name} - {language === 'ar' ? 'نصف القطر:' : 'Radius:'} {zone.radius}m
                        </span>
                        <button
                          onClick={() => setRedZones(redZones.filter((_, i) => i !== index))}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowRedZonesDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveRedZones}
                disabled={isSavingZones}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSavingZones ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSavingZones 
                  ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                  : (language === 'ar' ? 'حفظ المناطق' : 'Save Zones')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}