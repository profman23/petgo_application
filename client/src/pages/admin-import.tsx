import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, FileText } from "lucide-react";
import { useTranslation, getTextAlign } from "@/lib/i18n";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import Papa from "papaparse";

export default function AdminImport() {
  const [, setLocation] = useLocation();
  const { language, t } = useTranslation();
  const { toast } = useToast();
  
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

  // Permission check - redirect users with "No Permission" for Import
  useEffect(() => {
    if (currentUserPermissions && currentUserPermissions.importHidden === true) {
      console.log('🚫 User has no permission for Import - redirecting to admin home');
      toast({
        title: language === 'ar' ? 'غير مسموح' : 'Access Denied',
        description: language === 'ar' ? 'ليس لديك صلاحية للوصول إلى استيراد البيانات' : 'You do not have permission to access data import',
        variant: 'destructive',
      });
      setLocation('/admin-home');
    }
  }, [currentUserPermissions, setLocation, toast, language]);

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
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-3 pl-1 pr-6 lg:pr-8">
        <div className="px-1 py-3 sm:px-0">
          {/* Import Section - exact copy from admin dashboard */}
          <div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-2xl font-bold flex items-center gap-3 text-gray-600 mb-6" style={{ textAlign: getTextAlign(language), fontFamily: 'Arimo' }}>
                  <lord-icon
                    src="https://cdn.lordicon.com/qkyvpnmr.json"
                    trigger="loop"
                    delay="2000"
                    colors="primary:#852085,secondary:#848484"
                    style={{width: '90px', height: '90px'}}
                  />
                  {language === 'ar' ? 'استيراد البيانات' : 'Import Data'}
                </h3>
                
                {/* Sub Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                  <button
                    data-testid="tab-products"
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
                    data-testid="tab-services"
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
                      data-testid="input-import-file"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                    <label
                      htmlFor="import-file"
                      data-testid="button-choose-file"
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
                      data-testid="button-download-template"
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
    </AdminLayout>
  );
}