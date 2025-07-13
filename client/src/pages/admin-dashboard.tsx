import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, Car, Calendar, Bell, Settings } from 'lucide-react';
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';
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

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const t = useTranslation();
  const dir = getDirection(language);
  const textAlign = getTextAlign(language);

  // Check if admin is authenticated
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    navigate('/admin-login');
    return null;
  }

  // Fetch VetsVan requests
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
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin-login');
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {language === 'ar' ? 'طلبات VetsVan' : 'VetsVan Requests'}
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {language === 'ar' ? 'الإحصائيات' : 'Statistics'}
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

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle style={{ textAlign }}>
                  {language === 'ar' ? 'إعدادات النظام' : 'System Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  {language === 'ar' ? 'قريباً...' : 'Coming soon...'}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}