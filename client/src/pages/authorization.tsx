import { useState } from 'react';
import { useLocation } from 'wouter';
import { Shield, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { AdministrationSidebar } from '@/components/administration-sidebar';

export default function Authorization() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    setLocation('/admin-login');
  };

  const getTextAlign = (lang: string) => {
    return lang === 'ar' ? 'right' : 'left';
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <AdministrationSidebar currentPath="/Administration/Authorization" />

      {/* Main Content Area */}
      <div className="ml-64" style={{ marginLeft: language === 'ar' ? '0' : '16rem', marginRight: language === 'ar' ? '16rem' : '0' }}>
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              {/* Title */}
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  {language === 'ar' ? 'إدارة التفويض' : 'Authorization Management'}
                </h1>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                {language === 'ar' ? 'تسجيل خروج' : 'Logout'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-6 w-6 text-purple-600 ml-2" />
                  <h2 className="text-lg font-medium text-gray-900">
                    {language === 'ar' ? 'قواعد التفويض' : 'Authorization Rules'}
                  </h2>
                </div>
                
                <Button className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md">
                  <Plus className="h-4 w-4 ml-2" />
                  {language === 'ar' ? 'إنشاء قاعدة جديدة' : 'Create New Rule'}
                </Button>
              </div>
            </div>

            {/* Content Area (Empty for now) */}
            <div className="px-6 py-8">
              <div className="text-center">
                <Shield className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {language === 'ar' ? 'لا توجد قواعد تفويض حالياً' : 'No authorization rules found'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {language === 'ar' ? 'استخدم زر "إنشاء قاعدة جديدة" لإضافة قواعد التفويض' : 'Use "Create New Rule" button to add authorization rules'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}