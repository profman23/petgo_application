import { useLocation } from 'wouter';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import newButtonsImage from '@assets/freepik__background__89215_1751365610576.png';

export function FixedFooter() {
  const [location, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);

  const navigationItems = [
    {
      id: 'home',
      path: '/',
      label: language === 'ar' ? 'الرئيسية' : 'Home',
      bgColor: 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900',
      hoverColor: 'hover:from-purple-800 hover:via-purple-900 hover:to-purple-950',
      icon: '🏠'
    },
    {
      id: 'activity',
      path: '/activity',
      label: language === 'ar' ? 'النشاط' : 'Activity',
      bgColor: 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500',
      hoverColor: 'hover:from-gray-400 hover:via-gray-500 hover:to-gray-600',
      icon: '🐾'
    },
    {
      id: 'account',
      path: '/account',
      label: language === 'ar' ? 'الحساب' : 'Account',
      bgColor: 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900',
      hoverColor: 'hover:from-purple-800 hover:via-purple-900 hover:to-purple-950',
      icon: '🐱'
    }
  ];

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-3 px-6">
          {navigationItems.map((item) => {
            const isActive = location === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex flex-col items-center justify-center 
                  px-6 py-4 rounded-2xl min-w-[90px] relative
                  transition-all duration-300 ease-in-out
                  transform hover:scale-105 active:scale-95
                  ${item.bgColor} ${item.hoverColor}
                  shadow-lg hover:shadow-xl
                  ${isActive 
                    ? 'ring-4 ring-white ring-opacity-50 scale-105' 
                    : 'hover:ring-2 hover:ring-white hover:ring-opacity-30'
                  }
                `}
                style={{ 
                  textAlign: 'center'
                }}
              >
                {/* 3D Icon Container */}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center mb-2
                  bg-white/20 backdrop-blur-sm border border-white/30
                  shadow-inner transition-all duration-300
                  ${isActive ? 'bg-white/30 shadow-lg' : ''}
                `}>
                  <span className={`text-2xl filter drop-shadow-sm ${
                    item.id === 'activity' ? 'text-purple-800' : ''
                  }`}>
                    {item.icon}
                  </span>
                </div>

                {/* Label with 3D Effect */}
                <span className={`
                  text-sm font-bold text-white
                  filter drop-shadow-md
                  transition-all duration-300
                  ${isActive ? 'text-shadow-lg' : ''}
                `}>
                  {item.label}
                </span>

                {/* Shine Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Active Glow */}
                {isActive && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl blur-sm"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}