import { useLocation } from 'wouter';
import { useTranslation } from '@/lib/i18n';
import { useSidebarState } from './sidebar-state';
import {
  adminSidebarConfig,
  SidebarSection,
  SidebarMenuItem,
  getActiveSectionFromRoute,
} from '@/lib/adminSidebar';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
  /** When true, sidebar is rendered inside the mobile Sheet drawer. Closes drawer on item click. */
  isMobile?: boolean;
}

// Helper: check if user has no permission for a given module
const checkNoPermission = (moduleName: string | undefined, permissions: any): boolean => {
  if (!moduleName || !permissions) return false;
  return permissions.rolePermissions?.[moduleName]?.noPermission === true;
};

export function Sidebar({ className = '', isMobile = false }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { language } = useTranslation();
  const isRTL = language === 'ar';
  const { expandedSections, toggleSection, setIsMobileSidebarOpen } = useSidebarState();

  // Active section based on the current route (used for highlighting)
  const activeSectionId = getActiveSectionFromRoute(location);

  const { data: currentUserPermissions } = useQuery({
    queryKey: ['/api/admin/current-user-permissions'],
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const closeMobileDrawer = () => {
    if (isMobile) setIsMobileSidebarOpen(false);
  };

  const handleItemClick = (item: SidebarMenuItem) => {
    if (item.requiresPermission && currentUserPermissions) {
      if (checkNoPermission(item.requiresPermission, currentUserPermissions)) {
        setLocation(item.permissionRedirect || '/admin-home');
        closeMobileDrawer();
        return;
      }
    }
    setLocation(item.route);
    closeMobileDrawer();
  };

  const handleSectionClick = (section: SidebarSection) => {
    if (section.requiresPermission && currentUserPermissions) {
      if (checkNoPermission(section.requiresPermission, currentUserPermissions)) {
        setLocation(section.permissionRedirect || '/admin-home');
        closeMobileDrawer();
        return;
      }
    }
    if (section.route) {
      setLocation(section.route);
      closeMobileDrawer();
    } else if (section.items) {
      toggleSection(section.id);
    }
  };

  const renderMenuItem = (item: SidebarMenuItem, parentActive: boolean) => {
    const Icon = item.icon;
    const isDisabled = checkNoPermission(item.requiresPermission, currentUserPermissions);
    const isItemActive = parentActive && location.startsWith(item.route.split('?')[0]);

    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item)}
        disabled={isDisabled}
        className={cn(
          'group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md w-full min-h-[44px] transition-colors',
          // In RTL: text on the right, icon on the left (natural Arabic reading order)
          isRTL ? 'flex-row-reverse text-right' : 'text-left',
          isDisabled && 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50',
          !isDisabled && isItemActive && 'bg-blue-50 text-blue-700',
          !isDisabled && !isItemActive && 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="truncate flex-1">{item.i18nKey[language] || item.i18nKey.en}</span>
      </button>
    );
  };

  const renderSection = (section: SidebarSection) => {
    const Icon = section.icon;
    const isExpanded = Boolean(expandedSections[section.id]);
    const isDisabled = checkNoPermission(section.requiresPermission, currentUserPermissions);
    const isActive = activeSectionId === section.id;

    // Active accent border position differs in RTL vs LTR
    const activeBorderClass = isActive && !isDisabled
      ? isRTL
        ? 'border-r-4 border-blue-600 bg-blue-50'
        : 'border-l-4 border-blue-600 bg-blue-50'
      : '';

    if (section.items) {
      // Collapsible section
      return (
        <div key={section.id} className="mb-1">
          <button
            onClick={() => handleSectionClick(section)}
            disabled={isDisabled}
            className={cn(
              'group flex items-center gap-3 px-3 py-3 text-base font-medium rounded-md w-full min-h-[48px] transition-colors',
              // In RTL: reverse so icon sits on the left, text on the right, chevron furthest left
              isRTL ? 'flex-row-reverse text-right' : 'text-left',
              isDisabled && 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50',
              !isDisabled && isActive && 'text-blue-700',
              !isDisabled && !isActive && 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              activeBorderClass
            )}
          >
            <Icon className="h-6 w-6 flex-shrink-0" />
            <span className="flex-1 truncate">
              {section.i18nKey[language] || section.i18nKey.en}
            </span>
            {!isDisabled &&
              (isExpanded ? (
                <ChevronUp className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ))}
          </button>

          {isExpanded && !isDisabled && (
            <div className={cn('mt-1 space-y-1', isRTL ? 'mr-6' : 'ml-6')}>
              {section.items.map((item) => renderMenuItem(item, isActive))}
            </div>
          )}
        </div>
      );
    }

    // Simple link item
    return (
      <button
        key={section.id}
        onClick={() => handleSectionClick(section)}
        disabled={isDisabled}
        className={cn(
          'group flex items-center gap-3 px-3 py-3 text-base font-medium rounded-md w-full mb-1 min-h-[48px] transition-colors',
          isRTL ? 'flex-row-reverse text-right' : 'text-left',
          isDisabled && 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50',
          !isDisabled && isActive && 'text-blue-700',
          !isDisabled && !isActive && 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          activeBorderClass
        )}
      >
        <Icon className="h-6 w-6 flex-shrink-0" />
        <span className="flex-1 truncate">{section.i18nKey[language] || section.i18nKey.en}</span>
      </button>
    );
  };

  return (
    <nav
      className={cn(
        isMobile ? 'flex-1 px-2 py-4 space-y-1 overflow-y-auto' : 'mt-4 px-2',
        className
      )}
    >
      {adminSidebarConfig.map((section) => renderSection(section))}
    </nav>
  );
}

/**
 * Mobile variant — same component, just passes `isMobile=true` to close the drawer on click.
 * Kept as a named export for backwards compatibility with existing imports.
 */
export function MobileSidebar(props: Omit<SidebarProps, 'isMobile'>) {
  return <Sidebar {...props} isMobile={true} />;
}
