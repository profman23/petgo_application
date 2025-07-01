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
      language: 'en', // تعيين الإنجليزية كلغة افتراضية
      setLanguage: (lang: Language) => set({ language: lang }),
    }),
    {
      name: 'language-preference',
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
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
    mobileVetService: 'خدمة العيادة البيطرية المتنقلة',
    petCareAtHome: 'رعاية حيواناتك في منزلك',
    
    // Login
    welcomeBack: 'مرحباً بعودتك',
    loginToAccount: 'سجل دخولك لحسابك',
    phoneNumber: 'رقم الهاتف',
    enterPhone: 'أدخل رقم هاتفك',
    enterPassword: 'أدخل كلمة المرور',
    noAccount: 'ليس لديك حساب؟',
    createAccount: 'إنشاء حساب',
    joinMobileVetService: 'انضم إلى خدمة العيادة البيطرية المتنقلة',
    createNewAccount: 'إنشاء حساب جديد',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    petType: 'نوع الحيوان الأليف',
    enterFirstName: 'أدخل اسمك الأول',
    enterLastName: 'أدخل اسم عائلتك',
    enterPetName: 'أدخل اسم حيوانك الأليف',
    whatIsPetName: 'ما اسم حيوانك الأليف؟',
    mathCaptcha: 'المعادلة الرياضية',
    enterCaptchaAnswer: 'أدخل ناتج المعادلة',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    backToLogin: 'العودة لتسجيل الدخول',
    
    // Doctor Dashboard
    doctorDashboard: 'لوحة تحكم الطبيب البيطري',
    sessionExpired: 'انتهت جلسة العمل',
    loginAgain: 'يرجى تسجيل الدخول مرة أخرى',
    gpsStatus: 'حالة GPS',
    accuracy: 'دقة الموقع',
    meters: 'متر',
    enableGps: 'تفعيل GPS',
    stopGps: 'إيقاف GPS',
    pendingRequests: 'الطلبات المعلقة',
    noPendingRequests: 'لا توجد طلبات معلقة حالياً',
    customerLocation: 'موقع العميل',
    acceptRequest: 'قبول الطلب',
    rejectRequest: 'رفض الطلب',
    newRequest: 'طلب جديد!',
    newRequestDesc: 'لديك طلب جديد للعيادة البيطرية',
    newVetRequest: 'طلب عيادة بيطرية جديد!',
    pendingApproval: 'طلب جديد في انتظار الموافقة',
    serviceType: 'نوع الخدمة',
    accept: 'قبول',
    reject: 'رفض',
    distance: 'المسافة التقديرية',
    
    // Registration
    enterName: 'أدخل اسمك الكامل',
    enterAddress: 'أدخل عنوانك',
    confirmPassword: 'تأكيد كلمة المرور',
    solve: 'حل: ',
    haveAccount: 'لديك حساب؟',
    
    // Home
    membership: 'العضوية',
    requestVetService: 'طلب خدمة بيطرية',
    continueTracking: 'متابعة الرحلة',
    noActiveRide: 'لا توجد رحلة نشطة',
    welcomeUser: 'مرحباً',
    quickActions: 'إجراءات سريعة',
    activeRide: 'لديك رحلة نشطة',
    clickToContinue: 'اضغط لمتابعة التتبع',
    recentOrders: 'الطلبات الأخيرة',
    noPreviousOrders: 'لا توجد طلبات سابقة',
    
    // Navigation buttons
    account: 'الحساب',
    activity: 'النشاط',
    home: 'الرئيسية',
    
    // Ride Request
    requestMobileVet: 'طلب عيادة بيطرية متنقلة',
    vetServiceType: 'نوع الخدمة البيطرية',
    generalExamination: 'فحص عام',
    vaccination: 'تطعيمات',
    emergency: 'حالة طارئة',
    surgery: 'جراحة',
    pickupLocation: 'موقع الاستلام',
    currentLocation: 'موقعك الحالي',
    destination: 'الوجهة',
    enterDestination: 'أدخل الوجهة',
    requestService: 'طلب الخدمة',
    locationDetected: 'تم تحديد موقعك بدقة',
    accuracy: 'الدقة',
    locationError: 'خطأ في تحديد الموقع',
    updatingLocation: 'يتم تحديث الموقع...',
    pleaseWait: 'الرجاء الانتظار',
    
    // Ride Tracking
    rideTracking: 'متابعة الرحلة',
    locationStatus: 'حالة الموقع',
    requested: 'جاري المعالجة',
    requestedDesc: 'طلبك قيد المراجعة وننتظر موافقة الطبيب',
    confirmed: 'تم القبول',
    confirmedDesc: 'تم قبول طلبك وسيتم التوجه إليك قريباً',
    inProgress: 'قيد التنفيذ',
    inProgressDesc: 'الطبيب في الطريق إليك',
    arrived: 'تم الوصول',
    arrivedDesc: 'وصل الطبيب إلى موقعك',
    completed: 'تم الانتهاء',
    completedDesc: 'تم إنجاز الخدمة بنجاح',
    locationAccuracy: 'تم تحديد موقعك بدقة',
    meters: 'متر',
    
    // Doctor Dashboard
    doctorDashboard: 'لوحة تحكم الطبيب البيطري',
    locationTracking: 'حالة تتبع الموقع',
    locationDetectedSuccessfully: 'الموقع محدد بنجاح',
    latitude: 'خط العرض',
    longitude: 'خط الطول',
    pendingRequests: 'الطلبات المعلقة',
    noPendingRequests: 'لا توجد طلبات معلقة حالياً',
    newRequestReceived: 'تم استلام طلب جديد!',
    from: 'من',
    serviceType: 'نوع الخدمة',
    distance: 'المسافة',
    estimatedCost: 'التكلفة المقدرة',
    accept: 'قبول',
    reject: 'رفض',
    
    // Doctor Ride Tracking
    gpsStatus: 'حالة GPS',
    connected: 'متصل',
    disconnected: 'غير متصل',
    customerInfo: 'معلومات العميل',
    rideDetails: 'تفاصيل الرحلة',
    currentStatus: 'الحالة الحالية',
    updateStatus: 'تحديث الحالة',
    startRide: 'بدء الرحلة',
    arriveAtLocation: 'الوصول للموقع',
    completeService: 'إنهاء الخدمة',
    callCustomer: 'اتصال بالعميل',
    openMaps: 'فتح الخرائط',
    googleMaps: 'خرائط جوجل',
    appleMaps: 'خرائط آبل',
    waze: 'وايز',
    
    // Status Messages
    statusRequested: 'مطلوب',
    statusAccepted: 'مقبول',
    statusInProgress: 'قيد التنفيذ',
    statusArrived: 'وصل',
    statusCompleted: 'مكتمل',
    
    // Notifications
    unauthorized: 'غير مخول',
    loginAgain: 'تسجيل الدخول مرة أخرى...',
    requestAccepted: 'تم قبول الطلب',
    requestRejected: 'تم رفض الطلب',
    statusUpdated: 'تم تحديث الحالة',
    loginSuccess: 'تم تسجيل الدخول بنجاح',
    logoutSuccess: 'تم تسجيل الخروج بنجاح',
    languageChanged: 'تم تغيير اللغة بنجاح',
    registrationSuccess: 'تم التسجيل بنجاح',
    welcomeNewUser: 'مرحباً بك في خدمتنا البيطرية',
    errorOccurred: 'حدث خطأ',
    pleaseTryAgain: 'يرجى المحاولة مرة أخرى',
    
    // Settings
    settings: 'الإعدادات',
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    selectLanguage: 'اختر اللغة',
    
    // Account Page
    accountTitle: 'حسابي الشخصي',
    accountSubtitle: 'إدارة ملفك الشخصي',
    accountDetails: 'تفاصيل الحساب',
    firstName: 'الاسم الأول',
    lastName: 'الاسم الأخير',
    firstNamePlaceholder: 'أدخل اسمك الأول',
    lastNamePlaceholder: 'أدخل اسمك الأخير',
    phonePlaceholder: 'أدخل رقم هاتفك',
    resetPassword: 'إعادة تعيين كلمة المرور',
    saveProfile: 'حفظ الملف الشخصي',
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
    mobileVetService: 'Mobile Veterinary Clinic Service',
    petCareAtHome: 'Pet care at your home',
    
    // Login
    welcomeBack: 'Welcome Back',
    loginToAccount: 'Login to your account',
    phoneNumber: 'Phone Number',
    enterPhone: 'Enter your phone number',
    enterPassword: 'Enter your password',
    noAccount: "Don't have an account?",
    createAccount: 'Create Account',
    joinMobileVetService: 'Join our mobile veterinary clinic service',
    createNewAccount: 'Create New Account',
    firstName: 'First Name',
    lastName: 'Last Name',
    petType: 'Pet Type',
    enterFirstName: 'Enter your first name',
    enterLastName: 'Enter your last name',
    enterPetName: 'Enter your pet name',
    whatIsPetName: 'What is your pet name?',
    mathCaptcha: 'Math Captcha',
    enterCaptchaAnswer: 'Enter the answer',
    alreadyHaveAccount: 'Already have an account?',
    backToLogin: 'Back to Login',
    
    // Doctor Dashboard
    doctorDashboard: 'Veterinary Doctor Dashboard',
    sessionExpired: 'Session Expired',
    loginAgain: 'Please login again',
    gpsStatus: 'GPS Status',
    accuracy: 'Location Accuracy',
    meters: 'meters',
    enableGps: 'Enable GPS',
    stopGps: 'Stop GPS',
    pendingRequests: 'Pending Requests',
    noPendingRequests: 'No pending requests at the moment',
    customerLocation: 'Customer Location',
    acceptRequest: 'Accept Request',
    rejectRequest: 'Reject Request',
    newRequest: 'New Request!',
    newRequestDesc: 'You have a new veterinary clinic request',
    newVetRequest: 'New Veterinary Request!',
    pendingApproval: 'New request pending approval',
    serviceType: 'Service Type',
    accept: 'Accept',
    reject: 'Reject',
    distance: 'Estimated Distance',
    
    // Registration
    enterName: 'Enter your full name',
    enterAddress: 'Enter your address',
    confirmPassword: 'Confirm Password',
    solve: 'Solve: ',
    haveAccount: 'Have an account?',
    
    // Home
    membership: 'Membership',
    requestVetService: 'Request Vet Service',
    noActiveRide: 'No active ride',
    welcomeUser: 'Welcome',
    
    // Ride Request
    requestMobileVet: 'Request Mobile Veterinary Clinic',
    vetServiceType: 'Veterinary Service Type',
    generalExamination: 'General Examination',
    vaccination: 'Vaccination',
    emergency: 'Emergency',
    surgery: 'Surgery',
    pickupLocation: 'Pickup Location',
    currentLocation: 'Your Current Location',
    destination: 'Destination',
    enterDestination: 'Enter destination',
    requestService: 'Request Service',
    locationDetected: 'Location detected accurately',
    accuracy: 'Accuracy',
    locationError: 'Location detection error',
    updatingLocation: 'Updating location...',
    pleaseWait: 'Please wait',
    
    // Ride Tracking
    rideTracking: 'Ride Tracking',
    locationStatus: 'Location Status',
    requested: 'Processing',
    requestedDesc: 'Your request is under review, waiting for doctor approval',
    confirmed: 'Accepted',
    confirmedDesc: 'Your request has been accepted, doctor will head to you soon',
    inProgress: 'In Progress',
    inProgressDesc: 'Doctor is on the way to you',
    arrived: 'Arrived',
    arrivedDesc: 'Doctor has arrived at your location',
    completed: 'Completed',
    completedDesc: 'Service completed successfully',
    locationAccuracy: 'Location detected with accuracy',
    meters: 'meters',
    
    // Doctor Dashboard
    doctorDashboard: 'Veterinary Doctor Dashboard',
    locationTracking: 'Location Tracking Status',
    locationDetectedSuccessfully: 'Location detected successfully',
    latitude: 'Latitude',
    longitude: 'Longitude',
    pendingRequests: 'Pending Requests',
    noPendingRequests: 'No pending requests currently',
    newRequestReceived: 'New request received!',
    from: 'From',
    serviceType: 'Service Type',
    distance: 'Distance',
    estimatedCost: 'Estimated Cost',
    accept: 'Accept',
    reject: 'Reject',
    
    // Doctor Ride Tracking
    gpsStatus: 'GPS Status',
    connected: 'Connected',
    disconnected: 'Disconnected',
    customerInfo: 'Customer Information',
    rideDetails: 'Ride Details',
    currentStatus: 'Current Status',
    updateStatus: 'Update Status',
    startRide: 'Start Ride',
    arriveAtLocation: 'Arrive at Location',
    completeService: 'Complete Service',
    callCustomer: 'Call Customer',
    openMaps: 'Open Maps',
    googleMaps: 'Google Maps',
    appleMaps: 'Apple Maps',
    waze: 'Waze',
    
    // Home Page
    veterinaryTransport: 'Veterinary Transport Company',
    veterinaryTransportService: 'Veterinary Transport Service',
    
    // General UI
    notifications: 'Notifications',
    settings: 'Settings',
    
    // Home Page Content
    myRides: 'My Rides',
    trackCurrentRide: 'Track Current Ride',
    noActiveRides: 'No Active Rides',
    quickActions: 'Quick Actions',
    activeRide: 'You have an active ride',
    clickToContinue: 'Click to continue tracking',
    continueTracking: 'Continue Tracking',
    recentOrders: 'Recent Orders',
    noPreviousOrders: 'No previous orders',
    
    // Navigation buttons
    account: 'Account',
    activity: 'Activity',
    home: 'Home',
    veterinaryServiceLocation: 'Veterinary service at your location',
    
    // Status Messages
    statusRequested: 'Requested',
    statusAccepted: 'Accepted',
    statusInProgress: 'In Progress',
    statusArrived: 'Arrived',
    statusCompleted: 'Completed',
    
    // Notifications
    unauthorized: 'Unauthorized',
    loginAgain: 'Logging in again...',
    requestAccepted: 'Request accepted',
    requestRejected: 'Request rejected',
    statusUpdated: 'Status updated',
    loginSuccess: 'Login successful',
    logoutSuccess: 'Logout successful',
    languageChanged: 'Language changed successfully',
    registrationSuccess: 'Registration completed successfully',
    welcomeNewUser: 'Welcome to our veterinary service',
    errorOccurred: 'An error occurred',
    pleaseTryAgain: 'Please try again',
    
    // Settings
    language: 'Language',
    arabic: 'العربية',
    english: 'English',
    selectLanguage: 'Select Language',
    
    // Account Page
    accountTitle: 'My Account',
    accountSubtitle: 'Manage your profile',
    accountDetails: 'Account Details',
    firstName: 'First Name',
    lastName: 'Last Name',
    firstNamePlaceholder: 'Enter your first name',
    lastNamePlaceholder: 'Enter your last name', 
    phonePlaceholder: 'Enter your phone number',
    resetPassword: 'Reset Password',
    saveProfile: 'Save Profile',
  }
};

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key: keyof typeof translations.ar): string => {
    return translations[language][key] || key;
  };
  
  return { t, language };
};

// Direction helper for RTL/LTR
export const getDirection = (language: Language): 'rtl' | 'ltr' => {
  return language === 'ar' ? 'rtl' : 'ltr';
};

// Text alignment helper
export const getTextAlign = (language: Language): 'right' | 'left' => {
  return language === 'ar' ? 'right' : 'left';
};