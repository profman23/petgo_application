import puppeteer from 'puppeteer';
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

export async function generateUnifiedInvoicePDF(invoiceData: InvoiceData, language: 'ar' | 'en' = 'en'): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Read the riyal symbol image and convert to base64
    const riyalSymbolPath = path.join(process.cwd(), 'attached_assets', 'Screenshot 2025-07-27 144314_1753616612709.png');
    let riyalSymbolBase64 = '';
    try {
      const riyalSymbolBuffer = await fs.readFile(riyalSymbolPath);
      riyalSymbolBase64 = `data:image/png;base64,${riyalSymbolBuffer.toString('base64')}`;
    } catch (error) {
      console.log('Could not load riyal symbol image:', error);
    }

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

    const html = `
    <!DOCTYPE html>
    <html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          background-color: #ffffff;
          color: #333;
          line-height: 1.6;
        }
        
        .container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 32px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        
        .logo-section {
          flex: 1;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #8B2F8B;
          margin-bottom: 4px;
        }
        
        .company-tagline {
          font-size: 12px;
          color: #6B7280;
          margin-bottom: 12px;
        }
        
        .contact-info {
          font-size: 10px;
          color: #6B7280;
          line-height: 1.4;
        }
        
        .invoice-details {
          flex: 1;
          text-align: left;
          padding: 0 20px;
        }
        
        .invoice-label {
          font-size: 10px;
          color: #666666;
          margin-bottom: 4px;
          font-weight: bold;
        }
        
        .date-text {
          font-size: 12px;
          color: #6B7280;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .doctor-info {
          font-size: 10px;
          color: #6B7280;
          margin-bottom: 4px;
        }
        
        .qr-section {
          text-align: center;
        }
        
        .qr-code {
          width: 80px;
          height: 80px;
          border: 2px solid #000000;
          border-radius: 8px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f9fafb;
        }
        
        .qr-text {
          font-size: 8px;
          color: #6B7280;
          text-align: center;
        }
        
        .separator-line {
          width: 100%;
          height: 1px;
          background: linear-gradient(to right, #8B2F8B, #8B2F8B, #8B2F8B);
          margin: 16px 0;
        }
        
        .section {
          border: 2px solid #8B2F8B;
          border-radius: 8px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #FFFFFF;
          background-color: #8B2F8B;
          padding: 12px 16px;
          margin: 0;
        }
        
        .section-content {
          padding: 16px;
        }
        
        .customer-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .customer-label {
          font-size: 10px;
          color: #666666;
          font-weight: bold;
        }
        
        .customer-value {
          font-size: 10px;
          color: #374151;
        }
        
        .pets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        
        .pet-card {
          border: 1px solid #8B2F8B;
          border-radius: 8px;
          padding: 12px;
          background: linear-gradient(to right, #faf5ff, #ffffff);
        }
        
        .pet-name {
          font-size: 12px;
          font-weight: bold;
          color: #8B2F8B;
          margin-bottom: 4px;
        }
        
        .pet-detail {
          font-size: 9px;
          color: #374151;
          margin-bottom: 2px;
        }
        
        .services-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #8B2F8B;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .services-table th {
          background-color: #8B2F8B;
          color: white;
          font-weight: bold;
          padding: 8px 4px;
          text-align: center;
          font-size: 9px;
          border-right: 1px solid #FFFFFF;
        }
        
        .services-table th:last-child {
          border-right: none;
        }
        
        .services-table td {
          padding: 8px 4px;
          text-align: center;
          font-size: 9px;
          color: #374151;
          border-bottom: 1px solid #E5E7EB;
          border-right: 1px solid #E5E7EB;
        }
        
        .services-table td:last-child {
          border-right: none;
        }
        
        .services-table td:first-child {
          text-align: left;
          font-weight: medium;
        }
        
        .services-table tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        .services-table tr:hover {
          background-color: #f3e8ff;
        }
        
        .totals-container {
          display: flex;
          justify-content: space-between;
          margin-top: 48px;
          gap: 24px;
        }
        
        .totals-section {
          background-color: #FFFFFF;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          padding: 16px;
          width: 45%;
        }
        
        .totals-title {
          font-size: 14px;
          font-weight: bold;
          color: #1F2937;
          text-align: center;
          border-bottom: 1px solid #E5E7EB;
          padding-bottom: 8px;
          margin-bottom: 16px;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #E5E7EB;
          margin-bottom: 8px;
        }
        
        .totals-label {
          font-size: 10px;
          font-weight: bold;
          color: #374151;
        }
        
        .totals-value {
          font-size: 10px;
          font-weight: bold;
          color: #1F2937;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .final-total .totals-label,
        .final-total .totals-value {
          color: #8B2F8B;
          font-weight: bold;
        }
        
        .paid-amount .totals-value {
          color: #059669;
        }
        
        .remaining-balance .totals-value {
          color: #DC2626;
        }
        
        .riyal-symbol {
          width: 8px;
          height: 8px;
        }
        
        .arabic-totals {
          direction: rtl;
        }
        
        .arabic-totals .totals-row {
          flex-direction: row-reverse;
        }
        
        .arabic-totals .totals-value {
          flex-direction: row-reverse;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .container {
            border: none;
            border-radius: 0;
            max-width: none;
            margin: 0;
            padding: 20px;
          }
          
          .section-title {
            font-size: 12px;
            padding: 8px 12px;
          }
          
          .section-content {
            padding: 12px;
          }
          
          .totals-container {
            margin-top: 32px;
          }
          
          .company-name {
            font-size: 20px;
          }
          
          .services-table th,
          .services-table td {
            font-size: 8px;
            padding: 6px 3px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header Section -->
        <div class="header">
          <!-- Company Info -->
          <div class="logo-section">
            <div class="company-name">VETS VAN</div>
            <div class="company-tagline">
              ${language === 'ar' ? 'خدمات بيطرية متنقلة في منزلك' : 'Mobile Veterinary Services at Your Home'}
            </div>
            <div class="contact-info">
              📞 +966 50 123 4567<br>
              ✉️ info@vetsvan.com<br>
              ${language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}
            </div>
          </div>

          <!-- Invoice Details -->
          <div class="invoice-details">
            <div class="invoice-label">
              Invoice: ${invoiceData.invoiceNumber || `VETSVAN-${invoiceData.bookingId}`}
            </div>
            <div class="date-text">
              📅 ${formatDate(invoiceData.appointmentDate)}
            </div>
            <div class="date-text">
              🕐 ${formatTime(invoiceData.appointmentTime)}
            </div>
            <div class="doctor-info">
              ${language === 'ar' ? 'الطبيب:' : 'Doctor:'} ${invoiceData.doctorName}
            </div>
            <div class="doctor-info">
              ${language === 'ar' ? 'المركبة:' : 'Vehicle:'} ${invoiceData.vetsVanCode}
            </div>
          </div>

          <!-- QR Code Section -->
          <div class="qr-section">
            <div class="qr-code">
              QR Code
            </div>
            <div class="qr-text">
              ${language === 'ar' ? 'امسح للتحقق' : 'Scan to verify'}
            </div>
          </div>
        </div>

        <!-- Separator -->
        <div class="separator-line"></div>

        <!-- Customer Information -->
        <div class="section">
          <div class="section-title">
            ${language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
          </div>
          <div class="section-content">
            <div class="customer-row">
              <span class="customer-label">
                ${language === 'ar' ? 'الاسم:' : 'Name:'}
              </span>
              <span class="customer-value">
                ${invoiceData.customer.firstName} ${invoiceData.customer.lastName}
              </span>
            </div>
            <div class="customer-row">
              <span class="customer-label">
                ${language === 'ar' ? 'الهاتف:' : 'Phone:'}
              </span>
              <span class="customer-value">
                ${invoiceData.customer.phone}
              </span>
            </div>
            ${invoiceData.customer.email ? `
            <div class="customer-row">
              <span class="customer-label">
                ${language === 'ar' ? 'الإيميل:' : 'Email:'}
              </span>
              <span class="customer-value">
                ${invoiceData.customer.email}
              </span>
            </div>
            ` : ''}
            <div class="customer-row">
              <span class="customer-label">
                ${language === 'ar' ? 'الخدمة:' : 'Service:'}
              </span>
              <span class="customer-value">
                ${invoiceData.serviceType}
              </span>
            </div>
          </div>
        </div>

        <!-- Separator -->
        <div class="separator-line"></div>

        <!-- Pets Information -->
        <div class="section">
          <div class="section-title">
            ${language === 'ar' ? 'معلومات الحيوانات الأليفة' : 'Pet Information'}
          </div>
          <div class="section-content">
            <div class="pets-grid">
              ${invoiceData.pets.map((pet) => `
                <div class="pet-card">
                  <div class="pet-name">${pet.name}</div>
                  <div class="pet-detail">
                    ${language === 'ar' ? 'النوع:' : 'Type:'} ${pet.type}
                  </div>
                  <div class="pet-detail">
                    ${language === 'ar' ? 'العمر:' : 'Age:'} ${pet.ageYear || 0} ${language === 'ar' ? 'سنوات' : 'years'} ${pet.ageMonth || 0} ${language === 'ar' ? 'شهور' : 'months'}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Separator -->
        <div class="separator-line"></div>

        <!-- Services Table -->
        <div class="section">
          <div class="section-title">
            ${language === 'ar' ? 'تفاصيل الخدمات' : 'Service Details'}
          </div>
          <div class="section-content">
            <table class="services-table">
              <thead>
                <tr>
                  <th>${language === 'ar' ? 'الخدمة' : 'Service'}</th>
                  <th>${language === 'ar' ? 'الكمية' : 'Qty'}</th>
                  <th>${language === 'ar' ? 'السعر' : 'Unit Price'}</th>
                  <th>${language === 'ar' ? 'الخصم' : 'Discount'}</th>
                  <th>${language === 'ar' ? 'ضريبة' : 'VAT'}</th>
                  <th>${language === 'ar' ? 'قبل الضريبة' : 'Before VAT'}</th>
                  <th>${language === 'ar' ? 'بعد الضريبة' : 'After VAT'}</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.items.map((item) => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unitPrice)}${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" alt="ر.س" class="riyal-symbol" style="display:inline-block;margin-left:2px;">` : ''}</td>
                    <td>
                      ${item.discountType && item.discountType !== 'none' && item.discountType !== 'No Discount'
                        ? item.discountType
                        : (language === 'ar' ? 'لا يوجد' : 'None')}
                    </td>
                    <td>${formatCurrency(item.vatAmount)}${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" alt="ر.س" class="riyal-symbol" style="display:inline-block;margin-left:2px;">` : ''}</td>
                    <td>${formatCurrency(item.totalBeforeVat)}${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" alt="ر.س" class="riyal-symbol" style="display:inline-block;margin-left:2px;">` : ''}</td>
                    <td>${formatCurrency(item.totalAfterVat)}${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" alt="ر.س" class="riyal-symbol" style="display:inline-block;margin-left:2px;">` : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Totals Section - Bilingual -->
        <div class="totals-container">
          <!-- English Totals -->
          <div class="totals-section">
            <div class="totals-title">Invoice Totals</div>
            
            <div class="totals-row">
              <span class="totals-label">Total Before VAT:</span>
              <span class="totals-value">
                ${formatCurrency((invoiceData.subtotal || 0) - (invoiceData.discount || 0))}
                ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" alt="ر.س" class="riyal-symbol">` : ''}
              </span>
            </div>
            
            <div class="totals-row">
              <span class="totals-label">VAT (15%):</span>
              <span class="totals-value">
                ${formatCurrency(invoiceData.tax || 0)}
                ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" alt="ر.س" class="riyal-symbol">` : ''}
              </span>
            </div>
            
            <div class="totals-row final-total">
              <span class="totals-label">Final Total:</span>
              <span class="totals-value">
                ${formatCurrency(invoiceData.total || 0)}
                ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" alt="ر.س" class="riyal-symbol">` : ''}
              </span>
            </div>
            
            <div class="totals-row paid-amount">
              <span class="totals-label">Total Paid:</span>
              <span class="totals-value">
                ${formatCurrency(totalPaid)}
                ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" alt="ر.س" class="riyal-symbol">` : ''}
              </span>
            </div>
            
            <div class="totals-row remaining-balance">
              <span class="totals-label">Remaining Balance:</span>
              <span class="totals-value">
                ${formatCurrency(remainingBalance)}
                ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" alt="ر.س" class="riyal-symbol">` : ''}
              </span>
            </div>
          </div>

          <!-- Arabic Totals -->
          <div class="totals-section arabic-totals">
            <div class="totals-title">مجموع الفاتورة</div>
            
            <div class="totals-row">
              <span class="totals-label">المجموع قبل الضريبة:</span>
              <span class="totals-value">
                ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" alt="ر.س" class="riyal-symbol">` : ''}
                ${formatCurrency((invoiceData.subtotal || 0) - (invoiceData.discount || 0))}
              </span>
            </div>
            
            <div class="totals-row">
              <span class="totals-label">ضريبة القيمة المضافة (15%):</span>
              <span class="totals-value">
                ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" alt="ر.س" class="riyal-symbol">` : ''}
                ${formatCurrency(invoiceData.tax || 0)}
              </span>
            </div>
            
            <div class="totals-row final-total">
              <span class="totals-label">المجموع النهائي:</span>
              <span class="totals-value">
                ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" alt="ر.س" class="riyal-symbol">` : ''}
                ${formatCurrency(invoiceData.total || 0)}
              </span>
            </div>
            
            <div class="totals-row paid-amount">
              <span class="totals-label">المبلغ المدفوع:</span>
              <span class="totals-value">
                ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" alt="ر.س" class="riyal-symbol">` : ''}
                ${formatCurrency(totalPaid)}
              </span>
            </div>
            
            <div class="totals-row remaining-balance">
              <span class="totals-label">الرصيد المتبقي:</span>
              <span class="totals-value">
                ${riyalSymbolBase64 ? `<img src="${riyalSymbolBase64}" alt="ر.س" class="riyal-symbol">` : ''}
                ${formatCurrency(remainingBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}