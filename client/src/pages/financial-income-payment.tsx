import { useState, useEffect, useRef } from "react";
import { format, addDays, subDays } from "date-fns";
import { useLocation } from "wouter";
import { useTranslation, getDirection } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DollarSign, FilePlus, ArrowDownLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";

// Declare lord-icon custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any;
    }
  }
}

export default function FinancialIncomePayment() {
  const [location, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  
  // Posting Date state
  const [postingDate, setPostingDate] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Initialize posting date when modal opens
  useEffect(() => {
    if (isCreateModalOpen) {
      setPostingDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [isCreateModalOpen]);
  
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
  
  // Lord-icon animation trigger state
  const [triggerAnimation, setTriggerAnimation] = useState("hover");

  // Effect to trigger lord-icon animation every 1.5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setTriggerAnimation("loop");
      // Reset to hover after a brief moment
      setTimeout(() => setTriggerAnimation("hover"), 1000);
    }, 90000); // 90 seconds = 1.5 minutes

    return () => clearInterval(interval);
  }, []);

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation]);

  return (
    <AdminLayout>
      <div className="flex-1 relative">
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            {/* Left side - Lord Icon and Title */}
            <div className="flex items-center gap-4">
              {/* Lord Icon */}
              <div className="flex-shrink-0">
                <lord-icon 
                  src="https://cdn.lordicon.com/uemybdyy.json" 
                  trigger={triggerAnimation}
                  colors="primary:#852085,secondary:#848484" 
                  style={{ width: '80px', height: '80px' }}
                />
              </div>
              
              {/* Income Payment Title */}
              <h1 className="text-2xl font-bold text-gray-600" style={{fontFamily: 'Arimo'}}>
                {language === 'ar' ? 'الدفع الوارد' : 'Income Payment'}
              </h1>
            </div>

            {/* Create Income Payment Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
              data-testid="button-create-income-payment"
            >
              <FilePlus className="h-4 w-4" style={{ color: '#852085' }} />
              {language === 'ar' ? 'إنشاء دفع وارد' : 'Create Income Payment'}
            </button>
          </div>

        </div>

        {/* Create Income Payment Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="sr-only">
                {language === 'ar' ? 'إنشاء دفع وارد' : 'Create Income Payment'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {language === 'ar' ? 'نموذج إنشاء دفع وارد جديد' : 'Form to create a new income payment'}
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
                      {language === 'ar' ? 'الدفع الوارد' : 'Income Payment'}
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
                    
                    {/* Right: Income Payment No. */}
                    <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {language === 'ar' ? 'رقم الدفع الوارد:' : 'Income Payment No.:'}
                      </label>
                      <input 
                        type="text" 
                        className="w-[170px] px-2 input-compact-20 border border-gray-300 bg-gray-100 cursor-not-allowed"
                        disabled
                        value="IPN001"
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
                    
                    {/* Customer Name - Horizontal Layout */}
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
                    
                    {/* Posting Date - Horizontal Layout */}
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
              
              {/* Referenced Documents Section */}
              <div className="mb-6">
                <div dir={getDirection(language)}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'المستندات المرجعية' : 'Referenced Documents'}
                  </label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={3}
                    placeholder={language === 'ar' ? 'أدخل المستندات المرجعية' : 'Enter referenced documents'}
                    data-testid="textarea-referenced-docs"
                  />
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
                <div className="flex items-center gap-2 text-green-600">
                  <ArrowDownLeft className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {language === 'ar' ? 'دفع وارد' : 'Income Payment'}
                  </span>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
                  >
                    {language === 'ar' ? 'إنشاء دفع وارد' : 'Create Income Payment'}
                  </button>
                </div>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}