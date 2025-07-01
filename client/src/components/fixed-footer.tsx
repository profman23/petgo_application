import { Home, Activity, User } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';

export function FixedFooter() {
  const [location, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);

  const navigationItems = [
    {
      id: 'home',
      path: '/',
      icon: Home,
      label: t('home'),
      gradient: 'from-purple-500 to-violet-600'
    },
    {
      id: 'activity',
      path: '/activity',
      icon: Activity,
      label: t('activity'),
      gradient: 'from-indigo-500 to-purple-600'
    },
    {
      id: 'account',
      path: '/account',
      icon: User,
      label: t('account'),
      gradient: 'from-violet-500 to-fuchsia-600'
    }
  ];

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-purple-200 shadow-2xl">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2 px-4">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex flex-col items-center justify-center 
                  p-3 rounded-xl min-w-[80px] relative
                  transition-all duration-300 ease-in-out
                  ${isActive 
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg transform scale-105` 
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }
                `}
                style={{ 
                  textAlign: 'center'
                }}
              >
                {/* Icon Container */}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center mb-1
                  ${isActive 
                    ? 'bg-white/20 backdrop-blur-sm' 
                    : 'bg-gray-100'
                  }
                  transition-all duration-300
                `}>
                  <IconComponent 
                    size={18} 
                    className={isActive ? 'text-white' : 'text-gray-700'}
                  />
                </div>

                {/* Label */}
                <span className={`
                  text-xs font-medium
                  ${isActive ? 'text-white' : 'text-gray-700'}
                  transition-colors duration-300
                `}>
                  {item.label}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-2 h-2 bg-white rounded-full shadow-md"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}