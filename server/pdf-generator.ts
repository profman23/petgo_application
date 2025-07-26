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
          font-size: 18px;
          font-weight: 600;
        }
        
        .logo-section {
          flex: 1;
          text-align: center;
        }
        
        .logo-image {
          height: 64px;
          width: auto;
          object-fit: contain;
        }
        
        .spacer {
          width: 192px;
        }
        

      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header with Date (left) and Logo (center) -->
        <div class="header-section">
          <!-- Date on the left -->
          <div class="date-section">
            <p class="date-text">
              <strong>${isArabic ? 'التاريخ:' : 'Date:'}</strong> ${new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
            </p>
          </div>
          
          <!-- Logo in the center -->
          <div class="logo-section">
            <img 
              class="logo-image" 
              src="data:image/png;base64,${getLogoBase64()}"
              alt="Vets Van Logo" 
            />
          </div>
          
          <!-- Empty space to balance the layout -->
          <div class="spacer"></div>
        </div>
      </div>
    </body>
    </html>
  `;
};