import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Home, 
  Car, 
  Package, 
  Stethoscope, 
  Clock, 
  FileText, 
  Upload, 
  Users, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useTranslation } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';

export function AdminSidebar() {
  const [location, setLocation] = useLocation();
  const { language } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fetch user permissions
  const { data: userPermissions } = useQuery({
    queryKey: ['/api/admin/current-user-permissions'],
    staleTime: 5 * 60 * 1000,
    enabled: !!localStorage.getItem('adminToken'),
  });

  // Get the persistent sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('adminSidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(newState));
  };

  // Check permissions
  const isSuperAdmin = (userPermissions as any)?.username === 'admin';
  const canViewProducts = isSuperAdmin || !(userPermissions as any)?.productsHidden;
  const canViewServices = isSuperAdmin || !(userPermissions as any)?.servicesHidden;
  const canViewVetsVan = isSuperAdmin || !(userPermissions as any)?.vetsVanHidden;
  const canViewImport = isSuperAdmin || !(userPermissions as any)?.importHidden;

  // Navigation items with permission checks
  const navigationItems = [
    {
      id: 'home',
      path: '/admin-home',
      label: language === 'ar' ? 'الرئيسية' : 'Home Page',
      icon: Home,
      visible: true
    },
    {
      id: 'management',
      path: '/vets-van/management', // Updated path for VetsVan Management
      label: language === 'ar' ? 'إدارة VETS VAN' : 'VETS VAN Management',
      icon: Car,
      visible: canViewVetsVan
    },
    {
      id: 'products',
      path: '/admin-dashboard/products',
      label: language === 'ar' ? 'إدارة المنتجات' : 'Products',
      icon: Package,
      visible: canViewProducts
    },
    {
      id: 'services',
      path: '/admin-dashboard/services',
      label: language === 'ar' ? 'إدارة الخدمات' : 'Services',
      icon: Stethoscope,
      visible: canViewServices
    },
    {
      id: 'shifts',
      path: '/vets-van-shifts',
      label: language === 'ar' ? 'مناوبات VETS VAN' : 'VetsVan Shifts',
      icon: Clock,
      visible: canViewVetsVan
    },
    {
      id: 'requests',
      path: '/admin-vetsvan-requests',
      label: language === 'ar' ? 'طلبات VETS VAN' : 'VetsVan Requests',
      icon: FileText,
      visible: canViewVetsVan
    },
    {
      id: 'import',
      path: '/admin-dashboard/import',
      label: language === 'ar' ? 'استيراد البيانات' : 'Import',
      icon: Upload,
      visible: canViewImport
    },
    {
      id: 'users',
      path: '/administration/users',
      label: language === 'ar' ? 'إدارة المستخدمين' : 'User Management',
      icon: Users,
      visible: isSuperAdmin
    },
    {
      id: 'authorization',
      path: '/administration/authorization',
      label: language === 'ar' ? 'إدارة الصلاحيات' : 'Authorization',
      icon: Settings,
      visible: isSuperAdmin
    },
    {
      id: 'analytics',
      path: '/new-reports-analytics',
      label: language === 'ar' ? 'التقارير والتحليلات' : 'Reports & Analytics',
      icon: BarChart3,
      visible: true
    }
  ];

  // Filter visible navigation items
  const visibleItems = navigationItems.filter(item => item.visible);

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <Sidebar 
      collapsible={isCollapsed ? "icon" : "none"}
      className="border-r border-gray-200"
    >
      <SidebarHeader className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">
              {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            {isCollapsed ? 
              <ChevronRight className="h-4 w-4" /> : 
              <ChevronLeft className="h-4 w-4" />
            }
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-auto">
        <SidebarMenu className="p-2">
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => handleNavigation(item.path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${location === item.path
                    ? 'bg-purple-50 border-l-4 border-purple-600 text-purple-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                  ${(userPermissions as any)?.[item.id + 'Hidden'] && !isSuperAdmin 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                  }
                `}
                disabled={(userPermissions as any)?.[item.id + 'Hidden'] && !isSuperAdmin}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-4">
        {!isCollapsed && (
          <div className="text-xs text-gray-500">
            {language === 'ar' ? 'نظام إدارة VETS VAN' : 'VETS VAN Management System'}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}