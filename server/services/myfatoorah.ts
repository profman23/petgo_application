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

export class MyFatoorahService {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    // Try Saudi Arabia production environment
    this.baseURL = 'https://api-sa.myfatoorah.com';
    this.apiKey = process.env.MYFATOORAH_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('MYFATOORAH_API_KEY environment variable is required');
    }
    
    console.log('🔧 MyFatoorah Service initialized for Saudi Arabia:', {
      baseURL: this.baseURL,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length
    });
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
    };
  }

  async createInvoice(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
    try {
      console.log('🏦 Creating MyFatoorah invoice:', {
        amount: request.InvoiceAmount,
        customer: request.CustomerName,
        reference: request.CustomerReference
      });

      console.log('🔐 API Details:', {
        baseURL: this.baseURL,
        apiKeyLength: this.apiKey.length,
        apiKeyPrefix: this.apiKey.substring(0, 20) + '...',
        headers: this.getHeaders()
      });

      const response = await axios.post(
        `${this.baseURL}/v2/SendPayment`,
        request,
        { headers: this.getHeaders() }
      );

      console.log('✅ MyFatoorah invoice created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ MyFatoorah detailed error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        url: error.config?.url,
        requestHeaders: error.config?.headers
      });
      throw new Error(`Payment gateway error: ${error.response?.data?.Message || error.message}`);
    }
  }

  async getPaymentStatus(invoiceId: number): Promise<PaymentStatus> {
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
      const { InvoiceId, InvoiceStatus, InvoiceValue } = webhookData;
      
      return {
        invoiceId: InvoiceId,
        status: InvoiceStatus,
        amount: InvoiceValue,
        isPaid: InvoiceStatus === 'Paid'
      };
    } catch (error: any) {
      console.error('❌ Webhook processing failed:', error);
      throw new Error(`Webhook processing failed: ${error.message}`);
    }
  }
}