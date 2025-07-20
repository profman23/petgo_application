import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  ArrowLeft, 
  User,
  Settings,
  Bell,
  Volume2,
  VolumeX,
  LogOut
} from 'lucide-react';
import logoPath from '@assets/IMG-20250415-WA0047_1751986059751.jpg';

export default function AdminAuthorization() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation]);

  const adminToken = localStorage.getItem("adminToken");
  const admin = JSON.parse(localStorage.getItem("admin") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    setLocation("/admin-login");
  };

  const getTextAlign = (lang: string) => {
    return lang === 'ar' ? 'right' : 'left';
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border-2 border-purple-600 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <img
                  src={logoPath}
                  alt="VetsVan Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {language === 'ar' ? 'لوحة تحكم المدير' : 'Admin Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? `مرحباً، ${admin.username || 'مدير'}` : `Welcome, ${admin.username || 'Admin'}`}
                </p>
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Audio notification toggle */}
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-2 rounded-md ${
                  audioEnabled 
                    ? 'text-green-600 hover:bg-green-50' 
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
                title={
                  audioEnabled 
                    ? (language === 'ar' ? 'إيقاف الإشعارات الصوتية' : 'Disable audio notifications') 
                    : (language === 'ar' ? 'تفعيل الإشعارات الصوتية' : 'Enable audio notifications')
                  }
              >
                {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
              
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => setLocation('/admin-dashboard')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
          </button>
        </div>

        {/* Authorization Management Section */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-6">
              <Shield className="h-8 w-8 text-purple-600 ml-3" />
              <h3 className="text-2xl leading-6 font-medium text-gray-900">
                {language === 'ar' ? 'إدارة التفويض والصلاحيات' : 'Authorization & Permissions Management'}
              </h3>
            </div>
            
            {/* Content Placeholder */}
            <div className="text-center py-16">
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-purple-100">
                <Shield className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="mt-6 text-xl font-medium text-gray-900">
                {language === 'ar' ? 'قسم إدارة التفويض والصلاحيات' : 'Authorization & Permissions Management'}
              </h3>
              <p className="mt-2 text-lg text-gray-500 max-w-md mx-auto">
                {language === 'ar' 
                  ? 'سيتم تطوير هذا القسم قريباً لإدارة صلاحيات المستخدمين والمديرين'
                  : 'This section will be developed soon to manage user and admin permissions'}
              </p>
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <User className="h-4 w-4 ml-2" />
                  {language === 'ar' ? 'إدارة صلاحيات المستخدمين' : 'User Permissions Management'}
                </div>
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Settings className="h-4 w-4 ml-2" />
                  {language === 'ar' ? 'إعدادات الأمان والتحكم' : 'Security & Access Control Settings'}
                </div>
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 ml-2" />
                  {language === 'ar' ? 'مراجعة سجلات الوصول' : 'Access Logs Review'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}