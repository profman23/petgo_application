import { Home, Users, DollarSign, Handshake, Car, Clock, BarChart3, TrendingUp, FileText, Upload, Package, Stethoscope, User, Receipt, ArrowDownLeft, ArrowUpRight, Calendar, BanknoteArrowUp, BanknoteArrowDown, ArrowUpDown, ReceiptText } from "lucide-react";

export interface SidebarMenuItem {
  id: string;
  i18nKey: { en: string; ar: string };
  route: string;
  icon: any;
  requiresPermission?: string;
  permissionRedirect?: string;
}

export interface SidebarSection {
  id: string;
  i18nKey: { en: string; ar: string };
  icon: any;
  items?: SidebarMenuItem[];
  route?: string;
  requiresPermission?: string;
  permissionRedirect?: string;
}

export const adminSidebarConfig: SidebarSection[] = [
  // Home Page
  {
    id: "home",
    i18nKey: { en: "Home Page", ar: "الصفحة الرئيسية" },
    icon: Home,
    route: "/admin-home"
  },
  
  // Administration Module
  {
    id: "administration",
    i18nKey: { en: "Administration", ar: "الإدارة" },
    icon: Users,
    items: [
      {
        id: "users",
        i18nKey: { en: "Users", ar: "المستخدمين" },
        route: "/administration/users",
        icon: User,
        requiresPermission: "usersHidden",
        permissionRedirect: "/admin-home"
      },
      {
        id: "authorization",
        i18nKey: { en: "Authorization", ar: "الصلاحيات" },
        route: "/administration/authorization",
        icon: User
      }
    ]
  },
  
  // Financial Module
  {
    id: "financial",
    i18nKey: { en: "Financial", ar: "المالية" },
    icon: DollarSign,
    items: [
      {
        id: "credit-note",
        i18nKey: { en: "Credit Note", ar: "إشعار دائن" },
        route: "/financial/credit-note",
        icon: Receipt,
        requiresPermission: "creditNoteNoPermission",
        permissionRedirect: "/admin-home"
      },
      {
        id: "credit-notes",
        i18nKey: { en: "Credit Notes", ar: "إشعارات دائنة" },
        route: "/financial/credit-notes",
        icon: ReceiptText,
        requiresPermission: "creditNoteNoPermission",
        permissionRedirect: "/admin-home"
      },
      {
        id: "outgoing-payment",
        i18nKey: { en: "Outgoing Payment", ar: "الدفع الصادر" },
        route: "/financial/outgoing-payment",
        icon: BanknoteArrowDown
      },
      {
        id: "income-payment",
        i18nKey: { en: "Income Payment", ar: "الدفع الوارد" },
        route: "/financial/income-payment",
        icon: BanknoteArrowUp
      },
      {
        id: "ar-balance",
        i18nKey: { en: "A/R Balance", ar: "رصيد الحسابات المدينة" },
        route: "/financial/ar-balance",
        icon: ArrowUpDown
      },
    ]
  },
  
  // Business Partner Module
  {
    id: "business-partner",
    i18nKey: { en: "Business Partner", ar: "شريك الأعمال" },
    icon: Handshake,
    items: [
      {
        id: "partner-management",
        i18nKey: { en: "Partner Management", ar: "إدارة الشركاء" },
        route: "/business-partner/partner-management",
        icon: Users
      },
    ]
  },
  
  // VetsVan Management
  {
    id: "vetsvan-management",
    i18nKey: { en: "VetsVan Management", ar: "إدارة VETS VAN" },
    icon: Car,
    route: "/admin-dashboard"
  },
  
  // Vets Van Shifts
  {
    id: "vets-van-shifts",
    i18nKey: { en: "Vets Van Shifts", ar: "نوبات VETS VAN" },
    icon: Clock,
    route: "/vets-van-shifts"
  },
  
  // Reports
  {
    id: "reports",
    i18nKey: { en: "Reports", ar: "التقارير" },
    icon: BarChart3,
    route: "/admin-dashboard?tab=reports"
  },
  
  // New Reports & Analytics
  {
    id: "new-reports",
    i18nKey: { en: "New Reports & Analytics", ar: "تقارير وتحليلات جديدة" },
    icon: TrendingUp,
    items: [
      {
        id: "sales-report",
        i18nKey: { en: "Sales Report", ar: "تقرير المبيعات" },
        route: "/new-reports-analytics/sales-report",
        icon: BarChart3
      }
    ]
  },
  
  // Vets Van Requests
  {
    id: "vets-van-requests",
    i18nKey: { en: "Vets Van Requests", ar: "طلبات VETS VAN" },
    icon: FileText,
    route: "/admin-vetsvan-requests"
  },
  
  // Import
  {
    id: "import",
    i18nKey: { en: "Import", ar: "استيراد" },
    icon: Upload,
    route: "/admin-dashboard/import",
    requiresPermission: "importHidden",
    permissionRedirect: "/admin-home"
  },
  
  // Services
  {
    id: "services",
    i18nKey: { en: "Services", ar: "الخدمات" },
    icon: Stethoscope,
    route: "/admin-dashboard/services",
    requiresPermission: "servicesHidden",
    permissionRedirect: "/admin-home"
  },
  
  // Products
  {
    id: "products",
    i18nKey: { en: "Products", ar: "المنتجات" },
    icon: Package,
    route: "/admin-dashboard/products"
  }
];

// Helper function to get the active section based on current route
export const getActiveSectionFromRoute = (currentPath: string): string | null => {
  // Check for exact route matches first
  for (const section of adminSidebarConfig) {
    if (section.route === currentPath) {
      return section.id;
    }
    
    // Check items if section has them
    if (section.items) {
      for (const item of section.items) {
        if (item.route === currentPath) {
          return section.id;
        }
      }
    }
  }
  
  // Fallback for partial matches (e.g., query parameters)
  for (const section of adminSidebarConfig) {
    if (section.route && currentPath.startsWith(section.route.split('?')[0])) {
      return section.id;
    }
    
    if (section.items) {
      for (const item of section.items) {
        if (currentPath.startsWith(item.route.split('?')[0])) {
          return section.id;
        }
      }
    }
  }
  
  return null;
};

// Helper function to determine default expanded sections based on current route
export const getDefaultExpandedSections = (currentPath: string): Record<string, boolean> => {
  const activeSection = getActiveSectionFromRoute(currentPath);
  
  const defaults: Record<string, boolean> = {
    administration: false,
    financial: false,
    "business-partner": false,
    "new-reports": false
  };
  
  // Expand the section that contains the current route
  if (activeSection && adminSidebarConfig.find(s => s.id === activeSection)?.items) {
    defaults[activeSection] = true;
  }
  
  return defaults;
};