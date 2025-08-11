import axios, { AxiosResponse } from 'axios';

interface MyFatoorahConfig {
  apiKey: string;
  baseUrl: string;
  isTest: boolean;
}

interface InitiatePaymentRequest {
  InvoiceAmount: number;
  CurrencyIso: string;
  CustomerName?: string;
  CustomerEmail?: string;
  CustomerMobile?: string;
  CustomerReference?: string;
  InvoiceReference?: string;
  DisplayCurrencyIso?: string;
  MobileCountryCode?: string;
  CallBackUrl?: string;
  ErrorUrl?: string;
  Language?: string;
  InvoiceItems?: Array<{
    ItemName: string;
    Quantity: number;
    UnitPrice: number;
    Weight?: number;
    Width?: number;
    Height?: number;
    Depth?: number;
  }>;
  ExpiryDate?: string;
  SendInvoiceOption?: number;
  InvoiceValue?: number;
  CustomerAddress?: {
    Block?: string;
    Street?: string;
    HouseBuildingNo?: string;
    Address?: string;
    AddressInstructions?: string;
  };
  Suppliers?: Array<{
    SupplierCode?: number;
    ProposedShare?: number;
    InvoiceShare?: number;
  }>;
}

interface InitiatePaymentResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors?: string[];
  Data: {
    InvoiceId: number;
    InvoiceURL: string;
    InvoiceReference: string;
    CustomerReference: string;
    RecurringId?: string;
  };
}

interface ExecutePaymentRequest {
  InvoiceValue: number;
  PaymentMethodId: number;
  CustomerName?: string;
  CustomerMobile?: string;
  CustomerEmail?: string;
  CallBackUrl?: string;
  ErrorUrl?: string;
  Language?: string;
  CustomerReference?: string;
  CustomerCivilId?: string;
  UserDefinedField?: string;
  ExpiryDate?: string;
  SourceInfo?: string;
  CustomerAddress?: {
    Block?: string;
    Street?: string;
    HouseBuildingNo?: string;
    Address?: string;
    AddressInstructions?: string;
  };
}

interface ExecutePaymentResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors?: string[];
  Data: {
    InvoiceId: number;
    InvoiceURL: string;
    PaymentURL: string;
    CustomerReference: string;
    UserDefinedField?: string;
  };
}

interface PaymentStatusResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors?: string[];
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
      TransactionValue: number;
      CustomerServiceCharge: number;
      DueValue: number;
      PaidCurrency: string;
      PaidCurrencyValue: number;
      Currency: string;
      Error: string;
      CardNumber: string;
      PaymentMethodTitle: string;
    }>;
  };
}

class MyFatoorahService {
  private config: MyFatoorahConfig;

