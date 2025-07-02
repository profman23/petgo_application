import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Calendar, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";

interface VetsVan {
  id: number;
  vetsvanCode: string;
  vetsvanName: string;
  name: string;
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [selectedVetsVan, setSelectedVetsVan] = useState<number | null>(null);
  const [newShift, setNewShift] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '17:00',
    duration: 'day' as 'day' | 'week' | 'month'
  });

  // تحديد نطاق التواريخ للعرض (7 أيام)
  const getDateRange = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const dateRange = getDateRange();

  // جلب قائمة السيارات
  const { data: vetsVans = [], isLoading: loadingVans } = useQuery({
    queryKey: ['/api/admin/drivers'],
    retry: false,
  });

  // جلب النوبات
  const { data: shifts = [], isLoading: loadingShifts } = useQuery({
    queryKey: ['/api/admin/shifts'],
    retry: false,
  });

  // إضافة نوبة جديدة
  const addShiftMutation = useMutation({
    mutationFn: async (shiftData: any) => {
      return await apiRequest('/api/admin/shifts', {
        method: 'POST',
        body: JSON.stringify(shiftData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shifts'] });
      setIsAddShiftOpen(false);
      setSelectedVetsVan(null);
      toast({
        title: t('success'),
        description: t('shiftAddedSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToAddShift'),
        variant: "destructive",
      });
    },
  });

  // حذف نوبة
  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: number) => {
      return await apiRequest(`/api/admin/shifts/${shiftId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shifts'] });
      toast({
        title: t('success'),
        description: t('shiftDeletedSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToDeleteShift'),
        variant: "destructive",
      });
    },
  });

  const handleAddShift = () => {
    if (!selectedVetsVan) return;
    
    addShiftMutation.mutate({
      vetsVanId: selectedVetsVan,
      ...newShift
    });
  };

  const getShiftForVanAndDate = (vetsVanId: number, date: string) => {
    return shifts.find((shift: Shift) => 
      shift.vetsVanId === vetsVanId && shift.date === date
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', options);
  };

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
    <div 
      className="min-h-screen bg-gray-50"
      dir={getDirection(language)}
      style={{ textAlign: getTextAlign(language) }}
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin-dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <img 
                  src="/api/placeholder/32/32" 
                  alt="Logo" 
                  className="w-6 h-6 rounded"
                />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">{t('vetsVanShifts')}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* جدول النوبات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('shiftsSchedule')}</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {dateRange.length} {t('days')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-gray-700 min-w-[200px]">
                      {t('vetsVanName')}
                    </th>
                    {dateRange.map(date => (
                      <th key={date} className="text-center p-3 font-medium text-gray-700 min-w-[120px]">
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
                        <td className="p-3">
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
                        {dateRange.map(date => {
                          const shift = getShiftForVanAndDate(van.id, date);
                          return (
                            <td key={date} className="p-3 text-center">
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
                                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                    onClick={() => deleteShiftMutation.mutate(shift.id)}
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
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => {
                                        setSelectedVetsVan(van.id);
                                        setNewShift(prev => ({ ...prev, date }));
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
                                          value={`${van.vetsvanCode} - ${van.vetsvanName}`} 
                                          disabled 
                                        />
                                      </div>
                                      <div>
                                        <Label>{t('date')}</Label>
                                        <Input 
                                          type="date" 
                                          value={newShift.date}
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
                                          onClick={handleAddShift}
                                          disabled={addShiftMutation.isPending}
                                          className="flex-1"
                                        >
                                          {addShiftMutation.isPending ? t('loading') : t('addShift')}
                                        </Button>
                                        <Button 
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
  );
}