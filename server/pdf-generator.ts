import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

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

const getLogoBase64 = (): string => {
  try {
    const logoPath = path.join(process.cwd(), 'attached_assets', 'Screenshot 2025-07-10 181936_1753542080451.png');
    const imageBuffer = fs.readFileSync(logoPath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('Error reading logo file:', error);
    // Fallback to empty string if file not found
    return '';
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
          font-family: 'Arial', sans-serif;
          background: white;
          padding: 32px;
        }
        
        .invoice-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }
        
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .date-section {
          text-align: left;
        }
        
        .date-text {
          font-size: 12px;
          font-weight: 600;
        }
        
        .separator-line {
          width: 100%;
          height: 1px;
          background-color: #8B2F8B;
          opacity: 0.3;
          margin: 16px 0;
        }
        
        .customer-info-section {
          margin-bottom: 20px;
        }
        
        .thick-separator-line {
          width: 100%;
          height: 4px;
          background-color: #8B2F8B;
          margin-top: 16px;
        }
        
        .invoice-items-header {
          margin-top: 20px;
          border-bottom: 2px solid #8B2F8B;
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        
        .header-table {
          display: table;
          width: 100%;
          table-layout: fixed;
        }
        
        .header-row {
          display: table-row;
        }
        
        .header-cell {
          display: table-cell;
          text-align: center;
          vertical-align: top;
          width: 14.28%; /* 100/7 columns */
          padding: 4px;
        }
        
        .header-english {
          font-size: 10px;
          font-weight: bold;
          color: #374151;
          margin-bottom: 2px;
        }
        
        .header-arabic {
          font-size: 9px;
          color: #6B7280;
        }
        
        .items-data-table {
          width: 100%;
        }
        
        .data-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          padding: 8px 0;
          border-bottom: 1px solid #E5E7EB;
        }
        
        .data-cell {
          text-align: center;
          font-size: 9px;
          color: #374151;
          padding: 4px;
        }
        
        .customer-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .customer-info-english {
          text-align: left;
          font-size: 10px;
          color: #666;
        }
        
        .customer-info-arabic {
          text-align: right;
          font-size: 10px;
          color: #666;
        }
        
        .logo-section {
          text-align: right;
        }
        
        .logo-image {
          height: 64px;
          width: auto;
          object-fit: contain;
        }
        
        .spacer {
          flex: 1;
        }
        

      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header with Date (left) and Logo (right) -->
        <div class="header-section">
          <!-- Date on the left -->
          <div class="date-section">
            <p class="date-text">
              ${new Date().toLocaleDateString('en-US')}
            </p>
          </div>
          
          <!-- Empty space to balance the layout -->
          <div class="spacer"></div>
          
          <!-- Logo on the right -->
          <div class="logo-section">
            <img 
              class="logo-image" 
              src="data:image/png;base64,${getLogoBase64()}"
              alt="Vets Van Logo" 
            />
          </div>
        </div>
        
        <!-- Light separator line -->
        <div class="separator-line"></div>
        
        <!-- Customer Information Section -->
        <div class="customer-info-section">
          <!-- Name row - English left, Arabic right, same level -->
          <div class="customer-info-row">
            <p class="customer-info-english">
              Customer Name: ${(invoiceData.customer?.firstName || '') + ' ' + (invoiceData.customer?.lastName || '') || invoiceData.customer?.name || ''}
            </p>
            <p class="customer-info-arabic">
              ${(invoiceData.customer?.firstName || '') + ' ' + (invoiceData.customer?.lastName || '') || invoiceData.customer?.name || ''} :اسم العميل
            </p>
          </div>
          
          <!-- Phone row - English left, Arabic right, same level -->
          <div class="customer-info-row">
            <p class="customer-info-english">
              Customer Phone: ${invoiceData.customer?.phone || ''}
            </p>
            <p class="customer-info-arabic">
              ${invoiceData.customer?.phone || ''} :تليفون العميل
            </p>
          </div>
          
          <!-- Thick separator line after customer info -->
          <div class="thick-separator-line"></div>
        </div>

        <!-- Invoice Items Header Table -->
        <div class="invoice-items-header">
          <div class="header-table">
            <div class="header-row">
              <div class="header-cell">
                <div class="header-english">Item Description</div>
                <div class="header-arabic">الصنف</div>
              </div>
              <div class="header-cell">
                <div class="header-english">Quantity</div>
                <div class="header-arabic">الكمية</div>
              </div>
              <div class="header-cell">
                <div class="header-english">Unit Price</div>
                <div class="header-arabic">سعر الوحدة</div>
              </div>
              <div class="header-cell">
                <div class="header-english">Discount</div>
                <div class="header-arabic">الخصم</div>
              </div>
              <div class="header-cell">
                <div class="header-english">VAT</div>
                <div class="header-arabic">الضريبة</div>
              </div>
              <div class="header-cell">
                <div class="header-english">Total B.Vat</div>
                <div class="header-arabic">المجموع قبل الضريبة</div>
              </div>
              <div class="header-cell">
                <div class="header-english">Total A.Vat</div>
                <div class="header-arabic">المجموع بعد الضريبة</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Invoice Items Data Table -->
        <div class="items-data-table">
          ${invoiceData.items?.map((item, index) => `
            <div class="data-row">
              <div class="data-cell">${item.description || ''}</div>
              <div class="data-cell">${item.quantity || ''}</div>
              <div class="data-cell">${item.unitPrice || ''} SAR</div>
              <div class="data-cell">${
                item.discountType && item.discountType !== 'none' && item.discountType !== 'No Discount'
                  ? item.discountType + ' Discount'
                  : 'No Discount'
              }</div>
              <div class="data-cell">${item.vatAmount || ''} SAR</div>
              <div class="data-cell">${item.totalBeforeVat || ''} SAR</div>
              <div class="data-cell">${item.totalAfterVat || ''} SAR</div>
            </div>
          `).join('') || ''}
        </div>

        <!-- Totals Section - Right Side -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
          <div style="background: white; border: 1px solid #D1D5DB; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); padding: 16px; width: 320px;">
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  Total Before VAT:
                </span>
                <span style="font-size: 12px; font-weight: 600; color: #1F2937;">
                  ${((invoiceData.subtotal || 0) - (invoiceData.discount || 0)).toFixed(2)} SAR
                </span>
              </div>
              <div style="border-bottom: 1px solid #E5E7EB;"></div>
            </div>
            
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  VAT:
                </span>
                <span style="font-size: 12px; font-weight: 600; color: #1F2937;">
                  ${(invoiceData.tax || 0).toFixed(2)} SAR
                </span>
              </div>
              <div style="border-bottom: 1px solid #E5E7EB;"></div>
            </div>
            
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  Final Total:
                </span>
                <span style="font-size: 12px; font-weight: 700; color: #8B2F8B;">
                  ${(invoiceData.total || 0).toFixed(2)} SAR
                </span>
              </div>
              <div style="border-bottom: 1px solid #E5E7EB;"></div>
            </div>
            
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  Total Paid:
                </span>
                <span style="font-size: 12px; font-weight: 600; color: #059669;">
                  ${((invoiceData.paymentMethods || []).reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 0)).toFixed(2)} SAR
                </span>
              </div>
            </div>
            
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  Remaining Balance:
                </span>
                <span style="font-size: 12px; font-weight: 600; color: #DC2626;">
                  ${(Math.max(0, (invoiceData.total || 0) - ((invoiceData.paymentMethods || []).reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 0)))).toFixed(2)} SAR
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};