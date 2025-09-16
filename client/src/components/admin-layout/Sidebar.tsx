import { useLocation } from 'wouter';
import { useTranslation } from '@/lib/i18n';
import { useSidebarState } from './sidebar-state';
import { adminSidebarConfig, SidebarSection, SidebarMenuItem } from '@/lib/adminSidebar';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Centralized active item styling constants
const ACTIVE_ITEM_STYLES = {
  background: 'bg-gray-100',
  textColor: 'text-gray-700', 
  border: 'border-l-4 border-[#852085]',
  underlineColor: 'bg-[#852085]',
  transition: 'transition-all duration-300'
};

// Helper function to check if an item is active based on current route
const isActiveItem = (itemRoute: string | undefined, currentLocation: string): boolean => {
  if (!itemRoute) return false;
  
  // Handle exact matches first
  if (currentLocation === itemRoute) return true;
  
  // Handle query parameter routes (like /admin-dashboard?tab=reports)
  if (itemRoute.includes('?')) {
    const [baseRoute, queryString] = itemRoute.split('?');
    const currentFullUrl = currentLocation + window.location.search;
    
    // Check if current URL matches the full route with query parameters
    if (currentFullUrl === itemRoute) return true;
    
    // Check if we're on the base route and have the correct query parameters
    if (currentLocation === baseRoute && window.location.search.includes(queryString)) return true;
  }
  
  return false;
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = "" }: SidebarProps) {
  const [location, setLocation] = useLocation();
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
    
    // Centralized active item detection
    const isActive = isActiveItem(item.route, location);

    return (
      <div key={item.id} className="relative">
        <button
          onClick={() => handleItemClick(item, isMobile)}
          disabled={isDisabled}
          className={`group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full ${ACTIVE_ITEM_STYLES.transition} ${
            isDisabled
              ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
              : isActive
              ? `${ACTIVE_ITEM_STYLES.textColor} ${ACTIVE_ITEM_STYLES.background} ${ACTIVE_ITEM_STYLES.border}`
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span>{item.i18nKey[language] || item.i18nKey.en}</span>
        </button>
        
        {/* Animated underline for active items */}
        <div 
          className={`absolute bottom-0 left-2 right-2 h-0.5 ${ACTIVE_ITEM_STYLES.underlineColor} transition-all duration-300 ease-in-out ${
            isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`}
        />
      </div>
    );
  };

  const renderSection = (section: SidebarSection, isMobile: boolean = false) => {
    const Icon = section.icon;
    const isExpanded = Boolean(expandedSections[section.id]);
    const isActive = isActiveItem(section.route, location);

    if (section.items) {
      // Collapsible section with subitems
      return (
        <div key={section.id} className="mb-2">
          <button
            onClick={() => handleSectionClick(section, isMobile)}
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
              {section.items.map(item => renderMenuItem(item, isMobile))}
            </div>
          )}
        </div>
      );
    } else {
      // Simple navigation item
      return (
        <div key={section.id} className="relative mb-2">
          <button
            onClick={() => handleSectionClick(section, isMobile)}
            className={`group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full ${ACTIVE_ITEM_STYLES.transition} ${
              isActive
                ? `${ACTIVE_ITEM_STYLES.textColor} ${ACTIVE_ITEM_STYLES.background} ${ACTIVE_ITEM_STYLES.border}`
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className="h-6 w-6 flex-shrink-0" />
            <span>{section.i18nKey[language] || section.i18nKey.en}</span>
          </button>
          
          {/* Animated underline for active sections */}
          <div 
            className={`absolute bottom-0 left-2 right-2 h-0.5 ${ACTIVE_ITEM_STYLES.underlineColor} transition-all duration-300 ease-in-out ${
              isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
            }`}
          />
        </div>
      );
    }
  };

  return (
    <nav className={`mt-4 px-2 ${className}`}>
      {adminSidebarConfig.map(section => renderSection(section))}
    </nav>
  );
}

// Mobile version that passes the mobile flag
export function MobileSidebar({ className = "" }: SidebarProps) {
  const [location, setLocation] = useLocation();
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
    
    // Centralized active item detection
    const isActive = isActiveItem(item.route, location);

    return (
      <div key={item.id} className="relative">
        <button
          onClick={() => handleItemClick(item)}
          disabled={isDisabled}
          className={`group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full ${ACTIVE_ITEM_STYLES.transition} ${
            isDisabled
              ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
              : isActive
              ? `${ACTIVE_ITEM_STYLES.textColor} ${ACTIVE_ITEM_STYLES.background} ${ACTIVE_ITEM_STYLES.border}`
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span>{item.i18nKey[language] || item.i18nKey.en}</span>
        </button>
        
        {/* Animated underline for active items */}
        <div 
          className={`absolute bottom-0 left-2 right-2 h-0.5 ${ACTIVE_ITEM_STYLES.underlineColor} transition-all duration-300 ease-in-out ${
            isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`}
        />
      </div>
    );
  };

  const renderSection = (section: SidebarSection) => {
    const Icon = section.icon;
    const isExpanded = Boolean(expandedSections[section.id]);
    const isActive = isActiveItem(section.route, location);

    if (section.items) {
      // Collapsible section with subitems
      return (
        <div key={section.id} className="mb-2">
          <button
            onClick={() => handleSectionClick(section)}
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
              {section.items.map(item => renderMenuItem(item))}
            </div>
          )}
        </div>
      );
    } else {
      // Simple navigation item
      return (
        <div key={section.id} className="relative mb-2">
          <button
            onClick={() => handleSectionClick(section)}
            className={`group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full ${ACTIVE_ITEM_STYLES.transition} ${
              isActive
                ? `${ACTIVE_ITEM_STYLES.textColor} ${ACTIVE_ITEM_STYLES.background} ${ACTIVE_ITEM_STYLES.border}`
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className="h-6 w-6 flex-shrink-0" />
            <span>{section.i18nKey[language] || section.i18nKey.en}</span>
          </button>
          
          {/* Animated underline for active sections */}
          <div 
            className={`absolute bottom-0 left-2 right-2 h-0.5 ${ACTIVE_ITEM_STYLES.underlineColor} transition-all duration-300 ease-in-out ${
              isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
            }`}
          />
        </div>
      );
    }
  };

  return (
    <nav className={`flex-1 px-2 py-4 space-y-1 ${className}`}>
      {adminSidebarConfig.map(section => renderSection(section))}
    </nav>
  );
}