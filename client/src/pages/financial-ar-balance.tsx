import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";

export default function FinancialARBalance() {
  const { language } = useTranslation();
  const [lordIconKey, setLordIconKey] = useState(0);

  useEffect(() => {
    setLordIconKey(prev => prev + 1);
  }, []);

  return (
    <AdminLayout>
      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Content Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {/* Lord Icon */}
            <script src="https://cdn.lordicon.com/lordicon.js"></script>
            <lord-icon
              key={lordIconKey}
              src="https://cdn.lordicon.com/mrniyolg.json"
              trigger="hover"
              colors="primary:#852085,secondary:#848484"
              style={{width:'80px',height:'80px'}}
            />
            
            {/* Page Title */}
            <div>
              <h1 
                className="text-2xl font-bold text-gray-600"
                style={{ fontFamily: 'Arimo' }}
              >
                {language === 'ar' ? 'رصيد الحسابات المدينة' : 'A/R Balance'}
              </h1>
            </div>
          </div>
        </div>

        {/* A/R Balance content would go here */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">
            {language === 'ar' ? 'محتوى رصيد الحسابات المدينة سيتم إضافته هنا' : 'A/R Balance content will be added here'}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}