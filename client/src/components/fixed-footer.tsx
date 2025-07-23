import { useLocation } from 'wouter';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import newButtonsImage from '@assets/freepik__background__89215_1751365610576.png';
import whatsappIcon from '@assets/freepik__background__20710_1752913557710.png';
import phoneIcon from '@assets/freepik__a-modern-and-sleek-smartphone-icon-in-dark-mauve-c__20709_1752913557712.png';

export function FixedFooter() {
  const [location, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);

  const navigationItems = [
    {
      id: 'account',
      path: '/account',
      label: language === 'ar' ? 'الحساب' : 'Account',
      bgColor: 'bg-gradient-to-br from-purple-600 via-#852085 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:via-#852085 hover:#852085950',
      icon: '🐱'
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
      id: 'home',
      path: '/home',
      label: language === 'ar' ? 'الرئيسية' : 'Home',
      bgColor: 'bg-gradient-to-br from-purple-600 via-#852085 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:via-#852085 hover:#852085950',
      icon: '🏠'
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
                  px-6 py-4 rounded-2xl min-w-[90px]
                  ${item.bgColor}
                  ${isActive ? 'opacity-100' : 'opacity-80'}
                `}
                style={{ 
                  textAlign: 'center'
                }}
              >
                {/* Simple Icon Container */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2">
                  <span className={`text-2xl ${
                    item.id === 'activity' ? 'text-purple-600' : ''
                  }`}>
                    {item.icon}
                  </span>
                </div>

                {/* Simple Label */}
                <span className="text-sm font-bold text-white" style={{
                  fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}