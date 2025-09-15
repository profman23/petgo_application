import { useState, useEffect } from "react";
import { useTranslation, getDirection } from "@/lib/i18n";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import { FilePlus } from "lucide-react";

// Declare lord-icon custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any;
    }
  }
}

export default function BusinessPartnerManagement() {
  const { language } = useTranslation();
  const [selectedPartnerType, setSelectedPartnerType] = useState<'customer' | 'supplier'>('customer');
  const [triggerAnimation, setTriggerAnimation] = useState('hover');

  // Animate icon every 1.5 minutes (90 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setTriggerAnimation('morph');
      setTimeout(() => setTriggerAnimation('hover'), 1000);
    }, 90000); // 1.5 minutes = 90,000 milliseconds

    return () => clearInterval(interval);
  }, []);

  const getButtonText = () => {
    if (selectedPartnerType === 'customer') {
      return language === 'ar' 
        ? 'إنشاء البيانات الرئيسية لعميل الأعمال' 
        : 'Create Customer Business Master Data';
    } else {
      return language === 'ar' 
        ? 'إنشاء البيانات الرئيسية لمورد الأعمال' 
        : 'Create Supplier Business Master Data';
    }
  };

  return (
    <AdminLayout>
      <div className="flex-1 p-8" dir={getDirection(language)}>
        {/* Content Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {/* Lord Icon */}
            <script src="https://cdn.lordicon.com/lordicon.js"></script>
            <lord-icon
              src="https://cdn.lordicon.com/rcuovkuy.json"
              trigger={triggerAnimation}
              colors="primary:#852085,secondary:#545454"
              style={{width:'80px',height:'80px'}}
            />
            
            {/* Page Title */}
            <div>
              <h1 
                className="text-2xl font-bold text-gray-600"
                style={{ fontFamily: 'Arimo' }}
              >
                {language === 'ar' ? 'إدارة الشركاء التجاريين' : 'Business Partner Management'}
              </h1>
              <p 
                className="text-sm text-gray-500 mt-2" 
                style={{ fontFamily: 'Arimo' }}
              >
                {language === 'ar' 
                  ? 'إنشاء وإدارة البيانات الرئيسية للعملاء والموردين' 
                  : 'Create and manage master data for customers and suppliers'
                }
              </p>
            </div>
          </div>

          {/* Create Button */}
          <div className="flex items-center gap-4">
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors duration-200"
              onClick={() => {
                console.log('Create new partner:', selectedPartnerType);
              }}
            >
              <FilePlus className="h-5 w-5" />
              <span style={{ fontFamily: 'Arimo' }}>
                {getButtonText()}
              </span>
            </button>
          </div>
        </div>

        {/* Partner Type Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-medium text-gray-900" style={{ fontFamily: 'Arimo' }}>
              {language === 'ar' ? 'نوع الشريك التجاري' : 'Business Partner Type'}
            </h3>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedPartnerType('customer')}
              className={`px-6 py-3 rounded-lg border transition-colors duration-200 ${
                selectedPartnerType === 'customer'
                  ? 'bg-purple-50 border-purple-500 text-purple-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              style={{ fontFamily: 'Arimo' }}
            >
              {language === 'ar' ? 'عميل' : 'Customer'}
            </button>
            
            <button
              onClick={() => setSelectedPartnerType('supplier')}
              className={`px-6 py-3 rounded-lg border transition-colors duration-200 ${
                selectedPartnerType === 'supplier'
                  ? 'bg-purple-50 border-purple-500 text-purple-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              style={{ fontFamily: 'Arivo' }}
            >
              {language === 'ar' ? 'مورد' : 'Supplier'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FilePlus className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2" style={{ fontFamily: 'Arimo' }}>
              {language === 'ar' 
                ? 'لا توجد بيانات شركاء تجاريين حتى الآن' 
                : 'No business partner data yet'
              }
            </h3>
            <p className="text-gray-500" style={{ fontFamily: 'Arimo' }}>
              {language === 'ar'
                ? 'ابدأ بإنشاء البيانات الرئيسية للعملاء أو الموردين باستخدام الزر أعلاه'
                : 'Start by creating customer or supplier master data using the button above'
              }
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}