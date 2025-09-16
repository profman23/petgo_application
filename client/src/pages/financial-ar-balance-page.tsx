import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import { useTranslation } from "@/lib/i18n";

export default function FinancialARBalancePage() {
  const { language, t } = useTranslation();

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {language === 'ar' ? 'صفحة' : 'Page'}
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            {language === 'ar' ? 'هذه الصفحة قيد التصميم' : 'This page is under design'}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}