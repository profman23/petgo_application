import { useTranslation } from "@/lib/i18n";
import { X } from "lucide-react";
import { useEffect } from "react";

interface AuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editMode?: boolean;
  authorizationName?: string;
  onNameChange?: (name: string) => void;
}

export function AuthorizationModal({
  isOpen,
  onClose,
  onSave,
  editMode = false,
  authorizationName = '',
  onNameChange
}: AuthorizationModalProps) {
  const { language } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      const script = document.createElement('script');
      script.src = 'https://cdn.lordicon.com/lordicon.js';
      if (!document.querySelector('script[src="https://cdn.lordicon.com/lordicon.js"]')) {
        document.head.appendChild(script);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getDirection = (lang: string) => lang === 'ar' ? 'rtl' : 'ltr';

  const permissionCategories = [
    {
      id: 'administration',
      title: { ar: 'الإدارة', en: 'Administration' },
      screens: [
        { id: 'users', title: { ar: 'المستخدمين', en: 'Users' } },
        { id: 'authorization', title: { ar: 'الصلاحيات', en: 'Authorization' } }
      ]
    },
    {
      id: 'financial',
      title: { ar: 'المالية', en: 'Financial' },
      screens: [
        { id: 'creditNotes', title: { ar: 'إشعارات دائنة', en: 'Credit Notes' } },
        { id: 'outgoingPayment', title: { ar: 'المدفوعات الصادرة', en: 'Outgoing Payment' } },
        { id: 'incomePayment', title: { ar: 'المدفوعات الواردة', en: 'Income Payment' } },
        { id: 'arBalance', title: { ar: 'رصيد الحسابات المدينة', en: 'A/R Balance' } }
      ]
    },
    {
      id: 'businessPartner',
      title: { ar: 'شريك الأعمال', en: 'Business Partner' },
      screens: [
        { id: 'partnerManagement', title: { ar: 'إدارة الشركاء', en: 'Partner Management' } }
      ]
    }
  ];

  const individualScreens = [
    { id: 'vetsvanManagement', title: { ar: 'إدارة فيتسفان', en: 'Vetsvan Management' } },
    { id: 'vetsvanShifts', title: { ar: 'نوبات فيتسفان', en: 'Vetsvan Shifts' } },
    { id: 'vetsvanRequests', title: { ar: 'طلبات فيتسفان', en: 'Vetsvan Requests' } },
    { id: 'import', title: { ar: 'استيراد', en: 'Import' } },
    { id: 'services', title: { ar: 'الخدمات', en: 'Services' } },
    { id: 'products', title: { ar: 'المنتجات', en: 'Products' } }
  ];

  const permissions = [
    { id: 'noPermission', label: { ar: 'لا صلاحية', en: 'No Permission' } },
    { id: 'read', label: { ar: 'قراءة', en: 'Read' } },
    { id: 'export', label: { ar: 'تصدير', en: 'Export' } },
    { id: 'fullControl', label: { ar: 'تحكم كامل', en: 'Full Control' } }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[1000px] max-w-6xl mx-4 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-4">
            {/* Lord Icon */}
            <div 
              dangerouslySetInnerHTML={{
                __html: '<lord-icon src="https://cdn.lordicon.com/gjlzobte.json" trigger="hover" colors="primary:#852085,secondary:#848484" style="width:80px;height:80px"></lord-icon>'
              }}
            />
            
            <h2 className="text-2xl font-bold text-gray-600" style={{ fontFamily: 'Arimo' }} dir={getDirection(language)}>
              {editMode 
                ? (language === 'ar' ? 'تعديل الصلاحية' : 'Edit Authorization')
                : (language === 'ar' ? 'إنشاء صلاحية جديدة' : 'Create New Authorization')
              }
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            data-testid="button-close-authorization-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="relative flex-1 overflow-hidden">
          <div className="p-4 pb-6 h-full overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(85vh - 200px)' }}>
            {/* Authorization Name Field with inline buttons */}
            <div className="mb-6 flex items-center gap-3">
              <input
                type="text"
                id="authorization-name"
                value={authorizationName}
                onChange={(e) => onNameChange?.(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل اسم الصلاحية...' : 'Enter authorization name...'}
                className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                data-testid="input-authorization-name"
                dir={getDirection(language)}
              />
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                data-testid="button-cancel-authorization"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={onSave}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
                style={{ backgroundColor: '#852085' }}
                data-testid="button-save-authorization"
              >
                {language === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>

            {/* Permissions Grid */}
            <div className="space-y-6">
              {/* Category-based screens */}
              {permissionCategories.map((category) => (
                <div key={category.id}>
                  {/* Category Title */}
                  <h3 className="text-xl font-bold text-gray-700 mb-3" style={{ fontFamily: 'Arimo' }} dir={getDirection(language)}>
                    {category.title[language]}
                  </h3>
                  
                  {/* Screens in this category */}
                  {category.screens.map((screen) => (
                    <div key={screen.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-700 font-medium" dir={getDirection(language)}>
                        {screen.title[language]}
                      </span>
                      <div className="flex items-center gap-6">
                        {permissions.map((permission) => (
                          <label key={permission.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 checked:border-purple-600"
                              style={{
                                accentColor: '#852085'
                              }}
                              data-testid={`checkbox-${screen.id}-${permission.id}`}
                            />
                            <span className="text-sm text-gray-600" dir={getDirection(language)}>
                              {permission.label[language]}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Individual screens */}
              {individualScreens.map((screen) => (
                <div key={screen.id}>
                  <h3 className="text-xl font-bold text-gray-700 mb-3" style={{ fontFamily: 'Arimo' }} dir={getDirection(language)}>
                    {screen.title[language]}
                  </h3>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-700 font-medium" dir={getDirection(language)}>
                      {screen.title[language]}
                    </span>
                    <div className="flex items-center gap-6">
                      {permissions.map((permission) => (
                        <label key={permission.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 checked:border-purple-600"
                            style={{
                              accentColor: '#852085'
                            }}
                            data-testid={`checkbox-${screen.id}-${permission.id}`}
                          />
                          <span className="text-sm text-gray-600" dir={getDirection(language)}>
                            {permission.label[language]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
