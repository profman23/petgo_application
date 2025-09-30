import { useLocation } from 'wouter';
import { useTranslation } from '@/lib/i18n';
import { useSidebarState } from './sidebar-state';
import { adminSidebarConfig, SidebarSection, SidebarMenuItem } from '@/lib/adminSidebar';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useScreenPermissions } from '@/hooks/useScreenPermissions';
import { getPermissionFields } from '@/lib/permissionMapping';

interface SidebarProps {
  className?: string;
}

// Helper component to check permissions and conditionally render menu items
function PermissionGatedMenuItem({ 
  item, 
  isMobile = false,
  onItemClick
}: { 
  item: SidebarMenuItem; 
  isMobile?: boolean;
  onItemClick: (item: SidebarMenuItem, isMobile: boolean) => void;
}) {
  const { language } = useTranslation();
  const Icon = item.icon;
  
  // Check permissions if screenId is provided
  const { hasAccess } = useScreenPermissions(item.screenId || '');
  
  // Hide item if it has a screenId and user doesn't have access
  if (item.screenId && !hasAccess) {
    return null;
  }

  return (
    <button
      key={item.id}
      onClick={() => onItemClick(item, isMobile)}
      className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span>{item.i18nKey[language] || item.i18nKey.en}</span>
    </button>
  );
}

// Helper component to check permissions for sections
function PermissionGatedSection({ 
  section, 
  isMobile = false,
  onSectionClick,
  onItemClick,
  isExpanded,
  userPermissions
}: { 
  section: SidebarSection; 
  isMobile?: boolean;
  onSectionClick: (section: SidebarSection, isMobile: boolean) => void;
  onItemClick: (item: SidebarMenuItem, isMobile: boolean) => void;
  isExpanded: boolean;
  userPermissions: any;
}) {
  const { language } = useTranslation();
  const Icon = section.icon;
  
  // Check permissions if screenId is provided
  const { hasAccess } = useScreenPermissions(section.screenId || '');
  
  // Hide section if it has a screenId and user doesn't have access
  if (section.screenId && !hasAccess) {
    return null;
  }

  if (section.items) {
    // Collapsible section with subitems
    // Pre-compute which items are accessible to determine if section should be shown
    const accessibleItemsCount = section.items.filter(item => {
      if (!item.screenId) return true;
      
      // Manually check permissions using passed permissions data
      const permFields = getPermissionFields(item.screenId);
      if (!permFields || !userPermissions) return false;
      
      // Check if item is blocked
      let isBlocked = false;
      if (permFields.hidden && userPermissions[permFields.hidden] === true) {
        isBlocked = true;
      }
      if (permFields.noPermission && userPermissions[permFields.noPermission] === true) {
        isBlocked = true;
      }
      
      // Check if has read or full control
      const hasRead = permFields.read ? userPermissions[permFields.read] === true : false;
      const hasFullControl = userPermissions[permFields.fullControl] === true;
      
      return !isBlocked && (hasRead || hasFullControl);
    }).length;

    // Hide section if no accessible items
    if (accessibleItemsCount === 0) {
      return null;
    }

    return (
      <div key={section.id} className="mb-2">
        <button
          onClick={() => onSectionClick(section, isMobile)}
          className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <Icon className="h-6 w-6 flex-shrink-0" />
          <span className="flex-1 text-left whitespace-nowrap">
            {section.i18nKey[language] || section.i18nKey.en}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          )}
        </button>
        
        {isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {section.items.map(item => (
              <PermissionGatedMenuItem 
                key={item.id}
                item={item} 
                isMobile={isMobile}
                onItemClick={onItemClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  } else {
    // Simple navigation item
    return (
      <button
        key={section.id}
        onClick={() => onSectionClick(section, isMobile)}
        className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      >
        <Icon className="h-6 w-6 flex-shrink-0" />
        <span>{section.i18nKey[language] || section.i18nKey.en}</span>
      </button>
    );
  }
}

export function Sidebar({ className = "" }: SidebarProps) {
  const [, setLocation] = useLocation();
  const { expandedSections, toggleSection, setIsMobileSidebarOpen } = useSidebarState();

  // Fetch user permissions once for the entire sidebar
  const { data: currentUserPermissions } = useQuery({
    queryKey: ['/api/admin/current-user-permissions'],
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const handleItemClick = (item: SidebarMenuItem, isMobile: boolean = false) => {
    setLocation(item.route);
    if (isMobile) setIsMobileSidebarOpen(false);
  };

  const handleSectionClick = (section: SidebarSection, isMobile: boolean = false) => {
    if (section.route) {
      setLocation(section.route);
      if (isMobile) setIsMobileSidebarOpen(false);
    } else if (section.items) {
      toggleSection(section.id);
    }
  };

  return (
    <nav className={`mt-4 px-2 ${className}`}>
      {adminSidebarConfig.map(section => (
        <PermissionGatedSection
          key={section.id}
          section={section}
          isMobile={false}
          onSectionClick={handleSectionClick}
          onItemClick={handleItemClick}
          isExpanded={Boolean(expandedSections[section.id])}
          userPermissions={currentUserPermissions}
        />
      ))}
    </nav>
  );
}

// Mobile version that passes the mobile flag
export function MobileSidebar({ className = "" }: SidebarProps) {
  const [, setLocation] = useLocation();
  const { expandedSections, toggleSection, setIsMobileSidebarOpen } = useSidebarState();

  // Fetch user permissions once for the entire sidebar
  const { data: currentUserPermissions } = useQuery({
    queryKey: ['/api/admin/current-user-permissions'],
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const handleItemClick = (item: SidebarMenuItem) => {
    setLocation(item.route);
    setIsMobileSidebarOpen(false);
  };

  const handleSectionClick = (section: SidebarSection) => {
    if (section.route) {
      setLocation(section.route);
      setIsMobileSidebarOpen(false);
    } else if (section.items) {
      toggleSection(section.id);
    }
  };

  return (
    <nav className={`flex-1 px-2 py-4 space-y-1 ${className}`}>
      {adminSidebarConfig.map(section => (
        <PermissionGatedSection
          key={section.id}
          section={section}
          isMobile={true}
          onSectionClick={handleSectionClick}
          onItemClick={handleItemClick}
          isExpanded={Boolean(expandedSections[section.id])}
          userPermissions={currentUserPermissions}
        />
      ))}
    </nav>
  );
}