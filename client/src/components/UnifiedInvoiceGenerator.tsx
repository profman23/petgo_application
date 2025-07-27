import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts for Arabic support
// Font.register({
//   family: 'Arabic',
//   src: 'https://fonts.gstatic.com/s/notoarabic/v27/Hgo13k-tfSpn0qi1SFdUfVtXRcuvYuduBSE.woff2'
// });

interface InvoiceData {
  invoiceNumber: string;
  bookingId: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  vetsVanCode: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  pets: Array<{
    id: string;
    name: string;
    type: string;
    ageYear: number;
    ageMonth: number;
  }>;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountType?: string;
    vatAmount: number;
    totalBeforeVat: number;
    totalAfterVat: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  serviceType: string;
  paymentMethods?: Array<{
    amount: number;
    paymentType: string;
  }>;
}

interface UnifiedInvoiceProps {
  invoiceData: InvoiceData;
  language: 'ar' | 'en';
  logoBase64?: string;
  riyalSymbolBase64?: string;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 32,
    fontFamily: 'Helvetica',
  },
  container: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logoSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B2F8B',
    marginBottom: 4,
  },
  companyTagline: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  contactInfo: {
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 1.4,
  },
  invoiceDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  invoiceLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  doctorInfo: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCode: {
    width: 80,
    height: 80,
    border: '2px solid #000000',
    borderRadius: 8,
    marginBottom: 8,
  },
  qrText: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
  separatorLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#8B2F8B',
    opacity: 0.3,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#8B2F8B',
    padding: 12,
    marginBottom: 16,
    borderRadius: '8px 8px 0 0',
  },
  customerSection: {
    border: '2px solid #8B2F8B',
    borderRadius: 8,
    marginBottom: 20,
    padding: 16,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  customerLabel: {
    fontSize: 10,
    color: '#666666',
    fontWeight: 'bold',
  },
  customerValue: {
    fontSize: 10,
    color: '#374151',
  },
  petsSection: {
    border: '2px solid #8B2F8B',
    borderRadius: 8,
    marginBottom: 20,
    padding: 16,
  },
  petCard: {
    border: '1px solid #8B2F8B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  petName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B2F8B',
    marginBottom: 4,
  },
  petDetail: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 2,
  },
  servicesSection: {
    border: '2px solid #8B2F8B',
    borderRadius: 8,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#8B2F8B',
    padding: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    padding: 4,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #E5E7EB',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: '#374151',
    textAlign: 'center',
    padding: 4,
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 48,
    gap: 24,
  },
  totalsSection: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #D1D5DB',
    borderRadius: 8,
    padding: 16,
    width: '45%',
  },
  totalsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: 8,
    marginBottom: 16,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottom: '1px solid #E5E7EB',
    marginBottom: 8,
  },
  totalsLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalsValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  finalTotal: {
    color: '#8B2F8B',
    fontWeight: 'bold',
  },
  paidAmount: {
    color: '#059669',
  },
  remainingBalance: {
    color: '#DC2626',
  },
  riyalSymbol: {
    width: 8,
    height: 8,
    marginLeft: 4,
  },
});

