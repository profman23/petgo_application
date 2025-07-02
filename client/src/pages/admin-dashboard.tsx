import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Shield, LogOut, Car, Clock, Trash2 } from "lucide-react";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
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
  const [activeTab, setActiveTab] = useState('management'); // 'management' or 'shifts'
  const [newDriver, setNewDriver] = useState<NewDriverData>({
    vetsvanCode: "",
    vetsvanName: "",
    phone: "",
    username: "",
    password: "",
  });

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation]);

  const adminToken = localStorage.getItem("adminToken");
  const admin = JSON.parse(localStorage.getItem("admin") || "{}");

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

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    setLocation("/admin-login");
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


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}