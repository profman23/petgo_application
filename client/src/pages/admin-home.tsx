import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Car, Clock, TrendingUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";

// Declare lord-icon custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any;
    }
  }
}

export default function AdminHome() {
  const [, setLocation] = useLocation();
  const { language } = useTranslation();

  // Lord-icon animation trigger state - continuous smooth animation
  const [triggerAnimation] = useState("loop");

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation]);

  // Fetch current user permissions
  const adminToken = localStorage.getItem("adminToken");
  const { data: currentUserPermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["/api/admin/current-user-permissions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/current-user-permissions", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch permissions");
      return response.json();
    },
    enabled: !!adminToken,
  });

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            {/* Lord Icon */}
            <div className="flex-shrink-0">
              <lord-icon
                src="https://cdn.lordicon.com/hfadyleu.json"
                trigger={triggerAnimation}
                colors="primary:#852085,secondary:#848484"
                style={{ width: '80px', height: '80px' }}
              />
            </div>
            
            {/* Welcome Username */}
            <h1 className="text-2xl font-bold text-gray-600" style={{ fontFamily: 'Arimo' }}>
              {currentUserPermissions?.username 
                ? (language === 'ar' 
                   ? `مرحباً ${currentUserPermissions.username}` 
                   : `Welcome ${currentUserPermissions.username}`)
                : (language === 'ar' ? 'مرحباً Admin' : 'Welcome Admin')
              }
            </h1>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (currentUserPermissions && (currentUserPermissions as any).vetsVanShiftsHidden === true) {
                  setLocation('/admin-home');
                } else {
                  setLocation('/vets-van-shifts');
                }
              }}
              disabled={permissionsLoading || !currentUserPermissions}
              className={`flex flex-col items-center p-4 border border-gray-200 rounded-lg transition-colors ${
                permissionsLoading || !currentUserPermissions
                  ? 'bg-gray-100 cursor-not-allowed opacity-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <Car className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">
                {language === 'ar' ? 'إدارة العيادات' : 'Manage VetsVans'}
              </span>
            </button>

            <button
              onClick={() => setLocation('/admin-vetsvan-requests')}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Clock className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">
                {language === 'ar' ? 'عرض الطلبات' : 'View Requests'}
              </span>
            </button>

            <button
              onClick={() => setLocation('/new-reports-analytics')}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">
                {language === 'ar' ? 'التحليلات' : 'Analytics'}
              </span>
            </button>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            {language === 'ar' ? 'معلومات مهمة' : 'Important Information'}
          </h3>
          <p className="text-blue-800">
            {language === 'ar'
              ? 'هذه الصفحة الرئيسية جاهزة للتوسع المستقبلي. يمكنك الوصول إلى جميع الوظائف الإدارية من الشريط الجانبي أو الإجراءات السريعة أعلاه.'
              : 'This home page is ready for future expansion. You can access all administrative functions from the sidebar navigation or the quick actions above.'
            }
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}