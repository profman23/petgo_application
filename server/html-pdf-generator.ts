import htmlPdf from 'html-pdf-node';
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

export async function generateHtmlPDF(invoiceData: InvoiceData, language: 'ar' | 'en' = 'en'): Promise<Buffer> {
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

    // Load riyal symbol
    let riyalSymbolBase64 = '';
    try {
      const riyalSymbolPath = path.join(process.cwd(), 'attached_assets', 'Screenshot 2025-07-27 144314_1753616612709.png');
      const riyalSymbolBuffer = await fs.readFile(riyalSymbolPath);
      riyalSymbolBase64 = `data:image/png;base64,${riyalSymbolBuffer.toString('base64')}`;
    } catch (error) {
      console.log('Could not load riyal symbol image:', error);
    }

    // Load company logo
    let logoBase64 = '';
    try {
      const logoPath = path.join(process.cwd(), 'attached_assets', 'IMG-20250415-WA0047_1751986059751.jpg');
      const logoBuffer = await fs.readFile(logoPath);
      logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      console.log('Could not load company logo:', error);
    }

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

    const htmlContent = `
<!DOCTYPE html>
<html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.invoice}: ${invoiceData.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
            direction: ${isRTL ? 'rtl' : 'ltr'};
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        /* Header */
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 3px solid #8B2F8B;
            padding-bottom: 20px;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-logo {
            width: 80px;
            height: 60px;
            object-fit: contain;
            margin-bottom: 10px;
            border-radius: 8px;
        }
        
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #8B2F8B;
            margin-bottom: 5px;
        }
        
        .company-tagline {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .contact-info {
            font-size: 11px;
            color: #666;
            line-height: 1.5;
        }
        
        .invoice-details {
            text-align: ${isRTL ? 'left' : 'right'};
        }
        
        .invoice-number {
            font-size: 20px;
            font-weight: bold;
            color: #8B2F8B;
            margin-bottom: 10px;
        }
        
        .invoice-meta {
            font-size: 12px;
            color: #666;
            line-height: 1.6;
        }
        
        /* Sections */
        .section {
            margin-bottom: 25px;
            border: 2px solid #8B2F8B;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .section-title {
            background: #8B2F8B;
            color: white;
            padding: 12px 15px;
            font-size: 14px;
            font-weight: bold;
        }
        
        .section-content {
            padding: 15px;
            background: white;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 8px;
            align-items: center;
        }
        
        .info-label {
            font-weight: bold;
            min-width: 120px;
            color: #333;
            margin-${isRTL ? 'left' : 'right'}: 10px;
        }
        
        .info-value {
            flex: 1;
            color: #555;
        }
        
        /* Table */
        .service-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .service-table th {
            background: #8B2F8B;
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
        }
        
        .service-table td {
            padding: 10px 8px;
            text-align: center;
            border-bottom: 1px solid #eee;
            font-size: 10px;
        }
        
        .service-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .description-cell {
            text-align: ${isRTL ? 'right' : 'left'} !important;
            max-width: 150px;
            word-wrap: break-word;
        }
        
        /* Totals */
        .totals-section {
            margin-top: 30px;
            float: ${isRTL ? 'left' : 'right'};
            width: 350px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            padding: 8px 15px;
            border-radius: 5px;
        }
        
        .total-label {
            font-weight: bold;
            color: #333;
        }
        
        .total-value {
            font-weight: bold;
            color: #333;
            display: flex;
            align-items: center;
        }
        
        .currency-symbol {
            width: 20px;
            height: 15px;
            margin-${isRTL ? 'right' : 'left'}: 5px;
        }
        
        .final-total {
            background: #8B2F8B;
            color: white !important;
            font-size: 16px;
            border-radius: 8px;
        }
        
        .final-total .total-label,
        .final-total .total-value {
            color: white !important;
        }
        
        .subtotal-row {
            background: #f5f5f5;
        }
        
        .discount-row {
            background: #fff3cd;
            color: #856404;
        }
        
        .vat-row {
            background: #d4edda;
            color: #155724;
        }
        
        .payment-row {
            background: #cce5ff;
            color: #004085;
        }
        
        .balance-row {
            background: #f8d7da;
            color: #721c24;
        }
        
        /* Print styles */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .invoice-container {
                max-width: none;
                padding: 10px;
            }
            
            .company-logo {
                width: 60px;
                height: 45px;
            }
            
            .company-name {
                font-size: 22px;
            }
            
            .section {
                margin-bottom: 15px;
            }
            
            .section-content {
                padding: 10px;
            }
        }
        
        .clearfix::after {
            content: "";
            display: table;
            clear: both;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
            <div class="company-info">
                ${logoBase64 ? `<img src="${logoBase64}" alt="VETS VAN Logo" class="company-logo">` : ''}
                <div class="company-name">VETS VAN</div>
                <div class="company-tagline">
                    ${language === 'ar' ? 'خدمات بيطرية متنقلة في منزلك' : 'Mobile Veterinary Services at Your Home'}
                </div>
                <div class="contact-info">
                    +966 50 123 4567<br>
                    info@vetsvan.com<br>
                    ${language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}
                </div>
            </div>
            <div class="invoice-details">
                <div class="invoice-number">${t.invoice}: ${invoiceData.invoiceNumber}</div>
                <div class="invoice-meta">
                    ${t.date}: ${formatDate(invoiceData.appointmentDate)}<br>
                    ${t.time}: ${invoiceData.appointmentTime}<br>
                    ${t.doctor}: ${invoiceData.doctorName}<br>
                    ${t.vehicle}: ${invoiceData.vetsVanCode}
                </div>
            </div>
        </div>

        <!-- Customer Information -->
        <div class="section">
            <div class="section-title">${t.customerInfo}</div>
            <div class="section-content">
                <div class="info-row">
                    <span class="info-label">${t.name}:</span>
                    <span class="info-value">${invoiceData.customer.firstName} ${invoiceData.customer.lastName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">${t.phone}:</span>
                    <span class="info-value">${invoiceData.customer.phone}</span>
                </div>
                ${invoiceData.customer.email ? `
                <div class="info-row">
                    <span class="info-label">${t.email}:</span>
                    <span class="info-value">${invoiceData.customer.email}</span>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Pet Information -->
        <div class="section">
            <div class="section-title">${t.petInfo}</div>
            <div class="section-content">
                ${invoiceData.pets.map(pet => `
                <div style="margin-bottom: 15px;">
                    <div class="info-row">
                        <span class="info-label">${t.petName}:</span>
                        <span class="info-value">${pet.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">${t.petType}:</span>
                        <span class="info-value">${pet.type}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">${t.age}:</span>
                        <span class="info-value">${pet.ageYear} ${t.years} ${pet.ageMonth > 0 ? `${pet.ageMonth} ${t.months}` : ''}</span>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>

        <!-- Service Details -->
        <div class="section">
            <div class="section-title">${t.serviceDetails}</div>
            <div class="section-content">
                <table class="service-table">
                    <thead>
                        <tr>
                            <th style="width: 25%;">${t.service}</th>
                            <th style="width: 10%;">${t.quantity}</th>
                            <th style="width: 15%;">${t.unitPrice}</th>
                            <th style="width: 10%;">${t.discount}</th>
                            <th style="width: 12%;">${t.vat}</th>
                            <th style="width: 14%;">${t.beforeVat}</th>
                            <th style="width: 14%;">${t.afterVat}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoiceData.items.map(item => `
                        <tr>
                            <td class="description-cell">${item.description}</td>
                            <td>${item.quantity}</td>
                            <td>${formatCurrency(item.unitPrice)} ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" class="currency-symbol">` : 'SAR'}</td>
                            <td>${item.discountType === '10%' ? '10%' : item.discountType === '100%' ? '100%' : '-'}</td>
                            <td>${formatCurrency(item.vatAmount)} ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" class="currency-symbol">` : 'SAR'}</td>
                            <td>${formatCurrency(item.totalBeforeVat)} ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" class="currency-symbol">` : 'SAR'}</td>
                            <td>${formatCurrency(item.totalAfterVat)} ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" class="currency-symbol">` : 'SAR'}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        ${invoiceData.paymentMethods && invoiceData.paymentMethods.length > 0 ? `
        <!-- Payment Methods -->
        <div class="section">
            <div class="section-title">${t.paymentMethods}</div>
            <div class="section-content">
                ${invoiceData.paymentMethods.map(payment => `
                <div class="info-row">
                    <span class="info-label">${t.paymentType}:</span>
                    <span class="info-value">${payment.paymentType} - ${formatCurrency(payment.amount)} ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" class="currency-symbol">` : 'SAR'}</span>
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Totals -->
        <div class="clearfix">
            <div class="totals-section">
                <div class="total-row subtotal-row">
                    <span class="total-label">${t.subtotal}:</span>
                    <span class="total-value">
                        ${formatCurrency(invoiceData.subtotal)}
                        ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" class="currency-symbol">` : 'SAR'}
                    </span>
                </div>
                ${invoiceData.discount > 0 ? `
                <div class="total-row discount-row">
                    <span class="total-label">${t.totalDiscount}:</span>
                    <span class="total-value">
                        -${formatCurrency(invoiceData.discount)}
                        ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" class="currency-symbol">` : 'SAR'}
                    </span>
                </div>
                ` : ''}
                <div class="total-row vat-row">
                    <span class="total-label">${t.totalVat}:</span>
                    <span class="total-value">
                        ${formatCurrency(invoiceData.tax)}
                        ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" class="currency-symbol">` : 'SAR'}
                    </span>
                </div>
                <div class="total-row final-total">
                    <span class="total-label">${t.finalTotal}:</span>
                    <span class="total-value">
                        ${formatCurrency(invoiceData.total)}
                        ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" class="currency-symbol">` : 'SAR'}
                    </span>
                </div>
                ${totalPaid > 0 ? `
                <div class="total-row payment-row">
                    <span class="total-label">${t.totalPaid}:</span>
                    <span class="total-value">
                        ${formatCurrency(totalPaid)}
                        ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" class="currency-symbol">` : 'SAR'}
                    </span>
                </div>
                <div class="total-row balance-row">
                    <span class="total-label">${t.remainingBalance}:</span>
                    <span class="total-value">
                        ${formatCurrency(remainingBalance)}
                        ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" class="currency-symbol">` : 'SAR'}
                    </span>
                </div>
                ` : ''}
            </div>
        </div>
    </div>
</body>
</html>
    `;

    const options = {
      format: 'A4',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      type: 'pdf',
      quality: '75',
      dpi: 300,
      orientation: 'portrait',
      zoomFactor: 1,
      height: '11.7in',
      width: '8.3in'
    };

    const file = { content: htmlContent };
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    
    return pdfBuffer;

  } catch (error) {
    console.error('Error generating HTML PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}