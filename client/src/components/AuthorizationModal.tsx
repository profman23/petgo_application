import { useTranslation } from "@/lib/i18n";
import { X } from "lucide-react";

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

  if (!isOpen) return null;

  const getDirection = (lang: string) => lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[1000px] max-w-6xl mx-4 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900" dir={getDirection(language)}>
            {editMode 
              ? (language === 'ar' ? 'تعديل الصلاحية' : 'Edit Authorization')
              : (language === 'ar' ? 'إنشاء صلاحية جديدة' : 'Create New Authorization')
            }
          </h2>
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
            {/* Authorization Name Field */}
            <div className="mb-6">
              <label 
                htmlFor="authorization-name" 
                className="block text-sm font-medium text-gray-700 mb-2"
                dir={getDirection(language)}
              >
                {language === 'ar' ? 'اسم الصلاحية' : 'Authorization Name'}
              </label>
              <input
                type="text"
                id="authorization-name"
                value={authorizationName}
                onChange={(e) => onNameChange?.(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل اسم الصلاحية...' : 'Enter authorization name...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                data-testid="input-authorization-name"
                dir={getDirection(language)}
              />
            </div>

            {/* Empty content area - permissions will be added later */}
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500" dir={getDirection(language)}>
                {language === 'ar' 
                  ? 'سيتم إضافة صلاحيات الشاشات هنا لاحقاً' 
                  : 'Screen permissions will be added here later'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
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
      </div>
    </div>
  );
}
