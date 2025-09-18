import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { format, addDays, subDays } from "date-fns";
import { useTranslation, getDirection } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowUpRight, ArrowDownLeft, Search, User } from "lucide-react";
import { ConfirmExitDialog } from "@/components/ui/confirm-exit-dialog";
import { useQuery } from "@tanstack/react-query";

// Customer interface for search results
interface Customer {
  id: number;
  name: string;
  phone: string;
}

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
  
  // Initialize posting date and capture initial state only once per modal open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      // Modal is opening for the first time
      const defaultDate = format(new Date(), 'yyyy-MM-dd');
      setPostingDate(defaultDate);
      
      // Reset validation states when opening
      setValidationErrors({
        customerId: false,
        postingDate: false,
        paymentMethod: false
      });
      setShowValidationErrors(false);
      
      // Set initial state with the default date to avoid race condition
      initialStateRef.current = {
        businessPartnerType,
        customerSearchQuery,
        customerPhone,
        customerName,
        postingDate: defaultDate,
        transactionType,
        documentNo,
        paymentMethods: {
          cash: { ...paymentMethods.cash },
          card: { ...paymentMethods.card },
          bank: { ...paymentMethods.bank }
        }
      };
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);
  
  // Normalize posting date shortcuts to actual dates
  const normalizePostingDate = useCallback((value: string) => {
    // Check for shortcut patterns like +3, -2, etc.
    const shortcutMatch = value.match(/^([+-])(\d+)$/);
    
    if (shortcutMatch) {
      const [, operator, days] = shortcutMatch;
      const today = new Date();
      const targetDate = operator === '+' 
        ? addDays(today, parseInt(days))
        : subDays(today, parseInt(days));
      
      return format(targetDate, 'yyyy-MM-dd');
    }
    
    return value;
  }, []);
  
  // Handle posting date changes and shortcuts
  const handlePostingDateChange = (value: string) => {
    setPostingDate(value);
    
    // Real-time validation when errors are being shown
    if (showValidationErrors) {
      setValidationErrors(prev => ({
        ...prev,
        postingDate: !value.trim()
      }));
    }
  };
  
  // Handle posting date blur to normalize shortcuts
  const handlePostingDateBlur = () => {
    const normalizedDate = normalizePostingDate(postingDate);
    if (normalizedDate !== postingDate) {
      setPostingDate(normalizedDate);
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
  
  // Customer ID search state
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);

  const [finalSearchQuery, setFinalSearchQuery] = useState('');
  
  // Reference Information Document state
  const [transactionType, setTransactionType] = useState('');
  const [documentNo, setDocumentNo] = useState('');
  
  // Unsaved changes tracking
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [pendingExit, setPendingExit] = useState<() => void>(() => {});
  
  // Track modal open state to initialize only once per open
  const wasOpenRef = useRef(false);
  
  // Mandatory field validation states
  const [validationErrors, setValidationErrors] = useState({
    customerId: false,
    postingDate: false,
    paymentMethod: false
  });
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  // Re-evaluate validation errors when businessPartnerType changes
  useEffect(() => {
    if (showValidationErrors) {
      setValidationErrors(prev => ({
        ...prev,
        customerId: businessPartnerType === 'customer' ? !customerSearchQuery.trim() : false
      }));
    }
  }, [businessPartnerType, customerSearchQuery, showValidationErrors]);
  
  // Capture initial state when modal opens
  const initialStateRef = useRef({
    businessPartnerType: 'customer',
    customerSearchQuery: '',
    customerPhone: '',
    customerName: '',
    postingDate: '',
    transactionType: '',
    documentNo: '',
    paymentMethods: {
      cash: { checked: false, amount: 0 },
      card: { checked: false, amount: 0 },
      bank: { checked: false, amount: 0 }
    }
  });

  
  useEffect(() => {
    const timer = setTimeout(() => {
      setFinalSearchQuery(customerSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearchQuery]);

  // Clear customer data when switching to Supplier
  useEffect(() => {
    if (businessPartnerType === 'supplier') {
      setSelectedCustomer(null);
      setCustomerSearchQuery('');
      setCustomerName('');
      setCustomerPhone('');
      setShowCustomerResults(false);
      setSelectedResultIndex(-1);
    }
  }, [businessPartnerType]);

  // Handlers to prevent negative input in payment amount fields
  const disallowNegativeKeys: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    const k = e.key;
    if (k === '-' || k === '+' || k.toLowerCase() === 'e') e.preventDefault();
  };

  const sanitizeNonNegative: React.FormEventHandler<HTMLInputElement> = (e) => {
    const el = e.currentTarget;
    let v = el.value;
    v = v.replace(/[^0-9.]/g, '');          // only digits and dot
    v = v.replace(/(\.*?)\./g, '$1');     // single dot
    if (v !== el.value) {
      const pos = el.selectionStart ?? v.length;
      el.value = v;
      el.setSelectionRange(pos, pos);
    }
  };

  const preventNegativePaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    const t = e.clipboardData.getData('text');
    if (/^-/.test(t) || /[^\d.]/.test(t) || (t.match(/\./g)?.length ?? 0) > 1) e.preventDefault();
  };

  // Check if there are unsaved changes by comparing with initial state
  const hasUnsavedChanges = useCallback(() => {
    const initial = initialStateRef.current;
    return (
      businessPartnerType !== initial.businessPartnerType ||
      customerSearchQuery.trim() !== initial.customerSearchQuery.trim() ||
      customerPhone.trim() !== initial.customerPhone.trim() ||
      customerName.trim() !== initial.customerName.trim() ||
      postingDate !== initial.postingDate ||
      transactionType !== initial.transactionType ||
      documentNo.trim() !== initial.documentNo.trim() ||
      paymentMethods.cash.checked !== initial.paymentMethods.cash.checked ||
      paymentMethods.card.checked !== initial.paymentMethods.card.checked ||
      paymentMethods.bank.checked !== initial.paymentMethods.bank.checked ||
      paymentMethods.cash.amount !== initial.paymentMethods.cash.amount ||
      paymentMethods.card.amount !== initial.paymentMethods.card.amount ||
      paymentMethods.bank.amount !== initial.paymentMethods.bank.amount
    );
  }, [businessPartnerType, customerSearchQuery, customerPhone, customerName, postingDate, transactionType, documentNo, paymentMethods]);

  // Handle exit with unsaved changes check
  
  // Real-time validation for customer search
  const handleCustomerSearchChangeWithValidation = (value: string) => {
    handleCustomerSearchChange(value);
    
    // Real-time validation when errors are being shown
    if (showValidationErrors && businessPartnerType === 'customer') {
      setValidationErrors(prev => ({
        ...prev,
        customerId: !value.trim()
      }));
    }
  };
  
  // Real-time validation for payment methods
  const handlePaymentMethodChangeWithValidation = (method: 'cash' | 'card' | 'bank', field: 'checked' | 'amount', value: boolean | number) => {
    handlePaymentMethodChange(method, field, value);
    
    // Real-time validation when errors are being shown
    if (showValidationErrors) {
      // Get updated payment methods state
      const updatedMethods = {
        ...paymentMethods,
        [method]: {
          ...paymentMethods[method],
          [field]: value
        }
      };
      
      const hasValidPaymentMethod = 
        (updatedMethods.cash.checked && updatedMethods.cash.amount > 0) ||
        (updatedMethods.card.checked && updatedMethods.card.amount > 0) ||
        (updatedMethods.bank.checked && updatedMethods.bank.amount > 0);
      
      setValidationErrors(prev => ({
        ...prev,
        paymentMethod: !hasValidPaymentMethod
      }));
    }
  };
  
  // Handle Save button click
  const handleSave = useCallback(() => {
    // Normalize posting date before validation
    const normalizedDate = normalizePostingDate(postingDate);
    if (normalizedDate !== postingDate) {
      setPostingDate(normalizedDate);
    }
    
    setShowValidationErrors(true);
    
    // Update validation state to use normalized date and run validation
    const tempValidationState = {
      businessPartnerType,
      customerSearchQuery,
      postingDate: normalizedDate,
      paymentMethods
    };
    
    const errors = {
      customerId: tempValidationState.businessPartnerType === 'customer' ? !tempValidationState.customerSearchQuery.trim() : false,
      postingDate: !tempValidationState.postingDate.trim(),
      paymentMethod: !(
        (tempValidationState.paymentMethods.cash.checked && tempValidationState.paymentMethods.cash.amount > 0) ||
        (tempValidationState.paymentMethods.card.checked && tempValidationState.paymentMethods.card.amount > 0) ||
        (tempValidationState.paymentMethods.bank.checked && tempValidationState.paymentMethods.bank.amount > 0)
      )
    };
    
    setValidationErrors(errors);
    
    if (!Object.values(errors).some(hasError => hasError)) {
      // TODO: Implement actual save logic here
      console.log('Save payment:', {
        businessPartnerType,
        customerSearchQuery,
        customerPhone,
        customerName,
        postingDate: normalizedDate,
        transactionType,
        documentNo,
        paymentMethods
      });
      
      // Close modal after successful save
      onOpenChange(false);
    }
  }, [normalizePostingDate, postingDate, businessPartnerType, customerSearchQuery, customerPhone, customerName, transactionType, documentNo, paymentMethods, onOpenChange]);
  
  const handleExit = useCallback((exitCallback: () => void) => {
    if (hasUnsavedChanges()) {
      setPendingExit(() => exitCallback);
      setShowConfirmExit(true);
    } else {
      exitCallback();
    }
  }, [hasUnsavedChanges]);

  // Confirm exit without saving
  const confirmExit = useCallback(() => {
    setShowConfirmExit(false);
    pendingExit();
    setPendingExit(() => {}); // Reset to prevent accidental reuse
  }, [pendingExit]);

  // Cancel exit
  const cancelExit = useCallback(() => {
    setShowConfirmExit(false);
    setPendingExit(() => {});
  }, []);

  // Search customers query using default fetcher pattern - only for customers, not suppliers
  const { data: searchResults = [], isLoading: isSearching, error: searchError } = useQuery<Customer[]>({
    queryKey: [`/api/admin/customers/search?q=${encodeURIComponent(finalSearchQuery)}`],
    enabled: finalSearchQuery.length >= 2 && businessPartnerType === 'customer', // Only search when we have at least 2 characters and it's for customers
    staleTime: 30000, // Cache for 30 seconds
  });

  // Handle customer selection
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery(customer.id.toString()); // Only show the ID number
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || '');
    setShowCustomerResults(false);
    setSelectedResultIndex(-1);
  };

  // Handle customer search input changes
  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearchQuery(value);
    setShowCustomerResults(value.length >= 2 && businessPartnerType === 'customer'); // Only show results for customers
    setSelectedResultIndex(-1);
    // Clear selection if user starts typing again
    if (selectedCustomer && value !== selectedCustomer.id.toString()) {
      setSelectedCustomer(null);
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  // Handle keyboard navigation in search results
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showCustomerResults || !searchResults.length) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedResultIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedResultIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedResultIndex >= 0 && searchResults[selectedResultIndex]) {
          handleCustomerSelect(searchResults[selectedResultIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowCustomerResults(false);
        setSelectedResultIndex(-1);
        break;
    }
  };

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
      paymentNo: paymentNo || 'IPN9000001',
      paymentNoLabel: language === 'ar' ? 'رقم الدفع الوارد:' : 'Income Payment No.:',
      createButton: language === 'ar' ? 'إنشاء دفع وارد' : 'Create Income Payment',
      footerLabel: language === 'ar' ? 'دفع وارد' : 'Income Payment',
      footerIcon: ArrowDownLeft,
      iconColor: 'text-green-600'
    },
    outgoing: {
      title: language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment',
      paymentNo: paymentNo || 'OPN9000001',
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
    <>
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleExit(() => onOpenChange(false));
      }
    }}>
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
              
              {/* Business Partner Selection */}
              <div className="mb-4">
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
              </div>

              {/* Customer/Supplier Details Section - New Layout */}
              <div className="space-y-4">
                {/* Row 0: Customer ID Search Field */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Customer ID Search */}
                  <div className={`flex items-center gap-3 relative ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                      {businessPartnerType === 'supplier' 
                        ? (language === 'ar' ? 'معرف المورد:' : 'Supplier ID:') 
                        : (language === 'ar' ? 'معرف العميل:' : 'Customer ID:')}
                    </label>
                    <div className="relative w-[170px]">
                      <input 
                        type="text" 
                        className={`w-full px-2 input-compact-20 border pr-8 ${
                          showValidationErrors && validationErrors.customerId 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                        value={customerSearchQuery}
                        onChange={(e) => handleCustomerSearchChangeWithValidation(e.target.value)}
                        placeholder={businessPartnerType === 'supplier' 
                          ? (language === 'ar' ? 'معرف المورد' : 'Supplier ID') 
                          : (language === 'ar' ? 'ابحث عن عميل...' : 'Search customer...')}
                        data-testid="input-customer-search"
                        disabled={businessPartnerType === 'supplier'}
                        onFocus={() => customerSearchQuery.length >= 2 && businessPartnerType === 'customer' && setShowCustomerResults(true)}
                        onKeyDown={handleSearchKeyDown}
                      />
                      <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      
                      {/* Search Results Dropdown - only show for customers */}
                      {showCustomerResults && customerSearchQuery.length >= 2 && businessPartnerType === 'customer' && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {isSearching ? (
                            <div className="p-3 text-center text-gray-500">
                              {language === 'ar' ? 'جاري البحث...' : 'Searching...'}
                            </div>
                          ) : searchError ? (
                            <div className="p-3 text-center text-red-500">
                              {language === 'ar' ? 'خطأ في البحث' : 'Search error'}
                            </div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map((customer, index: number) => (
                              <div
                                key={customer.id}
                                className={`p-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                  index === selectedResultIndex 
                                    ? 'bg-blue-50 border-blue-200' 
                                    : 'hover:bg-gray-100'
                                }`}
                                onClick={() => handleCustomerSelect(customer)}
                                data-testid={`customer-result-${customer.id}`}
                              >
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {customer.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ID: {customer.id} • {customer.phone || 'No phone'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-center text-gray-500">
                              {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Customer/Supplier ID Error Message */}
                      {showValidationErrors && validationErrors.customerId && (
                        <div className="absolute top-full left-0 mt-1 text-xs text-red-600" data-testid="error-customer-id">
                          {businessPartnerType === 'supplier' 
                            ? (language === 'ar' ? 'معرف المورد مطلوب' : 'Supplier ID is required')
                            : (language === 'ar' ? 'معرف العميل مطلوب' : 'Customer ID is required')
                          }
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right: Empty space to maintain layout balance */}
                  <div></div>
                </div>
                
                {/* Row 1: Customer Phone ↔ Payment No */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Customer Phone */}
                  <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                      {businessPartnerType === 'supplier' 
                        ? (language === 'ar' ? 'هاتف المورد:' : 'Supplier Phone:') 
                        : (language === 'ar' ? 'هاتف العميل:' : 'Customer Phone:')}
                    </label>
                    <input 
                      type="text" 
                      className={`w-[170px] px-2 input-compact-20 border border-gray-300 ${
                        selectedCustomer ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                      }`}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      disabled={selectedCustomer !== null}
                      data-testid="input-partner-phone"
                      placeholder={businessPartnerType === 'supplier' 
                        ? (language === 'ar' ? 'أدخل هاتف المورد' : 'Enter supplier phone') 
                        : (language === 'ar' ? 'أدخل هاتف العميل' : 'Enter customer phone')}
                    />
                  </div>
                  
                  {/* Right: Payment No */}
                  <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                      {currentConfig.paymentNoLabel}
                    </label>
                    <input 
                      type="text" 
                      className="w-[170px] px-2 input-compact-20 border border-gray-300 bg-gray-100 cursor-not-allowed"
                      disabled
                      value={currentConfig.paymentNo}
                      data-testid="input-payment-no"
                      style={variant === 'income' ? { marginLeft: '13px' } : undefined}
                    />
                  </div>
                </div>
                
                {/* Row 2: Customer Name ↔ Posting Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ borderBottomWidth: '2px', paddingBottom: '10px' }}>
                  {/* Left: Customer Name */}
                  <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                      {businessPartnerType === 'supplier' 
                        ? (language === 'ar' ? 'اسم المورد:' : 'Supplier Name:') 
                        : (language === 'ar' ? 'اسم العميل:' : 'Customer Name:')}
                    </label>
                    <input 
                      type="text" 
                      className={`w-[170px] px-2 input-compact-20 border border-gray-300 ${
                        selectedCustomer ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                      }`}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={selectedCustomer !== null}
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
                    <div className="relative">
                      <input 
                        type="text" 
                        className={`w-[170px] px-2 input-compact-20 border ${
                          showValidationErrors && validationErrors.postingDate 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                        value={postingDate}
                        onChange={(e) => handlePostingDateChange(e.target.value)}
                        onBlur={handlePostingDateBlur}
                        onKeyDown={handlePostingDateKeyDown}
                        placeholder={language === 'ar' ? 'تاريخ أو +3، -2' : 'Date or +3, -2'}
                        data-testid="input-posting-date"
                        style={{ marginLeft: '29px' }}
                      />
                      
                      {/* Posting Date Error Message */}
                      {showValidationErrors && validationErrors.postingDate && (
                        <div className="absolute top-full left-0 mt-1 text-xs text-red-600" data-testid="error-posting-date">
                          {language === 'ar' ? 'تاريخ الترحيل مطلوب' : 'Posting Date is required'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Reference Information Document Section */}
          <div className="space-y-4" dir="ltr">
            <h3 className="text-lg font-medium text-gray-700">
              {language === 'ar' ? 'وثيقة المعلومات المرجعية:' : 'Reference Information Document:'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Transaction Type */}
              <div className="flex items-center gap-3 flex-row">
                <label className="text-sm font-medium text-gray-700 min-w-[120px] text-left">
                  {language === 'ar' ? 'نوع المعاملة:' : 'Transaction Type:'}
                </label>
                <select 
                  className="w-[170px] px-2 input-compact-20 border border-gray-300"
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  data-testid="select-transaction-type"
                >
                  <option value="">{language === 'ar' ? 'اختر النوع' : 'Select Type'}</option>
                  <option value="ar-credit-note">A/R Credit Note</option>
                  <option value="ar-invoice">A/R Invoice</option>
                </select>
              </div>
              
              {/* Right: Document No */}
              <div className="flex items-center gap-3 flex-row">
                <label className="text-sm font-medium text-gray-700 min-w-[120px] text-left">
                  {language === 'ar' ? 'رقم الوثيقة:' : 'Document No:'}
                </label>
                <input 
                  type="text" 
                  className="w-[170px] px-2 input-compact-20 border border-gray-300"
                  value={documentNo}
                  onChange={(e) => setDocumentNo(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث عن الوثيقة' : 'Search document'}
                  data-testid="input-document-no"
                />
              </div>
            </div>
          </div>
          
          {/* Spacer above Payment Method */}
          <div className="h-[200px]" data-testid="spacer-above-payment-method" />
          
          {/* Payment Method Section */}
          <div style={{ marginTop: '200px' }}>
            <div dir={getDirection(language)}>
              <label className={`block text-sm font-medium mb-4 ${
                showValidationErrors && validationErrors.paymentMethod 
                  ? 'text-red-600' 
                  : 'text-gray-700'
              }`} style={{ borderTopWidth: '2px', paddingTop: '10px' }}>
                {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                {showValidationErrors && validationErrors.paymentMethod && (
                  <span className="text-red-600 text-xs ml-1">*</span>
                )}
              </label>
              
              <div className="space-y-4">
                {/* Payment Method Error Message */}
                {showValidationErrors && validationErrors.paymentMethod && (
                  <div className="text-xs text-red-600 mb-2" data-testid="error-payment-method">
                    {language === 'ar' ? 'يجب تحديد طريقة دفع واحدة على الأقل بمبلغ أكبر من الصفر' : 'At least one payment method must be selected with amount greater than zero'}
                  </div>
                )}
                
                {/* Cash Option */}
                <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className="flex items-center min-w-[120px]">
                    <input 
                      type="checkbox" 
                      name="paymentMethod" 
                      value="cash"
                      checked={paymentMethods.cash.checked}
                      onChange={(e) => handlePaymentMethodChangeWithValidation('cash', 'checked', e.target.checked)}
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
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      className="w-[170px] px-2 input-compact-20 border border-gray-300"
                      placeholder={language === 'ar' ? 'المبلغ' : 'Amount'}
                      value={paymentMethods.cash.amount || ''}
                      onChange={(e) => handlePaymentMethodChangeWithValidation('cash', 'amount', parseFloat(e.currentTarget.value) || 0)}
                      onKeyDown={disallowNegativeKeys}
                      onInput={sanitizeNonNegative}
                      onPaste={preventNegativePaste}
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
                      onChange={(e) => handlePaymentMethodChangeWithValidation('card', 'checked', e.target.checked)}
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
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      className="w-[170px] px-2 input-compact-20 border border-gray-300"
                      placeholder={language === 'ar' ? 'المبلغ' : 'Amount'}
                      value={paymentMethods.card.amount || ''}
                      onChange={(e) => handlePaymentMethodChangeWithValidation('card', 'amount', parseFloat(e.currentTarget.value) || 0)}
                      onKeyDown={disallowNegativeKeys}
                      onInput={sanitizeNonNegative}
                      onPaste={preventNegativePaste}
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
                      onChange={(e) => handlePaymentMethodChangeWithValidation('bank', 'checked', e.target.checked)}
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
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      className="w-[170px] px-2 input-compact-20 border border-gray-300"
                      placeholder={language === 'ar' ? 'المبلغ' : 'Amount'}
                      value={paymentMethods.bank.amount || ''}
                      onChange={(e) => handlePaymentMethodChangeWithValidation('bank', 'amount', parseFloat(e.currentTarget.value) || 0)}
                      onKeyDown={disallowNegativeKeys}
                      onInput={sanitizeNonNegative}
                      onPaste={preventNegativePaste}
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
                onClick={() => handleExit(() => onOpenChange(false))}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                data-testid="button-cancel"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
                data-testid="button-save"
              >
                {currentConfig.createButton}
              </button>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
    
    {/* Confirm Exit Dialog */}
    <ConfirmExitDialog
      isOpen={showConfirmExit}
      onCancel={cancelExit}
      onConfirm={confirmExit}
      language={language}
    />
    </>
  );
}