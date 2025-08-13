// Public payment test endpoint without authentication
import { MyFatoorahService } from './services/myfatoorah';

export function addPublicPaymentRoutes(app: any) {
  // Public test payment creation (no auth required)
  app.post('/api/public/payments/test-invoice', async (req: any, res: any) => {
    try {
      const { 
        invoiceNumber, 
        amount, 
        customerName, 
        customerEmail, 
        customerPhone, 
        description,
        callBackUrl,
        errorUrl
      } = req.body;

      console.log('📥 Payment creation request received:', {
        invoiceNumber,
        amount,
        customerName,
        customerEmail: customerEmail?.substring(0, 20) + '...',
        customerPhone: customerPhone?.substring(0, 10) + '...'
      });

      if (!invoiceNumber || !amount || !customerName || !customerEmail || !customerPhone) {
        console.error('❌ Missing required fields for payment creation');
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: invoiceNumber, amount, customerName, customerEmail, customerPhone'
        });
      }

      const myfatoorah = new MyFatoorahService();
      
      // Prepare payment request for MyFatoorah API
      const paymentRequest = {
        CustomerName: customerName,
        NotificationOption: 'EML',
        InvoiceValue: parseFloat(amount),
        DisplayCurrencyIso: 'SAR',
        MobileCountryCode: '966',
        CustomerMobile: customerPhone.replace(/^\+966/, '').replace(/^966/, ''), // Remove country code
        CustomerEmail: customerEmail,
        CallBackUrl: callBackUrl || `${req.protocol}://${req.get('host')}/payment-success?ref=${invoiceNumber}&source=myfatoorah`,
        ErrorUrl: errorUrl || `${req.protocol}://${req.get('host')}/payment-error?ref=${invoiceNumber}&source=myfatoorah`,
        Language: 'En' as const,
        CustomerReference: invoiceNumber
      };

      console.log('🏦 Creating MyFatoorah TEST payment invoice:', paymentRequest);

      const paymentResponse = await myfatoorah.createInvoice(paymentRequest);

      if (paymentResponse.IsSuccess && paymentResponse.Data) {
        console.log('✅ Test payment created successfully:', paymentResponse.Data);
        console.log('🔗 Payment URL being sent:', paymentResponse.Data.InvoiceURL);

        const responseData = {
          success: true,
          data: {
            paymentUrl: paymentResponse.Data.InvoiceURL,
            invoiceId: paymentResponse.Data.InvoiceId,
            invoiceReference: paymentResponse.Data.CustomerReference,
            message: 'Test payment invoice created successfully'
          }
        };

        console.log('📤 Final API Response:', JSON.stringify(responseData, null, 2));
        
        // Ensure proper JSON content type
        res.setHeader('Content-Type', 'application/json');
        res.json(responseData);
      } else {
        console.error('❌ MyFatoorah test payment creation failed:', paymentResponse);
        res.setHeader('Content-Type', 'application/json');
        res.status(400).json({
          success: false,
          message: 'Failed to create payment invoice',
          error: paymentResponse.ValidationErrors || paymentResponse.Message
        });
      }

    } catch (error: any) {
      console.error('❌ Test payment creation error:', error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({
        success: false,
        message: 'Internal server error during payment creation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
}