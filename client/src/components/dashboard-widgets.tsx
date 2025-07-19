import { useState, useEffect } from "react";
import { Responsive, WidthProvider, Layout, Layouts } from "react-grid-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Car, 
  BarChart3, 
  FileText, 
  Calendar, 
  Users, 
  Settings, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Maximize2,
  Minimize2,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { getDirection, getTextAlign, useTranslation } from "@/lib/i18n";

// Import CSS for react-grid-layout
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

// Widget types and their default configurations
const WIDGET_TYPES = {
  vetsVanStats: {
    id: 'vetsVanStats',
    title: { ar: 'إحصائيات VETS VAN', en: 'VetsVan Statistics' },
    icon: Car,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    color: 'purple'
  },
  recentRequests: {
    id: 'recentRequests',
    title: { ar: 'الطلبات الحديثة', en: 'Recent Requests' },
    icon: FileText,
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 4 },
    color: 'blue'
  },
  analytics: {
    id: 'analytics',
    title: { ar: 'التحليلات', en: 'Analytics' },
    icon: BarChart3,
    defaultSize: { w: 8, h: 5 },
    minSize: { w: 6, h: 4 },
    color: 'green'
  },
  appointments: {
    id: 'appointments',
    title: { ar: 'المواعيد', en: 'Appointments' },
    icon: Calendar,
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 3, h: 4 },
    color: 'orange'
  },
  customers: {
    id: 'customers',
    title: { ar: 'العملاء', en: 'Customers' },
    icon: Users,
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    color: 'indigo'
  }
};

// Default layout configuration
const DEFAULT_LAYOUTS: Layouts = {
  lg: [
    { i: 'vetsVanStats', x: 0, y: 0, w: 6, h: 4 },
    { i: 'recentRequests', x: 6, y: 0, w: 6, h: 6 },
    { i: 'analytics', x: 0, y: 4, w: 8, h: 5 },
    { i: 'appointments', x: 8, y: 4, w: 4, h: 5 },
    { i: 'customers', x: 0, y: 9, w: 4, h: 4 }
  ],
  md: [
    { i: 'vetsVanStats', x: 0, y: 0, w: 6, h: 4 },
    { i: 'recentRequests', x: 6, y: 0, w: 6, h: 6 },
    { i: 'analytics', x: 0, y: 4, w: 8, h: 5 },
    { i: 'appointments', x: 8, y: 4, w: 4, h: 5 },
    { i: 'customers', x: 0, y: 9, w: 4, h: 4 }
  ],
  sm: [
    { i: 'vetsVanStats', x: 0, y: 0, w: 6, h: 4 },
    { i: 'recentRequests', x: 0, y: 4, w: 6, h: 6 },
    { i: 'analytics', x: 0, y: 10, w: 6, h: 5 },
    { i: 'appointments', x: 0, y: 15, w: 6, h: 5 },
    { i: 'customers', x: 0, y: 20, w: 6, h: 4 }
  ]
};

const DEFAULT_WIDGET_SETTINGS = {
  vetsVanStats: { visible: true, expanded: false },
  recentRequests: { visible: true, expanded: false },
  analytics: { visible: true, expanded: false },
  appointments: { visible: true, expanded: false },
  customers: { visible: true, expanded: false }
};

interface DashboardWidgetsProps {
  adminId: number;
}

