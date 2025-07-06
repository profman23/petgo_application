import axios from 'axios';

interface PaymentMethodResponse {
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

interface InitiatePaymentResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors: any[];
  Data: {
    PaymentMethods: PaymentMethodResponse[];
  };
}

interface ExecutePaymentResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors: any[];
  Data: {
    InvoiceId: number;
    IsDirectPayment: boolean;
    PaymentURL: string;
    CustomerReference: string;
    UserDefinedField: string;
    RecurringId: string;
  };
}

interface PaymentStatusResponse {
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
    PaidValue: number;
    DueValue: number;
    InvoiceDisplayValue: string;
    InvoiceTransactions: Array<{
      TransactionId: number;
      PaymentId: string;
      AuthorizationId: string;
      TransactionStatus: string;
      TransactionValue: number;
      CustomerServiceCharge: number;
      DueValue: number;
      PaidCurrency: string;
      PaidCurrencyValue: number;
      IpAddress: string;
      Country: string;
      Currency: string;
      Error: string;
      CardNumber: string;
      PaymentMethod: string;
      PaymentMethodCode: string;
      ReferenceId: string;
      TrackId: string;
      TransactionDate: string;
      PaymentGateway: string;
      GatewayTransactionId: string;
      GatewayReferenceId: string;
    }>;
  };
}

export class MyFatoorahService {
  private apiKey: string;
  private baseUrl: string = 'https://api-sa.myfatoorah.com/v2/';
  private testMode: boolean = false;

  constructor() {
    this.apiKey = process.env.MYFATOORAH_API_KEY!;
    if (!this.apiKey) {
      throw new Error('MYFATOORAH_API_KEY environment variable is required');
    }
    
    // Use test environment if API key contains 'test' or 'demo'
    if (this.apiKey.toLowerCase().includes('test') || this.apiKey.toLowerCase().includes('demo')) {
      this.baseUrl = 'https://apitest.myfatoorah.com/v2/';
      this.testMode = true;
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async initiatePayment(amount: number, currency: string = 'SAR'): Promise<PaymentMethodResponse[]> {
    try {
      const response = await axios.post<InitiatePaymentResponse>(
        `${this.baseUrl}InitiatePayment`,
        {
          InvoiceAmount: amount,
          CurrencyIso: currency
        },
        { headers: this.getHeaders() }
      );

      if (!response.data.IsSuccess) {
        throw new Error(response.data.Message || 'Payment initiation failed');
      }

      return response.data.Data.PaymentMethods;
    } catch (error: any) {
      console.error('MyFatoorah InitiatePayment error:', error.response?.data || error.message);
      throw new Error('فشل في تهيئة عملية الدفع');
    }
  }

  async executePayment(paymentData: {
    paymentMethodId: number;
    invoiceValue: number;
    customerName: string;
    customerEmail: string;
    customerMobile: string;
    callbackUrl: string;
    errorUrl: string;
    customerReference?: string;
    invoiceItems?: Array<{
      ItemName: string;
      Quantity: number;
      UnitPrice: number;
    }>;
  }): Promise<string> {
    try {
      const requestBody = {
        PaymentMethodId: paymentData.paymentMethodId,
        InvoiceValue: paymentData.invoiceValue,
        CustomerName: paymentData.customerName,
        CustomerEmail: paymentData.customerEmail,
        CustomerMobile: paymentData.customerMobile,
        CallBackUrl: paymentData.callbackUrl,
        ErrorUrl: paymentData.errorUrl,
        CustomerReference: paymentData.customerReference || '',
        Language: 'AR',
        InvoiceItems: paymentData.invoiceItems || [{
          ItemName: 'خدمة بيطرية',
          Quantity: 1,
          UnitPrice: paymentData.invoiceValue
        }]
      };

      const response = await axios.post<ExecutePaymentResponse>(
        `${this.baseUrl}ExecutePayment`,
        requestBody,
        { headers: this.getHeaders() }
      );

      if (!response.data.IsSuccess) {
        throw new Error(response.data.Message || 'Payment execution failed');
      }

      return response.data.Data.PaymentURL;
    } catch (error: any) {
      console.error('MyFatoorah ExecutePayment error:', error.response?.data || error.message);
      throw new Error('فشل في تنفيذ عملية الدفع');
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse['Data']> {
    try {
      const response = await axios.post<PaymentStatusResponse>(
        `${this.baseUrl}GetPaymentStatus`,
        {
          Key: paymentId,
          KeyType: 'PaymentId'
        },
        { headers: this.getHeaders() }
      );

      if (!response.data.IsSuccess) {
        throw new Error(response.data.Message || 'Payment status check failed');
      }

      return response.data.Data;
    } catch (error: any) {
      console.error('MyFatoorah GetPaymentStatus error:', error.response?.data || error.message);
      throw new Error('فشل في التحقق من حالة الدفع');
    }
  }

  isTestMode(): boolean {
    return this.testMode;
  }
}

export const paymentService = new MyFatoorahService();