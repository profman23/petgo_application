// Device language detection utility
export function getDeviceLanguage(): 'ar' | 'en' {
  // Get browser/device language
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  
  // Check if Arabic is preferred
  if (browserLang.startsWith('ar') || browserLang.includes('Arab')) {
    return 'ar';
  }
  
  // Default to English for all other languages
  return 'en';
}

// Installation messages in both languages
export const installMessages = {
  ar: {
    ios: {
      title: 'أضف VetsVan للشاشة الرئيسية',
      shareText: 'اضغط على أيقونة المشاركة',
      thenText: 'ثم "إضافة إلى الشاشة الرئيسية"',
      installTitle: 'تثبيت تطبيق VetsVan',
      installDesc: 'ثبت التطبيق على جهازك للوصول السريع إلى خدمات العيادة البيطرية المتنقلة',
      installNow: 'تثبيت الآن',
      showInstructions: 'عرض التعليمات',
      notNow: 'ليس الآن',
      dontWant: 'لا أريد',
      understood: 'فهمت'
    },
    android: {
      title: 'ثبت تطبيق VetsVan',
      steps: 'اضغط على القائمة (⋮) ثم "إضافة إلى الشاشة الرئيسية"',
      installTitle: 'تثبيت تطبيق VetsVan',
      installDesc: 'ثبت التطبيق على جهازك للوصول السريع إلى خدمات العيادة البيطرية المتنقلة',
      installNow: 'تثبيت الآن',
      showInstructions: 'عرض التعليمات',
      notNow: 'ليس الآن',
      dontWant: 'لا أريد'
    }
  },
  en: {
    ios: {
      title: 'Add VetsVan to Home Screen',
      shareText: 'Tap the Share icon',
      thenText: 'then "Add to Home Screen"',
      installTitle: 'Install VetsVan App',
      installDesc: 'Install the app on your device for quick access to mobile veterinary services',
      installNow: 'Install Now',
      showInstructions: 'Show Instructions',
      notNow: 'Not Now',
      dontWant: 'No Thanks',
      understood: 'Got it'
    },
    android: {
      title: 'Install VetsVan App',
      steps: 'Tap the menu (⋮) then "Add to Home screen"',
      installTitle: 'Install VetsVan App',
      installDesc: 'Install the app on your device for quick access to mobile veterinary services',
      installNow: 'Install Now',
      showInstructions: 'Show Instructions',
      notNow: 'Not Now',
      dontWant: 'No Thanks'
    }
  }
};

// Safari browser instructions in both languages
export const safariInstructions = {
  ar: [
    'اضغط على أيقونة المشاركة في الأسفل',
    'مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية"',
    'اضغط "إضافة" للتأكيد'
  ],
  en: [
    'Tap the Share icon at the bottom',
    'Scroll down and select "Add to Home Screen"',
    'Tap "Add" to confirm'
  ]
};