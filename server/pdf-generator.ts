import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { 
  getTranslation, 
  formatCurrency as sharedFormatCurrency, 
  invoiceStyles, 
  companyInfo 
} from '../shared/invoice-config';

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

const getRiyalSymbolBase64 = (): string => {
  try {
    const symbolPath = path.join(process.cwd(), 'attached_assets', 'Screenshot 2025-07-27 144314_1753616612709.png');
    const imageBuffer = fs.readFileSync(symbolPath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('Error reading riyal symbol file:', error);
    // Fallback to empty string if file not found
    return '';
  }
};

const generateInvoiceHTML = (invoiceData: any): string => {
  const isArabic = invoiceData.language === 'ar';
  const direction = isArabic ? 'rtl' : 'ltr';
  const logoBase64 = getLogoBase64();
  const riyalSymbolBase64 = getRiyalSymbolBase64();
  
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
            <p style="font-size: 10px; color: #666; margin-bottom: 4px;">
              ${getTranslation('invoiceLabel', invoiceData.language || 'en')} ${invoiceData.invoiceNumber || `VETSVAN-${invoiceData.bookingId}`}
            </p>
            <p class="date-text">
              ${new Date().toLocaleDateString('en-US')}
            </p>
          </div>
          
          <!-- Test Label in Center -->
          <div style="text-align: center; flex: 0 0 auto;">
            <h2 style="font-size: 18px; font-weight: bold; color: #8B5CF6; margin: 0;">
              ${getTranslation('testLabel', invoiceData.language || 'en')}
            </h2>
          </div>
          
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
              ${getTranslation('customerName', 'en')} ${(invoiceData.customer?.firstName || '') + ' ' + (invoiceData.customer?.lastName || '') || invoiceData.customer?.name || ''}
            </p>
            <p class="customer-info-arabic">
              ${getTranslation('customerName', 'ar')} ${(invoiceData.customer?.firstName || '') + ' ' + (invoiceData.customer?.lastName || '') || invoiceData.customer?.name || ''}
            </p>
          </div>
          
          <!-- Phone row - English left, Arabic right, same level -->
          <div class="customer-info-row">
            <p class="customer-info-english">
              ${getTranslation('customerPhone', 'en')} ${invoiceData.customer?.phone || ''}
            </p>
            <p class="customer-info-arabic">
              ${getTranslation('customerPhone', 'ar')} ${invoiceData.customer?.phone || ''}
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
                <div class="header-english">${getTranslation('serviceItem', 'en')}</div>
                <div class="header-arabic">${getTranslation('serviceItem', 'ar')}</div>
              </div>
              <div class="header-cell">
                <div class="header-english">${getTranslation('quantity', 'en')}</div>
                <div class="header-arabic">${getTranslation('quantity', 'ar')}</div>
              </div>
              <div class="header-cell">
                <div class="header-english">${getTranslation('unitPrice', 'en')}</div>
                <div class="header-arabic">${getTranslation('unitPrice', 'ar')}</div>
              </div>
              <div class="header-cell">
                <div class="header-english">${getTranslation('discount', 'en')}</div>
                <div class="header-arabic">${getTranslation('discount', 'ar')}</div>
              </div>
              <div class="header-cell">
                <div class="header-english">${getTranslation('vat', 'en')}</div>
                <div class="header-arabic">${getTranslation('vat', 'ar')}</div>
              </div>
              <div class="header-cell">
                <div class="header-english">${getTranslation('totalBeforeVat', 'en')}</div>
                <div class="header-arabic">${getTranslation('totalBeforeVat', 'ar')}</div>
              </div>
              <div class="header-cell">
                <div class="header-english">${getTranslation('totalAfterVat', 'en')}</div>
                <div class="header-arabic">${getTranslation('totalAfterVat', 'ar')}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Invoice Items Data Table -->
        <div class="items-data-table">
          ${invoiceData.items?.map((item: any, index: number) => `
            <div class="data-row">
              <div class="data-cell">${item.description || ''}</div>
              <div class="data-cell">${item.quantity || ''}</div>
              <div class="data-cell" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                ${item.unitPrice || ''} 
                <img src="data:image/png;base64,${riyalSymbolBase64}" alt="ر.س" style="width: 8px; height: 8px;" />
              </div>
              <div class="data-cell">${
                item.discountType && item.discountType !== 'none' && item.discountType !== 'No Discount'
                  ? item.discountType + ' Discount'
                  : 'No Discount'
              }</div>
              <div class="data-cell" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                ${item.vatAmount || ''} 
                <img src="data:image/png;base64,${riyalSymbolBase64}" alt="ر.س" style="width: 8px; height: 8px;" />
              </div>
              <div class="data-cell" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                ${item.totalBeforeVat || ''} 
                <img src="data:image/png;base64,${riyalSymbolBase64}" alt="ر.س" style="width: 8px; height: 8px;" />
              </div>
              <div class="data-cell" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                ${item.totalAfterVat || ''} 
                <img src="data:image/png;base64,${riyalSymbolBase64}" alt="ر.س" style="width: 8px; height: 8px;" />
              </div>
            </div>
          `).join('') || ''}
        </div>

        <!-- Spacing between items table and totals -->
        <div style="margin-bottom: 48px;"></div>

        <!-- Totals Section - Bilingual Side by Side -->
        <div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px;">
          <!-- English Totals - Left Side -->
          <div style="background: white; border: 1px solid #D1D5DB; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); padding: 16px; width: 320px;">
            <h3 style="font-size: 16px; font-weight: 600; color: #1F2937; margin-bottom: 16px; text-align: center; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;">
              ${getTranslation('totalsTitle', 'en')}
            </h3>
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  ${getTranslation('subtotalBeforeVat', 'en')}
                </span>
                <span style="font-size: 12px; font-weight: 600; color: #1F2937; display: flex; align-items: center; gap: 4px;">
                  ${((invoiceData.subtotal || 0) - (invoiceData.discount || 0)).toFixed(2)} 
                  <img src="data:image/png;base64,${riyalSymbolBase64}" alt="ر.س" style="width: 10px; height: 10px;" />
                </span>
              </div>
              <div style="border-bottom: 1px solid #E5E7EB;"></div>
            </div>
            
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  ${getTranslation('vatAmount', 'en')}
                </span>
                <span style="font-size: 12px; font-weight: 600; color: #1F2937; display: flex; align-items: center; gap: 4px;">
                  ${(invoiceData.tax || 0).toFixed(2)} 
                  <img src="data:image/png;base64,${riyalSymbolBase64}" alt="ر.س" style="width: 10px; height: 10px;" />
                </span>
              </div>
              <div style="border-bottom: 1px solid #E5E7EB;"></div>
            </div>
            
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  ${getTranslation('finalTotal', 'en')}
                </span>
                <span style="font-size: 12px; font-weight: 700; color: #8B2F8B; display: flex; align-items: center; gap: 4px;">
                  ${(invoiceData.total || 0).toFixed(2)} 
                  <img src="data:image/png;base64,${riyalSymbolBase64}" alt="ر.س" style="width: 10px; height: 10px;" />
                </span>
              </div>
              <div style="border-bottom: 1px solid #E5E7EB;"></div>
            </div>
            
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  ${getTranslation('totalPaid', 'en')}
                </span>
                <span style="font-size: 12px; font-weight: 600; color: #059669; display: flex; align-items: center; gap: 4px;">
                  ${((invoiceData.paymentMethods || []).reduce((sum: any, p: any) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 0)).toFixed(2)} 
                  <img src="data:image/png;base64,${riyalSymbolBase64}" alt="ر.س" style="width: 10px; height: 10px;" />
                </span>
              </div>
            </div>
            
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  ${getTranslation('remainingBalance', 'en')}
                </span>
                <span style="font-size: 12px; font-weight: 600; color: #DC2626; display: flex; align-items: center; gap: 4px;">
                  ${(Math.max(0, (invoiceData.total || 0) - ((invoiceData.paymentMethods || []).reduce((sum: any, p: any) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 0)))).toFixed(2)} 
                  <img src="data:image/png;base64,${riyalSymbolBase64}" alt="ر.س" style="width: 10px; height: 10px;" />
                </span>
              </div>
            </div>
          </div>

          <!-- Arabic Totals - Right Side -->
          <div style="background: white; border: 1px solid #D1D5DB; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); padding: 16px; width: 320px; direction: rtl;">
            <h3 style="font-size: 16px; font-weight: 600; color: #1F2937; margin-bottom: 16px; text-align: center; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;">
              ${getTranslation('totalsTitle', 'ar')}
            </h3>
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  ${getTranslation('subtotalBeforeVat', 'ar')}
                </span>
                <span style="font-size: 12px; font-weight: 600; color: #1F2937; display: flex; align-items: center; gap: 4px;">
                  <img src="data:image/png;base64,${riyalSymbolBase64}" alt="ر.س" style="width: 10px; height: 10px;" />
                  ${((invoiceData.subtotal || 0) - (invoiceData.discount || 0)).toFixed(2)}
                </span>
              </div>
              <div style="border-bottom: 1px solid #E5E7EB;"></div>
            </div>
            
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  ${getTranslation('vatAmount', 'ar')}
                </span>
                <span style="font-size: 12px; font-weight: 600; color: #1F2937; display: flex; align-items: center; gap: 4px;">
                  <img src="data:image/png;base64,${riyalSymbolBase64}" alt="ر.س" style="width: 10px; height: 10px;" />
                  ${(invoiceData.tax || 0).toFixed(2)}
                </span>
              </div>
              <div style="border-bottom: 1px solid #E5E7EB;"></div>
            </div>
            
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  ${getTranslation('finalTotal', 'ar')}
                </span>
                <span style="font-size: 12px; font-weight: 700; color: #8B2F8B; display: flex; align-items: center; gap: 4px;">
                  <img src="data:image/png;base64,${riyalSymbolBase64}" alt="ر.س" style="width: 10px; height: 10px;" />
                  ${(invoiceData.total || 0).toFixed(2)}
                </span>
              </div>
              <div style="border-bottom: 1px solid #E5E7EB;"></div>
            </div>
            
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  ${getTranslation('totalPaid', 'ar')}
                </span>
                <span style="font-size: 12px; font-weight: 600; color: #059669; display: flex; align-items: center; gap: 4px;">
                  <img src="data:image/png;base64,${riyalSymbolBase64}" alt="ر.س" style="width: 10px; height: 10px;" />
                  ${((invoiceData.paymentMethods || []).reduce((sum: any, p: any) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 0)).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="font-size: 12px; font-weight: 500; color: #374151;">
                  ${getTranslation('remainingBalance', 'ar')}
                </span>
                <span style="font-size: 12px; font-weight: 600; color: #DC2626; display: flex; align-items: center; gap: 4px;">
                  <img src="data:image/png;base64,${riyalSymbolBase64}" alt="ر.س" style="width: 10px; height: 10px;" />
                  ${(Math.max(0, (invoiceData.total || 0) - ((invoiceData.paymentMethods || []).reduce((sum: any, p: any) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 0)))).toFixed(2)}
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