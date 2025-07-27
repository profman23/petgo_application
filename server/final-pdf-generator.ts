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

export async function generateFinalPDF(invoiceData: InvoiceData, language: 'ar' | 'en' = 'en'): Promise<Buffer> {
  try {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return language === 'ar' 
        ? date.toLocaleDateString('ar-SA')
        : date.toLocaleDateString('en-US');
    };

    const formatCurrency = (amount: number | string) => {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      return (isNaN(numAmount) ? 0 : numAmount).toFixed(2);
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
    const isRTL = language === 'ar';

    // Generate simple PDF-like content using plain text format
    // This approach avoids Chrome/Puppeteer completely
    let pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 2000
>>
stream
BT
/F1 12 Tf
50 750 Td
(VETS VAN - ${t.invoice}: ${invoiceData.invoiceNumber}) Tj
0 -30 Td
(${t.date}: ${formatDate(invoiceData.appointmentDate)}) Tj
0 -20 Td
(${t.time}: ${invoiceData.appointmentTime}) Tj
0 -20 Td
(${t.doctor}: ${invoiceData.doctorName}) Tj
0 -20 Td
(${t.vehicle}: ${invoiceData.vetsVanCode}) Tj
0 -40 Td
(${t.customerInfo}:) Tj
0 -20 Td
(${t.name}: ${invoiceData.customer.firstName} ${invoiceData.customer.lastName}) Tj
0 -20 Td
(${t.phone}: ${invoiceData.customer.phone}) Tj
${invoiceData.customer.email ? `0 -20 Td
(${t.email}: ${invoiceData.customer.email}) Tj` : ''}
0 -40 Td
(${t.petInfo}:) Tj
`;

    // Add pets information
    let yOffset = -20;
    invoiceData.pets.forEach(pet => {
      pdfContent += `0 ${yOffset} Td
(${t.petName}: ${pet.name} - ${t.petType}: ${pet.type} - ${t.age}: ${pet.ageYear} ${t.years}) Tj
`;
      yOffset -= 20;
    });

    pdfContent += `0 ${yOffset - 20} Td
(${t.serviceDetails}:) Tj
`;

    // Add service items
    yOffset -= 40;
    invoiceData.items.forEach(item => {
      pdfContent += `0 ${yOffset} Td
(${item.description} - ${t.quantity}: ${item.quantity} - ${formatCurrency(item.totalAfterVat)} SAR) Tj
`;
      yOffset -= 20;
    });

    // Add totals
    pdfContent += `0 ${yOffset - 20} Td
(${t.totals}:) Tj
0 ${yOffset - 40} Td
(${t.subtotal}: ${formatCurrency(invoiceData.subtotal)} SAR) Tj
`;

    if (invoiceData.discount > 0) {
      pdfContent += `0 ${yOffset - 60} Td
(${t.totalDiscount}: -${formatCurrency(invoiceData.discount)} SAR) Tj
`;
    }

    pdfContent += `0 ${yOffset - 80} Td
(${t.totalVat}: ${formatCurrency(invoiceData.tax)} SAR) Tj
0 ${yOffset - 100} Td
(${t.finalTotal}: ${formatCurrency(invoiceData.total)} SAR) Tj
`;

    if (totalPaid > 0) {
      pdfContent += `0 ${yOffset - 120} Td
(${t.totalPaid}: ${formatCurrency(totalPaid)} SAR) Tj
0 ${yOffset - 140} Td
(${t.remainingBalance}: ${formatCurrency(remainingBalance)} SAR) Tj
`;
    }

    pdfContent += `
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000258 00000 n 
0000002309 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
2379
%%EOF`;

    return Buffer.from(pdfContent, 'utf-8');

  } catch (error) {
    console.error('Error generating final PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}