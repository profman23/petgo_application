import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { 
  Shield, 
  Bell,
  LogOut,
  Menu,
  X,
  User,
  Truck,
  BarChart,
  FileText,
  Settings,
  Upload,
  Plus,
  MessageSquare,
  Zap,
  CreditCard,
  MapPin,
  Users
} from 'lucide-react';
import logoPath from '@assets/IMG-20250415-WA0047_1751986059751.jpg';

export default function AdminAuthorization() {
  const { t, language, toggleLanguage } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setLocation('/admin-login');
  };

  const navigation = [
    { name: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', href: '/admin-dashboard', icon: BarChart, current: false },
    { name: language === 'ar' ? 'إدارة VetsVan' : 'VetsVan Management', href: '#', icon: Truck, current: false },
    { name: language === 'ar' ? 'طلبات VetsVan' : 'VetsVan Requests', href: '#', icon: FileText, current: false },
    { name: language === 'ar' ? 'التقارير الجديدة والتحليلات' : 'New Reports & Analytics', href: '/new-reports-analytics', icon: BarChart, current: false },
    { name: language === 'ar' ? 'الإدارة' : 'Administration', href: '#', icon: Settings, current: true, 
      children: [
        { name: language === 'ar' ? 'المستخدمون' : 'Users', href: '/admin-dashboard', icon: User },
        { name: language === 'ar' ? 'التفويض' : 'Authorization', href: '/administration/authorization', icon: Shield, current: true }
      ]
    },
    { name: language === 'ar' ? 'استيراد' : 'Import', href: '#', icon: Upload, current: false },
    { name: language === 'ar' ? 'إدارة الخدمات' : 'Services Management', href: '/admin-dashboard/services', icon: Plus, current: false },
    { name: language === 'ar' ? 'إرسال SMS' : 'Send SMS', href: '#', icon: MessageSquare, current: false }
  ];

  return (
    <div className={`min-h-screen bg-gray-50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Mobile sidebar */}
      <div className={`lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 flex z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div ref={sidebarRef} className={`relative flex-1 flex flex-col max-w-xs w-full bg-white ${language === 'ar' ? 'mr-0' : 'ml-0'}`}>
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            {/* Mobile Sidebar Content */}
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <img className="h-12 w-auto rounded-lg shadow-md" src={logoPath} alt="Logo" />
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <div key={item.name}>
                    <button
                      onClick={() => item.href !== '#' && setLocation(item.href)}
                      className={`${
                        item.current
                          ? 'bg-purple-100 text-purple-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full`}
                    >
                      <item.icon className="mr-4 h-6 w-6" />
                      {item.name}
                    </button>
                    {item.children && (
                      <div className="ml-8 space-y-1">
                        {item.children.map((child) => (
                          <button
                            key={child.name}
                            onClick={() => setLocation(child.href)}
                            className={`${
                              child.current
                                ? 'bg-purple-100 text-purple-600'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full`}
                          >
                            <child.icon className="ml-3 h-5 w-5" />
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <img className="h-12 w-auto rounded-lg shadow-md" src={logoPath} alt="Logo" />
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  <button
                    onClick={() => item.href !== '#' && setLocation(item.href)}
                    className={`${
                      item.current
                        ? 'bg-purple-100 text-purple-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </button>
                  {item.children && (
                    <div className="ml-8 space-y-1">
                      {item.children.map((child) => (
                        <button
                          key={child.name}
                          onClick={() => setLocation(child.href)}
                          className={`${
                            child.current
                              ? 'bg-purple-100 text-purple-600'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full`}
                        >
                          <child.icon className="ml-3 h-5 w-5" />
                          {child.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`lg:pl-64 flex flex-col flex-1`}>
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Header content */}
          <div className={`flex-1 px-4 flex justify-between ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`${language === 'ar' ? 'mr-4' : 'ml-4'}`}>
                <img 
                  src={logoPath} 
                  alt="Company Logo" 
                  className="w-12 h-12 object-contain bg-white border-2 border-purple-600 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {language === 'ar' ? 'إدارة التفويض' : 'Authorization Management'}
              </h1>
            </div>

            <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'} ${language === 'ar' ? 'ml-4' : 'mr-4'} lg:${language === 'ar' ? 'ml-6' : 'mr-6'}`}>
              {/* Language Selector */}
              <button
                onClick={toggleLanguage}
                className={`bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${language === 'ar' ? 'ml-3' : 'mr-3'}`}
              >
                <span className="sr-only">Toggle language</span>
                <span className="text-sm font-medium">{language === 'ar' ? 'EN' : 'عر'}</span>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${language === 'ar' ? 'ml-3' : 'mr-3'}`}
                >
                  <Bell className="h-6 w-6" />
                </button>
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={handleLogout}
                  className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Back to Dashboard Button */}
              <div className="mb-6">
                <button
                  onClick={() => setLocation('/admin-dashboard')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-600 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <Shield className={`${language === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
                </button>
              </div>

              {/* Authorization Content */}
              <div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      {language === 'ar' ? 'إدارة التفويض' : 'Authorization Management'}
                    </h3>
                    <div className="text-center py-12">
                      <Shield className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">
                        {language === 'ar' ? 'قسم إدارة التفويض' : 'Authorization Management Section'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {language === 'ar' ? 'سيتم تطوير هذا القسم قريباً' : 'This section will be developed soon'}
                      </p>
                      <p className="mt-4 text-sm text-purple-600">
                        {language === 'ar' ? 'المسار الحالي: /administration/authorization' : 'Current Path: /administration/authorization'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}