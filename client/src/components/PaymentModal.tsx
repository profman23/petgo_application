import { useState, useEffect } from "react";
import { format, addDays, subDays } from "date-fns";
import { useTranslation, getDirection } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

// Declare lord-icon custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any;
    }
  }
}

interface PaymentModalProps {
  variant: 'income' | 'outgoing';
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  paymentNo?: string;
}

export function PaymentModal({ variant, isOpen, onOpenChange, paymentNo }: PaymentModalProps) {
  const { language } = useTranslation();
  
  // Posting Date state
  const [postingDate, setPostingDate] = useState('');
  
  // Initialize posting date when modal opens
  useEffect(() => {
    if (isOpen) {
      setPostingDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [isOpen]);
  
  // Handle posting date changes and shortcuts
  const handlePostingDateChange = (value: string) => {
    // Check for shortcut patterns like +3, -2, etc.
    const shortcutMatch = value.match(/^([+-])(\d+)$/);
    
    if (shortcutMatch) {
      const [, operator, days] = shortcutMatch;
      const today = new Date();
      const targetDate = operator === '+' 
        ? addDays(today, parseInt(days))
        : subDays(today, parseInt(days));
      
      setPostingDate(format(targetDate, 'yyyy-MM-dd'));
    } else {
      // Allow clearing and regular date input
      setPostingDate(value);
    }
  };
  
  // Handle key input for shortcuts
  const handlePostingDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    
    // If user starts typing + or -, clear the field first
    if ((e.key === '+' || e.key === '-') && value) {
      setPostingDate('');
    }
    
    if (e.key === 'Enter') {
      handlePostingDateChange(e.currentTarget.value);
    }
  };
  
  const [businessPartnerType, setBusinessPartnerType] = useState('customer');
  const [paymentMethods, setPaymentMethods] = useState({
    cash: { checked: false, amount: 0 },
    card: { checked: false, amount: 0 },
    bank: { checked: false, amount: 0 }
  });

  const handlePaymentMethodChange = (method: string, field: 'checked' | 'amount', value: boolean | number) => {
    setPaymentMethods(prev => ({
      ...prev,
      [method]: {
        ...prev[method as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const calculateTotal = () => {
    return Object.values(paymentMethods).reduce((total, method) => {
      return total + (method.checked ? method.amount : 0);
    }, 0);
  };

  // Variant configuration
  const config = {
    income: {
      title: language === 'ar' ? 'الدفع الوارد' : 'Income Payment',
      paymentNo: paymentNo || 'IPN001',
      paymentNoLabel: language === 'ar' ? 'رقم الدفع الوارد:' : 'Income Payment No.:',
      createButton: language === 'ar' ? 'إنشاء دفع وارد' : 'Create Income Payment',
      footerLabel: language === 'ar' ? 'دفع وارد' : 'Income Payment',
      footerIcon: ArrowDownLeft,
      iconColor: 'text-green-600'
    },
    outgoing: {
      title: language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment',
      paymentNo: paymentNo || 'OPN001',
      paymentNoLabel: language === 'ar' ? 'رقم الدفع الصادر:' : 'Outgoing Payment No.:',
      createButton: language === 'ar' ? 'إنشاء دفع صادر' : 'Create Outgoing Payment',
      footerLabel: language === 'ar' ? 'دفع صادر' : 'Outgoing Payment',
      footerIcon: ArrowUpRight,
      iconColor: 'text-red-600'
    }
  };

  const currentConfig = config[variant];
  const FooterIcon = currentConfig.footerIcon;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {currentConfig.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {language === 'ar' ? `نموذج إنشاء ${currentConfig.title.toLowerCase()} جديد` : `Form to create a new ${currentConfig.title.toLowerCase()}`}
          </DialogDescription>
          {/* Top Row - Title on Left */}
          <div className="mb-6" dir="ltr">
            {/* Title and Customer/Posting Info */}
            <div className="space-y-4" dir={getDirection(language)}>
              <div className="flex items-center gap-4">
                <lord-icon 
                  src="https://cdn.lordicon.com/uemybdyy.json" 
                  trigger="hover" 
                  colors="primary:#852085,secondary:#848484" 
                  style={{ width: '80px', height: '80px' }}>
                </lord-icon>
                <h1 className="text-2xl font-bold text-gray-600" style={{ fontFamily: 'Arimo' }}>
                  {currentConfig.title}
                </h1>
              </div>
              
              {/* Business Partner Selection and Payment No. Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Select Business Partner Master Data */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'تحديد بيانات شريك العمل الرئيسية:' : 'Select Business Partner Master Data:'}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="businessPartnerType" 
                        value="customer" 
                        checked={businessPartnerType === 'customer'}
                        onChange={(e) => setBusinessPartnerType(e.target.value)}
                        className="text-purple-600 focus:ring-purple-500"
                        data-testid="radio-partner-customer"
                      />
                      <span className="text-sm text-gray-700">
                        {language === 'ar' ? 'عميل' : 'Customer'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="businessPartnerType" 
                        value="supplier" 
                        checked={businessPartnerType === 'supplier'}
                        onChange={(e) => setBusinessPartnerType(e.target.value)}
                        className="text-purple-600 focus:ring-purple-500"
                        data-testid="radio-partner-supplier"
                      />
                      <span className="text-sm text-gray-700">
                        {language === 'ar' ? 'مورد' : 'Supplier'}
                      </span>
                    </label>
                  </div>
                </div>
                
                {/* Right: Payment No. */}
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    {currentConfig.paymentNoLabel}
                  </label>
                  <input 
                    type="text" 
                    className="w-[170px] px-2 input-compact-20 border border-gray-300 bg-gray-100 cursor-not-allowed"
                    disabled
                    value={currentConfig.paymentNo}
                    data-testid="input-payment-no"
                  />
                </div>
              </div>
              
              {/* Customer/Supplier Details Section */}
              <div className="space-y-4">
                {/* Customer Phone - Horizontal Layout */}
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {businessPartnerType === 'supplier' 
                      ? (language === 'ar' ? 'هاتف المورد:' : 'Supplier Phone:') 
                      : (language === 'ar' ? 'هاتف العميل:' : 'Customer Phone:')}
                  </label>
                  <input 
                    type="text" 
                    className="w-[170px] px-2 input-compact-20 border border-gray-300"
                    data-testid="input-partner-phone"
                    placeholder={businessPartnerType === 'supplier' 
                      ? (language === 'ar' ? 'أدخل هاتف المورد' : 'Enter supplier phone') 
                      : (language === 'ar' ? 'أدخل هاتف العميل' : 'Enter customer phone')}
                  />
                </div>
                
                {/* Customer Name and Posting Date - Side by Side Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Customer Name */}
                  <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                      {businessPartnerType === 'supplier' 
                        ? (language === 'ar' ? 'اسم المورد:' : 'Supplier Name:') 
                        : (language === 'ar' ? 'اسم العميل:' : 'Customer Name:')}
                    </label>
                    <input 
                      type="text" 
                      className="w-[170px] px-2 input-compact-20 border border-gray-300"
                      data-testid="input-partner-name"
                      placeholder={businessPartnerType === 'supplier' 
                        ? (language === 'ar' ? 'أدخل اسم المورد' : 'Enter supplier name') 
                        : (language === 'ar' ? 'أدخل اسم العميل' : 'Enter customer name')}
                    />
                  </div>
                  
                  {/* Right: Posting Date */}
                  <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                      {language === 'ar' ? 'تاريخ الترحيل:' : 'Posting Date:'}
                    </label>
                    <input 
                      type="text" 
                      className="w-[170px] px-2 input-compact-20 border border-gray-300"
                      value={postingDate}
                      onChange={(e) => handlePostingDateChange(e.target.value)}
                      onKeyDown={handlePostingDateKeyDown}
                      placeholder={language === 'ar' ? 'تاريخ أو +3، -2' : 'Date or +3, -2'}
                      data-testid="input-posting-date"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Method Section */}
          <div>
            <div dir={getDirection(language)}>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
              </label>
              
              <div className="space-y-4">
                {/* Cash Option */}
                <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className="flex items-center min-w-[120px]">
                    <input 
                      type="checkbox" 
                      name="paymentMethod" 
                      value="cash"
                      checked={paymentMethods.cash.checked}
                      onChange={(e) => handlePaymentMethodChange('cash', 'checked', e.target.checked)}
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      {language === 'ar' ? 'نقدي' : 'Cash'}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'المبلغ:' : 'Amount:'}
                    </label>
                    <input 
                      type="number" 
                      className="w-[170px] px-2 input-compact-20 border border-gray-300"
                      placeholder={language === 'ar' ? 'المبلغ' : 'Amount'}
                      value={paymentMethods.cash.amount || ''}
                      onChange={(e) => handlePaymentMethodChange('cash', 'amount', parseFloat(e.target.value) || 0)}
                      disabled={!paymentMethods.cash.checked}
                    />
                  </div>
                </div>
                
                {/* Card Option */}
                <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className="flex items-center min-w-[120px]">
                    <input 
                      type="checkbox" 
                      name="paymentMethod" 
                      value="card"
                      checked={paymentMethods.card.checked}
                      onChange={(e) => handlePaymentMethodChange('card', 'checked', e.target.checked)}
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      {language === 'ar' ? 'بطاقة' : 'Card'}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'المبلغ:' : 'Amount:'}
                    </label>
                    <input 
                      type="number" 
                      className="w-[170px] px-2 input-compact-20 border border-gray-300"
                      placeholder={language === 'ar' ? 'المبلغ' : 'Amount'}
                      value={paymentMethods.card.amount || ''}
                      onChange={(e) => handlePaymentMethodChange('card', 'amount', parseFloat(e.target.value) || 0)}
                      disabled={!paymentMethods.card.checked}
                    />
                  </div>
                </div>
                
                {/* Bank Transfer Option */}
                <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className="flex items-center min-w-[120px]">
                    <input 
                      type="checkbox" 
                      name="paymentMethod" 
                      value="bank"
                      checked={paymentMethods.bank.checked}
                      onChange={(e) => handlePaymentMethodChange('bank', 'checked', e.target.checked)}
                      className="mr-2 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      {language === 'ar' ? 'تحويل مصرفي' : 'Bank Transfer'}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'المبلغ:' : 'Amount:'}
                    </label>
                    <input 
                      type="number" 
                      className="w-[170px] px-2 input-compact-20 border border-gray-300"
                      placeholder={language === 'ar' ? 'المبلغ' : 'Amount'}
                      value={paymentMethods.bank.amount || ''}
                      onChange={(e) => handlePaymentMethodChange('bank', 'amount', parseFloat(e.target.value) || 0)}
                      disabled={!paymentMethods.bank.checked}
                    />
                  </div>
                </div>
                
                {/* Total Amount */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <label className="flex items-center min-w-[120px] font-semibold">
                      <span className="text-sm text-gray-800">
                        {language === 'ar' ? 'المبلغ الإجمالي:' : 'Total Amount:'}
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        className="w-[170px] px-2 input-compact-20 border border-gray-300 bg-gray-50 font-semibold"
                        placeholder={language === 'ar' ? 'الإجمالي' : 'Total'}
                        value={calculateTotal()}
                        readOnly
                        data-testid="input-total-amount"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Description Section - Moved below Payment Method */}
          <div>
            <div dir={getDirection(language)}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'الوصف' : 'Description'}
              </label>
              <textarea 
                className="description-field border border-gray-300"
                placeholder={language === 'ar' ? 'أدخل الوصف' : 'Enter description'}
              />
            </div>
          </div>
          
          {/* Footer with Payment Icon */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className={`flex items-center gap-2 ${currentConfig.iconColor}`}>
              <FooterIcon className="h-5 w-5" />
              <span className="text-sm font-medium">
                {currentConfig.footerLabel}
              </span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
              >
                {currentConfig.createButton}
              </button>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}