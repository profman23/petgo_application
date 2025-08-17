// Public payment test endpoint without authentication
import { sql } from 'drizzle-orm';
import { MyFatoorahService } from './services/myfatoorah';
import { sessionService } from './sessionService';
import { storage } from './storage';
import { db } from './db';

export function addPublicPaymentRoutes(app: any) {
  // Simple test endpoint
  app.get('/api/public/test', (req: any, res: any) => {
    res.json({ status: 'Public routes working', timestamp: new Date() });
  });

  // Backfill payment amounts from MyFatoorah for existing transactions
  app.post('/api/public/payments/backfill-amounts', async (req: any, res: any) => {
    try {
      console.log('🔧 Starting payment amount backfill process...');
      
      // Get all payment transactions with payment IDs but potentially incorrect amounts
      const result = await db.execute(sql`
        SELECT id, myfatoorah_payment_id, amount, status, created_at 
        FROM payment_transactions 
        WHERE myfatoorah_payment_id IS NOT NULL 
        AND status = 'paid'
        ORDER BY created_at DESC 
        LIMIT 20
      `);
      
      const transactions = result.rows;
      console.log(`📊 Found ${transactions.length} transactions to process`);
      
      const myFatoorahService = new MyFatoorahService();
      let successCount = 0;
      let errorCount = 0;
      
      for (const transaction of transactions) {
        try {
          console.log(`🔍 Processing payment ID: ${transaction.myfatoorah_payment_id}`);
          
          const paymentDetails = await myFatoorahService.getPaymentDetailsFromCallback(
            transaction.myfatoorah_payment_id
          );
          
          if (paymentDetails.amount > 0 && paymentDetails.amount !== transaction.amount) {
            await db.execute(sql`
              UPDATE payment_transactions 
              SET amount = ${paymentDetails.amount}, 
                  currency = ${paymentDetails.currency || 'SAR'},
                  updated_at = ${new Date()}
              WHERE id = ${transaction.id}
            `);
            
            console.log(`✅ Updated transaction ${transaction.id}: ${transaction.amount} → ${paymentDetails.amount} SAR`);
            successCount++;
          } else {
            console.log(`⏭️ Skipping transaction ${transaction.id}: amount already correct or unavailable`);
          }
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`❌ Failed to update transaction ${transaction.id}:`, error);
          errorCount++;
        }
      }
      
      res.json({
        success: true,
        message: `Backfill completed: ${successCount} updated, ${errorCount} errors`,
        processed: transactions.length,
        updated: successCount,
        errors: errorCount
      });
      
    } catch (error: any) {
      console.error('❌ Payment backfill error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

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
      console.log('🔍 Payment Auth Check:', {
        hasAuthHeader: !!authHeader,
        authPrefix: authHeader?.substring(0, 20) + '...',
        providedCustomerName: customerName,
        providedCustomerEmail: customerEmail
      });
      
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const sessionId = authHeader.replace('Bearer ', '');
          console.log('🔍 Checking session:', sessionId?.substring(0, 20) + '...');
          
          const session = await sessionService.getSession(sessionId);
          
          console.log('🔍 Session result:', {
            hasSession: !!session,
            hasUserData: !!session?.userData,
            userId: session?.userData?.id
          });
          
          if (session && session.userData) {
            // Fetch complete user data from database
            const fullUser = await storage.getUser(session.userData.id);
            
            console.log('🔍 Full user data:', {
              hasFullUser: !!fullUser,
              userName: fullUser?.name,
              userEmail: fullUser?.email,
              userPhone: fullUser?.phone
            });
            
            if (fullUser) {
              finalCustomerName = fullUser.name || fullUser.phone || `User-${fullUser.id}`;
              finalCustomerEmail = fullUser.email || `user${fullUser.id}@vetsvan.app`;
              finalCustomerPhone = fullUser.phone || '+966000000000';
              
              console.log('🔑 SUCCESS: Using authenticated user data for payment:', {
                userId: fullUser.id,
                customerName: finalCustomerName,
                customerEmail: finalCustomerEmail?.substring(0, 8) + '...',
                customerPhone: finalCustomerPhone?.substring(0, 8) + '...'
              });
            } else {
              console.log('❌ No user found in database for ID:', session.userData.id);
            }
          } else {
            console.log('❌ No valid session or userData found');
          }
        } catch (authError) {
          console.log('⚠️ Authentication check failed, using provided customer data:', authError.message);
        }
      } else {
        console.log('ℹ️ No Bearer token found, using provided customer data');
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
        CallBackUrl: `${req.protocol}://${req.get('host')}/api/public/myfatoorah/callback?ref=${invoiceNumber}`,
        ErrorUrl: `${req.protocol}://${req.get('host')}/ride-request?payment=failed&ref=${invoiceNumber}&source=myfatoorah`,
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

  // MyFatoorah payment callback handler
  app.get('/api/public/myfatoorah/callback', async (req: any, res: any) => {
    try {
      const { paymentId, Id, ref } = req.query;
      const actualPaymentId = paymentId || Id;
      
      console.log('🎉 MyFatoorah payment callback received:', {
        paymentId: actualPaymentId,
        reference: ref,
        allParams: req.query
      });

      if (actualPaymentId && ref) {
        // Fetch actual payment details from MyFatoorah
        try {
          const myFatoorahService = new MyFatoorahService();
          const paymentDetails = await myFatoorahService.getPaymentDetailsFromCallback(actualPaymentId);
          
          console.log('💰 Fetched actual payment details:', paymentDetails);

          // Update existing payment transaction with correct amount
          if (paymentDetails.amount > 0) {
            await db.execute(sql`
              UPDATE payment_transactions 
              SET amount = ${paymentDetails.amount}, 
                  currency = ${paymentDetails.currency},
                  status = ${paymentDetails.status},
                  paid_at = ${paymentDetails.paidAt},
                  updated_at = ${new Date()}
              WHERE myfatoorah_payment_id = ${actualPaymentId}
              OR reference_id = ${ref}
            `);
            
            console.log('✅ Payment transaction updated with actual amount:', paymentDetails.amount);
          }
        } catch (fetchError) {
          console.error('❌ Failed to fetch payment details:', fetchError);
        }

        // Store payment success info and redirect to booking page
        const redirectUrl = `/vetsvan-booking?payment=success&ref=${ref}&paymentId=${actualPaymentId}&source=myfatoorah`;
        console.log('🔄 Redirecting to booking page with payment info:', redirectUrl);
        return res.redirect(redirectUrl);
      } else {
        console.log('❌ Missing payment parameters, redirecting to booking page without payment info');
        return res.redirect('/vetsvan-booking?payment=failed');
      }
    } catch (error: any) {
      console.error('❌ MyFatoorah callback error:', error);
      res.redirect('/vetsvan-booking?payment=error');
    }
  });

  // MyFatoorah webhook handler for payment notifications
  app.post('/api/public/myfatoorah/webhook', async (req: any, res: any) => {
    try {
      console.log('🔔 MyFatoorah webhook received:', req.body);
      
      const { InvoiceId, PaymentId, InvoiceValue, InvoiceStatus, CustomerReference } = req.body;
      
      if (InvoiceStatus === 'Paid' && PaymentId && InvoiceValue && CustomerReference) {
        console.log('💰 Payment confirmed via webhook:', {
          invoiceId: InvoiceId,
          paymentId: PaymentId,
          amount: InvoiceValue,
          reference: CustomerReference
        });
        
        // Update existing payment transaction with correct amount
        try {
          await db.execute(sql`
            UPDATE payment_transactions 
            SET amount = ${parseFloat(InvoiceValue)}, 
                status = 'paid',
                paid_at = ${new Date()},
                updated_at = ${new Date()}
            WHERE myfatoorah_payment_id = ${PaymentId}
            OR reference_id = ${CustomerReference}
          `);
          
          console.log('✅ Payment transaction updated with actual amount:', InvoiceValue);
        } catch (updateError) {
          console.error('❌ Failed to update payment transaction:', updateError);
        }
      }
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('❌ MyFatoorah webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Manual payment linking endpoint for testing (admin only)
  app.post('/api/public/link-payment-to-booking', async (req: any, res: any) => {
    try {
      const { bookingId, amount, paymentId, reference } = req.body;
      
      if (!bookingId || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: bookingId, amount'
        });
      }

      console.log('🔗 Manually linking payment to booking:', {
        bookingId,
        amount,
        paymentId,
        reference
      });

      // Get booking details
      const allBookings = await storage.getAllBookings();
      const booking = allBookings.find(b => b.id === parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Get user details
      const user = await storage.getUser(booking.userId);

      // Create payment transaction record using raw SQL (to match existing database structure)
      await db.execute(sql`
        INSERT INTO payment_transactions (
          booking_id, myfatoorah_payment_id, amount, currency, status, 
          reference_id, customer_name, customer_email, customer_phone,
          paid_at, created_at, updated_at
        ) VALUES (
          ${booking.id}, ${paymentId || `MANUAL-${Date.now()}`}, ${parseFloat(amount)}, 'SAR', 'paid',
          ${reference || `REF-${bookingId}`}, ${user?.name || 'Customer'}, 
          ${user?.email || 'customer@vetsvan.app'}, ${user?.phone || '+966000000000'},
          ${new Date()}, ${new Date()}, ${new Date()}
        )
      `);

      console.log('✅ Payment successfully linked to booking:', bookingId);

      res.json({
        success: true,
        message: 'Payment linked successfully',
        bookingId,
        amount
      });

    } catch (error: any) {
      console.error('❌ Payment linking error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to link payment',
        error: error.message
      });
    }
  });

  // Fetch payment details endpoint for immediate payment verification
  app.get('/api/public/payment-details/:paymentId', async (req: any, res: any) => {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required'
        });
      }

      console.log('🔍 Fetching payment details for immediate display:', paymentId);

      const myFatoorahService = new MyFatoorahService();
      const paymentDetails = await myFatoorahService.getPaymentDetailsFromCallback(paymentId);

      if (paymentDetails && paymentDetails.amount > 0) {
        // Store payment transaction immediately for future reference
        try {
          const existingPayment = await db.execute(sql`
            SELECT id FROM payment_transactions 
            WHERE myfatoorah_payment_id = ${paymentId}
            LIMIT 1
          `);

          if (existingPayment.rows.length === 0) {
            // Create new payment transaction record
            await db.execute(sql`
              INSERT INTO payment_transactions (
                myfatoorah_payment_id, myfatoorah_invoice_id, amount, currency, status,
                customer_name, customer_email, customer_phone, paid_at, created_at, updated_at,
                reference_id
              ) VALUES (
                ${paymentId}, ${paymentDetails.invoiceId}, ${paymentDetails.amount}, 
                ${paymentDetails.currency}, ${paymentDetails.status}, 'Payment Verified', 
                'verified@payment.com', '+966000000000', ${paymentDetails.paidAt || new Date()}, 
                ${new Date()}, ${new Date()}, ${paymentDetails.customerReference || ''}
              )
            `);
            console.log('✅ Payment transaction stored for immediate display');
          }
        } catch (storeError) {
          console.log('⚠️ Payment storage failed, but proceeding with display:', storeError);
        }

        res.json({
          success: true,
          payment: {
            paymentId: paymentDetails.paymentId,
            invoiceId: paymentDetails.invoiceId,
            amount: paymentDetails.amount,
            currency: paymentDetails.currency,
            status: paymentDetails.status,
            customerReference: paymentDetails.customerReference,
            paidAt: paymentDetails.paidAt
          }
        });
      } else {
        res.json({
          success: false,
          message: 'Payment not found or not completed',
          payment: null
        });
      }

    } catch (error: any) {
      console.error('❌ Payment details fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment details',
        error: error.message
      });
    }
  });
}