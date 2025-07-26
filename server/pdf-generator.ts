import puppeteer from 'puppeteer';

export const generateInvoicePDF = async (invoiceData: any): Promise<Buffer> => {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--single-process',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });
    
    const page = await browser.newPage();
    
    // Generate invoice HTML content
    const htmlContent = generateInvoiceHTML(invoiceData);
    
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      },
      preferCSSPageSize: true
    });
    
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const generateInvoiceHTML = (invoiceData: any): string => {
  const isArabic = invoiceData.language === 'ar';
  const direction = isArabic ? 'rtl' : 'ltr';
  
  return `
    <!DOCTYPE html>
    <html dir="${direction}" lang="${invoiceData.language || 'en'}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoiceData.invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          direction: ${direction};
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #8B5CF6;
        }
        
        .logo-section {
          text-align: ${isArabic ? 'right' : 'left'};
        }
        
        .company-logo {
          width: 80px;
          height: 60px;
          object-fit: contain;
          margin-bottom: 10px;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #8B5CF6;
          margin-bottom: 5px;
        }
        
        .company-subtitle {
          font-size: 14px;
          color: #666;
        }
        
        .invoice-info {
          text-align: ${isArabic ? 'left' : 'right'};
        }
        
        .invoice-title {
          font-size: 28px;
          font-weight: bold;
          color: #8B5CF6;
          margin-bottom: 10px;
        }
        
        .invoice-number {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .invoice-date {
          font-size: 14px;
          color: #666;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #8B5CF6;
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 2px solid #E5E7EB;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .info-card {
          background: #F9FAFB;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
        }
        
        .info-card h3 {
          font-size: 14px;
          font-weight: bold;
          color: #374151;
          margin-bottom: 10px;
        }
        
        .info-item {
          margin-bottom: 5px;
          font-size: 12px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .items-table th,
        .items-table td {
          border: 1px solid #E5E7EB;
          padding: 10px 8px;
          text-align: ${isArabic ? 'right' : 'left'};
          font-size: 11px;
        }
        
        .items-table th {
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
          color: white;
          font-weight: bold;
          text-align: center;
        }
        
        .items-table tbody tr:nth-child(even) {
          background: #F9FAFB;
        }
        
        .items-table tbody tr:hover {
          background: #F3F4F6;
        }
        
        .items-table .number-cell {
          text-align: center;
          font-weight: bold;
        }
        
        .totals-section {
          background: #F9FAFB;
          padding: 20px;
          border-radius: 8px;
          border: 2px solid #E5E7EB;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #E5E7EB;
        }
        
        .totals-row:last-child {
          border-bottom: none;
          font-size: 16px;
          font-weight: bold;
          color: #8B5CF6;
          border-top: 2px solid #8B5CF6;
          padding-top: 15px;
          margin-top: 10px;
        }
        
        .totals-label {
          font-weight: bold;
        }
        
        .totals-value {
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .currency-symbol {
          width: 16px;
          height: 16px;
          object-fit: contain;
        }
        
        .notes-section {
          background: #FEF7FF;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #E879F9;
          margin-top: 20px;
        }
        
        .notes-title {
          font-weight: bold;
          color: #8B5CF6;
          margin-bottom: 10px;
        }
        
        .qr-section {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #E5E7EB;
        }
        
        .qr-code {
          width: 100px;
          height: 100px;
          margin: 0 auto 10px;
        }
        
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #8B5CF6;
          color: #666;
          font-size: 11px;
        }
        
        .payment-methods {
          margin-top: 20px;
        }
        
        .payment-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #E5E7EB;
        }
        
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .invoice-container { padding: 10px; }
          .section { margin-bottom: 15px; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <div class="company-name">${isArabic ? 'فيتس فان' : 'Vets Van'}</div>
            <div class="company-subtitle">${isArabic ? 'خدمة طبيب بيطري متنقل' : 'Mobile Veterinary Service'}</div>
          </div>
          <div class="invoice-info">
            <div class="invoice-title">${isArabic ? 'فاتورة' : 'INVOICE'}</div>
            <div class="invoice-number">${isArabic ? 'رقم الفاتورة:' : 'Invoice #:'} ${invoiceData.invoiceNumber || 'N/A'}</div>
            <div class="invoice-date">${isArabic ? 'التاريخ:' : 'Date:'} ${new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}</div>
          </div>
        </div>

        <!-- Customer and Pet Information -->
        <div class="info-grid">
          <div class="info-card">
            <h3>${isArabic ? 'معلومات العميل' : 'Customer Information'}</h3>
            <div class="info-item"><strong>${isArabic ? 'الاسم:' : 'Name:'}</strong> ${invoiceData.customer.firstName} ${invoiceData.customer.lastName}</div>
            <div class="info-item"><strong>${isArabic ? 'الهاتف:' : 'Phone:'}</strong> ${invoiceData.customer.phone}</div>
            ${invoiceData.customer.email ? `<div class="info-item"><strong>${isArabic ? 'البريد الإلكتروني:' : 'Email:'}</strong> ${invoiceData.customer.email}</div>` : ''}
          </div>
          
          <div class="info-card">
            <h3>${isArabic ? 'معلومات الموعد' : 'Appointment Information'}</h3>
            <div class="info-item"><strong>${isArabic ? 'التاريخ:' : 'Date:'}</strong> ${invoiceData.appointmentDate}</div>
            <div class="info-item"><strong>${isArabic ? 'الوقت:' : 'Time:'}</strong> ${invoiceData.appointmentTime}</div>
            <div class="info-item"><strong>${isArabic ? 'نوع الخدمة:' : 'Service Type:'}</strong> ${invoiceData.serviceType}</div>
            <div class="info-item"><strong>${isArabic ? 'الطبيب:' : 'Doctor:'}</strong> ${invoiceData.doctorName}</div>
          </div>
        </div>

        <!-- Pet Information -->
        ${invoiceData.pets && invoiceData.pets.length > 0 ? `
        <div class="section">
          <div class="section-title">${isArabic ? 'معلومات الحيوان الأليف' : 'Pet Information'}</div>
          ${invoiceData.pets.map((pet: any) => `
            <div class="info-item"><strong>${isArabic ? 'الاسم:' : 'Name:'}</strong> ${pet.name} | <strong>${isArabic ? 'النوع:' : 'Type:'}</strong> ${pet.type} | <strong>${isArabic ? 'العمر:' : 'Age:'}</strong> ${pet.ageYear}${isArabic ? ' سنة' : ' years'} ${pet.ageMonth}${isArabic ? ' شهر' : ' months'}</div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Service Items -->
        <div class="section">
          <div class="section-title">${isArabic ? 'تفاصيل الخدمات' : 'Service Details'}</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>${isArabic ? 'الخدمة/المنتج' : 'Service/Product'}</th>
                <th>${isArabic ? 'الكمية' : 'Qty'}</th>
                <th>${isArabic ? 'سعر الوحدة' : 'Unit Price'}</th>
                <th>${isArabic ? 'الخصم' : 'Discount'}</th>
                <th>${isArabic ? 'قبل الضريبة' : 'Before VAT'}</th>
                <th>${isArabic ? 'الضريبة (15%)' : 'VAT (15%)'}</th>
                <th>${isArabic ? 'المجموع' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items.map((item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td class="number-cell">${item.quantity}</td>
                  <td class="number-cell">${Number(item.unitPrice).toFixed(2)}</td>
                  <td class="number-cell">${item.discountType !== 'none' ? `${Number(item.discount).toFixed(2)}` : '0.00'}</td>
                  <td class="number-cell">${Number(item.totalBeforeVat).toFixed(2)}</td>
                  <td class="number-cell">${Number(item.vatAmount).toFixed(2)}</td>
                  <td class="number-cell">${Number(item.totalAfterVat).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="totals-section">
          <div class="totals-row">
            <span class="totals-label">${isArabic ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
            <span class="totals-value">${Number(invoiceData.subtotal).toFixed(2)} ${isArabic ? 'ريال' : 'SAR'}</span>
          </div>
          <div class="totals-row">
            <span class="totals-label">${isArabic ? 'إجمالي الخصم:' : 'Total Discount:'}</span>
            <span class="totals-value">${Number(invoiceData.discount || 0).toFixed(2)} ${isArabic ? 'ريال' : 'SAR'}</span>
          </div>
          <div class="totals-row">
            <span class="totals-label">${isArabic ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</span>
            <span class="totals-value">${Number(invoiceData.tax).toFixed(2)} ${isArabic ? 'ريال' : 'SAR'}</span>
          </div>
          <div class="totals-row">
            <span class="totals-label">${isArabic ? 'المجموع النهائي:' : 'Final Total:'}</span>
            <span class="totals-value">${Number(invoiceData.total).toFixed(2)} ${isArabic ? 'ريال' : 'SAR'}</span>
          </div>
        </div>

        <!-- Payment Methods -->
        ${invoiceData.paymentMethods && invoiceData.paymentMethods.length > 0 ? `
        <div class="section">
          <div class="section-title">${isArabic ? 'طرق الدفع' : 'Payment Methods'}</div>
          <div class="payment-methods">
            ${invoiceData.paymentMethods.map((payment: any) => `
              <div class="payment-item">
                <span>${isArabic ? 'نقداً' : payment.method === 'cash' ? 'Cash' : payment.method}</span>
                <span>${Number(payment.amount).toFixed(2)} ${isArabic ? 'ريال' : 'SAR'}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Notes -->
        ${invoiceData.notes ? `
        <div class="notes-section">
          <div class="notes-title">${isArabic ? 'ملاحظات:' : 'Notes:'}</div>
          <div>${invoiceData.notes}</div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <div>${isArabic ? 'شكراً لثقتكم في خدماتنا' : 'Thank you for choosing our services'}</div>
          <div>${isArabic ? 'فيتس فان - خدمة طبيب بيطري متنقل' : 'Vets Van - Mobile Veterinary Service'}</div>
        </div>
      </div>
    </body>
    </html>
  `;
};