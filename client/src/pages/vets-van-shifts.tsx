import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Calendar, Clock, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";

import type { Driver, Shift as ShiftType } from "@shared/schema";

interface VetsVan extends Driver {
  id: number;
  vetsvanCode: string;
  vetsvanName: string;
  name: string;
  email: string;
  phone: string;
  isAvailable: boolean;
}

interface Shift {
  id: number;
  vetsVanId: number;
  date: string;
  startTime: string;
  endTime: string;
  duration: 'day' | 'week' | 'month';
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export default function VetsVanShifts() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  // Check admin authentication and permissions
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // Only block doctors, not admins with old tokens
    if (user.membershipType === "doctor") {
      toast({
        title: language === 'ar' ? 'غير مسموح' : 'Access Denied',
        description: language === 'ar' ? 'لا يمكن للأطباء الوصول إلى إدارة المناوبات' : 'Doctors cannot access shift management',
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
  
  // Fetch user permissions
  const { data: userPermissions } = useQuery({
    queryKey: ['/api/admin/current-user-permissions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/current-user-permissions', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    },
    enabled: !!adminToken,
  });

  // Check if user has access to VetsVan Shifts
  useEffect(() => {
    if (userPermissions?.vetsVanShiftsHidden) {
      toast({
        title: language === 'ar' ? 'غير مسموح' : 'Access Denied',
        description: language === 'ar' ? 'ليس لديك صلاحية للوصول إلى إدارة المناوبات' : 'You do not have permission to access shift management',
        variant: 'destructive',
      });
      setLocation('/admin-home');
    }
  }, [userPermissions, setLocation, toast, language]);
  
  // Determine read-only mode from permissions
  const isReadOnly = !userPermissions?.vetsVanShiftsFullControl;

  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    return start;
  });

  // Generate date range for current week
  const dateRange = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', options);
  };

