// Invoice Configuration - Shared settings for all invoice components
export interface InvoiceTexts {
  ar: {
    invoice: 'فاتورة';
    invoiceNumber: 'رقم الفاتورة';
  };
  en: {
    invoice: 'Invoice';
    invoiceNumber: 'Invoice Number';
  };
}

export interface InvoiceConfig {
  texts: InvoiceTexts;
  dateFormat: {
    ar: string;
    en: string;
  };
  currency: {
    symbol: 'SAR';
    position: 'after'; // 'before' | 'after'
  };
  styles: {
    headerFontSize: string;
    bodyFontSize: string;
    primaryColor: string;
    backgroundColor: string;
  };
}

export const invoiceConfig: InvoiceConfig = {
  texts: {
    ar: {
      invoice: 'فاتورة',
      invoiceNumber: 'رقم الفاتورة'
    },
    en: {
      invoice: 'Invoice',
      invoiceNumber: 'Invoice Number'
    }
  },
  dateFormat: {
    ar: 'DD/MM/YYYY',
    en: 'MM/DD/YYYY'
  },
  currency: {
    symbol: 'SAR',
    position: 'after'
  },
  styles: {
    headerFontSize: '18px',
    bodyFontSize: '14px',
    primaryColor: '#8B5CF6',
    backgroundColor: '#FFFFFF'
  }
};

// Generate invoice number format
export const generateInvoiceNumber = (bookingId: number): string => {
  return `INV-${String(bookingId).padStart(5, '0')}`;
};