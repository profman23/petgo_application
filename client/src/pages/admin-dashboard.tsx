import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';
import { 
  Users, 
  Car, 
  TrendingUp, 
  Star, 
  Calendar,
  MapPin,
  Edit3,
  Trash2,
  Plus,
  Settings,
  BarChart3,
  DollarSign,
  TrendingDown,
  Upload,
  Download,
  FileText,
  Volume2,
  VolumeX,
  Bell,
  MessageSquare
} from 'lucide-react';

// Audio notification system
class AudioNotification {
  private static instance: AudioNotification;
  private audioContext: AudioContext | null = null;
  private audio: HTMLAudioElement | null = null;

  static getInstance(): AudioNotification {
    if (!AudioNotification.instance) {
      AudioNotification.instance = new AudioNotification();
    }
    return AudioNotification.instance;
  }

  async playNotification() {
    try {
      if (!this.audio) {
        this.audio = new Audio('/رسائل-الايفون_1751699547648.mp3');
        this.audio.volume = 0.8;
      }
      
      await this.audio.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }
}

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

interface SalesData {
  id: number;
  invoiceNumber: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  serviceType: string;
  vetsVanCode: string;
  vetsVanName: string;
  hasInvoice: boolean;
  invoiceDetails: {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    finalTotal: number;
  } | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  createdAt: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  
  // Tab management
  const [activeTab, setActiveTab] = useState('management');
  const [reportsSubTab, setReportsSubTab] = useState<'analytics' | 'sales'>('analytics');
  
  // Sales Report states
  const [expandedSales, setExpandedSales] = useState<number[]>([]);
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [salesDateFilter, setSalesDateFilter] = useState<string>('all');
  
  // Audio notifications
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastRequestCountRef = useRef(0);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);

