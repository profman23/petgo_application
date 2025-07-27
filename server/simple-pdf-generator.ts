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

export async function generateSimplePDF(invoiceData: InvoiceData, language: 'ar' | 'en' = 'en'): Promise<Buffer> {
  try {
    // Use the same HTML structure from unified-pdf-generator
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return language === 'ar' 
        ? date.toLocaleDateString('ar-SA')
        : date.toLocaleDateString('en-US');
    };

    const formatCurrency = (amount: number) => {
      return amount.toFixed(2);
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

    // Generate simple text-based PDF content
    let pdfContent = `
${t.invoice}: ${invoiceData.invoiceNumber}
============================

VETS VAN - Mobile Veterinary Services
${t.date}: ${formatDate(invoiceData.appointmentDate)}
${t.time}: ${invoiceData.appointmentTime}
${t.doctor}: ${invoiceData.doctorName}
${t.vehicle}: ${invoiceData.vetsVanCode}

${t.customerInfo}
--------------------
${t.name}: ${invoiceData.customer.firstName} ${invoiceData.customer.lastName}
${t.phone}: ${invoiceData.customer.phone}
${invoiceData.customer.email ? `${t.email}: ${invoiceData.customer.email}` : ''}

${t.petInfo}
--------------------
`;

    invoiceData.pets.forEach(pet => {
      pdfContent += `${t.petName}: ${pet.name}
${t.petType}: ${pet.type}
${t.age}: ${pet.ageYear} ${t.years} ${pet.ageMonth > 0 ? `${pet.ageMonth} ${t.months}` : ''}

`;
    });

    pdfContent += `${t.serviceDetails}
--------------------
`;

    invoiceData.items.forEach(item => {
      pdfContent += `${t.service}: ${item.description}
${t.quantity}: ${item.quantity}
${t.unitPrice}: ${formatCurrency(item.unitPrice)} SAR
${t.discount}: ${item.discountType || '-'}
${t.vat}: ${formatCurrency(item.vatAmount)} SAR
${t.beforeVat}: ${formatCurrency(item.totalBeforeVat)} SAR
${t.afterVat}: ${formatCurrency(item.totalAfterVat)} SAR

`;
    });

    if (invoiceData.paymentMethods && invoiceData.paymentMethods.length > 0) {
      pdfContent += `${t.paymentMethods}
--------------------
`;
      invoiceData.paymentMethods.forEach(payment => {
        pdfContent += `${t.paymentType}: ${payment.paymentType} - ${formatCurrency(payment.amount)} SAR
`;
      });
      pdfContent += '\n';
    }

    pdfContent += `${t.totals}
--------------------
${t.subtotal}: ${formatCurrency(invoiceData.subtotal)} SAR
${invoiceData.discount > 0 ? `${t.totalDiscount}: -${formatCurrency(invoiceData.discount)} SAR\n` : ''}${t.totalVat}: ${formatCurrency(invoiceData.tax)} SAR
${t.finalTotal}: ${formatCurrency(invoiceData.total)} SAR
${totalPaid > 0 ? `${t.totalPaid}: ${formatCurrency(totalPaid)} SAR\n${t.remainingBalance}: ${formatCurrency(remainingBalance)} SAR` : ''}
`;

    // Convert text to basic PDF buffer (placeholder)
    // For now, return the content as a simple text buffer
    // In production, you would use a proper PDF library here
    return Buffer.from(pdfContent, 'utf-8');

  } catch (error) {
    console.error('Error generating simple PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}