  constructor() {
    this.config = {
      apiKey: process.env.MYFATOORAH_API_KEY || '',
      baseUrl: process.env.NODE_ENV === 'production' 
        ? 'https://apitest.myfatoorah.com' // Change to live URL when ready: https://api.myfatoorah.com
        : 'https://apitest.myfatoorah.com', // Sandbox URL
      isTest: process.env.NODE_ENV !== 'production',
    };

    if (!this.config.apiKey) {
      console.warn('⚠️ MyFatoorah API key not found. Payment functionality will be disabled.');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Create payment invoice (initiate payment)
   */
  async initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    try {
      console.log('🔄 MyFatoorah: Initiating payment...', {
        amount: request.InvoiceAmount,
        currency: request.CurrencyIso,
        customer: request.CustomerName,
        isTest: this.config.isTest
      });

      const response: AxiosResponse<InitiatePaymentResponse> = await axios.post(
        `${this.config.baseUrl}/v2/InitiatePayment`,
        request,
        { headers: this.getHeaders() }
      );

      console.log('✅ MyFatoorah: Payment initiated successfully', {
        invoiceId: response.data.Data?.InvoiceId,
        invoiceURL: response.data.Data?.InvoiceURL
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ MyFatoorah: Payment initiation failed', {
        error: error.response?.data || error.message,
        status: error.response?.status
      });
      
      throw new Error(
        error.response?.data?.Message || 
        'Failed to initiate payment with MyFatoorah'
      );
    }
  }

  /**
   * Execute payment (direct payment)
   */
  async executePayment(request: ExecutePaymentRequest): Promise<ExecutePaymentResponse> {
    try {
      console.log('🔄 MyFatoorah: Executing payment...', {
        amount: request.InvoiceValue,
        paymentMethodId: request.PaymentMethodId
      });

      const response: AxiosResponse<ExecutePaymentResponse> = await axios.post(
        `${this.config.baseUrl}/v2/ExecutePayment`,
        request,
        { headers: this.getHeaders() }
      );

      console.log('✅ MyFatoorah: Payment executed successfully', {
        invoiceId: response.data.Data?.InvoiceId,
        paymentURL: response.data.Data?.PaymentURL
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ MyFatoorah: Payment execution failed', {
        error: error.response?.data || error.message,
        status: error.response?.status
      });
      
      throw new Error(
        error.response?.data?.Message || 
        'Failed to execute payment with MyFatoorah'
      );
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      console.log('🔄 MyFatoorah: Getting payment status...', { paymentId });

      const response: AxiosResponse<PaymentStatusResponse> = await axios.post(
        `${this.config.baseUrl}/v2/getPaymentStatus`,
        { Key: paymentId, KeyType: 'PaymentId' },
        { headers: this.getHeaders() }
      );

      console.log('✅ MyFatoorah: Payment status retrieved', {
        invoiceId: response.data.Data?.InvoiceId,
        status: response.data.Data?.InvoiceStatus
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ MyFatoorah: Get payment status failed', {
        error: error.response?.data || error.message,
        status: error.response?.status
      });
      
      throw new Error(
        error.response?.data?.Message || 
        'Failed to get payment status from MyFatoorah'
      );
    }
  }

  /**
   * Get payment status by invoice reference
   */
  async getPaymentStatusByInvoiceId(invoiceId: number): Promise<PaymentStatusResponse> {
    try {
      console.log('🔄 MyFatoorah: Getting payment status by invoice ID...', { invoiceId });

      const response: AxiosResponse<PaymentStatusResponse> = await axios.post(
        `${this.config.baseUrl}/v2/getPaymentStatus`,
        { Key: invoiceId.toString(), KeyType: 'InvoiceId' },
        { headers: this.getHeaders() }
      );

      console.log('✅ MyFatoorah: Payment status retrieved by invoice ID', {
        invoiceId: response.data.Data?.InvoiceId,
        status: response.data.Data?.InvoiceStatus
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ MyFatoorah: Get payment status by invoice ID failed', {
        error: error.response?.data || error.message,
        status: error.response?.status
      });
      
      throw new Error(
        error.response?.data?.Message || 
        'Failed to get payment status by invoice ID from MyFatoorah'
      );
    }
  }

  /**
   * Validate webhook signature (for production security)
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    // TODO: Implement webhook signature validation when MyFatoorah provides it
    // This is placeholder - actual implementation depends on MyFatoorah's webhook security
    return true;
  }

  /**
   * Process webhook callback
   */
  async processWebhookCallback(payload: any): Promise<{
    invoiceId: number;
    paymentStatus: string;
    transactionData: any;
  }> {
    try {
      console.log('🔄 MyFatoorah: Processing webhook callback...', payload);

      // Extract relevant data from webhook payload
      const invoiceId = payload.InvoiceId;
      const paymentStatus = payload.InvoiceStatus;
      
      // Verify payment status with MyFatoorah API
      const statusResponse = await this.getPaymentStatusByInvoiceId(invoiceId);
      
      return {
        invoiceId,
        paymentStatus: statusResponse.Data.InvoiceStatus,
        transactionData: statusResponse.Data
      };
    } catch (error: any) {
      console.error('❌ MyFatoorah: Webhook processing failed', error);
      throw new Error('Failed to process webhook callback');
    }
  }

  /**
   * Get available payment methods
   */
  async getPaymentMethods(invoiceAmount: number, currencyIso: string = 'SAR'): Promise<any> {
    try {
      console.log('🔄 MyFatoorah: Getting payment methods...', { invoiceAmount, currencyIso });

      const response = await axios.post(
        `${this.config.baseUrl}/v2/InitiatePayment`,
        {
          InvoiceAmount: invoiceAmount,
          CurrencyIso: currencyIso
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ MyFatoorah: Get payment methods failed', error);
      throw new Error('Failed to get payment methods from MyFatoorah');
    }
  }
}

export { MyFatoorahService, InitiatePaymentRequest, PaymentStatusResponse };