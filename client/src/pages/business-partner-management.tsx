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

  // Animate icon every 1.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTriggerAnimation('loop');
      setTimeout(() => setTriggerAnimation('hover'), 1000);
    }, 1500); // 1.5 seconds = 1,500 milliseconds

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
            
            {/* Radio Buttons */}
            <div className="flex items-center gap-6 ml-8">
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="businessPartnerType" 
                  value="customer"
                  checked={selectedPartnerType === 'customer'}
                  onChange={() => setSelectedPartnerType('customer')}
                  className="text-purple-600 focus:ring-purple-500"
                  data-testid="radio-partner-customer"
                />
                <span className="text-sm text-gray-700">
                  {language === 'ar' ? 'عميل' : 'Customer'}
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="businessPartnerType" 
                  value="supplier"
                  checked={selectedPartnerType === 'supplier'}
                  onChange={() => setSelectedPartnerType('supplier')}
                  className="text-purple-600 focus:ring-purple-500"
                  data-testid="radio-partner-supplier"
                />
                <span className="text-sm text-gray-700">
                  {language === 'ar' ? 'مورد' : 'Supplier'}
                </span>
              </label>
            </div>
          </div>

          {/* Create Button */}
          <div className="flex items-center gap-4">
            <button
              className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
              onClick={() => {
                console.log('Create new partner:', selectedPartnerType);
              }}
              data-testid="button-create-partner"
            >
              <FilePlus className="h-4 w-4" style={{ color: '#852085' }} />
              <span style={{ fontFamily: 'Arimo' }}>
                {getButtonText()}
              </span>
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