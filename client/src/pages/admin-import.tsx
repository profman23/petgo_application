import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Loader2, Plus, X, Search, Trash2, Bell, Volume2, LogOut, VolumeX, Car, Clock, BarChart3, TrendingUp, ChevronDown, ChevronUp, FileText, Upload, Stethoscope, Package, Users, User, Shield, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";

// Import Management Component
const ImportManagementTable = ({ language }: { language: 'ar' | 'en' }) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'products' | 'services'>('products');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ imported: 0, updated: 0, failed: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch import history
  const { data: importHistory = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/import-history'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const adminToken = localStorage.getItem("adminToken");
      const response = await fetch('/api/import-history', {
        credentials: "include",
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    },
    enabled: !!localStorage.getItem("adminToken"), // Only fetch if admin token exists
  });

  const importMutation = useMutation({
    mutationFn: async (data: { type: string; data: any[]; fileName: string }) => {
      return apiRequest('/api/import-data', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result) => {
      setImportProgress(result);
      queryClient.invalidateQueries({ queryKey: ['/api/import-history'] });
      toast({
        title: language === 'ar' ? "تم الاستيراد بنجاح" : "Import Successful",
        description: language === 'ar' 
          ? `تم استيراد ${result.imported} عنصر، تحديث ${result.updated} عنصر`
          : `Imported ${result.imported} items, updated ${result.updated} items`,
      });
      setSelectedFile(null);
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      console.error('Error importing data:', error);
      toast({
        title: language === 'ar' ? "خطأ في الاستيراد" : "Import Error",
        description: language === 'ar' ? "فشل في استيراد البيانات" : "Failed to import data",
        variant: "destructive",
      });
      setIsImporting(false);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      toast({
        title: language === 'ar' ? "نوع ملف غير صحيح" : "Invalid File Type",
        description: language === 'ar' ? "يجب أن يكون الملف من نوع CSV" : "File must be CSV format",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    
    try {
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });

      await importMutation.mutateAsync({
        type: importType,
        data,
        fileName: selectedFile.name
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: language === 'ar' ? "خطأ في معالجة الملف" : "File Processing Error",
        description: language === 'ar' ? "فشل في قراءة ملف CSV" : "Failed to read CSV file",
        variant: "destructive",
      });
      setIsImporting(false);
    }
  };

  const downloadTemplate = (type: 'products' | 'services') => {
    let csvContent = '';
    let filename = '';
    
    if (type === 'products') {
      csvContent = 'name,nameAr,price\n"Sample Product","منتج تجريبي","100.00"';
      filename = 'products_template.csv';
    } else {
      csvContent = 'name,nameAr,price\n"Sample Service","خدمة تجريبية","150.00"';
      filename = 'services_template.csv';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold" style={{ 
          direction: getDirection(language), 
          textAlign: getTextAlign(language) 
        }}>
          {language === 'ar' ? 'استيراد البيانات' : 'Import Data'}
        </h2>
      </div>

      {/* Import Form */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-purple-200 mb-6">
        <h3 className="text-lg font-semibold mb-4" style={{ 
          direction: getDirection(language), 
          textAlign: getTextAlign(language) 
        }}>
          {language === 'ar' ? 'استيراد ملف CSV' : 'Import CSV File'}
        </h3>
        
        <div className="space-y-4">
          {/* Import Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ 
              direction: getDirection(language), 
              textAlign: getTextAlign(language) 
            }}>
              {language === 'ar' ? 'نوع البيانات' : 'Data Type'}
            </label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value as 'products' | 'services')}
              className="w-full border border-purple-300 rounded-md px-3 py-2 focus:border-purple-500 focus:outline-none"
            >
              <option value="products">{language === 'ar' ? 'المنتجات' : 'Products'}</option>
              <option value="services">{language === 'ar' ? 'الخدمات' : 'Services'}</option>
            </select>
          </div>

          {/* Template Download */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ 
              direction: getDirection(language), 
              textAlign: getTextAlign(language) 
            }}>
              {language === 'ar' ? 'تحميل القالب' : 'Download Template'}
            </label>
            <Button
              onClick={() => downloadTemplate(importType)}
              variant="outline"
              className="border-purple-300 hover:bg-purple-50"
            >
              <Download className="h-4 w-4 mr-2" />
              {language === 'ar' ? `قالب ${importType === 'products' ? 'المنتجات' : 'الخدمات'}` : `${importType} Template`}
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ 
              direction: getDirection(language), 
              textAlign: getTextAlign(language) 
            }}>
              {language === 'ar' ? 'اختر ملف CSV' : 'Select CSV File'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="w-full border border-purple-300 rounded-md px-3 py-2 focus:border-purple-500 focus:outline-none"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-1">
                {language === 'ar' ? 'الملف المحدد:' : 'Selected file:'} {selectedFile.name}
              </p>
            )}
          </div>

          {/* Import Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isImporting 
                ? (language === 'ar' ? 'جاري الاستيراد...' : 'Importing...') 
                : (language === 'ar' ? 'استيراد' : 'Import')
              }
            </Button>

            {selectedFile && (
              <Button
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                variant="outline"
                className="border-gray-300"
              >
                <X className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'إلغاء' : 'Clear'}
              </Button>
            )}
          </div>

          {/* Progress Display */}
          {isImporting && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                <span className="text-blue-700">
                  {language === 'ar' ? 'جاري معالجة البيانات...' : 'Processing data...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium" style={{ 
            direction: getDirection(language), 
            textAlign: getTextAlign(language) 
          }}>
            {language === 'ar' ? 'سجل الاستيراد' : 'Import History'}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'اسم الملف' : 'File Name'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'النوع' : 'Type'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'مستورد' : 'Imported'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'محدث' : 'Updated'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'متخطى' : 'Skipped'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'التاريخ' : 'Date'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {importHistory && Array.isArray(importHistory) && importHistory.length > 0 ? (
                importHistory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.fileName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {language === 'ar' ? (item.fileType === 'products' ? 'منتجات' : 'خدمات') : item.fileType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {item.recordsImported}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {item.recordsUpdated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                      {item.recordsSkipped}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {language === 'ar' 
                          ? (item.status === 'completed' ? 'مكتمل' : item.status === 'partial' ? 'جزئي' : 'فشل')
                          : item.status
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(item.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {language === 'ar' ? 'لا يوجد سجل استيراد' : 'No import history'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function AdminImport() {
  const [, setLocation] = useLocation();
  const { language, t } = useTranslation();
  
  // State for tracking notifications and audio - matches VetsVan Shifts and admin dashboard
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastRequestCountRef = useRef(0);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(false);
  const [isAdministrationExpanded, setIsAdministrationExpanded] = useState(true);

  // Fetch current requests count for notification badge - matches VetsVan Shifts
  const { data: allVetsVanRequests } = useQuery({
    queryKey: ['/api/admin/vetsvan-requests'],
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates like admin dashboard
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  // Monitor for new requests and update notification count - exact same logic as VetsVan Shifts
  useEffect(() => {
    if (allVetsVanRequests && allVetsVanRequests.length > 0) {
      const currentCount = allVetsVanRequests.length;
      
      lastRequestCountRef.current = currentCount;
      setCurrentRequestCount(currentCount);
    }
  }, [allVetsVanRequests]);

  return (
    <div 
      className="min-h-screen bg-gray-50"
      dir={getDirection(language)}
      style={{ textAlign: getTextAlign(language) }}
    >
      {/* Full-width Header with logo and controls - exact copy from VetsVan Shifts */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src={vetsVanLogo} 
              alt="VETS VAN" 
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-4">
            <LanguageSelector />
            
            {/* Audio notification toggle */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 rounded-full transition-colors duration-200 ${
                audioEnabled 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={audioEnabled 
                ? (language === 'ar' ? 'إيقاف الإشعارات الصوتية' : 'Disable audio notifications') 
                : (language === 'ar' ? 'تفعيل الإشعارات الصوتية' : 'Enable audio notifications')
              }
            >
              {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>

            {/* Notifications counter - matches VetsVan Shifts and admin dashboard */}
            <div className="relative">
              <Bell className="h-6 w-6 text-purple-600" />
              {currentRequestCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {currentRequestCount > 99 ? '99+' : currentRequestCount}
                </span>
              )}
            </div>
            
            <button
              onClick={() => {
                localStorage.removeItem("adminToken");
                setLocation("/admin-login");
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 ml-2" />
              {t('logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar - exact copy from VetsVan Shifts */}
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
              onClick={() => setLocation('/admin-dashboard')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
                <span className="flex-1 text-left">
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
              onClick={() => setLocation('/admin-dashboard')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FileText className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'طلبات VETS VAN' : 'Vets Van Requests'}</span>
            </button>
            <button
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 bg-purple-600 text-purple-600"
            >
              <Upload className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'استيراد البيانات' : 'Import'}</span>
            </button>
            <button
              onClick={() => setLocation('/admin-dashboard/services')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Stethoscope className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'الخدمات' : 'Services'}</span>
            </button>
            <button
              onClick={() => setLocation('/admin-dashboard/products')}
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
              <ImportManagementTable language={language} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}