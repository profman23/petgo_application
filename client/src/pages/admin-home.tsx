import { useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation, getDirection } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { LogOut, Home } from "lucide-react";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";

export default function AdminHome() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    setLocation("/admin-login");
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={getDirection(language)}>
      {/* Header */}
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
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 ml-2" />
              {t('logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex justify-center items-center min-h-[calc(100vh-100px)]">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Home className="h-24 w-24 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {language === 'ar' ? 'الصفحة الرئيسية' : 'Home Page'}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {language === 'ar' 
              ? 'مرحباً بك في نظام إدارة VETS VAN' 
              : 'Welcome to VETS VAN Management System'
            }
          </p>
          <div className="max-w-2xl mx-auto">
            <p className="text-gray-500 mb-6">
              {language === 'ar'
                ? 'هذه الصفحة جاهزة للتوسع المستقبلي. يمكنك الوصول إلى جميع الوظائف الإدارية من الشريط الجانبي.'
                : 'This page is ready for future expansion. You can access all administrative functions from the sidebar navigation.'
              }
            </p>
            <button
              onClick={() => setLocation('/admin-dashboard')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              {language === 'ar' ? 'انتقل إلى لوحة التحكم' : 'Go to Dashboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}