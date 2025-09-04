import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Loader2, Bell, Volume2, LogOut, VolumeX, Car, Clock, BarChart3, TrendingUp, ChevronDown, ChevronUp, FileText, Stethoscope, Package, Users, User, Shield, Home } from "lucide-react";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";
import Papa from "papaparse";

export default function AdminImport() {
  const [, setLocation] = useLocation();
  const { language, t } = useTranslation();
  const { toast } = useToast();
  
  // State for tracking notifications and audio - matches other admin pages
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastRequestCountRef = useRef(0);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(false);
  const [isAdministrationExpanded, setIsAdministrationExpanded] = useState(() => {
    const savedState = localStorage.getItem('isAdministrationExpanded');
    return savedState !== null ? JSON.parse(savedState) : false;
  });

  // Import-specific state - extracted from admin dashboard
  const [importSubTab, setImportSubTab] = useState<'products' | 'services'>('products');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Fetch current user permissions
  const adminToken = localStorage.getItem("adminToken");
  const { data: currentUserPermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["/api/admin/current-user-permissions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/current-user-permissions", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch permissions");
      return response.json();
    },
    enabled: !!adminToken,
  });

  // Fetch current requests count for notification badge - matches other admin pages
  const { data: allVetsVanRequests } = useQuery({
    queryKey: ['/api/admin/vetsvan-requests'],
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  // Monitor for new requests and update notification count
  useEffect(() => {
    if (allVetsVanRequests && allVetsVanRequests.length > 0) {
      const currentCount = allVetsVanRequests.length;
      
      lastRequestCountRef.current = currentCount;
      setCurrentRequestCount(currentCount);
    }
  }, [allVetsVanRequests]);

  // Permission check - redirect users with "No Permission" for Import
  useEffect(() => {
    if (currentUserPermissions && currentUserPermissions.importHidden === true) {
      console.log('🚫 User has no permission for Import - redirecting to admin home');
      setLocation('/admin-home');
    }
  }, [currentUserPermissions, setLocation]);

  // Download template function - exact copy from admin dashboard
  const downloadTemplate = async (type: 'products' | 'services') => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/download-template/${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_template.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: language === 'ar' ? 'تم التحميل' : 'Downloaded',
        description: language === 'ar' 
          ? `تم تحميل نموذج ${type === 'products' ? 'المنتجات' : 'الخدمات'} بنجاح` 
          : `${type === 'products' ? 'Products' : 'Services'} template downloaded successfully`,
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل النموذج' : 'Failed to download template',
        variant: 'destructive',
      });
    }
  };

  // File upload handler - exact copy from admin dashboard
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: language === 'ar' ? 'ملف كبير جداً' : 'File Too Large',
        description: language === 'ar' ? 'حجم الملف يجب أن يكون أقل من 10 ميجابايت' : 'File size must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file extension
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: language === 'ar' ? 'نوع ملف غير مدعوم' : 'Unsupported File Type',
        description: language === 'ar' ? 'يرجى رفع ملف CSV أو Excel' : 'Please upload a CSV or Excel file',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setUploadingFile(true);

    try {
      let data: any[] = [];

      if (fileExtension === '.csv') {
        // Use papaparse for CSV files
        const text = await file.text();
        const parseResult = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transform: (value: string, field: string) => {
            // Transform price field to number
            if (field === 'price') {
              return parseFloat(value) || 0;
            }
            return value.trim();
          }
        });

        if (parseResult.errors.length > 0) {
          console.warn('CSV parsing warnings:', parseResult.errors);
        }

        data = parseResult.data;
      } else {
        // For Excel files, we'll need to convert to CSV first or use xlsx library
        // For now, show error for Excel files
        toast({
          title: language === 'ar' ? 'Excel غير مدعوم حالياً' : 'Excel Not Supported Yet',
          description: language === 'ar' ? 'يرجى تحويل الملف إلى CSV أولاً' : 'Please convert to CSV format first',
          variant: 'destructive',
        });
        setUploadingFile(false);
        setSelectedFile(null);
        return;
      }

      // Validate required columns based on import type
      const requiredColumns = importSubTab === 'products' 
        ? ['name', 'price', 'category', 'description']
        : ['name', 'price', 'category', 'description'];

      if (data.length === 0) {
        toast({
          title: language === 'ar' ? 'ملف فارغ' : 'Empty File',
          description: language === 'ar' ? 'الملف لا يحتوي على بيانات' : 'File contains no data',
          variant: 'destructive',
        });
        setUploadingFile(false);
        setSelectedFile(null);
        return;
      }

      // Check if required columns exist
      const firstRow = data[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        toast({
          title: language === 'ar' ? 'أعمدة مفقودة' : 'Missing Columns',
          description: language === 'ar' 
            ? `الأعمدة المفقودة: ${missingColumns.join(', ')}` 
            : `Missing columns: ${missingColumns.join(', ')}`,
          variant: 'destructive',
        });
        setUploadingFile(false);
        setSelectedFile(null);
        return;
      }

      // Send data to server
      const token = localStorage.getItem("adminToken");
      const response = await fetch('/api/import-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: importSubTab,
          data,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Server error: ${errorData}`);
      }

      const result = await response.json();

      toast({
        title: language === 'ar' ? 'تم الاستيراد بنجاح' : 'Import Successful',
        description: language === 'ar' 
          ? `تم استيراد ${result.imported} ${importSubTab === 'products' ? 'منتج' : 'خدمة'} بنجاح` 
          : `Successfully imported ${result.imported} ${importSubTab === 'products' ? 'products' : 'services'}`,
      });

      // Reset file selection
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('import-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: language === 'ar' ? 'خطأ في الاستيراد' : 'Import Error',
        description: language === 'ar' ? 'فشل في استيراد البيانات' : 'Failed to import data',
        variant: 'destructive',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gray-50"
      dir={getDirection(language)}
      style={{ textAlign: getTextAlign(language) }}
    >
      {/* Full-width Header with logo and controls - exact copy from other admin pages */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4">
          {/* Logo */}
          <div className="flex-shrink-0 -ml-6">
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

            {/* Notifications counter */}
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

      {/* Main Content with Sidebar - exact copy from other admin pages */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="mt-4 px-2">
            {/* Home Page */}
            <button
              onClick={() => setLocation('/admin-home')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Home className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'الصفحة الرئيسية' : 'Home Page'}</span>
            </button>
            
            {/* Administration Module */}
            <div className="mb-2">
              <button
                onClick={() => {
                  const newState = !isAdministrationExpanded;
                  setIsAdministrationExpanded(newState);
                  localStorage.setItem('isAdministrationExpanded', JSON.stringify(newState));
                }}
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
                    onClick={currentUserPermissions && currentUserPermissions.usersHidden === true ? () => setLocation('/admin-home') : () => setLocation('/administration/users')}
                    disabled={permissionsLoading || !currentUserPermissions}
                    className={`group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full ${
                      permissionsLoading || !currentUserPermissions
                        ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    <User className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'المستخدمين' : 'Users'}</span>
                    {permissionsLoading && <div className="ml-auto w-3 h-3 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />}
                  </button>
                  <button
                    onClick={currentUserPermissions && (currentUserPermissions as any).authHidden === true ? () => setLocation('/admin-home') : () => setLocation('/administration/authorization')}
                    disabled={permissionsLoading || !currentUserPermissions}
                    className={`group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full ${
                      permissionsLoading || !currentUserPermissions
                        ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'التصريح' : 'Authorization'}</span>
                    {permissionsLoading && <div className="ml-auto w-3 h-3 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />}
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={currentUserPermissions && currentUserPermissions.vetsVanHidden === true ? () => setLocation('/admin-home') : () => setLocation('/admin-dashboard')}
              disabled={permissionsLoading || !currentUserPermissions}
              className={`group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full ${
                permissionsLoading || !currentUserPermissions
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Car className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'إدارة VETS VAN' : 'Vets Van Management'}</span>
              {permissionsLoading && <div className="ml-auto w-3 h-3 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (currentUserPermissions && (currentUserPermissions as any).vetsVanShiftsHidden === true) {
                  setLocation('/admin-home');
                } else {
                  setLocation('/vets-van-shifts');
                }
              }}
              disabled={permissionsLoading || !currentUserPermissions}
              className={`group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 ${
                permissionsLoading || !currentUserPermissions
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Clock className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'مناوبات VETS VAN' : 'Vets Van Shifts'}</span>
              {permissionsLoading && <div className="ml-auto w-3 h-3 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />}
            </button>
            <button
              onClick={() => setLocation('/admin-dashboard?tab=reports')}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <BarChart3 className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'التقارير' : 'Reports'}</span>
            </button>
            
            {/* New Reports & Analytics Dropdown */}
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
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mt-2 bg-purple-50 border-l-4 border-purple-600"
            >
              <Upload className="h-6 w-6 flex-shrink-0 text-purple-600" />
              <span className="text-purple-600">{language === 'ar' ? 'استيراد البيانات' : 'Import'}</span>
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
              {/* Import Section - exact copy from admin dashboard */}
              <div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6" style={{ textAlign: getTextAlign(language) }}>
                      {language === 'ar' ? 'استيراد البيانات' : 'Import Data'}
                    </h3>
                    
                    {/* Sub Tabs */}
                    <div className="flex border-b border-gray-200 mb-6">
                      <button
                        onClick={() => setImportSubTab('products')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                          importSubTab === 'products'
                            ? 'border-purple-600 text-purple-600 #85208550'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {language === 'ar' ? '📦 المنتجات' : '📦 Products'}
                      </button>
                      <button
                        onClick={() => setImportSubTab('services')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                          importSubTab === 'services'
                            ? 'border-purple-600 text-purple-600 #85208550'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {language === 'ar' ? '🩺 الخدمات' : '🩺 Services'}
                      </button>
                    </div>
                    
                    {/* Upload Section */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-600 transition-colors">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2" style={{ textAlign: getTextAlign(language) }}>
                        {language === 'ar' 
                          ? `ارفع ملف ${importSubTab === 'products' ? 'المنتجات' : 'الخدمات'}` 
                          : `Upload ${importSubTab === 'products' ? 'Products' : 'Services'} File`
                        }
                      </p>
                      <p className="text-sm text-gray-500 mb-4" style={{ textAlign: getTextAlign(language) }}>
                        {language === 'ar' 
                          ? `يمكنك رفع ملفات Excel أو CSV تحتوي على بيانات ${importSubTab === 'products' ? 'المنتجات' : 'الخدمات'}` 
                          : `Upload Excel or CSV files containing ${importSubTab === 'products' ? 'products' : 'services'} data`
                        }
                      </p>
                      
                      <div className="flex flex-col items-center gap-4">
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          id="import-file"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                        />
                        <label
                          htmlFor="import-file"
                          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white cursor-pointer transition-colors ${
                            uploadingFile 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-purple-600 hover:bg-purple-600'
                          }`}
                        >
                          {uploadingFile ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              {language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
                            </>
                          ) : (
                            <>
                              <Upload className="h-5 w-5 mr-2" />
                              {language === 'ar' ? 'اختيار الملف' : 'Choose File'}
                            </>
                          )}
                        </label>
                        
                        {selectedFile && (
                          <div className="text-sm text-gray-600 mt-2" style={{ textAlign: getTextAlign(language) }}>
                            {language === 'ar' ? 'الملف المحدد: ' : 'Selected file: '}
                            <span className="font-medium">{selectedFile.name}</span>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' 
                            ? 'الصيغ المدعومة: .xlsx, .xls, .csv - الحد الأقصى: 10 ميجابايت'
                            : 'Supported formats: .xlsx, .xls, .csv - Max size: 10MB'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Template Download Section */}
                    <div className="mt-8">
                      <h4 className="text-md font-medium text-gray-900 mb-4" style={{ textAlign: getTextAlign(language) }}>
                        {language === 'ar' ? 'تحميل النموذج' : 'Download Template'}
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' 
                            ? `نموذج ${importSubTab === 'products' ? 'المنتجات' : 'الخدمات'}` 
                            : `${importSubTab === 'products' ? 'Products' : 'Services'} Template`
                          }
                        </h5>
                        <p className="text-sm text-gray-600 mb-3" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' 
                            ? `نموذج CSV يحتوي على الأعمدة المطلوبة لاستيراد ${importSubTab === 'products' ? 'المنتجات' : 'الخدمات'} (الاسم، السعر، الفئة، الوصف)`
                            : `CSV template with required columns for importing ${importSubTab === 'products' ? 'products' : 'services'} (name, price, category, description)`
                          }
                        </p>
                        <button 
                          onClick={() => downloadTemplate(importSubTab)}
                          className="inline-flex items-center text-sm text-purple-600 hover:text-purple-600 hover:underline"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          {language === 'ar' 
                            ? `تحميل نموذج ${importSubTab === 'products' ? 'المنتجات' : 'الخدمات'}` 
                            : `Download ${importSubTab === 'products' ? 'Products' : 'Services'} Template`
                          }
                        </button>
                      </div>
                    </div>

                    {/* Import Instructions */}
                    <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-blue-800" style={{ textAlign: getTextAlign(language) }}>
                            {language === 'ar' ? 'تعليمات الاستيراد' : 'Import Instructions'}
                          </h4>
                          <div className="mt-2 text-sm text-blue-700" style={{ textAlign: getTextAlign(language) }}>
                            <ul className="list-disc list-inside space-y-1">
                              <li>
                                {language === 'ar' 
                                  ? 'قم بتحميل النموذج المناسب (منتجات أو خدمات)'
                                  : 'Download the appropriate template (products or services)'
                                }
                              </li>
                              <li>
                                {language === 'ar' 
                                  ? 'املأ البيانات في الأعمدة المطلوبة: الاسم، السعر، الفئة، الوصف'
                                  : 'Fill in the required columns: name, price, category, description'
                                }
                              </li>
                              <li>
                                {language === 'ar' 
                                  ? 'احفظ الملف بصيغة CSV وارفعه هنا'
                                  : 'Save the file as CSV and upload it here'
                                }
                              </li>
                              <li>
                                {language === 'ar' 
                                  ? 'ستتم إضافة البيانات إلى قاعدة البيانات تلقائياً'
                                  : 'Data will be automatically added to the database'
                                }
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Import History */}
                    <div className="mt-8">
                      <h4 className="text-md font-medium text-gray-900 mb-4" style={{ textAlign: getTextAlign(language) }}>
                        {language === 'ar' ? 'سجل عمليات الاستيراد' : 'Import History'}
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-500" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' 
                            ? 'لا توجد عمليات استيراد سابقة'
                            : 'No previous imports found'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}