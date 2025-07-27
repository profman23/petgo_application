// Shared Invoice Configuration
// This file ensures consistency between View, PDF, and Print formats

export interface InvoiceTranslations {
  ar: {
    [key: string]: string;
  };
  en: {
    [key: string]: string;
  };
}

export interface InvoiceStyles {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    danger: string;
    text: string;
    border: string;
  };
  spacing: {
    sectionGap: string;
    itemSpacing: string;
    headerPadding: string;
  };
  typography: {
    headerSize: string;
    bodySize: string;
    labelSize: string;
  };
}

export interface InvoiceLayout {
  header: {
    showInvoiceNumber: boolean;
    invoiceNumberPosition: 'above-date' | 'beside-date' | 'separate';
    dateAlignment: 'left' | 'center' | 'right';
  };
  sections: {
    customerInfo: boolean;
    petInfo: boolean;
    serviceDetails: boolean;
    totals: boolean;
  };
  totals: {
    position: 'right' | 'left' | 'center';
    showDualLanguage: boolean;
    spacing: string;
  };
}

// Shared translations with correct Arabic colon positioning
export const invoiceTranslations: InvoiceTranslations = {
  ar: {
    // Header
    companyName: '🚐 VETS VAN المحدث',
    companyTagline: '🐾 خدمات بيطرية متنقلة محدثة في منزلك',
    
    // Invoice Details
    invoiceLabel: 'فاتورة:',
    invoiceNumber: 'رقم الفاتورة:',
    date: 'التاريخ:',
    time: 'الوقت:',
    doctor: 'الطبيب:',
    vehicle: 'المركبة:',
    
    // Customer Information
    customerInfo: 'معلومات العميل',
    customerName: 'اسم العميل:',
    customerPhone: 'تليفون العميل:',
    customerEmail: 'الإيميل:',
    service: 'الخدمة:',
    
    // Pet Information
    petInfo: 'معلومات الحيوانات الأليفة',
    petType: 'النوع:',
    petAge: 'العمر:',
    years: 'سنوات',
    months: 'شهور',
    
    // Service Details
    serviceDetails: 'تفاصيل الخدمات',
    serviceItem: 'الخدمة',
    quantity: 'الكمية',
    unitPrice: 'السعر',
    discount: 'الخصم',
    vat: 'ضريبة',
    totalBeforeVat: 'قبل الضريبة',
    totalAfterVat: 'بعد الضريبة',
    
    // Totals
    totalsTitle: '🧾 ملخص الفاتورة المالي',
    subtotalBeforeVat: 'المجموع قبل الضريبة:',
    vatAmount: 'ضريبة القيمة المضافة (15%):',
    finalTotal: 'المجموع النهائي:',
    totalPaid: 'المبلغ المدفوع:',
    remainingBalance: 'الرصيد المتبقي:',
    
    // Actions
    viewInvoice: 'عرض الفاتورة',
    downloadInvoice: 'تحميل الفاتورة',
    printInvoice: 'طباعة الفاتورة',
    
    // Status
    noDiscount: 'لا يوجد',
    scanToVerify: 'امسح للتحقق'
  },
  en: {
    // Header
    companyName: '🚐 VETS VAN UPDATED',
    companyTagline: '🐾 Updated Mobile Veterinary Services at Your Home',
    
    // Invoice Details
    invoiceLabel: 'Invoice:',
    invoiceNumber: 'Invoice Number:',
    date: 'Date:',
    time: 'Time:',
    doctor: 'Doctor:',
    vehicle: 'Vehicle:',
    
    // Customer Information
    customerInfo: 'Customer Information',
    customerName: 'Name:',
    customerPhone: 'Phone:',
    customerEmail: 'Email:',
    service: 'Service:',
    
    // Pet Information
    petInfo: 'Pet Information',
    petType: 'Type:',
    petAge: 'Age:',
    years: 'years',
    months: 'months',
    
    // Service Details
    serviceDetails: 'Service Details',
    serviceItem: 'Service',
    quantity: 'Qty',
    unitPrice: 'Unit Price',
    discount: 'Discount',
    vat: 'VAT',
    totalBeforeVat: 'Before VAT',
    totalAfterVat: 'After VAT',
    
    // Totals
    totalsTitle: '💰 Financial Invoice Summary',
    subtotalBeforeVat: 'Total Before VAT:',
    vatAmount: 'VAT (15%):',
    finalTotal: 'Final Total:',
    totalPaid: 'Total Paid:',
    remainingBalance: 'Remaining Balance:',
    
    // Actions
    viewInvoice: 'View Invoice',
    downloadInvoice: 'Download Invoice',
    printInvoice: 'Print Invoice',
    
    // Status
    noDiscount: 'None',
    scanToVerify: 'Scan to verify'
  }
};

// Shared styles
export const invoiceStyles: InvoiceStyles = {
  colors: {
    primary: '#8B2F8B',
    secondary: '#6B7280',
    success: '#059669',
    danger: '#DC2626',
    text: '#374151',
    border: '#E5E7EB'
  },
  spacing: {
    sectionGap: '24px',
    itemSpacing: '8px',
    headerPadding: '16px'
  },
  typography: {
    headerSize: '16px',
    bodySize: '12px',
    labelSize: '10px'
  }
};

// Shared layout configuration
export const invoiceLayout: InvoiceLayout = {
  header: {
    showInvoiceNumber: true,
    invoiceNumberPosition: 'above-date',
    dateAlignment: 'left'
  },
  sections: {
    customerInfo: true,
    petInfo: true,
    serviceDetails: true,
    totals: true
  },
  totals: {
    position: 'right',
    showDualLanguage: true,
    spacing: '48px'
  }
};

// Helper function to get translation
export const getTranslation = (key: string, language: 'ar' | 'en'): string => {
  return invoiceTranslations[language][key] || key;
};

// Helper function to format currency
export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

// Helper function to get Riyal symbol path
export const getRiyalSymbolPath = (): string => {
  return '/attached_assets/Screenshot 2025-07-27 144314_1753616612709.png';
};

// Company contact information
export const companyInfo = {
  phone: '+966 50 123 4567',
  email: 'info@vetsvan.com',
  address: {
    ar: 'الرياض، المملكة العربية السعودية',
    en: 'Riyadh, Saudi Arabia'
  }
};

// QR Code configuration
export const qrCodeConfig = {
  size: 128,
  border: 2,
  borderColor: '#000000',
  backgroundColor: '#FFFFFF'
};