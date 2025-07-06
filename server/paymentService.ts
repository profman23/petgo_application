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
  private baseUrl: string;
  private testMode: boolean = false;

  constructor() {
    this.apiKey = process.env.MYFATOORAH_API_KEY!;
    if (!this.apiKey) {
      throw new Error('MYFATOORAH_API_KEY environment variable is required');
    }
    
    // Default to test environment for development
    // Use test environment if API key contains 'test' or 'demo' or if it's a demo key
    const isDemoKey = this.apiKey.toLowerCase().includes('test') || 
                     this.apiKey.toLowerCase().includes('demo') ||
                     this.apiKey.toLowerCase().includes('sandbox') ||
                     this.apiKey === 'demo' ||
                     this.apiKey.length < 50; // Demo keys are usually shorter
    
    if (isDemoKey || process.env.NODE_ENV === 'development') {
      this.baseUrl = 'https://apitest.myfatoorah.com/v2/';
      this.testMode = true;
      // Use demo API key for testing
      this.apiKey = 'rLtt6JWvbUHDDhsZnfpAhpYk4dxYDQkbcPTyGaKp2TYqQgG7FGZ5Th_WD53Oq8Ebz6A53njUoo1w3pjU1D4vs_ZMqFiz_j0urb_BH9Oq9VZoKFoJEDAbRZepGcQanImyYrry7Kt6MnMdgfG5jn4HngWoRdKduNNyP4kzcp3mRv7x00ahkm9LAK7ZRieg7k1PDAnBIOG3EyVSJ5kK4WLMvYr7sCwHbHcu4A5WwelxYK0GMJy37bNAarSJDFQsJ2ZvJjvMDmfWwDVFEVe_5tOomfVNt6bOg9mexbGjMrnHBnKnZR1vQbBtQieDlQepzTZMuQrSuKn-t5XZM7V6fCW7oP-uXGX-sMOajeX65JOf6XVpk29DP6ro8WTAflCDANC193yof8-f5_EYY-3hXhJj7RBXmizDpneEQDSaSz5sFk0sV5qPcARJ9zGG73vuGFyenjPPmtDtXtpx35A-BVcOSBYVIWe9kndG3nclfefjKEuZ3m4jL9Gg1h2JBvmXSMYiZtp9MR5I6pvbvylU_PP5xJFSjVTIz7IQSjcVGO41npnwIxRXNRxFOdIUHn0tjQ-7LwvEcTXyPsHXcMD8WtgBh-wxR8aKX7WPSsT1O8d8reb2aR7K3rkV3K82K_0OgawImEpwSvp9MNKynEAJQS6ZHe_J_l77652xwPNxMRTMASk1ZsJL';
      console.log('🧪 Using MyFatoorah Test Environment');
    } else {
      this.baseUrl = 'https://api-sa.myfatoorah.com/v2/';
      this.testMode = false;
      console.log('🏭 Using MyFatoorah Production Environment');
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
      console.error('API Key length:', this.apiKey.length);
      console.error('Base URL:', this.baseUrl);
      console.error('Test Mode:', this.testMode);
      
      if (error.response?.status === 401) {
        throw new Error('مفتاح API غير صحيح - يرجى التحقق من صحة المفتاح');
      }
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