import React from 'react';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';

const translations = {
  en: {
    updateAvailable: 'App Update Available',
    updateMessage: 'A new version is available with updated features',
    updateNow: 'Update Now',
    later: 'Later'
  },
  ar: {
    updateAvailable: 'تحديث جديد متوفر',
    updateMessage: 'إصدار جديد متوفر مع ميزات محدثة',
    updateNow: 'تحديث الآن',
    later: 'لاحقاً'
  }
};

export function UpdateNotification() {
  const { updateAvailable, updateApp } = useAppUpdate();
  const { language } = useLanguage();
  const t = translations[language];

  if (!updateAvailable) return null;

  return (
    <div data-update-notification className="fixed top-4 left-4 right-4 z-50 bg-white border border-purple-300 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-purple-800">{t.updateAvailable}</h3>
          <p className="text-sm text-gray-600">{t.updateMessage}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              // Hide notification for this session
              const element = document.querySelector('[data-update-notification]');
              if (element) {
                element.remove();
              }
            }}
          >
            {t.later}
          </Button>
          <Button 
            size="sm" 
            onClick={updateApp}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {t.updateNow}
          </Button>
        </div>
      </div>
    </div>
  );
}