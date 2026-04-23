import { ReactNode, useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, getDirection } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { LanguageSelector } from '@/components/language-selector';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarStateProvider, useSidebarState } from './sidebar-state';
import { Sidebar, MobileSidebar } from './Sidebar';
import { LogOut, Bell, Volume2, VolumeX, Menu } from 'lucide-react';
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const { language } = useTranslation();
  const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useSidebarState();
  const isMobile = useIsMobile();
  
  // State for tracking notifications and audio
  const [audioEnabled, setAudioEnabled] = useState(true);
  const lastRequestCountRef = useRef(0);
  const [currentRequestCount, setCurrentRequestCount] = useState(0);

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation]);

  // Fetch VetsVan requests for notification count
  const { data: vetsVanRequests = [] } = useQuery({
    queryKey: ['/api/admin/vetsvan-requests'],
    refetchInterval: 5000,
  });

  // Update request count and handle audio notifications
  useEffect(() => {
    const requests = vetsVanRequests as any[];
    const newCount = requests.length;
    setCurrentRequestCount(newCount);

    // Play notification sound if count increased and audio is enabled
    if (newCount > lastRequestCountRef.current && audioEnabled && lastRequestCountRef.current > 0) {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUX7Tr3ZdKDgxOqOXwugwBAAABhYuCZFxddJmtrI9kODNdotLfpWEbCEGX2OzNdCYELIHN8tiJOAcZZ7zr4p9NERAAAAAA');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignore audio play errors (browser restrictions)
        });
      } catch (error) {
        // Ignore audio errors
      }
    }

    lastRequestCountRef.current = newCount;
  }, [vetsVanRequests, audioEnabled]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setLocation("/admin-login");
  };

  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-gray-50" dir={getDirection(language)}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2 sm:py-3 md:py-4 gap-2">
            {/* Logo + Mobile Menu */}
            <div className="flex items-center gap-2 min-w-0">
              {/* Mobile Menu Trigger (hidden on desktop) */}
              <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                <SheetTrigger asChild>
                  <button
                    className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex-shrink-0"
                    aria-label="Menu"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side={isRTL ? 'right' : 'left'}
                  className="w-72 sm:w-80 p-0"
                  dir={getDirection(language)}
                >
                  <div className="flex flex-col h-full bg-white" dir={getDirection(language)}>
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-2">
                        <img
                          src={vetsVanLogo}
                          alt="PetGo Logo"
                          className="h-10 w-auto object-contain"
                        />
                        <span className="text-lg font-semibold text-blue-800">PetGo</span>
                      </div>
                    </div>
                    <MobileSidebar />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Logo — responsive */}
              <img
                src={vetsVanLogo}
                alt="PetGo"
                className="h-10 sm:h-14 md:h-16 lg:h-20 w-auto object-contain"
              />
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
              {/* Language Selector — hidden on smallest screen to save space */}
              <div className="hidden sm:block">
                <LanguageSelector />
              </div>

              {/* Audio Toggle */}
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                title={audioEnabled ? 'Disable Audio Notifications' : 'Enable Audio Notifications'}
                aria-label="Toggle audio notifications"
              >
                {audioEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </button>

              {/* Notifications */}
              <button
                onClick={() => setLocation('/admin-vetsvan-requests')}
                className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {currentRequestCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {currentRequestCount > 99 ? '99+' : currentRequestCount}
                  </span>
                )}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                title={language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block md:w-56 lg:w-64 bg-white shadow-lg min-h-screen shrink-0">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-screen min-w-0 overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarStateProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </SidebarStateProvider>
  );
}