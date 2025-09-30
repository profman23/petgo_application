import { useLocation } from 'wouter';
import { useTranslation } from '@/lib/i18n';
import { useSidebarState } from './sidebar-state';
import { adminSidebarConfig, SidebarSection, SidebarMenuItem } from '@/lib/adminSidebar';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useScreenPermissions } from '@/hooks/useScreenPermissions';

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
  isExpanded
}: { 
  section: SidebarSection; 
  isMobile?: boolean;
  onSectionClick: (section: SidebarSection, isMobile: boolean) => void;
  onItemClick: (item: SidebarMenuItem, isMobile: boolean) => void;
  isExpanded: boolean;
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
    // Filter out items that the user doesn't have access to
    const accessibleItems = section.items.filter(item => {
      if (!item.screenId) return true;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { hasAccess } = useScreenPermissions(item.screenId);
      return hasAccess;
    });

    // Hide section completely if no accessible items
    if (accessibleItems.length === 0) {
      return null;
    }

    // Collapsible section with subitems
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
  const { language } = useTranslation();
  const { expandedSections, toggleSection, setIsMobileSidebarOpen } = useSidebarState();

  // Fetch current user permissions for conditional rendering
  const { data: currentUserPermissions } = useQuery({
    queryKey: ['/api/admin/current-user-permissions'],
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const handleItemClick = (item: SidebarMenuItem, isMobile: boolean = false) => {
    // Check permissions if required
    if (item.requiresPermission && currentUserPermissions) {
      const permissions = currentUserPermissions as any;
      if (permissions[item.requiresPermission] === true) {
        setLocation(item.permissionRedirect || '/admin-home');
        if (isMobile) setIsMobileSidebarOpen(false);
        return;
      }
    }

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

  const renderMenuItem = (item: SidebarMenuItem, isMobile: boolean = false) => {
    const Icon = item.icon;
    const permissions = currentUserPermissions as any;
    const isDisabled = Boolean(item.requiresPermission && 
      currentUserPermissions && 
      permissions[item.requiresPermission] === true);

    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item, isMobile)}
        disabled={isDisabled}
        className={`group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full ${
          isDisabled
            ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
        }`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span>{item.i18nKey[language] || item.i18nKey.en}</span>
      </button>
    );
  };

  const renderSection = (section: SidebarSection, isMobile: boolean = false) => {
    const Icon = section.icon;
    const isExpanded = Boolean(expandedSections[section.id]);
    const permissions = currentUserPermissions as any;
    const isDisabled = Boolean(section.requiresPermission && 
      currentUserPermissions && 
      permissions[section.requiresPermission] === true);

    if (section.items) {
      // Collapsible section with subitems
      return (
        <div key={section.id} className="mb-2">
          <button
            onClick={() => handleSectionClick(section, isMobile)}
            disabled={isDisabled}
            className={`group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full ${
              isDisabled
                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className="h-6 w-6 flex-shrink-0" />
            <span className="flex-1 text-left whitespace-nowrap">
              {section.i18nKey[language] || section.i18nKey.en}
            </span>
            {!isDisabled && (isExpanded ? (
              <ChevronUp className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ))}
          </button>
          
          {isExpanded && !isDisabled && (
            <div className="ml-6 mt-1 space-y-1">
              {section.items.map(item => renderMenuItem(item, isMobile))}
            </div>
          )}
        </div>
      );
    } else {
      // Simple navigation item - now with permission checking
      return (
        <button
          key={section.id}
          onClick={() => handleSectionClick(section, isMobile)}
          disabled={isDisabled}
          className={`group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 ${
            isDisabled
              ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Icon className="h-6 w-6 flex-shrink-0" />
          <span>{section.i18nKey[language] || section.i18nKey.en}</span>
        </button>
      );
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
        />
      ))}
    </nav>
  );
}

// Mobile version that passes the mobile flag
export function MobileSidebar({ className = "" }: SidebarProps) {
  const [, setLocation] = useLocation();
  const { language } = useTranslation();
  const { expandedSections, toggleSection, setIsMobileSidebarOpen } = useSidebarState();

  // Fetch current user permissions for conditional rendering
  const { data: currentUserPermissions } = useQuery({
    queryKey: ['/api/admin/current-user-permissions'],
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const handleItemClick = (item: SidebarMenuItem) => {
    // Check permissions if required
    if (item.requiresPermission && currentUserPermissions) {
      const permissions = currentUserPermissions as any;
      if (permissions[item.requiresPermission] === true) {
        setLocation(item.permissionRedirect || '/admin-home');
        setIsMobileSidebarOpen(false);
        return;
      }
    }

    setLocation(item.route);
    setIsMobileSidebarOpen(false);
  };

  const handleSectionClick = (section: SidebarSection) => {
    // Check permissions if required
    if (section.requiresPermission && currentUserPermissions) {
      const permissions = currentUserPermissions as any;
      if (permissions[section.requiresPermission] === true) {
        setLocation(section.permissionRedirect || '/admin-home');
        setIsMobileSidebarOpen(false);
        return;
      }
    }

    if (section.route) {
      setLocation(section.route);
      setIsMobileSidebarOpen(false);
    } else if (section.items) {
      toggleSection(section.id);
    }
  };

  const renderMenuItem = (item: SidebarMenuItem) => {
    const Icon = item.icon;
    const permissions = currentUserPermissions as any;
    const isDisabled = Boolean(item.requiresPermission && 
      currentUserPermissions && 
      permissions[item.requiresPermission] === true);

    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item)}
        disabled={isDisabled}
        className={`group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full ${
          isDisabled
            ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
        }`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span>{item.i18nKey[language] || item.i18nKey.en}</span>
      </button>
    );
  };

  const renderSection = (section: SidebarSection) => {
    const Icon = section.icon;
    const isExpanded = Boolean(expandedSections[section.id]);
    const permissions = currentUserPermissions as any;
    const isDisabled = Boolean(section.requiresPermission && 
      currentUserPermissions && 
      permissions[section.requiresPermission] === true);

    if (section.items) {
      // Collapsible section with subitems
      return (
        <div key={section.id} className="mb-2">
          <button
            onClick={() => handleSectionClick(section)}
            disabled={isDisabled}
            className={`group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full ${
              isDisabled
                ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className="h-6 w-6 flex-shrink-0" />
            <span className="flex-1 text-left whitespace-nowrap">
              {section.i18nKey[language] || section.i18nKey.en}
            </span>
            {!isDisabled && (isExpanded ? (
              <ChevronUp className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ))}
          </button>
          
          {isExpanded && !isDisabled && (
            <div className="ml-6 mt-1 space-y-1">
              {section.items.map(item => renderMenuItem(item))}
            </div>
          )}
        </div>
      );
    } else {
      // Simple navigation item - now with permission checking
      return (
        <button
          key={section.id}
          onClick={() => handleSectionClick(section)}
          disabled={isDisabled}
          className={`group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 ${
            isDisabled
              ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Icon className="h-6 w-6 flex-shrink-0" />
          <span>{section.i18nKey[language] || section.i18nKey.en}</span>
        </button>
      );
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
        />
      ))}
    </nav>
  );
}