  // Week navigation functions
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  // Get week range for display
  const getWeekRange = () => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);
    return `${formatDate(currentWeekStart.toISOString().split('T')[0])} - ${formatDate(endDate.toISOString().split('T')[0])}`;
  };

  // State for shift management
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [selectedVetsVan, setSelectedVetsVan] = useState<number | null>(null);
  const [newShift, setNewShift] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '17:00',
    duration: 'day' as 'day' | 'week' | 'month'
  });
  
  // Remove redundant polling - AdminLayout handles notifications

  // Fetch VetsVans data
  const { data: vetsVans = [], isLoading: loadingVans } = useQuery({
    queryKey: ['/api/admin/drivers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/drivers', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch drivers');
      return response.json();
    },
    enabled: !!adminToken,
  });

  // Fetch shifts data
  const { data: shifts = [] } = useQuery({
    queryKey: ['/api/admin/shifts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/shifts', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch shifts');
      return response.json();
    },
    enabled: !!adminToken,
  });

  // Add shift mutation
  const addShiftMutation = useMutation({
    mutationFn: async (shiftData: any) => {
      return apiRequest('/api/admin/shifts', {
        method: 'POST',
        body: JSON.stringify(shiftData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shifts'] });
      setIsAddShiftOpen(false);
      setSelectedVetsVan(null);
      setNewShift({
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '17:00',
        duration: 'day'
      });
      toast({
        title: t('success'),
        description: t('shiftAddedSuccessfully'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('errorAddingShift'),
        variant: 'destructive',
      });
    },
  });

  // Delete shift mutation
  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: number) => {
      return apiRequest(`/api/admin/shifts/${shiftId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shifts'] });
      toast({
        title: t('success'),
        description: t('shiftDeletedSuccessfully'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('errorDeletingShift'),
        variant: 'destructive',
      });
    },
  });

  // Handle add shift
  const handleAddShift = () => {
    if (!selectedVetsVan) return;
    
    const shiftData = {
      vetsVanId: selectedVetsVan,
      date: newShift.date,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      duration: newShift.duration,
      status: 'scheduled'
    };
    
    addShiftMutation.mutate(shiftData);
  };

  // Get shift for specific van and date
  const getShiftForVanAndDate = (vanId: number, date: string) => {
    return shifts.find((shift: Shift) => 
      shift.vetsVanId === vanId && shift.date === date
    );
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      {/* Read-Only Mode Indicator */}
      {isReadOnly && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 mx-6 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                {language === 'ar' 
                  ? 'وضع القراءة فقط - يمكنك عرض المناوبات ولكن لا يمكنك إجراء تعديلات'
                  : 'Read-Only Mode - You can view shifts but cannot make modifications'
                }
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full mx-auto py-3 px-4">
        <div className="w-full py-3">
          {/* جدول النوبات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <lord-icon
                    src="https://cdn.lordicon.com/warimioc.json"
                    trigger="loop"
                    stroke="bold"
                    colors="primary:#852085,secondary:#b4b4b4"
                    style={{width: '80px', height: '80px'}}
                  />
                  <span className="text-2xl font-bold text-gray-600" style={{ fontFamily: 'Arimo' }}>{t('shiftsSchedule')}</span>
                </div>
                <div className="flex items-center gap-4">
                  {/* أسهم التنقل بين الأسابيع */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousWeek}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
                      {getWeekRange()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextWeek}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {dateRange.length} {t('days')}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left p-3 font-medium text-gray-700 min-w-[200px] border-r-2 border-gray-300 bg-gray-50">
                        {t('vetsVanName')}
                      </th>
                      {dateRange.map((date, index) => (
                        <th key={date} className={`text-center p-3 font-medium text-gray-700 min-w-[120px] bg-gray-50 ${
                          index < dateRange.length - 1 ? 'border-r border-gray-200' : ''
                        }`}>
                          <div className="flex flex-col items-center">
                            <span className="text-sm">{formatDate(date)}</span>
                            <span className="text-xs text-gray-500">{date}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingVans ? (
                      <tr>
                        <td colSpan={dateRange.length + 1} className="text-center p-8 text-gray-500">
                          {t('loading')}
                        </td>
                      </tr>
                    ) : vetsVans.length === 0 ? (
                      <tr>
                        <td colSpan={dateRange.length + 1} className="text-center p-8 text-gray-500">
                          {t('noVetsVansFound')}
                        </td>
                      </tr>
                    ) : (
                      vetsVans.map((van: VetsVan) => (
                        <tr key={van.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 border-r-2 border-gray-300 bg-gray-25">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {van.vetsvanCode} - {van.vetsvanName}
                              </span>
                              <span className="text-sm text-gray-500">{van.name}</span>
                              <Badge 
                                variant={van.isAvailable ? "default" : "secondary"}
                                className="w-fit mt-1"
                              >
                                {van.isAvailable ? t('available') : t('notAvailable')}
                              </Badge>
                            </div>
                          </td>
                          {dateRange.map((date, index) => {
                            const shift = getShiftForVanAndDate(van.id, date);
                            return (
                              <td key={date} className={`p-3 text-center ${
                                index < dateRange.length - 1 ? 'border-r border-gray-200' : ''
                              }`}>
                                {shift ? (
                                  <div className="relative">
                                    <Badge className={`${getStatusColor(shift.status)} text-xs`}>
                                      {t(shift.status)}
                                    </Badge>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {shift.startTime} - {shift.endTime}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={isReadOnly}
                                      className={`absolute -top-1 -right-1 h-5 w-5 p-0 ${
                                        isReadOnly 
                                          ? 'text-gray-400 cursor-not-allowed opacity-50' 
                                          : 'text-red-500 hover:text-red-700'
                                      }`}
                                      onClick={() => !isReadOnly && deleteShiftMutation.mutate(shift.id)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Dialog open={isAddShiftOpen && selectedVetsVan === van.id} onOpenChange={(open) => {
                                    setIsAddShiftOpen(open);
                                    if (!open) setSelectedVetsVan(null);
                                  }}>
                                    <DialogTrigger asChild>
                                      <Button
                                        data-testid={`button-add-shift-${van.id}-${date}`}
                                        variant="outline"
                                        size="sm"
                                        disabled={isReadOnly}
                                        className={`h-8 w-8 p-0 ${
                                          isReadOnly 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50 border-gray-300' 
                                            : ''
                                        }`}
                                        onClick={() => {
                                          if (!isReadOnly) {
                                            setSelectedVetsVan(van.id);
                                            setNewShift(prev => ({ ...prev, date }));
                                          }
                                        }}
                                      >
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>{t('addNewShift')}</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <Label>{t('vetsVanName')}</Label>
                                          <Input 
                                            data-testid="input-van-name"
                                            value={`${van.vetsvanCode} - ${van.vetsvanName}`} 
                                            disabled 
                                          />
                                        </div>
                                        <div>
                                          <Label>{t('date')}</Label>
                                          <Input 
                                            type="date" 
                                            value={newShift.date}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setNewShift(prev => ({ ...prev, date: e.target.value }))}
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label>{t('startTime')}</Label>
                                            <Input 
                                              type="time" 
                                              value={newShift.startTime}
                                              onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                                            />
                                          </div>
                                          <div>
                                            <Label>{t('endTime')}</Label>
                                            <Input 
                                              type="time" 
                                              value={newShift.endTime}
                                              onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <Label>{t('duration')}</Label>
                                          <Select 
                                            value={newShift.duration} 
                                            onValueChange={(value: 'day' | 'week' | 'month') => 
                                              setNewShift(prev => ({ ...prev, duration: value }))
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="day">{t('day')}</SelectItem>
                                              <SelectItem value="week">{t('week')}</SelectItem>
                                              <SelectItem value="month">{t('month')}</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="flex gap-2 pt-4">
                                          <Button 
                                            data-testid="button-save-shift"
                                            onClick={handleAddShift}
                                            disabled={addShiftMutation.isPending}
                                            className="flex-1"
                                          >
                                            {addShiftMutation.isPending ? t('loading') : t('addShift')}
                                          </Button>
                                          <Button 
                                            data-testid="button-cancel-shift"
                                            variant="outline" 
                                            onClick={() => {
                                              setIsAddShiftOpen(false);
                                              setSelectedVetsVan(null);
                                            }}
                                            className="flex-1"
                                          >
                                            {t('cancel')}
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}