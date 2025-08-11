import axios from 'axios';

export interface CreateInvoiceRequest {
  InvoiceAmount: number;
  CustomerName: string;
  CustomerEmail: string;
  CustomerMobile: string;
  CustomerReference: string;
  InvoiceReference: string;
  InvoiceDisplayValue: string;
  Language: 'EN' | 'AR';
  CallBackUrl: string;
  ErrorUrl: string;
  MobileCountryCode: string;
  ExpiryDate?: string;
  SendInvoiceOption: number; // 1=SMS, 2=Email, 3=Both
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
    // Use sandbox for testing, production URL would be different
    this.baseURL = 'https://apitest.myfatoorah.com';
    this.apiKey = process.env.MYFATOORAH_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('MYFATOORAH_API_KEY environment variable is required');
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  async createInvoice(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
    try {
      console.log('🏦 Creating MyFatoorah invoice:', {
        amount: request.InvoiceAmount,
        customer: request.CustomerName,
        reference: request.CustomerReference
      });

      const response = await axios.post(
        `${this.baseURL}/v2/SendPayment`,
        request,
        { headers: this.getHeaders() }
      );

      console.log('✅ MyFatoorah invoice created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ MyFatoorah invoice creation failed:', error.response?.data || error.message);
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