  // Queries for data fetching
  const { data: drivers, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ['/api/admin/drivers'],
    enabled: activeTab === 'management'
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: activeTab === 'reports'
  });

  const { data: salesData, isLoading: isLoadingSales } = useQuery({
    queryKey: ['/api/admin/sales-report'],
    enabled: activeTab === 'reports' && reportsSubTab === 'sales',
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: vetsVanRequests, isLoading: isLoadingVetsVanRequests } = useQuery({
    queryKey: ['/api/admin/vetsvan-requests'],
    enabled: activeTab === 'requests',
    refetchInterval: 2000
  });

  // Notification system
  useEffect(() => {
    if (vetsVanRequests && Array.isArray(vetsVanRequests)) {
      const newCount = vetsVanRequests.length;
      
      if (lastRequestCountRef.current > 0 && newCount > lastRequestCountRef.current) {
        if (audioEnabled) {
          const audioNotification = AudioNotification.getInstance();
          audioNotification.playNotification();
        }
        
        toast({
          title: language === 'ar' ? 'طلب جديد!' : 'New Request!',
          description: language === 'ar' ? 'تم استلام طلب VETS VAN جديد' : 'New VetsVan request received',
        });
      }
      
      lastRequestCountRef.current = newCount;
      setCurrentRequestCount(newCount);
    }
  }, [vetsVanRequests, audioEnabled, language, toast]);

  // Helper functions
  const getDirection = (lang: string) => lang === 'ar' ? 'rtl' : 'ltr';
  const getTextAlign = (lang: string) => lang === 'ar' ? 'right' : 'left';

  const toggleSaleExpansion = (saleId: number) => {
    setExpandedSales(prev => 
      prev.includes(saleId) 
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
    );
  };

  // Filter sales data
  const filteredSalesData = salesData?.filter((sale: SalesData) => {
    // Status filter
    if (salesFilter !== 'all') {
      if (salesFilter === 'invoiced' && !sale.hasInvoice) return false;
      if (salesFilter === 'pending' && sale.hasInvoice) return false;
    }
    
    // Date filter
    if (salesDateFilter !== 'all') {
      const saleDate = new Date(sale.appointmentDate);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - saleDate.getTime()) / (1000 * 3600 * 24));
      
      if (salesDateFilter === 'today' && daysDiff !== 0) return false;
      if (salesDateFilter === 'week' && daysDiff > 7) return false;
      if (salesDateFilter === 'month' && daysDiff > 30) return false;
    }
    
    return true;
  }) || [];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setLocation('/admin-login');
  };

  return (
    <div className="min-h-screen bg-gray-100" dir={getDirection(language)}>
      {/* Header */}
      <div className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {language === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Audio Toggle */}
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-2 rounded-lg ${audioEnabled ? 'text-green-600' : 'text-gray-400'}`}
              >
                {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
              
              {/* Notification Bell */}
              <div className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                {currentRequestCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs px-1">
                    {currentRequestCount}
                  </span>
                )}
              </div>
              
              {/* Logout */}
              <Button onClick={handleLogout} variant="outline">
                {language === 'ar' ? 'تسجيل خروج' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'management', label: language === 'ar' ? 'إدارة VetsVan' : 'VetsVan Management', icon: Car },
              { id: 'reports', label: language === 'ar' ? 'التقارير' : 'Reports', icon: BarChart3 },
              { id: 'requests', label: language === 'ar' ? 'طلبات VetsVan' : 'VetsVan Requests', icon: Calendar }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Reports Tab Content */}
        {activeTab === 'reports' && (
          <div className="space-y-6" dir={getDirection(language)}>
            {/* Reports Sub-tabs */}
            <div className="flex space-x-4 border-b">
              <button
                onClick={() => setReportsSubTab('analytics')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  reportsSubTab === 'analytics'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {language === 'ar' ? 'التحليلات' : 'Analytics'}
              </button>
              <button
                onClick={() => setReportsSubTab('sales')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  reportsSubTab === 'sales'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}
              </button>
            </div>

            {/* Sales Report Content */}
            {reportsSubTab === 'sales' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}
                  </h2>
                  <p className="text-gray-600">
                    {language === 'ar' ? 'عرض جميع الفواتير والمبيعات' : 'View all invoices and sales data'}
                  </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'حالة الفاتورة' : 'Invoice Status'}
                      </label>
                      <select
                        value={salesFilter}
                        onChange={(e) => setSalesFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
                        <option value="invoiced">{language === 'ar' ? 'تم إنشاء فاتورة' : 'Invoiced'}</option>
                        <option value="pending">{language === 'ar' ? 'بدون فاتورة' : 'No Invoice'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'فترة التاريخ' : 'Date Period'}
                      </label>
                      <select
                        value={salesDateFilter}
                        onChange={(e) => setSalesDateFilter(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="all">{language === 'ar' ? 'جميع التواريخ' : 'All Dates'}</option>
                        <option value="today">{language === 'ar' ? 'اليوم' : 'Today'}</option>
                        <option value="week">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</option>
                        <option value="month">{language === 'ar' ? 'هذا الشهر' : 'This Month'}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sales Table */}
                {isLoadingSales ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">
                      {language === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}
                    </p>
                  </div>
                ) : filteredSalesData.length > 0 ? (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'العميل' : 'Customer'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'التاريخ' : 'Date'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'الحالة' : 'Status'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'VetsVan' : 'VetsVan'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'ar' ? 'إجراء' : 'Action'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredSalesData.map((sale) => (
                            <>
                              <tr key={sale.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {sale.invoiceNumber || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {sale.customerName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(sale.appointmentDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    sale.hasInvoice 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {sale.hasInvoice 
                                      ? (language === 'ar' ? 'مفوتر' : 'Invoiced')
                                      : (language === 'ar' ? 'بدون فاتورة' : 'No Invoice')
                                    }
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {sale.vetsVanCode}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <button
                                    onClick={() => toggleSaleExpansion(sale.id)}
                                    className="inline-flex items-center text-purple-600 hover:text-purple-900"
                                  >
                                    {expandedSales.includes(sale.id) ? (
                                      <>
                                        <span className="mr-1">{language === 'ar' ? 'إخفاء' : 'Hide'}</span>
                                        <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </>
                                    ) : (
                                      <>
                                        <span className="mr-1">{language === 'ar' ? 'عرض' : 'Show'}</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                              
                              {/* Expanded Details Row */}
                              {expandedSales.includes(sale.id) && (
                                <tr>
                                  <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                    <div className="space-y-4">
                                      {/* Customer Details */}
                                      <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                                          {language === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                          <div>
                                            <span className="font-medium">{language === 'ar' ? 'الاسم:' : 'Name:'}</span>
                                            <span className="ml-2">{sale.customerName}</span>
                                          </div>
                                          <div>
                                            <span className="font-medium">{language === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                                            <span className="ml-2">{sale.customerPhone}</span>
                                          </div>
                                          <div>
                                            <span className="font-medium">{language === 'ar' ? 'الإيميل:' : 'Email:'}</span>
                                            <span className="ml-2">{sale.customerEmail || 'N/A'}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* VetsVan Details */}
                                      <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                                          {language === 'ar' ? 'تفاصيل VetsVan' : 'VetsVan Details'}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                          <div>
                                            <span className="font-medium">{language === 'ar' ? 'كود VetsVan:' : 'VetsVan Code:'}</span>
                                            <span className="ml-2">{sale.vetsVanCode}</span>
                                          </div>
                                          <div>
                                            <span className="font-medium">{language === 'ar' ? 'اسم VetsVan:' : 'VetsVan Name:'}</span>
                                            <span className="ml-2">{sale.vetsVanName}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Service Details */}
                                      <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                                          {language === 'ar' ? 'تفاصيل الخدمة' : 'Service Details'}
                                        </h4>
                                        <div className="text-sm">
                                          <span className="font-medium">{language === 'ar' ? 'نوع الخدمة:' : 'Service Type:'}</span>
                                          <span className="ml-2">{sale.serviceType}</span>
                                        </div>
                                      </div>

                                      {/* Invoice Details - Only show if invoice exists */}
                                      {sale.hasInvoice && sale.invoiceDetails && (
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                                            {language === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}
                                          </h4>
                                          <div className="bg-white rounded-lg p-4 border">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                              <div>
                                                <span className="font-medium">{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                                                <div className="text-gray-600">{sale.invoiceDetails.subtotal.toFixed(2)} SAR</div>
                                              </div>
                                              <div>
                                                <span className="font-medium">{language === 'ar' ? 'الضريبة:' : 'Tax:'}</span>
                                                <div className="text-gray-600">{sale.invoiceDetails.taxAmount.toFixed(2)} SAR</div>
                                              </div>
                                              <div>
                                                <span className="font-medium">{language === 'ar' ? 'الخصم:' : 'Discount:'}</span>
                                                <div className="text-gray-600">{sale.invoiceDetails.discountAmount.toFixed(2)} SAR</div>
                                              </div>
                                              <div>
                                                <span className="font-medium">{language === 'ar' ? 'المجموع النهائي:' : 'Final Total:'}</span>
                                                <div className="text-green-600 font-bold">{sale.invoiceDetails.finalTotal.toFixed(2)} SAR</div>
                                              </div>
                                            </div>

                                            {/* Invoice Items */}
                                            {sale.items && sale.items.length > 0 && (
                                              <div className="mt-4">
                                                <h5 className="text-sm font-medium text-gray-900 mb-2">
                                                  {language === 'ar' ? 'عناصر الفاتورة' : 'Invoice Items'}
                                                </h5>
                                                <div className="bg-gray-50 rounded p-3">
                                                  <table className="w-full text-xs">
                                                    <thead>
                                                      <tr className="border-b">
                                                        <th className="text-left py-1">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                                                        <th className="text-left py-1">{language === 'ar' ? 'الكمية' : 'Quantity'}</th>
                                                        <th className="text-left py-1">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
                                                        <th className="text-left py-1">{language === 'ar' ? 'المجموع' : 'Total'}</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {sale.items.map((item, index) => (
                                                        <tr key={index} className="border-b">
                                                          <td className="py-2">{item.description}</td>
                                                          <td className="py-2">{item.quantity}</td>
                                                          <td className="py-2">{item.unitPrice.toFixed(2)} SAR</td>
                                                          <td className="py-2">{item.total.toFixed(2)} SAR</td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {language === 'ar' ? 'لا توجد مبيعات' : 'No Sales Data'}
                    </h3>
                    <p className="text-gray-500">
                      {language === 'ar' ? 'لا توجد بيانات مبيعات متاحة بناءً على الفلاتر المحددة' : 'No sales data available based on selected filters'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Content */}
            {reportsSubTab === 'analytics' && (
              <div>
                <p className="text-gray-600">
                  {language === 'ar' ? 'قسم التحليلات قيد التطوير' : 'Analytics section under development'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Other tab contents would go here */}
        {activeTab === 'management' && (
          <div className="text-center py-12">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === 'ar' ? 'إدارة VetsVan' : 'VetsVan Management'}
            </h3>
            <p className="text-gray-500">
              {language === 'ar' ? 'قسم إدارة VetsVan قيد التطوير' : 'VetsVan management section under development'}
            </p>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === 'ar' ? 'طلبات VetsVan' : 'VetsVan Requests'}
            </h3>
            <p className="text-gray-500">
              {language === 'ar' ? 'قسم طلبات VetsVan قيد التطوير' : 'VetsVan requests section under development'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}