import { useState } from 'react';
import { useLocation } from 'wouter';
import { Shield, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { AdministrationSidebar } from '@/components/administration-sidebar';

export default function Authorization() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    setLocation('/admin-login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <AdministrationSidebar currentPath="/Administration/Authorization" />

      {/* Main Content Area */}
      <div className={`flex-1 ${language === 'ar' ? 'mr-64' : 'ml-64'}`}>
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'ar' ? 'التفويض' : 'Authorization'}
              </h1>
              
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
        <div className="p-6">
          <div className="bg-white shadow rounded-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-6 w-6 text-purple-600 ml-2" />
                  <h2 className="text-lg font-medium text-gray-900">
                    {language === 'ar' ? 'إدارة الصلاحيات' : 'Permissions Management'}
                  </h2>
                </div>
                
                <Button className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md">
                  <Plus className="h-4 w-4 ml-2" />
                  {language === 'ar' ? 'إضافة صلاحية جديدة' : 'Add New Permission'}
                </Button>
              </div>
            </div>

            {/* Authorization Content (Empty for now) */}
            <div className="px-6 py-8">
              <div className="text-center">
                <Settings className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {language === 'ar' ? 'نظام التفويض قيد التطوير' : 'Authorization System Under Development'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {language === 'ar' ? 'سيتم إضافة إدارة الصلاحيات والأدوار قريباً' : 'Permissions and roles management will be added soon'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}