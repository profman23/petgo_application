import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Trash2, Edit, UserCheck, UserX, LogOut } from 'lucide-react';

interface Driver {
  id: number;
  name: string;
  phone: string;
  username: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  createdAt: string;
}

interface NewDriverData {
  name: string;
  phone: string;
  username: string;
  password: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [newDriver, setNewDriver] = useState<NewDriverData>({
    name: '',
    phone: '',
    username: '',
    password: ''
  });

  // التحقق من صحة دخول الإدارة
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      setLocation('/admin-login');
    }
  }, [setLocation]);

  // جلب قائمة السائقين
  const { data: drivers, isLoading } = useQuery({
    queryKey: ['admin/drivers'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/drivers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response as Driver[];
    },
    refetchInterval: 5000 // تحديث كل 5 ثوان
  });

  // إضافة سائق جديد
  const addDriverMutation = useMutation({
    mutationFn: async (data: NewDriverData) => {
      return await apiRequest('/api/admin/drivers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة السائق بنجاح",
        variant: "default",
      });
      setNewDriver({ name: '', phone: '', username: '', password: '' });
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ['admin/drivers'] });
    },
    onError: () => {
      toast({
        title: "خطأ في إضافة السائق",
        variant: "destructive",
      });
    }
  });

  // حذف سائق
  const deleteDriverMutation = useMutation({
    mutationFn: async (driverId: number) => {
      return await apiRequest(`/api/admin/drivers/${driverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "تم حذف السائق بنجاح",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['admin/drivers'] });
    },
    onError: () => {
      toast({
        title: "خطأ في حذف السائق",
        variant: "destructive",
      });
    }
  });

  // تغيير حالة توفر السائق
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ driverId, isAvailable }: { driverId: number; isAvailable: boolean }) => {
      return await apiRequest(`/api/admin/drivers/${driverId}/availability`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ isAvailable })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin/drivers'] });
    }
  });

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriver.name || !newDriver.phone || !newDriver.username || !newDriver.password) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }
    addDriverMutation.mutate(newDriver);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setLocation('/admin-login');
  };

  const adminUser = localStorage.getItem('adminUser') ? JSON.parse(localStorage.getItem('adminUser')!) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-purple-700">لوحة تحكم الإدارة</h1>
              <p className="text-gray-600">إدارة السائقين والطلبات - العيادة البيطرية المتنقلة</p>
              {adminUser && (
                <p className="text-sm text-gray-500 mt-1">مرحباً {adminUser.name}</p>
              )}
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي السائقين</p>
                  <p className="text-2xl font-bold text-purple-700">{drivers?.length || 0}</p>
                </div>
                <UserCheck className="w-8 h-8 text-purple-700" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">السائقين المتاحين</p>
                  <p className="text-2xl font-bold text-green-600">
                    {drivers?.filter(d => d.isAvailable).length || 0}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">السائقين غير المتاحين</p>
                  <p className="text-2xl font-bold text-red-600">
                    {drivers?.filter(d => !d.isAvailable).length || 0}
                  </p>
                </div>
                <UserX className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* إضافة سائق جديد */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>إدارة السائقين</CardTitle>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-purple-700 hover:bg-purple-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة سائق جديد
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddForm && (
              <form onSubmit={handleAddDriver} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="name">اسم السائق</Label>
                  <Input
                    id="name"
                    value={newDriver.name}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="أدخل اسم السائق"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>
                <div>
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input
                    id="username"
                    value={newDriver.username}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>
                <div>
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newDriver.password}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="أدخل كلمة المرور"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button
                    type="submit"
                    disabled={addDriverMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {addDriverMutation.isPending ? 'جاري الإضافة...' : 'إضافة السائق'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            )}

            {/* قائمة السائقين */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-3 text-right">الاسم</th>
                    <th className="border border-gray-200 p-3 text-right">رقم الهاتف</th>
                    <th className="border border-gray-200 p-3 text-right">اسم المستخدم</th>
                    <th className="border border-gray-200 p-3 text-right">الحالة</th>
                    <th className="border border-gray-200 p-3 text-right">الموقع</th>
                    <th className="border border-gray-200 p-3 text-right">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers?.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-3">{driver.name}</td>
                      <td className="border border-gray-200 p-3">{driver.phone}</td>
                      <td className="border border-gray-200 p-3">{driver.username}</td>
                      <td className="border border-gray-200 p-3">
                        <Button
                          onClick={() => toggleAvailabilityMutation.mutate({
                            driverId: driver.id,
                            isAvailable: !driver.isAvailable
                          })}
                          size="sm"
                          variant={driver.isAvailable ? "default" : "secondary"}
                          className={driver.isAvailable ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                        >
                          {driver.isAvailable ? 'متاح' : 'غير متاح'}
                        </Button>
                      </td>
                      <td className="border border-gray-200 p-3 text-sm">
                        {driver.latitude ? (
                          <span>
                            {driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-gray-500">غير محدد</span>
                        )}
                      </td>
                      <td className="border border-gray-200 p-3">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => deleteDriverMutation.mutate(driver.id)}
                            size="sm"
                            variant="destructive"
                            disabled={deleteDriverMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={6} className="border border-gray-200 p-6 text-center text-gray-500">
                        لا يوجد سائقين مضافين
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}