// Individual Widget Components
const VetsVanStatsWidget = ({ language }: { language: string }) => {
  const { data: driversStats } = useQuery({
    queryKey: ['/api/admin/drivers'],
    staleTime: 30000,
  });

  const activeDrivers = driversStats?.filter((d: any) => d.isAvailable)?.length || 0;
  const totalDrivers = driversStats?.length || 0;

  return (
    <div className="p-4 h-full">
      <div className="grid grid-cols-2 gap-4 h-full">
        <div className="bg-purple-50 rounded-lg p-3 flex flex-col justify-center">
          <div className="text-2xl font-bold text-purple-700">{totalDrivers}</div>
          <div className="text-sm text-purple-600">
            {language === 'ar' ? 'إجمالي VETS VAN' : 'Total VetsVan'}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 flex flex-col justify-center">
          <div className="text-2xl font-bold text-green-700">{activeDrivers}</div>
          <div className="text-sm text-green-600">
            {language === 'ar' ? 'متاح حالياً' : 'Active Now'}
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentRequestsWidget = ({ language }: { language: string }) => {
  const { data: recentRequests } = useQuery({
    queryKey: ['/api/admin/vetsvan-requests'],
    staleTime: 30000,
  });

  const recent = recentRequests?.slice(0, 5) || [];

  return (
    <div className="p-4 h-full">
      <div className="space-y-2 h-full overflow-auto">
        {recent.map((request: any, index: number) => (
          <div key={index} className="bg-gray-50 rounded p-2 text-sm">
            <div className="font-medium">{request.customerName}</div>
            <div className="text-gray-600">{request.vetsvanCode}</div>
            <div className="text-xs text-gray-500">
              {new Date(request.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalyticsWidget = ({ language }: { language: string }) => {
  const { data: requestsData } = useQuery({
    queryKey: ['/api/admin/vetsvan-requests'],
    staleTime: 30000,
  });

  const totalRequests = requestsData?.length || 0;
  const confirmedRequests = requestsData?.filter((r: any) => r.status === 'confirmed')?.length || 0;
  const pendingRequests = requestsData?.filter((r: any) => r.status === 'pending_review')?.length || 0;

  return (
    <div className="p-4 h-full">
      <div className="grid grid-cols-3 gap-3 h-full">
        <div className="bg-blue-50 rounded-lg p-3 flex flex-col justify-center">
          <div className="text-xl font-bold text-blue-700">{totalRequests}</div>
          <div className="text-xs text-blue-600">
            {language === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 flex flex-col justify-center">
          <div className="text-xl font-bold text-green-700">{confirmedRequests}</div>
          <div className="text-xs text-green-600">
            {language === 'ar' ? 'مؤكدة' : 'Confirmed'}
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 flex flex-col justify-center">
          <div className="text-xl font-bold text-orange-700">{pendingRequests}</div>
          <div className="text-xs text-orange-600">
            {language === 'ar' ? 'قيد المراجعة' : 'Pending'}
          </div>
        </div>
      </div>
    </div>
  );
};

const AppointmentsWidget = ({ language }: { language: string }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: appointmentsData } = useQuery({
    queryKey: ['/api/admin/vetsvan-requests'],
    staleTime: 30000,
  });

  const todayAppointments = appointmentsData?.filter((a: any) => 
    a.appointmentDate?.startsWith(today)
  )?.length || 0;

  return (
    <div className="p-4 h-full flex flex-col justify-center">
      <div className="text-center">
        <div className="text-3xl font-bold text-orange-700">{todayAppointments}</div>
        <div className="text-sm text-orange-600 mt-2">
          {language === 'ar' ? 'مواعيد اليوم' : "Today's Appointments"}
        </div>
      </div>
    </div>
  );
};

const CustomersWidget = ({ language }: { language: string }) => {
  const { data: customersData } = useQuery({
    queryKey: ['/api/admin/users'],
    staleTime: 30000,
  });

  const totalCustomers = customersData?.length || 0;

  return (
    <div className="p-4 h-full flex flex-col justify-center">
      <div className="text-center">
        <div className="text-3xl font-bold text-indigo-700">{totalCustomers}</div>
        <div className="text-sm text-indigo-600 mt-2">
          {language === 'ar' ? 'إجمالي العملاء' : 'Total Customers'}
        </div>
      </div>
    </div>
  );
};

export default function DashboardWidgets({ adminId }: DashboardWidgetsProps) {
  const { toast } = useToast();
  const { language } = useTranslation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [layouts, setLayouts] = useState<Layouts>(DEFAULT_LAYOUTS);
  const [widgetSettings, setWidgetSettings] = useState(DEFAULT_WIDGET_SETTINGS);

  // Load saved layout
  const { data: savedLayout } = useQuery({
    queryKey: ['/api/admin/dashboard-layout', adminId],
    staleTime: 60000,
  });

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (data: { layout: Layouts; widgetSettings: any }) => {
      return apiRequest('/api/admin/dashboard-layout', {
        method: 'POST',
        body: JSON.stringify({
          adminId,
          layout: data.layout,
          widgetSettings: data.widgetSettings,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? "تم الحفظ" : "Saved",
        description: language === 'ar' ? "تم حفظ تخطيط لوحة المعلومات" : "Dashboard layout saved",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-layout', adminId] });
    },
  });

  // Load saved layout on mount
  useEffect(() => {
    if (savedLayout) {
      setLayouts(savedLayout.layout || DEFAULT_LAYOUTS);
      setWidgetSettings(savedLayout.widgetSettings || DEFAULT_WIDGET_SETTINGS);
    }
  }, [savedLayout]);

  const handleLayoutChange = (layout: Layout[], layouts: Layouts) => {
    setLayouts(layouts);
  };

  const toggleWidget = (widgetId: string) => {
    setWidgetSettings(prev => ({
      ...prev,
      [widgetId]: {
        ...prev[widgetId],
        visible: !prev[widgetId]?.visible
      }
    }));
  };

  const resetLayout = () => {
    setLayouts(DEFAULT_LAYOUTS);
    setWidgetSettings(DEFAULT_WIDGET_SETTINGS);
  };

  const saveLayout = () => {
    saveLayoutMutation.mutate({ layout: layouts, widgetSettings });
    setIsEditMode(false);
  };

  const renderWidget = (widgetType: string) => {
    const widget = WIDGET_TYPES[widgetType as keyof typeof WIDGET_TYPES];
    if (!widget || !widgetSettings[widgetType as keyof typeof widgetSettings]?.visible) {
      return null;
    }

    const IconComponent = widget.icon;

    let content;
    switch (widgetType) {
      case 'vetsVanStats':
        content = <VetsVanStatsWidget language={language} />;
        break;
      case 'recentRequests':
        content = <RecentRequestsWidget language={language} />;
        break;
      case 'analytics':
        content = <AnalyticsWidget language={language} />;
        break;
      case 'appointments':
        content = <AppointmentsWidget language={language} />;
        break;
      case 'customers':
        content = <CustomersWidget language={language} />;
        break;
      default:
        content = <div>Unknown widget</div>;
    }

    return (
      <Card key={widgetType} className="h-full border-2 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className={`flex items-center gap-2 text-sm ${getTextAlign(language)}`}>
            <IconComponent className={`h-4 w-4 text-${widget.color}-600`} />
            {widget.title[language as keyof typeof widget.title]}
            {isEditMode && (
              <GripVertical className="h-4 w-4 text-gray-400 ml-auto cursor-move" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 h-full">
          {content}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4" dir={getDirection(language)}>
      {/* Widget Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">
            {language === 'ar' ? 'لوحة المعلومات المخصصة' : 'Customizable Dashboard'}
          </h3>
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isEditMode 
              ? (language === 'ar' ? 'إنهاء التعديل' : 'Exit Edit') 
              : (language === 'ar' ? 'تعديل التخطيط' : 'Edit Layout')
            }
          </Button>
        </div>

        {isEditMode && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetLayout}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
            </Button>
            <Button 
              size="sm" 
              onClick={saveLayout}
              disabled={saveLayoutMutation.isPending}
            >
              {saveLayoutMutation.isPending 
                ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                : (language === 'ar' ? 'حفظ التخطيط' : 'Save Layout')
              }
            </Button>
          </div>
        )}
      </div>

      {/* Widget Visibility Controls */}
      {isEditMode && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-md font-medium mb-3">
            {language === 'ar' ? 'إظهار/إخفاء الودجت' : 'Show/Hide Widgets'}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(WIDGET_TYPES).map(([key, widget]) => (
              <div key={key} className="flex items-center space-x-2">
                <Switch
                  checked={widgetSettings[key as keyof typeof widgetSettings]?.visible || false}
                  onCheckedChange={() => toggleWidget(key)}
                />
                <label className="text-sm font-medium">
                  {widget.title[language as keyof typeof widget.title]}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="min-h-screen">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          compactType="vertical"
          preventCollision={false}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          rowHeight={60}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        >
          {Object.keys(WIDGET_TYPES).map(widgetType => renderWidget(widgetType))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}