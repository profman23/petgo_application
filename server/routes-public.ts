// Public payment test endpoint without authentication
import { MyFatoorahService } from './services/myfatoorah';

export function addPublicPaymentRoutes(app: any) {
  // Public test payment creation (no auth required)
  app.post('/api/public/payments/test-invoice', async (req: any, res) => {
    try {
      const { 
        invoiceNumber, 
        amount, 
        customerName, 
        customerEmail, 
        customerPhone, 
        description 
      } = req.body;

      if (!invoiceNumber || !amount || !customerName || !customerEmail || !customerPhone) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: invoiceNumber, amount, customerName, customerEmail, customerPhone'
        });
      }

      const myfatoorah = new MyFatoorahService();
      
      // Prepare payment request for MyFatoorah API
      const paymentRequest = {
        InvoiceAmount: parseFloat(amount),
        CustomerName: customerName,
        CustomerEmail: customerEmail,
        CustomerMobile: customerPhone.replace(/^\+966/, '').replace(/^966/, ''), // Remove country code
        CustomerReference: `TEST-CUSTOMER`,
        InvoiceReference: invoiceNumber,
        InvoiceDisplayValue: `${amount} SAR`,
        Language: 'AR' as const,
        CallBackUrl: `${req.protocol}://${req.get('host')}/payment-success?ref=${invoiceNumber}&source=myfatoorah`,
        ErrorUrl: `${req.protocol}://${req.get('host')}/payment-error?ref=${invoiceNumber}&source=myfatoorah`,
        MobileCountryCode: '+966',
        SendInvoiceOption: 2 // Email only
      };

      console.log('🏦 Creating MyFatoorah TEST payment invoice:', paymentRequest);

      const paymentResponse = await myfatoorah.createInvoice(paymentRequest);

      if (paymentResponse.IsSuccess && paymentResponse.Data) {
        console.log('✅ Test payment created successfully:', paymentResponse.Data);

        res.json({
          success: true,
          data: {
            paymentUrl: paymentResponse.Data.PaymentURL,
            invoiceId: paymentResponse.Data.InvoiceId,
            message: 'Test payment invoice created successfully'
          }
        });
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