const UnifiedInvoiceGenerator: React.FC<UnifiedInvoiceProps> = ({
  invoiceData,
  language,
  logoBase64,
  riyalSymbolBase64
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return language === 'ar' 
      ? date.toLocaleDateString('ar-SA')
      : date.toLocaleDateString('en-US');
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2);
  };

  const totalPaid = (invoiceData.paymentMethods || []).reduce(
    (sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 
    0
  );

  const remainingBalance = Math.max(0, (invoiceData.total || 0) - totalPaid);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            {/* Company Info */}
            <View style={styles.logoSection}>
              <Text style={styles.companyName}>VETS VAN</Text>
              <Text style={styles.companyTagline}>
                {language === 'ar' ? 'خدمات بيطرية متنقلة في منزلك' : 'Mobile Veterinary Services at Your Home'}
              </Text>
              <View style={styles.contactInfo}>
                <Text>📞 +966 50 123 4567</Text>
                <Text>✉️ info@vetsvan.com</Text>
                <Text>{language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</Text>
              </View>
            </View>

            {/* Invoice Details */}
            <View style={styles.invoiceDetails}>
              <Text style={styles.invoiceLabel}>
                Invoice: {invoiceData.invoiceNumber || `VETSVAN-${invoiceData.bookingId}`}
              </Text>
              <Text style={styles.dateText}>
                📅 {formatDate(invoiceData.appointmentDate)}
              </Text>
              <Text style={styles.dateText}>
                🕐 {formatTime(invoiceData.appointmentTime)}
              </Text>
              <Text style={styles.doctorInfo}>
                {language === 'ar' ? 'الطبيب:' : 'Doctor:'} {invoiceData.doctorName}
              </Text>
              <Text style={styles.doctorInfo}>
                {language === 'ar' ? 'المركبة:' : 'Vehicle:'} {invoiceData.vetsVanCode}
              </Text>
            </View>

            {/* QR Code Section */}
            <View style={styles.qrSection}>
              <View style={styles.qrCode}>
                {/* QR Code placeholder */}
              </View>
              <Text style={styles.qrText}>
                {language === 'ar' ? 'امسح للتحقق' : 'Scan to verify'}
              </Text>
            </View>
          </View>

          {/* Separator */}
          <View style={styles.separatorLine} />

          {/* Customer Information */}
          <View style={styles.customerSection}>
            <Text style={styles.sectionTitle}>
              {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
            </Text>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>
                {language === 'ar' ? 'الاسم:' : 'Name:'}
              </Text>
              <Text style={styles.customerValue}>
                {invoiceData.customer.firstName} {invoiceData.customer.lastName}
              </Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>
                {language === 'ar' ? 'الهاتف:' : 'Phone:'}
              </Text>
              <Text style={styles.customerValue}>
                {invoiceData.customer.phone}
              </Text>
            </View>
            {invoiceData.customer.email && (
              <View style={styles.customerRow}>
                <Text style={styles.customerLabel}>
                  {language === 'ar' ? 'الإيميل:' : 'Email:'}
                </Text>
                <Text style={styles.customerValue}>
                  {invoiceData.customer.email}
                </Text>
              </View>
            )}
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>
                {language === 'ar' ? 'الخدمة:' : 'Service:'}
              </Text>
              <Text style={styles.customerValue}>
                {invoiceData.serviceType}
              </Text>
            </View>
          </View>

          {/* Pets Information */}
          <View style={styles.petsSection}>
            <Text style={styles.sectionTitle}>
              {language === 'ar' ? 'معلومات الحيوانات الأليفة' : 'Pet Information'}
            </Text>
            {invoiceData.pets.map((pet) => (
              <View key={pet.id} style={styles.petCard}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petDetail}>
                  {language === 'ar' ? 'النوع:' : 'Type:'} {pet.type}
                </Text>
                <Text style={styles.petDetail}>
                  {language === 'ar' ? 'العمر:' : 'Age:'} {pet.ageYear || 0} {language === 'ar' ? 'سنوات' : 'years'} {pet.ageMonth || 0} {language === 'ar' ? 'شهور' : 'months'}
                </Text>
              </View>
            ))}
          </View>

          {/* Services Table */}
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>
              {language === 'ar' ? 'تفاصيل الخدمات' : 'Service Details'}
            </Text>
            
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>
                {language === 'ar' ? 'الخدمة' : 'Service'}
              </Text>
              <Text style={styles.tableHeaderCell}>
                {language === 'ar' ? 'الكمية' : 'Qty'}
              </Text>
              <Text style={styles.tableHeaderCell}>
                {language === 'ar' ? 'السعر' : 'Unit Price'}
              </Text>
              <Text style={styles.tableHeaderCell}>
                {language === 'ar' ? 'الخصم' : 'Discount'}
              </Text>
              <Text style={styles.tableHeaderCell}>
                {language === 'ar' ? 'ضريبة' : 'VAT'}
              </Text>
              <Text style={styles.tableHeaderCell}>
                {language === 'ar' ? 'قبل الضريبة' : 'Before VAT'}
              </Text>
              <Text style={styles.tableHeaderCell}>
                {language === 'ar' ? 'بعد الضريبة' : 'After VAT'}
              </Text>
            </View>

            {/* Table Data */}
            {invoiceData.items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.description}</Text>
                <Text style={styles.tableCell}>{item.quantity}</Text>
                <Text style={styles.tableCell}>{formatCurrency(item.unitPrice)}</Text>
                <Text style={styles.tableCell}>
                  {item.discountType && item.discountType !== 'none' && item.discountType !== 'No Discount'
                    ? item.discountType
                    : (language === 'ar' ? 'لا يوجد' : 'None')}
                </Text>
                <Text style={styles.tableCell}>{formatCurrency(item.vatAmount)}</Text>
                <Text style={styles.tableCell}>{formatCurrency(item.totalBeforeVat)}</Text>
                <Text style={styles.tableCell}>{formatCurrency(item.totalAfterVat)}</Text>
              </View>
            ))}
          </View>

          {/* Totals Section - Bilingual */}
          <View style={styles.totalsContainer}>
            {/* English Totals */}
            <View style={styles.totalsSection}>
              <Text style={styles.totalsTitle}>Invoice Totals</Text>
              
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Total Before VAT:</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrency((invoiceData.subtotal || 0) - (invoiceData.discount || 0))}
                </Text>
              </View>
              
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>VAT (15%):</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrency(invoiceData.tax || 0)}
                </Text>
              </View>
              
              <View style={styles.totalsRow}>
                <Text style={[styles.totalsLabel, styles.finalTotal]}>Final Total:</Text>
                <Text style={[styles.totalsValue, styles.finalTotal]}>
                  {formatCurrency(invoiceData.total || 0)}
                </Text>
              </View>
              
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Total Paid:</Text>
                <Text style={[styles.totalsValue, styles.paidAmount]}>
                  {formatCurrency(totalPaid)}
                </Text>
              </View>
              
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Remaining Balance:</Text>
                <Text style={[styles.totalsValue, styles.remainingBalance]}>
                  {formatCurrency(remainingBalance)}
                </Text>
              </View>
            </View>

            {/* Arabic Totals */}
            <View style={styles.totalsSection}>
              <Text style={styles.totalsTitle}>مجموع الفاتورة</Text>
              
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>المجموع قبل الضريبة:</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrency((invoiceData.subtotal || 0) - (invoiceData.discount || 0))}
                </Text>
              </View>
              
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>ضريبة القيمة المضافة (15%):</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrency(invoiceData.tax || 0)}
                </Text>
              </View>
              
              <View style={styles.totalsRow}>
                <Text style={[styles.totalsLabel, styles.finalTotal]}>المجموع النهائي:</Text>
                <Text style={[styles.totalsValue, styles.finalTotal]}>
                  {formatCurrency(invoiceData.total || 0)}
                </Text>
              </View>
              
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>المبلغ المدفوع:</Text>
                <Text style={[styles.totalsValue, styles.paidAmount]}>
                  {formatCurrency(totalPaid)}
                </Text>
              </View>
              
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>الرصيد المتبقي:</Text>
                <Text style={[styles.totalsValue, styles.remainingBalance]}>
                  {formatCurrency(remainingBalance)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default UnifiedInvoiceGenerator;