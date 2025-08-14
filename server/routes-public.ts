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
        description 
      } = req.body;

      if (!invoiceNumber || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: invoiceNumber, amount'
        });
      }

      // Initialize customer data with provided values
      let finalCustomerName = customerName || 'Customer';
      let finalCustomerEmail = customerEmail || 'test@example.com';
      let finalCustomerPhone = customerPhone || '+966000000000';

      // Check if user is authenticated and override with real data
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const sessionId = authHeader.replace('Bearer ', '');
          const sessionService = require('./sessionService').default;
          const session = await sessionService.getSession(sessionId);
          
          if (session && session.userData) {
            // Fetch complete user data from database
            const storage = require('./storage').default;
            const fullUser = await storage.getUser(session.userData.id);
            
            if (fullUser) {
              finalCustomerName = fullUser.name || fullUser.phone || `User-${fullUser.id}`;
              finalCustomerEmail = fullUser.email || `user${fullUser.id}@vetsvan.app`;
              finalCustomerPhone = fullUser.phone || '+966000000000';
              
              console.log('🔑 Using authenticated user data for payment:', {
                userId: fullUser.id,
                customerName: finalCustomerName,
                customerEmail: finalCustomerEmail?.substring(0, 8) + '...',
                customerPhone: finalCustomerPhone?.substring(0, 8) + '...'
              });
            }
          }
        } catch (authError) {
          console.log('⚠️ Authentication check failed, using provided customer data:', authError.message);
        }
      }

      const myfatoorah = new MyFatoorahService();
      
      // Prepare payment request for MyFatoorah API
      const paymentRequest = {
        CustomerName: finalCustomerName,
        NotificationOption: 'EML',
        InvoiceValue: parseFloat(amount),
        DisplayCurrencyIso: 'SAR',
        MobileCountryCode: '966',
        CustomerMobile: finalCustomerPhone.replace(/^\+966/, '').replace(/^966/, ''), // Remove country code
        CustomerEmail: finalCustomerEmail,
        CallBackUrl: `${req.protocol}://${req.get('host')}/payment-success?ref=${invoiceNumber}&source=myfatoorah`,
        ErrorUrl: `${req.protocol}://${req.get('host')}/payment-error?ref=${invoiceNumber}&source=myfatoorah`,
        Language: 'En' as const,
        CustomerReference: invoiceNumber
      };

      console.log('🏦 Creating MyFatoorah payment invoice with customer data:', paymentRequest);

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
        res.json(responseData);
      } else {
        console.error('❌ MyFatoorah test payment creation failed:', paymentResponse);
        res.status(400).json({
          success: false,
          message: 'Failed to create payment invoice',
          error: paymentResponse.ValidationErrors || paymentResponse.Message
        });
      }

    } catch (error: any) {
      console.error('❌ Test payment creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during payment creation',
        error: error.message
      });
    }
  });
}