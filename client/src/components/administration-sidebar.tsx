import { useLocation } from 'wouter';
import { Users, Shield, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import logoPath from '@assets/IMG-20250415-WA0047_1751986059751.jpg';

interface AdministrationSidebarProps {
  currentPath: string;
}

export function AdministrationSidebar({ currentPath }: AdministrationSidebarProps) {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();

  const menuItems = [
    {
      path: '/Administration/Users-Management',
      icon: Users,
      label: language === 'ar' ? 'المستخدمين' : 'Users',
      isActive: currentPath === '/Administration/Users-Management'
    },
    {
      path: '/Administration/Authorization',
      icon: Shield,
      label: language === 'ar' ? 'التفويض' : 'Authorization',
      isActive: currentPath === '/Administration/Authorization'
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-40" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-12 bg-white rounded-lg shadow-lg border-2 border-purple-600 p-1 hover:shadow-xl transition-shadow duration-200">
            <img 
              src={logoPath} 
              alt="Vets Van Logo" 
              className="w-full h-full object-contain rounded-md"
            />
          </div>
        </div>
        <h2 className="text-lg font-bold text-gray-900 text-center">
          {language === 'ar' ? 'الإدارة' : 'Administration'}
        </h2>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <button
                  onClick={() => setLocation(item.path)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    item.isActive
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${language === 'ar' ? 'ml-3' : 'mr-3'}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Back Button */}
      <div className="absolute bottom-6 left-4 right-4">
        <button
          onClick={() => setLocation('/admin-dashboard')}
          className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className={`h-5 w-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {language === 'ar' ? 'العودة للوحة' : 'Back to Dashboard'}
        </button>
      </div>
    </div>
  );
}