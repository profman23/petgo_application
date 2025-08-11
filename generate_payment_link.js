// Quick script to generate a 1 SAR payment link using MyFatoorah API directly

const axios = require('axios');

const MYFATOORAH_API_KEY = process.env.MYFATOORAH_API_KEY;
const baseURL = 'https://apitest.myfatoorah.com';

async function createTestPayment() {
  try {
    const paymentRequest = {
      InvoiceAmount: 1.00, // 1 SAR test payment
      CustomerName: 'VetsVan Test Customer',
      CustomerEmail: 'test@vetsvan.com',
      CustomerMobile: '512345678', // Without country code
      CustomerReference: 'VETSVAN-TEST-CUSTOMER',
      InvoiceReference: `VETSVAN-TEST-${Date.now()}`,
      InvoiceDisplayValue: '1.00 SAR',
      Language: 'AR',
      CallBackUrl: 'https://vetsvan.replit.app/payment-success',
      ErrorUrl: 'https://vetsvan.replit.app/payment-error',
      MobileCountryCode: '+966',
      SendInvoiceOption: 2 // Email only
    };

    console.log('🏦 Creating MyFatoorah test payment...');
    console.log('Request:', JSON.stringify(paymentRequest, null, 2));

    const response = await axios.post(
      `${baseURL}/v2/SendPayment`,
      paymentRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MYFATOORAH_API_KEY}`
        }
      }
    );

    console.log('✅ MyFatoorah Response:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.IsSuccess && response.data.Data) {
      console.log('\n🎉 SUCCESS! Payment link created:');
      console.log('Payment URL:', response.data.Data.PaymentURL);
      console.log('Invoice ID:', response.data.Data.InvoiceId);
      console.log('Amount: 1.00 SAR');
      console.log('\nYou can now test the payment by visiting the Payment URL above.');
    } else {
      console.log('❌ Payment creation failed:', response.data.Message);
      if (response.data.ValidationErrors) {
        console.log('Validation Errors:', response.data.ValidationErrors);
      }
    }

  } catch (error) {
    console.error('❌ Error creating payment:', error.response?.data || error.message);
  }
}

createTestPayment();