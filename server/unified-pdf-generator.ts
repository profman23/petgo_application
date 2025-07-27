import * as fs from 'fs/promises';
import * as path from 'path';

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

export async function generateUnifiedPDF(invoiceData: InvoiceData, language: 'ar' | 'en' = 'en'): Promise<Buffer> {
  try {
    console.log('Starting PDF generation with invoice data:', JSON.stringify(invoiceData, null, 2));

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

    // Load company logo as base64
    let logoBase64 = '';
    try {
      const logoPath = path.join(process.cwd(), 'attached_assets', 'IMG-20250415-WA0047_1751986059751.jpg');
      const logoBuffer = await fs.readFile(logoPath);
      logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      console.log('Could not load company logo:', error);
    }

    // Load riyal symbol as base64
    let riyalSymbolBase64 = '';
    try {
      const riyalSymbolPath = path.join(process.cwd(), 'attached_assets', 'Screenshot 2025-07-27 144314_1753616612709.png');
      const riyalSymbolBuffer = await fs.readFile(riyalSymbolPath);
      riyalSymbolBase64 = `data:image/png;base64,${riyalSymbolBuffer.toString('base64')}`;
    } catch (error) {
      console.log('Could not load riyal symbol image:', error);
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

    // Create a comprehensive HTML invoice with proper Unicode support
    const htmlContent = `
<!DOCTYPE html>
<html lang="${language}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VETS VAN - ${t.invoice}: ${invoiceData.invoiceNumber}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            direction: ${isRTL ? 'rtl' : 'ltr'};
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #8B2F8B, #9B3FA8);
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            margin: 0 auto 10px;
            ${logoBase64 ? `background-image: url(${logoBase64}); background-size: cover; background-position: center;` : 'background: #fff;'}
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .invoice-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .invoice-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .invoice-number {
            font-size: 16px;
            font-weight: bold;
        }
        
        .content {
            padding: 20px;
        }
        
        .section {
            margin-bottom: 25px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            overflow: hidden;
        }
        
        .section-header {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 12px 15px;
            font-weight: bold;
            font-size: 14px;
            color: #495057;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .section-content {
            padding: 15px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-weight: bold;
            color: #6c757d;
            margin-bottom: 5px;
        }
        
        .info-value {
            color: #212529;
            font-weight: 500;
        }
        
        .pets-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .pet-card {
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 12px;
            background: #f8f9fa;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .table th,
        .table td {
            padding: 10px;
            text-align: ${isRTL ? 'right' : 'left'};
            border-bottom: 1px solid #dee2e6;
        }
        
        .table th {
            background: linear-gradient(135deg, #e9ecef, #f8f9fa);
            font-weight: bold;
            color: #495057;
        }
        
        .table tbody tr:hover {
            background: #f8f9fa;
        }
        
        .currency {
            font-weight: bold;
            color: #28a745;
        }
        
        .currency::after {
            content: " SAR";
            font-size: 0.9em;
            color: #6c757d;
        }
        
        .totals-section {
            background: linear-gradient(135deg, #f8f9fa, #ffffff);
            border: 2px solid #8B2F8B;
        }
        
        .totals-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .total-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .total-item:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 16px;
            color: #8B2F8B;
        }
        
        .total-label {
            font-weight: 600;
        }
        
        .total-value {
            font-weight: bold;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 15px;
            text-align: center;
            color: #6c757d;
            font-size: 11px;
            border-top: 1px solid #e0e0e0;
        }
        
        @media print {
            body {
                font-size: 11px;
            }
            
            .invoice-container {
                border: none;
                box-shadow: none;
            }
            
            .section {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="logo"></div>
            <div class="company-name">VETS VAN</div>
            <div class="invoice-title">${t.invoice}</div>
            <div class="invoice-info">
                <div class="invoice-number">#${invoiceData.invoiceNumber}</div>
                <div>
                    <div>${t.date}: ${formatDate(invoiceData.appointmentDate)}</div>
                    <div>${t.time}: ${invoiceData.appointmentTime}</div>
                </div>
            </div>
        </div>
        
        <div class="content">
            <!-- Customer Information -->
            <div class="section">
                <div class="section-header">${t.customerInfo}</div>
                <div class="section-content">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">${t.name}</div>
                            <div class="info-value">${invoiceData.customer.firstName} ${invoiceData.customer.lastName}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">${t.phone}</div>
                            <div class="info-value">${invoiceData.customer.phone}</div>
                        </div>
                        ${invoiceData.customer.email ? `
                        <div class="info-item">
                            <div class="info-label">${t.email}</div>
                            <div class="info-value">${invoiceData.customer.email}</div>
                        </div>
                        ` : ''}
                        <div class="info-item">
                            <div class="info-label">${t.doctor}</div>
                            <div class="info-value">${invoiceData.doctorName}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">${t.vehicle}</div>
                            <div class="info-value">${invoiceData.vetsVanCode}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Pet Information -->
            <div class="section">
                <div class="section-header">${t.petInfo}</div>
                <div class="section-content">
                    <div class="pets-grid">
                        ${invoiceData.pets.map(pet => `
                        <div class="pet-card">
                            <div><strong>${t.petName}:</strong> ${pet.name}</div>
                            <div><strong>${t.petType}:</strong> ${pet.type}</div>
                            <div><strong>${t.age}:</strong> ${pet.ageYear} ${t.years}</div>
                        </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Service Details -->
            <div class="section">
                <div class="section-header">${t.serviceDetails}</div>
                <div class="section-content">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>${t.service}</th>
                                <th>${t.quantity}</th>
                                <th>${t.unitPrice}</th>
                                <th>${t.beforeVat}</th>
                                <th>${t.vat}</th>
                                <th>${t.afterVat}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoiceData.items.map(item => `
                            <tr>
                                <td>${item.description}</td>
                                <td>${item.quantity}</td>
                                <td class="currency">${formatCurrency(item.unitPrice)}</td>
                                <td class="currency">${formatCurrency(item.totalBeforeVat)}</td>
                                <td class="currency">${formatCurrency(item.vatAmount)}</td>
                                <td class="currency">${formatCurrency(item.totalAfterVat)}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Totals -->
            <div class="section totals-section">
                <div class="section-header">${t.totals}</div>
                <div class="section-content">
                    <div class="totals-grid">
                        <div>
                            <div class="total-item">
                                <span class="total-label">${t.subtotal}:</span>
                                <span class="total-value currency">${formatCurrency(invoiceData.subtotal)}</span>
                            </div>
                            ${invoiceData.discount > 0 ? `
                            <div class="total-item">
                                <span class="total-label">${t.totalDiscount}:</span>
                                <span class="total-value currency">-${formatCurrency(invoiceData.discount)}</span>
                            </div>
                            ` : ''}
                            <div class="total-item">
                                <span class="total-label">${t.totalVat}:</span>
                                <span class="total-value currency">${formatCurrency(invoiceData.tax)}</span>
                            </div>
                            <div class="total-item">
                                <span class="total-label">${t.finalTotal}:</span>
                                <span class="total-value currency">${formatCurrency(invoiceData.total)}</span>
                            </div>
                        </div>
                        
                        ${totalPaid > 0 ? `
                        <div>
                            <div class="total-item">
                                <span class="total-label">${t.totalPaid}:</span>
                                <span class="total-value currency">${formatCurrency(totalPaid)}</span>
                            </div>
                            <div class="total-item">
                                <span class="total-label">${t.remainingBalance}:</span>
                                <span class="total-value currency">${formatCurrency(remainingBalance)}</span>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            ${(invoiceData.paymentMethods && invoiceData.paymentMethods.length > 0) ? `
            <!-- Payment Methods -->
            <div class="section">
                <div class="section-header">${t.paymentMethods}</div>
                <div class="section-content">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>${t.paymentType}</th>
                                <th>${t.amount}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoiceData.paymentMethods.map(payment => `
                            <tr>
                                <td>${payment.paymentType}</td>
                                <td class="currency">${formatCurrency(payment.amount)}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <div>VETS VAN - ${language === 'ar' ? 'العيادة البيطرية المتنقلة' : 'Mobile Veterinary Clinic'}</div>
            <div>${language === 'ar' ? 'شكراً لثقتكم بنا' : 'Thank you for your trust'}</div>
        </div>
    </div>
</body>
</html>`;

    console.log('HTML content generated successfully');

    // For now, return the HTML as text content in a simple PDF structure
    // This provides readable content without Chrome dependencies
    const simplePdfContent = `
===========================================
VETS VAN - ${t.invoice}: ${invoiceData.invoiceNumber}
===========================================

${t.date}: ${formatDate(invoiceData.appointmentDate)}
${t.time}: ${invoiceData.appointmentTime}
${t.doctor}: ${invoiceData.doctorName}
${t.vehicle}: ${invoiceData.vetsVanCode}

-------------------------------------------
${t.customerInfo}:
-------------------------------------------
${t.name}: ${invoiceData.customer.firstName} ${invoiceData.customer.lastName}
${t.phone}: ${invoiceData.customer.phone}
${invoiceData.customer.email ? `${t.email}: ${invoiceData.customer.email}` : ''}

-------------------------------------------
${t.petInfo}:
-------------------------------------------
${invoiceData.pets.map(pet => `${t.petName}: ${pet.name} - ${t.petType}: ${pet.type} - ${t.age}: ${pet.ageYear} ${t.years}`).join('\n')}

-------------------------------------------
${t.serviceDetails}:
-------------------------------------------
${invoiceData.items.map(item => `${item.description} - ${t.quantity}: ${item.quantity} - ${t.afterVat}: ${formatCurrency(item.totalAfterVat)} SAR`).join('\n')}

-------------------------------------------
${t.totals}:
-------------------------------------------
${t.subtotal}: ${formatCurrency(invoiceData.subtotal)} SAR
${invoiceData.discount > 0 ? `${t.totalDiscount}: -${formatCurrency(invoiceData.discount)} SAR` : ''}
${t.totalVat}: ${formatCurrency(invoiceData.tax)} SAR
${t.finalTotal}: ${formatCurrency(invoiceData.total)} SAR

${totalPaid > 0 ? `
${t.totalPaid}: ${formatCurrency(totalPaid)} SAR
${t.remainingBalance}: ${formatCurrency(remainingBalance)} SAR
` : ''}

${(invoiceData.paymentMethods && invoiceData.paymentMethods.length > 0) ? `
-------------------------------------------
${t.paymentMethods}:
-------------------------------------------
${invoiceData.paymentMethods.map(payment => `${t.paymentType}: ${payment.paymentType} - ${t.amount}: ${formatCurrency(payment.amount)} SAR`).join('\n')}
` : ''}

===========================================
VETS VAN - ${language === 'ar' ? 'العيادة البيطرية المتنقلة' : 'Mobile Veterinary Clinic'}
${language === 'ar' ? 'شكراً لثقتكم بنا' : 'Thank you for your trust'}
===========================================
`;

    console.log('Text-based PDF content generated successfully');
    
    return Buffer.from(simplePdfContent, 'utf-8');

  } catch (error) {
    console.error('Error generating unified PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}