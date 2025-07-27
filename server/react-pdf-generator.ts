import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import * as React from 'react';
import fs from 'fs/promises';
import path from 'path';

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

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#8B2F8B',
    paddingBottom: 10,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B2F8B',
    marginBottom: 5,
  },
  companyTagline: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 10,
  },
  contactInfo: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 2,
  },
  invoiceDetails: {
    alignItems: 'flex-end',
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  invoiceDate: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 2,
  },
  section: {
    marginBottom: 15,
    padding: 10,
    border: 2,
    borderColor: '#8B2F8B',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#8B2F8B',
    padding: 8,
    margin: -10,
    marginBottom: 10,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 80,
    color: '#333333',
  },
  value: {
    fontSize: 10,
    flex: 1,
    color: '#333333',
  },
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#8B2F8B',
    color: '#FFFFFF',
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#EEEEEE',
    padding: 8,
    fontSize: 9,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  totalsSection: {
    alignItems: 'flex-end',
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
    width: 250,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 120,
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    fontSize: 12,
    width: 80,
    textAlign: 'right',
  },
  finalTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B2F8B',
  },
});

// Create Document Component
const InvoicePDF = ({ invoiceData, language }: { invoiceData: InvoiceData; language: 'ar' | 'en' }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return language === 'ar' 
      ? date.toLocaleDateString('ar-SA')
      : date.toLocaleDateString('en-US');
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} SAR`;
  };

  const totalPaid = (invoiceData.paymentMethods || []).reduce(
    (sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 
    0
  );

  const remainingBalance = Math.max(0, (invoiceData.total || 0) - totalPaid);

  const translations = {
    ar: {
      invoice: 'فاتورة',
      customerInfo: 'معلومات العميل',
      petInfo: 'معلومات الحيوان الأليف',
      serviceDetails: 'تفاصيل الخدمة',
      paymentMethods: 'طرق الدفع',
      totals: 'المجاميع',
      name: 'الاسم',
      phone: 'الهاتف',
      email: 'الإيميل',
      date: 'التاريخ',
      time: 'الوقت',
      doctor: 'الطبيب',
      vehicle: 'المركبة',
      petName: 'اسم الحيوان',
      petType: 'النوع',
      age: 'العمر',
      service: 'الخدمة',
      quantity: 'الكمية',
      unitPrice: 'سعر الوحدة',
      discount: 'الخصم',
      vat: 'ضريبة القيمة المضافة',
      beforeVat: 'قبل الضريبة',
      afterVat: 'بعد الضريبة',
      subtotal: 'المجموع الفرعي',
      totalDiscount: 'إجمالي الخصم',
      totalVat: 'إجمالي الضريبة',
      finalTotal: 'المجموع النهائي',
      totalPaid: 'المدفوع',
      remainingBalance: 'الرصيد المتبقي',
      paymentType: 'نوع الدفع',
      amount: 'المبلغ',
      years: 'سنة',
      months: 'شهر'
    },
    en: {
      invoice: 'Invoice',
      customerInfo: 'Customer Information',
      petInfo: 'Pet Information',
      serviceDetails: 'Service Details',
      paymentMethods: 'Payment Methods',
      totals: 'Totals',
      name: 'Name',
      phone: 'Phone',
      email: 'Email',
      date: 'Date',
      time: 'Time',
      doctor: 'Doctor',
      vehicle: 'Vehicle',
      petName: 'Pet Name',
      petType: 'Type',
      age: 'Age',
      service: 'Service',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      discount: 'Discount',
      vat: 'VAT',
      beforeVat: 'Before VAT',
      afterVat: 'After VAT',
      subtotal: 'Subtotal',
      totalDiscount: 'Total Discount',
      totalVat: 'Total VAT',
      finalTotal: 'Final Total',
      totalPaid: 'Total Paid',
      remainingBalance: 'Remaining Balance',
      paymentType: 'Payment Type',
      amount: 'Amount',
      years: 'years',
      months: 'months'
    }
  };

  const t = translations[language];

  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: styles.page },
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>VETS VAN</Text>
            <Text style={styles.companyTagline}>
              {language === 'ar' ? 'خدمات بيطرية متنقلة في منزلك' : 'Mobile Veterinary Services at Your Home'}
            </Text>
            <Text style={styles.contactInfo}>+966 50 123 4567</Text>
            <Text style={styles.contactInfo}>info@vetsvan.com</Text>
            <Text style={styles.contactInfo}>
              {language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}
            </Text>
          </View>
          <View style={styles.invoiceDetails}>
            <Text style={styles.invoiceNumber}>
              {t.invoice}: {invoiceData.invoiceNumber}
            </Text>
            <Text style={styles.invoiceDate}>
              {t.date}: {formatDate(invoiceData.appointmentDate)}
            </Text>
            <Text style={styles.invoiceDate}>
              {t.time}: {invoiceData.appointmentTime}
            </Text>
            <Text style={styles.invoiceDate}>
              {t.doctor}: {invoiceData.doctorName}
            </Text>
            <Text style={styles.invoiceDate}>
              {t.vehicle}: {invoiceData.vetsVanCode}
            </Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.customerInfo}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t.name}:</Text>
            <Text style={styles.value}>{invoiceData.customer.firstName} {invoiceData.customer.lastName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.phone}:</Text>
            <Text style={styles.value}>{invoiceData.customer.phone}</Text>
          </View>
          {invoiceData.customer.email && (
            <View style={styles.row}>
              <Text style={styles.label}>{t.email}:</Text>
              <Text style={styles.value}>{invoiceData.customer.email}</Text>
            </View>
          )}
        </View>

        {/* Pet Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.petInfo}</Text>
          {invoiceData.pets.map((pet, index) => (
            <View key={pet.id}>
              <View style={styles.row}>
                <Text style={styles.label}>{t.petName}:</Text>
                <Text style={styles.value}>{pet.name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t.petType}:</Text>
                <Text style={styles.value}>{pet.type}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t.age}:</Text>
                <Text style={styles.value}>
                  {pet.ageYear} {t.years} {pet.ageMonth > 0 ? `${pet.ageMonth} ${t.months}` : ''}
                </Text>
              </View>
              {index < invoiceData.pets.length - 1 && <Text style={{ marginBottom: 5 }}></Text>}
            </View>
          ))}
        </View>

        {/* Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.serviceDetails}</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{t.service}</Text>
              <Text style={styles.tableCell}>{t.quantity}</Text>
              <Text style={styles.tableCell}>{t.unitPrice}</Text>
              <Text style={styles.tableCell}>{t.discount}</Text>
              <Text style={styles.tableCell}>{t.vat}</Text>
              <Text style={styles.tableCell}>{t.beforeVat}</Text>
              <Text style={styles.tableCell}>{t.afterVat}</Text>
            </View>
            {invoiceData.items.map((item, index) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2, textAlign: 'left' }]}>{item.description}</Text>
                <Text style={styles.tableCell}>{item.quantity}</Text>
                <Text style={styles.tableCell}>{formatCurrency(item.unitPrice)}</Text>
                <Text style={styles.tableCell}>
                  {item.discountType === '10%' ? '10%' : item.discountType === '100%' ? '100%' : '-'}
                </Text>
                <Text style={styles.tableCell}>{formatCurrency(item.vatAmount)}</Text>
                <Text style={styles.tableCell}>{formatCurrency(item.totalBeforeVat)}</Text>
                <Text style={styles.tableCell}>{formatCurrency(item.totalAfterVat)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Methods */}
        {invoiceData.paymentMethods && invoiceData.paymentMethods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.paymentMethods}</Text>
            {invoiceData.paymentMethods.map((payment, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.label}>{t.paymentType}:</Text>
                <Text style={styles.value}>{payment.paymentType} - {formatCurrency(payment.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.subtotal}:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoiceData.subtotal)}</Text>
          </View>
          {invoiceData.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t.totalDiscount}:</Text>
              <Text style={styles.totalValue}>-{formatCurrency(invoiceData.discount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.totalVat}:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoiceData.tax)}</Text>
          </View>
          <View style={[styles.totalRow, { borderTop: 2, borderTopColor: '#8B2F8B', paddingTop: 5 }]}>
            <Text style={[styles.totalLabel, styles.finalTotal]}>{t.finalTotal}:</Text>
            <Text style={[styles.totalValue, styles.finalTotal]}>{formatCurrency(invoiceData.total)}</Text>
          </View>
          {totalPaid > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t.totalPaid}:</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalPaid)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t.remainingBalance}:</Text>
                <Text style={styles.totalValue}>{formatCurrency(remainingBalance)}</Text>
              </View>
            </>
          )}
        </View>
      </Page>
    </Document>
  );
};

export async function generateReactPDF(invoiceData: InvoiceData, language: 'ar' | 'en' = 'en'): Promise<Buffer> {
  try {
    const doc = React.createElement(InvoicePDF, { invoiceData, language });
    const pdfBuffer = await pdf(doc).toBuffer();
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF with react-pdf:', error);
    throw new Error('Failed to generate PDF');
  }
}