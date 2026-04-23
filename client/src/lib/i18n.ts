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
    enterPassword: 'أدخل كلمة المرور',
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
    vetsVanManagement: 'إدارة سيارات PetGo',
    addNewVetsVan: 'إضافة سيارة PetGo جديدة',
    vetsVanCode: 'رمز السيارة',
    vetsVanName: 'اسم السيارة',
    driverName: 'اسم السائق',
    phoneNumber: 'رقم الهاتف',
    username: 'اسم المستخدم',
    addVetsVan: 'إضافة سيارة PetGo',
    vetsVansList: 'قائمة سيارات PetGo',
    totalVetsVans: 'إجمالي السيارات',
    available: 'متاح',
    notAvailable: 'غير متاح',
    changeStatus: 'تغيير الحالة',
    delete: 'حذف',
    vetsVanAddedSuccess: 'تم إضافة سيارة PetGo بنجاح',
    vetsVanAddedDesc: 'تم إضافة سيارة PetGo الجديدة إلى النظام',
    failedToAddVetsVan: 'فشل في إضافة سيارة PetGo',
    vetsVanDeleted: 'تم حذف سيارة PetGo',
    vetsVanDeletedDesc: 'تم حذف سيارة PetGo من النظام',
    failedToDeleteVetsVan: 'فشل في حذف سيارة PetGo',
    fillAllFields: 'يرجى ملء جميع الحقول',
    invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    loginSuccessful: 'تم تسجيل الدخول بنجاح',
    welcomeToAdmin: 'مرحباً بك في لوحة تحكم الإدارة',
    loginError: 'خطأ في تسجيل الدخول',
    enterUsernamePassword: 'يرجى إدخال اسم المستخدم وكلمة المرور',
    currentVetsVans: 'سيارات PetGo الحالية',
    statusUpdated: 'تم تحديث الحالة',
    failedToUpdateStatus: 'فشل في تحديث الحالة',
    
    // Patients & Services
    selectPatients: 'اختر الحيوانات الأليفة',
    selectPatientsDesc: 'اختر الحيوانات التي تحتاج خدمة بيطرية',
    noRegisteredPatients: 'لا توجد حيوانات مسجلة',
    registerPetsFirst: 'يرجى تسجيل حيواناتك الأليفة أولاً',
    goToPatients: 'انتقل لتسجيل الحيوانات',
    selectServiceType: 'اختر نوع الخدمة: ',
    generalCheckUp: 'فحص عام',
    grooming: 'تنظيف وتجميل',
    yourLocation: 'موقعك الحالي: ',
    
    // Patient Form
    patientName: 'اسم الحيوان الأليف',
    patientType: 'نوع الحيوان الأليف',
    patientForm: 'نموذج الحيوان الأليف',
    selectPatientType: 'اختر نوع الحيوان الأليف',
    addPatient: 'إضافة حيوان أليف',
    noPatients: 'لا توجد حيوانات أليفة',
    addFirstPatient: 'أضف حيوانك الأليف الأول',
    cat: 'قطة',
    dog: 'كلب', 
    bird: 'طائر',
    year: 'سنة',
    month: 'شهر',
    day: 'يوم',
    noAge: 'لم يحدد العمر',
    
    // Shifts Management
    vetsVanShifts: 'مناوبات PetGo',
    shiftsSchedule: 'جدول المناوبات',
    days: 'أيام',
    week: 'أسبوع',
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
    noVetsVansFound: 'لا توجد سيارات PetGo',
    driverStatusChanged: 'تم تغيير حالة السائق',
    confirmDelete: 'تأكيد الحذف',
    deleteVetsVanConfirm: 'هل أنت متأكد من حذف سيارة PetGo',
    deleteWarning: 'لا يمكن التراجع عن هذا الإجراء.',
    deleteConfirm: 'حذف',
    
    // Language
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    selectLanguage: 'اختر اللغة',
    
    // Payment
    payment: {
      title: 'الدفع الإلكتروني',
      subtitle: 'اختر طريقة الدفع المناسبة لك',
      orderSummary: 'ملخص الطلب',
      service: 'الخدمة',
      vetService: 'خدمة بيطرية منزلية',
      total: 'المجموع',
      sar: 'ريال',
      selectPaymentMethod: 'اختر طريقة الدفع',
      loadingMethods: 'جاري تحميل طرق الدفع...',
      serviceCharge: 'رسوم الخدمة',
      payNow: 'ادفع الآن',
      processing: 'جاري المعالجة...',
      selectMethod: 'اختر طريقة الدفع',
      selectMethodDesc: 'يرجى اختيار طريقة دفع للمتابعة',
      failed: 'فشل في إتمام عملية الدفع',
      invalidBooking: 'حجز غير صالح',
      securityNotice: 'جميع المعاملات محمية بتشفير SSL',
      success: {
        title: 'تم الدفع بنجاح!',
        message: 'تم إتمام عملية الدفع بنجاح',
        details: 'تفاصيل الدفع',
        bookingId: 'رقم الحجز',
        amount: 'المبلغ',
        method: 'طريقة الدفع',
        status: 'الحالة',
        card: 'بطاقة',
        paid: 'مدفوع',
        confirmation: 'سيتم إرسال رسالة تأكيد على رقم الهاتف المسجل',
        viewBookings: 'عرض الحجوزات',
        goHome: 'العودة للرئيسية',
        autoRedirect: 'سيتم التوجيه تلقائياً خلال 10 ثوانٍ'
      },
      error: {
        whatHappened: 'ماذا حدث؟',
        support: 'في حالة استمرار المشكلة، يرجى التواصل مع خدمة العملاء',
        tryAgain: 'حاول مرة أخرى',
        goHome: 'العودة للرئيسية',
        helpText: 'لمساعدة إضافية، تواصل معنا عبر الهاتف أو WhatsApp',
        failed: {
          title: 'فشل في الدفع',
          message: 'لم يتم إتمام عملية الدفع بنجاح'
        },
        cancelled: {
          title: 'تم إلغاء الدفع',
          message: 'تم إلغاء عملية الدفع من قبل المستخدم'
        },
        missing: {
          title: 'خطأ في البيانات',
          message: 'معلومات الدفع مفقودة أو غير صحيحة'
        },
        callback: {
          title: 'خطأ في النظام',
          message: 'حدث خطأ أثناء التحقق من حالة الدفع'
        },
        unknown: {
          title: 'خطأ غير معروف',
          message: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى'
        },
        reasons: {
          insufficientFunds: 'رصيد غير كافٍ في الحساب',
          invalidCard: 'بيانات البطاقة غير صحيحة',
          networkIssue: 'مشكلة في الاتصال بالشبكة',
          bankDecline: 'تم رفض العملية من البنك',
          userCancelled: 'تم إلغاء العملية من قبل المستخدم',
          technicalIssue: 'مشكلة تقنية في النظام',
          callbackError: 'خطأ في استقبال نتيجة الدفع',
          unknownError: 'خطأ غير محدد في النظام'
        }
      }
    },
  },
  
  en: {
    // Common
    back: 'Back',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    phone: 'Phone',
    password: 'Password',
    enterPassword: 'Enter Password',
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
    vetsVanManagement: 'Vetsvan Management',
    vetsVanShifts: 'PetGo Shifts',
    addNewVetsVan: 'Add New PetGo',
    vetsVanCode: 'VetsVan Code',
    vetsVanName: 'VetsVan Name',
    driverName: 'Driver Name',
    phoneNumber: 'Phone Number',
    username: 'Username',
    addVetsVan: 'Add PetGo',
    vetsVansList: 'PetGo List',
    totalVetsVans: 'Total Vehicles',
    available: 'Available',
    notAvailable: 'Not Available',
    changeStatus: 'Change Status',
    delete: 'Delete',
    vetsVanAddedSuccess: 'PetGo added successfully',
    vetsVanAddedDesc: 'New PetGo has been added to the system',
    failedToAddVetsVan: 'Failed to add PetGo',
    vetsVanDeleted: 'PetGo deleted',
    vetsVanDeletedDesc: 'PetGo has been removed from the system',
    failedToDeleteVetsVan: 'Failed to delete PetGo',
    fillAllFields: 'Please fill all fields',
    invalidCredentials: 'Invalid username or password',
    loginSuccessful: 'Login successful',
    welcomeToAdmin: 'Welcome to administration dashboard',
    loginError: 'Login error',
    enterUsernamePassword: 'Please enter username and password',
    currentVetsVans: 'Current PetGos',
    statusUpdated: 'Status updated',
    failedToUpdateStatus: 'Failed to update status',
    
    // Patients & Services
    selectPatients: 'Select Pets',
    selectPatientsDesc: 'Choose pets that need veterinary service',
    noRegisteredPatients: 'No registered pets',
    registerPetsFirst: 'Please register your pets first',
    goToPatients: 'Go to register pets',
    selectServiceType: 'Select Service Type: ',
    generalCheckUp: 'General Check Up',
    grooming: 'Grooming',
    yourLocation: 'Your Location: ',
    
    // Patient Form
    patientName: 'Patient Name',
    patientType: 'Patient Type',
    patientForm: 'Patient Form',
    selectPatientType: 'Select Patient Type',
    addPatient: 'Add Patient',
    noPatients: 'No Patients',
    addFirstPatient: 'Add your first patient',
    cat: 'Cat',
    dog: 'Dog',
    bird: 'Bird',
    year: 'Year',
    month: 'Month', 
    day: 'Day',
    noAge: 'Age not specified',
    
    // Shifts Management
    shiftsSchedule: 'Shifts Schedule',
    days: 'Days',
    week: 'Week',
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
    noVetsVansFound: 'No PetGos found',
    driverStatusChanged: 'Driver status changed',
    confirmDelete: 'Confirm Delete',
    deleteVetsVanConfirm: 'Are you sure you want to delete PetGo',
    deleteWarning: 'This action cannot be undone.',
    deleteConfirm: 'Delete',
    
    // Language
    language: 'Language',
    arabic: 'العربية',
    english: 'English',
    selectLanguage: 'Select Language',
    
    // Payment
    payment: {
      title: 'Online Payment',
      subtitle: 'Choose your preferred payment method',
      orderSummary: 'Order Summary',
      service: 'Service',
      vetService: 'Home Veterinary Service',
      total: 'Total',
      sar: 'SAR',
      selectPaymentMethod: 'Select Payment Method',
      loadingMethods: 'Loading payment methods...',
      serviceCharge: 'Service Charge',
      payNow: 'Pay Now',
      processing: 'Processing...',
      selectMethod: 'Select Payment Method',
      selectMethodDesc: 'Please select a payment method to continue',
      failed: 'Payment failed',
      invalidBooking: 'Invalid booking',
      securityNotice: 'All transactions are protected with SSL encryption',
      success: {
        title: 'Payment Successful!',
        message: 'Your payment has been completed successfully',
        details: 'Payment Details',
        bookingId: 'Booking ID',
        amount: 'Amount',
        method: 'Payment Method',
        status: 'Status',
        card: 'Card',
        paid: 'Paid',
        confirmation: 'A confirmation message will be sent to your registered phone number',
        viewBookings: 'View Bookings',
        goHome: 'Go Home',
        autoRedirect: 'You will be redirected automatically in 10 seconds'
      }
    },
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