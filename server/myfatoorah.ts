import axios, { AxiosInstance } from 'axios';

export interface MyFatoorahConfig {
  apiToken: string;
  baseUrl: string;
  isTestMode?: boolean;
}

export interface PaymentMethod {
  PaymentMethodId: number;
  PaymentMethodAr: string;
  PaymentMethodEn: string;
  PaymentMethodCode: string;
  IsDirectPayment: boolean;
  ServiceCharge: number;
  TotalAmount: number;
  CurrencyIso: string;
  ImageUrl: string;
}

export interface InitiatePaymentRequest {
  InvoiceAmount: number;
  CurrencyIso: string;
}

export interface InitiatePaymentResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors: any[];
  Data: PaymentMethod[];
}

export interface ExecutePaymentRequest {
  PaymentMethodId: number;
  InvoiceValue: number;
  DisplayCurrencyIso?: string;
  CallBackUrl: string;
  ErrorUrl: string;
  Language?: string;
  CustomerName?: string;
  CustomerEmail?: string;
  CustomerMobile?: string;
  CustomerReference?: string;
  InvoiceItems?: Array<{
    ItemName: string;
    Quantity: number;
    UnitPrice: number;
  }>;
}

export interface ExecutePaymentResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors: any[];
  Data: {
    InvoiceId: number;
    IsDirectPayment: boolean;
    PaymentURL: string;
    CustomerReference: string;
    UserDefinedField: string;
  };
}

export interface PaymentStatusRequest {
  Key: string;
  KeyType: 'PaymentId' | 'InvoiceId';
}

export interface PaymentStatusResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors: any[];
  Data: {
    InvoiceId: number;
    InvoiceStatus: string;
    InvoiceReference: string;
    CustomerReference: string;
    CreatedDate: string;
    ExpiryDate: string;
    InvoiceValue: number;
    Comments: string;
    CustomerName: string;
    CustomerMobile: string;
    CustomerEmail: string;
    UserDefinedField: string;
    InvoiceDisplayValue: string;
    DueDeposit: number;
    DepositeStatus: string;
    InvoiceItems: Array<{
      ItemName: string;
      Quantity: number;
      UnitPrice: number;
      Weight: number;
      Width: number;
      Height: number;
      Depth: number;
    }>;
    InvoiceTransactions: Array<{
      TransactionDate: string;
      PaymentGateway: string;
      ReferenceId: string;
      TrackId: string;
      TransactionId: string;
      PaymentId: string;
      AuthorizationId: string;
      TransactionStatus: string;
      TransactionValue: string;
      CustomerServiceCharge: number;
      DueValue: number;
      PaidCurrency: string;
      PaidCurrencyValue: string;
      IpAddress: string;
      Country: string;
      Currency: string;
      Error: string;
      CardNumber: string;
      ErrorCode: string;
    }>;
    Suppliers: any[];
  };
}

export class MyFatoorahService {
  private client: AxiosInstance;
  private config: MyFatoorahConfig;

  constructor(config: MyFatoorahConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`MyFatoorah API Response [${response.config.url}]:`, {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error) => {
        console.error(`MyFatoorah API Error [${error.config?.url}]:`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize payment to get available payment methods
   */
  async initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    try {
      const response = await this.client.post('/v2/InitiatePayment', request);
      return response.data;
    } catch (error: any) {
      console.error('InitiatePayment failed:', error.response?.data || error.message);
      throw new Error(`MyFatoorah InitiatePayment failed: ${error.response?.data?.Message || error.message}`);
    }
  }

  /**
   * Execute payment to create payment link
   */
  async executePayment(request: ExecutePaymentRequest): Promise<ExecutePaymentResponse> {
    try {
      const response = await this.client.post('/v2/ExecutePayment', request);
      return response.data;
    } catch (error: any) {
      console.error('ExecutePayment failed:', error.response?.data || error.message);
      throw new Error(`MyFatoorah ExecutePayment failed: ${error.response?.data?.Message || error.message}`);
    }
  }

  /**
   * Get payment status by PaymentId or InvoiceId
   */
  async getPaymentStatus(request: PaymentStatusRequest): Promise<PaymentStatusResponse> {
    try {
      const response = await this.client.post('/v2/GetPaymentStatus', request);
      return response.data;
    } catch (error: any) {
      console.error('GetPaymentStatus failed:', error.response?.data || error.message);
      throw new Error(`MyFatoorah GetPaymentStatus failed: ${error.response?.data?.Message || error.message}`);
    }
  }

  /**
   * Verify payment webhook signature (if MyFatoorah provides webhook signing)
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // MyFatoorah webhook verification logic would go here
    // This is a placeholder - implement according to MyFatoorah's webhook documentation
    return true;
  }

  /**
   * Get cached payment methods from database or fetch new ones
   */
  async getPaymentMethods(amount: number = 100, currency: string = 'SAR'): Promise<PaymentMethod[]> {
    try {
      const result = await this.initiatePayment({
        InvoiceAmount: amount,
        CurrencyIso: currency
      });

      if (!result.IsSuccess) {
        throw new Error(result.Message || 'Failed to get payment methods');
      }

      return result.Data;
    } catch (error: any) {
      console.error('Failed to get payment methods:', error.message);
      throw error;
    }
  }

  /**
   * Create a payment for an invoice
   */
  async createPayment(params: {
    invoiceId: number;
    amount: number;
    paymentMethodId: number;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    callbackUrl: string;
    errorUrl: string;
    language?: 'ar' | 'en';
    items?: Array<{
      ItemName: string;
      Quantity: number;
      UnitPrice: number;
    }>;
  }): Promise<ExecutePaymentResponse> {
    const request: ExecutePaymentRequest = {
      PaymentMethodId: params.paymentMethodId,
      InvoiceValue: params.amount,
      DisplayCurrencyIso: 'SAR',
      CallBackUrl: params.callbackUrl,
      ErrorUrl: params.errorUrl,
      Language: params.language || 'ar',
      CustomerName: params.customerName,
      CustomerEmail: params.customerEmail,
      CustomerMobile: params.customerPhone,
      CustomerReference: `VETS-INVOICE-${params.invoiceId}`,
      InvoiceItems: params.items,
    };

    return this.executePayment(request);
  }
}

// Export a singleton instance
export const myfatoorahService = new MyFatoorahService({
  apiToken: process.env.MYFATOORAH_API_TOKEN!,
  baseUrl: 'https://api-sa.myfatoorah.com', // Saudi Arabia live API
  isTestMode: process.env.NODE_ENV !== 'production',
});

// Export test instance for development
export const myfatoorahTestService = new MyFatoorahService({
  apiToken: process.env.MYFATOORAH_API_TOKEN!,
  baseUrl: 'https://apitest.myfatoorah.com', // Test API
  isTestMode: true,
});