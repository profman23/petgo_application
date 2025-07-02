import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'ar' | 'en';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'en' as Language,
      setLanguage: (lang: Language) => set({ language: lang }),
    }),
    {
      name: 'language-storage',
    }
  )
);

// Translation keys and values
export const translations = {
  ar: {
    // Common
    back: 'العودة',
    logout: 'خروج',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    phone: 'رقم الهاتف',
    password: 'كلمة المرور',
    name: 'الاسم',
    petName: 'اسم الحيوان الأليف',
    address: 'العنوان',
    submit: 'إرسال',
    cancel: 'إلغاء',
    save: 'حفظ',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'تم بنجاح',
    
    // User Type Selection
    mobileVetClinic: 'العيادة البيطرية المتنقلة',
    selectAccountType: 'اختر نوع حسابك للمتابعة',
    customerLogin: 'تسجيل دخول العميل',
    customerLoginDesc: 'لطلب خدمات بيطرية',
    doctorLogin: 'تسجيل دخول الطبيب',
    doctorLoginDesc: 'لتقديم الخدمات البيطرية',
    
    // Admin System
    adminLogin: 'دخول الإدارة',
    adminDashboard: 'لوحة تحكم الإدارة',
    welcome: 'مرحباً',
    vetsVanManagement: 'إدارة سيارات فيتس فان',
    addNewVetsVan: 'إضافة سيارة فيتس فان جديدة',
    vetsVanCode: 'رمز السيارة',
    vetsVanName: 'اسم السيارة',
    driverName: 'اسم السائق',
    phoneNumber: 'رقم الهاتف',
    username: 'اسم المستخدم',
    addVetsVan: 'إضافة سيارة فيتس فان',
    vetsVansList: 'قائمة سيارات فيتس فان',
    totalVetsVans: 'إجمالي السيارات',
    available: 'متاح',
    notAvailable: 'غير متاح',
    changeStatus: 'تغيير الحالة',
    delete: 'حذف',
    vetsVanAddedSuccess: 'تم إضافة سيارة فيتس فان بنجاح',
    vetsVanAddedDesc: 'تم إضافة سيارة فيتس فان الجديدة إلى النظام',
    failedToAddVetsVan: 'فشل في إضافة سيارة فيتس فان',
    vetsVanDeleted: 'تم حذف سيارة فيتس فان',
    vetsVanDeletedDesc: 'تم حذف سيارة فيتس فان من النظام',
    failedToDeleteVetsVan: 'فشل في حذف سيارة فيتس فان',
    fillAllFields: 'يرجى ملء جميع الحقول',
    invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    loginSuccessful: 'تم تسجيل الدخول بنجاح',
    welcomeToAdmin: 'مرحباً بك في لوحة تحكم الإدارة',
    loginError: 'خطأ في تسجيل الدخول',
    enterUsernamePassword: 'يرجى إدخال اسم المستخدم وكلمة المرور',
    currentVetsVans: 'سيارات فيتس فان الحالية',
    statusUpdated: 'تم تحديث الحالة',
    failedToUpdateStatus: 'فشل في تحديث الحالة',
    
    // Patients & Services
    selectPatients: 'اختر الحيوانات الأليفة',
    selectPatientsDesc: 'اختر الحيوانات التي تحتاج خدمة بيطرية',
    noRegisteredPatients: 'لا توجد حيوانات مسجلة',
    registerPetsFirst: 'يرجى تسجيل حيواناتك الأليفة أولاً',
    goToPatients: 'انتقل لتسجيل الحيوانات',
    selectServiceType: 'اختر نوع الخدمة',
    generalCheckUp: 'فحص عام',
    grooming: 'تنظيف وتجميل',
    yourLocation: 'موقعك الحالي',
    
    // Shifts Management
    vetsVanShifts: 'مناوبات فيتس فان',
    shiftsSchedule: 'جدول المناوبات',
    days: 'أيام',
    day: 'يوم',
    week: 'أسبوع',
    month: 'شهر',
    addNewShift: 'إضافة مناوبة جديدة',
    addShift: 'إضافة مناوبة',
    date: 'التاريخ',
    startTime: 'وقت البداية',
    endTime: 'وقت النهاية',
    duration: 'المدة',
    scheduled: 'مجدولة',
    active: 'نشطة',
    completed: 'مكتملة',
    cancelled: 'ملغاة',
    shiftAddedSuccess: 'تم إضافة المناوبة بنجاح',
    failedToAddShift: 'فشل في إضافة المناوبة',
    shiftDeletedSuccess: 'تم حذف المناوبة بنجاح',
    failedToDeleteShift: 'فشل في حذف المناوبة',
    noVetsVansFound: 'لا توجد سيارات فيتس فان',
    
    // Language
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    selectLanguage: 'اختر اللغة',
  },
  
  en: {
    // Common
    back: 'Back',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    phone: 'Phone',
    password: 'Password',
    name: 'Name',
    petName: 'Pet Name',
    address: 'Address',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    
    // User Type Selection
    mobileVetClinic: 'Mobile Veterinary Clinic',
    selectAccountType: 'Select your account type to continue',
    customerLogin: 'Customer Login',
    customerLoginDesc: 'To request veterinary services',
    doctorLogin: 'Doctor Login',
    doctorLoginDesc: 'To provide veterinary services',
    
    // Admin System
    adminLogin: 'Admin Login',
    adminDashboard: 'Admin Dashboard',
    welcome: 'Welcome',
    vetsVanManagement: 'VETS VAN Management',
    vetsVanShifts: 'VETS VAN Shifts',
    addNewVetsVan: 'Add New VETS VAN',
    vetsVanCode: 'VetsVan Code',
    vetsVanName: 'VetsVan Name',
    driverName: 'Driver Name',
    phoneNumber: 'Phone Number',
    username: 'Username',
    addVetsVan: 'Add VETS VAN',
    vetsVansList: 'VETS VAN List',
    totalVetsVans: 'Total Vehicles',
    available: 'Available',
    notAvailable: 'Not Available',
    changeStatus: 'Change Status',
    delete: 'Delete',
    vetsVanAddedSuccess: 'VETS VAN added successfully',
    vetsVanAddedDesc: 'New VETS VAN has been added to the system',
    failedToAddVetsVan: 'Failed to add VETS VAN',
    vetsVanDeleted: 'VETS VAN deleted',
    vetsVanDeletedDesc: 'VETS VAN has been removed from the system',
    failedToDeleteVetsVan: 'Failed to delete VETS VAN',
    fillAllFields: 'Please fill all fields',
    invalidCredentials: 'Invalid username or password',
    loginSuccessful: 'Login successful',
    welcomeToAdmin: 'Welcome to administration dashboard',
    loginError: 'Login error',
    enterUsernamePassword: 'Please enter username and password',
    currentVetsVans: 'Current VETS VANs',
    statusUpdated: 'Status updated',
    failedToUpdateStatus: 'Failed to update status',
    
    // Patients & Services
    selectPatients: 'Select Pets',
    selectPatientsDesc: 'Choose pets that need veterinary service',
    noRegisteredPatients: 'No registered pets',
    registerPetsFirst: 'Please register your pets first',
    goToPatients: 'Go to register pets',
    selectServiceType: 'Select Service Type',
    generalCheckUp: 'General Check Up',
    grooming: 'Grooming',
    yourLocation: 'Your Location',
    
    // Shifts Management
    shiftsSchedule: 'Shifts Schedule',
    days: 'Days',
    day: 'Day',
    week: 'Week',
    month: 'Month',
    addNewShift: 'Add New Shift',
    addShift: 'Add Shift',
    date: 'Date',
    startTime: 'Start Time',
    endTime: 'End Time',
    duration: 'Duration',
    scheduled: 'Scheduled',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    shiftAddedSuccess: 'Shift added successfully',
    failedToAddShift: 'Failed to add shift',
    shiftDeletedSuccess: 'Shift deleted successfully',
    failedToDeleteShift: 'Failed to delete shift',
    noVetsVansFound: 'No VETS VANs found',
    
    // Language
    language: 'Language',
    arabic: 'العربية',
    english: 'English',
    selectLanguage: 'Select Language',
  }
};

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key: keyof typeof translations.ar): string => {
    return translations[language][key] || key;
  };
  
  return { t, language };
};

export const getDirection = (language: Language): 'rtl' | 'ltr' => {
  return language === 'ar' ? 'rtl' : 'ltr';
};

export const getTextAlign = (language: Language): 'right' | 'left' => {
  return language === 'ar' ? 'right' : 'left';
};