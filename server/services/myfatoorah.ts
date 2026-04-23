import axios from 'axios';

export interface CreateInvoiceRequest {
  CustomerName: string;
  NotificationOption: string; // "EML" for email
  InvoiceValue: number;
  DisplayCurrencyIso: string; // "SAR"
  MobileCountryCode: string; // "966"
  CustomerMobile: string;
  CustomerEmail: string;
  CallBackUrl: string;
  ErrorUrl: string;
  Language: string; // "En" or "Ar"
  CustomerReference: string;
  ExpiryDate?: string;
}

export interface CreateInvoiceResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors?: string[];
  Data?: {
    InvoiceId: number;
    InvoiceURL: string;
    PaymentURL: string;
    CustomerReference: string;
    InvoiceReference: string;
  };
}

export interface PaymentStatus {
  InvoiceId: number;
  InvoiceStatus: string;
  InvoiceValue: number;
  PaidValue: number;
  PaymentMethod: string;
  InvoiceError: string;
}

const MYFATOORAH_ENABLED = process.env.MYFATOORAH_ENABLED === 'true';

export class MyFatoorahService {
  private baseURL: string;
  private apiKey: string;
  private enabled: boolean;

  constructor() {
    this.baseURL = 'https://api-sa.myfatoorah.com';
    this.apiKey = process.env.MYFATOORAH_API_KEY || '';
    this.enabled = MYFATOORAH_ENABLED;

    if (!this.enabled) {
      console.log('💳 MyFatoorah: DISABLED (MYFATOORAH_ENABLED=false). Payment calls return mock success.');
      return;
    }

    if (!this.apiKey) {
      throw new Error('MYFATOORAH_API_KEY environment variable is required when MYFATOORAH_ENABLED=true');
    }

    console.log('🔧 MyFatoorah Service initialized for Saudi Arabia');
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
    };
  }

  async createInvoice(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
    if (!this.enabled) {
      const mockInvoiceId = Math.floor(Math.random() * 1000000);
      console.log('💳 [MYFATOORAH DISABLED] Mock invoice created:', { amount: request.InvoiceValue, customer: request.CustomerName, reference: request.CustomerReference });
      return {
        IsSuccess: true,
        Message: 'Mock invoice (MyFatoorah disabled in dev)',
        Data: {
          InvoiceId: mockInvoiceId,
          InvoiceURL: `${request.CallBackUrl}?paymentId=mock_${mockInvoiceId}&Id=${mockInvoiceId}`,
          PaymentURL: `${request.CallBackUrl}?paymentId=mock_${mockInvoiceId}&Id=${mockInvoiceId}`,
          CustomerReference: request.CustomerReference,
          InvoiceReference: `MOCK-${mockInvoiceId}`
        }
      };
    }

    try {
      console.log('🏦 Creating MyFatoorah invoice:', {
        amount: request.InvoiceValue,
        customer: request.CustomerName,
        reference: request.CustomerReference
      });

      console.log('🔐 MyFatoorah request to:', this.baseURL);

      const response = await axios.post(
        `${this.baseURL}/v2/SendPayment`,
        request,
        { headers: this.getHeaders() }
      );

      console.log('✅ MyFatoorah invoice created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ MyFatoorah error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      // Log validation errors in detail
      if (error.response?.data?.ValidationErrors) {
        console.error('🔍 MyFatoorah Validation Errors:', JSON.stringify(error.response.data.ValidationErrors, null, 2));
      }
      
      // Log the full request that was sent
      console.error('📤 Request that failed:', JSON.stringify(request, null, 2));
      
      throw new Error(`Payment gateway error: ${error.response?.data?.Message || error.message}`);
    }
  }

  async getPaymentStatus(invoiceId: number): Promise<PaymentStatus> {
    if (!this.enabled) {
      console.log('💳 [MYFATOORAH DISABLED] Mock payment status for invoice:', invoiceId);
      return {
        InvoiceId: invoiceId,
        InvoiceStatus: 'Paid',
        InvoiceValue: 0,
        PaidValue: 0,
        PaymentMethod: 'MockPayment',
        InvoiceError: ''
      };
    }
    try {
      console.log('🔍 Checking payment status for invoice:', invoiceId);

      const response = await axios.post(
        `${this.baseURL}/v2/getPaymentStatus`,
        { Key: invoiceId, KeyType: 'InvoiceId' },
        { headers: this.getHeaders() }
      );

      console.log('✅ Payment status retrieved:', response.data);
      return response.data.Data;
    } catch (error: any) {
      console.error('❌ Payment status check failed:', error.response?.data || error.message);
      throw new Error(`Payment status check failed: ${error.response?.data?.Message || error.message}`);
    }
  }

  async processWebhook(webhookData: any) {
    try {
      console.log('🔔 Processing MyFatoorah webhook:', webhookData);
      
      // Extract payment information from webhook
      const { InvoiceId, InvoiceStatus, InvoiceValue, PaymentId } = webhookData;
      
      return {
        invoiceId: InvoiceId,
        paymentId: PaymentId,
        status: InvoiceStatus,
        amount: parseFloat(InvoiceValue) || 0,
        isPaid: InvoiceStatus === 'Paid'
      };
    } catch (error: any) {
      console.error('❌ Webhook processing failed:', error);
      throw new Error(`Webhook processing failed: ${error.message}`);
    }
  }

  async getPaymentDetailsFromCallback(paymentId: string): Promise<any> {
    if (!this.enabled) {
      console.log('💳 [MYFATOORAH DISABLED] Mock payment details for:', paymentId);
      return {
        paymentId,
        invoiceId: 0,
        amount: 0,
        currency: 'SAR',
        status: 'paid',
        customerReference: paymentId,
        paidAt: new Date(),
        customerName: 'Mock Customer',
        customerEmail: 'mock@dev.local',
        customerMobile: '500000000'
      };
    }
    try {
      console.log('🔍 Fetching payment details from MyFatoorah for payment ID:', paymentId);

      const response = await axios.post(
        `${this.baseURL}/v2/getPaymentStatus`,
        { Key: paymentId, KeyType: 'PaymentId' },
        { headers: this.getHeaders() }
      );

      console.log('✅ Payment details retrieved:', response.data);
      
      const paymentData = response.data.Data;
      return {
        paymentId: paymentData.InvoiceTransactions[0]?.PaymentId || paymentId,
        invoiceId: paymentData.InvoiceId,
        amount: parseFloat(paymentData.InvoiceValue) || 0,
        currency: paymentData.InvoiceDisplayValue?.split(' ')[1] || 'SAR',
        status: paymentData.InvoiceStatus === 'Paid' ? 'paid' : 'pending',
        customerReference: paymentData.CustomerReference,
        paidAt: paymentData.InvoiceTransactions[0]?.TransactionDate ? new Date(paymentData.InvoiceTransactions[0].TransactionDate) : new Date(),
        // Include customer data directly from the response
        customerName: paymentData.CustomerName,
        customerEmail: paymentData.CustomerEmail,
        customerMobile: paymentData.CustomerMobile
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch payment details:', error.response?.data || error.message);
      // Return default structure if API call fails
      return {
        paymentId: paymentId,
        amount: 0,
        currency: 'SAR',
        status: 'unknown',
        paidAt: new Date()
      };
    }
  }

  async getInvoiceDetails(invoiceId: number): Promise<any> {
    if (!this.enabled) {
      console.log('💳 [MYFATOORAH DISABLED] Mock invoice details for:', invoiceId);
      return { Data: { InvoiceId: invoiceId, InvoiceStatus: 'Paid', InvoiceValue: 0 } };
    }
    try {
      console.log('🔍 Fetching invoice details from MyFatoorah for invoice ID:', invoiceId);

      const response = await axios.post(
        `${this.baseURL}/v2/getPaymentStatus`,
        { Key: invoiceId, KeyType: 'InvoiceId' },
        { headers: this.getHeaders() }
      );

      console.log('✅ Invoice details retrieved:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch invoice details:', error.response?.data || error.message);
      return null;
    }
  }
}