import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { useTranslation, getDirection } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { User, Plus, Trash2, FilePlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { InvoiceSelectionModal } from "./InvoiceSelectionModal";

// Declare lord-icon custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any;
    }
  }
}

// Customer interface for search results
interface Customer {
  id: number;
  name: string;
  phone: string;
}

// Credit Note Item interface
interface CreditNoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalBeforeVAT: number;
  vat: number;
  totalAfterVAT: number;
}

interface CreditNoteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditNoteModal({ isOpen, onOpenChange }: CreditNoteModalProps) {
  const { language } = useTranslation();
  
  // Helper function to handle relative date input
  const parseRelativeDate = (input: string) => {
    if (!input) return '';
    
    // Check if it's a relative value (+2, -3, etc.)
    const relativeMatch = input.match(/^([+-]?\d+)$/);
    if (relativeMatch) {
      const days = parseInt(relativeMatch[1]);
      const resultDate = addDays(new Date(), days);
      return format(resultDate, 'yyyy-MM-dd');
    }
    
    // Return as-is for regular date inputs
    return input;
  };
  
  // Auto-generate Credit Note Number
  const { data: nextCreditNoteNumber } = useQuery<string>({
    queryKey: ['/api/admin/credit-notes/next-number'],
    enabled: isOpen,
  });

  // State for customer information
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [postingDate, setPostingDate] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'content' | 'attachment'>('content');
  
  // Invoice Selection Modal state
  const [showInvoiceSelectionModal, setShowInvoiceSelectionModal] = useState(false);
  
  // Customer Selection Modal state
  const [showCustomerSelectionModal, setShowCustomerSelectionModal] = useState(false);
  
  // Admin token for API calls
  const adminToken = localStorage.getItem('adminToken');
  
  // Payment Methods state
  const [paymentMethods, setPaymentMethods] = useState({
    cash: { checked: false, amount: 0 },
    card: { checked: false, amount: 0 },
    bank: { checked: false, amount: 0 }
  });
  
  // Credit Note Items state
  const [items, setItems] = useState<CreditNoteItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalBeforeVAT: 0,
      vat: 0,
      totalAfterVAT: 0
    }
  ]);

  // Customer search query
  const { data: customerSearchResults = [] } = useQuery<Customer[]>({
    queryKey: ['/api/admin/customers/search', customerSearchQuery],
    enabled: customerSearchQuery.length >= 2 && !selectedCustomer,
  });

  // Initialize posting date when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultDate = format(new Date(), 'yyyy-MM-dd');
      setPostingDate(defaultDate);
      
      // Load lord-icon script (only if not already loaded)
      if (!document.querySelector('script[src="https://cdn.lordicon.com/lordicon.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdn.lordicon.com/lordicon.js';
        document.head.appendChild(script);
      }
      
      // Reset state when opening
      setCustomerSearchQuery('');
      setCustomerPhone('');
      setCustomerName('');
      setSelectedCustomer(null);
      setShowCustomerDropdown(false);
      setActiveTab('content');
      setShowInvoiceSelectionModal(false);
      setPaymentMethods({
        cash: { checked: false, amount: 0 },
        card: { checked: false, amount: 0 },
        bank: { checked: false, amount: 0 }
      });
      setItems([{
        id: '1',
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalBeforeVAT: 0,
        vat: 0,
        totalAfterVAT: 0
      }]);
    }
  }, [isOpen]);

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerSearchQuery(customer.name);
    setShowCustomerDropdown(false);
  };

  // Handle customer search input
  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearchQuery(value);
    if (selectedCustomer) {
      setSelectedCustomer(null);
      setCustomerPhone('');
      setCustomerName('');
    }
    setShowCustomerDropdown(value.length >= 2);
  };

  // Add new item
  const handleAddItem = () => {
    const newItem: CreditNoteItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalBeforeVAT: 0,
      vat: 0,
      totalAfterVAT: 0
    };
    setItems([...items, newItem]);
  };

  // Remove item
  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // Handle Copy From dropdown change
  const handleCopyFromChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === 'ar-invoice') {
      setShowInvoiceSelectionModal(true);
    }
    // Reset the dropdown
    event.target.value = '';
  };

  // Handle invoice selection from the modal
  const handleInvoiceSelected = async (invoice: any) => {
    try {
      // Populate customer information
      setSelectedCustomer({
        id: invoice.bookingId || 0,
        name: invoice.customerName || '',
        phone: invoice.customerPhone || ''
      });
      setCustomerName(invoice.customerName || '');
      setCustomerPhone(invoice.customerPhone || '');
      setCustomerSearchQuery(invoice.customerName || '');

      // If we have a bookingId, fetch the invoice items
      if (invoice.bookingId && adminToken) {
        const response = await fetch(`/api/invoice-items/${invoice.bookingId}`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        
        if (response.ok) {
          const invoiceItems = await response.json();
          
          // Transform invoice items to credit note items format
          const creditNoteItems: CreditNoteItem[] = invoiceItems.map((item: any, index: number) => ({
            id: (Date.now() + index).toString(),
            description: item.description || '',
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            totalBeforeVAT: parseFloat(item.totalBeforeVat) || 0,
            vat: parseFloat(item.vatAmount) || 0,
            totalAfterVAT: parseFloat(item.totalAfterVat) || 0
          }));
          
          // If we have items, replace the current items, otherwise keep the default empty item
          if (creditNoteItems.length > 0) {
            setItems(creditNoteItems);
          }
        } else {
          console.error('Failed to fetch invoice items:', response.statusText);
        }
      }
    } catch (error) {
      console.error('Error processing selected invoice:', error);
    }
  };

  // Handle customer selection from customer modal
  const handleCustomerSelected = (customer: any) => {
    try {
      // Populate customer information
      setSelectedCustomer({
        id: customer.id || 0,
        name: customer.customerName || '',
        phone: customer.customerPhone || ''
      });
      setCustomerName(customer.customerName || '');
      setCustomerPhone(customer.customerPhone || '');
      setCustomerSearchQuery(customer.id?.toString() || '');
    } catch (error) {
      console.error('Error processing selected customer:', error);
    }
  };

  // Update item
  const handleItemChange = (id: string, field: keyof CreditNoteItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate totals when quantity or unit price changes
        if (field === 'quantity' || field === 'unitPrice') {
          const quantity = field === 'quantity' ? Number(value) : updatedItem.quantity;
          const unitPrice = field === 'unitPrice' ? Number(value) : updatedItem.unitPrice;
          
          updatedItem.totalBeforeVAT = quantity * unitPrice;
          updatedItem.vat = updatedItem.totalBeforeVAT * 0.15; // 15% VAT
          updatedItem.totalAfterVAT = updatedItem.totalBeforeVAT + updatedItem.vat;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Calculate totals
  const totals = items.reduce((acc, item) => ({
    totalBeforeVAT: acc.totalBeforeVAT + item.totalBeforeVAT,
    vat: acc.vat + item.vat,
    totalAfterVAT: acc.totalAfterVAT + item.totalAfterVAT
  }), { totalBeforeVAT: 0, vat: 0, totalAfterVAT: 0 });

  // Handle payment method changes
  const handlePaymentMethodChange = (method: 'cash' | 'card' | 'bank', field: 'checked' | 'amount', value: boolean | number) => {
    setPaymentMethods(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        [field]: value
      }
    }));
  };

  // Calculate payment total
  const calculatePaymentTotal = () => {
    return Object.values(paymentMethods).reduce((total, method) => {
      return total + (method.checked ? method.amount : 0);
    }, 0);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Save Credit Note:', {
      creditNoteNo: nextCreditNoteNumber,
      customer: selectedCustomer,
      customerPhone,
      customerName,
      postingDate,
      items,
      totals
    });
    onOpenChange(false);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0">
        <DialogHeader className="p-3 pb-2" dir={getDirection(language)}>
          <div className="flex items-center gap-4">
            {/* Lord Icon */}
            <div className="flex-shrink-0">
              <div 
                dangerouslySetInnerHTML={{
                  __html: '<lord-icon src="https://cdn.lordicon.com/lbrbofig.json" trigger="hover" colors="primary:#852085,secondary:#848484" style="width:80px;height:80px"></lord-icon>'
                }}
              />
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-600" style={{fontFamily: 'Arimo'}}>
              {language === 'ar' ? 'إنشاء إشعار دائن' : 'Create Credit Note'}
            </h1>
          </div>
        </DialogHeader>

        <div className="px-3 pb-3 overflow-y-auto max-h-[75vh]" dir={getDirection(language)}>
          {/* Customer Information Section */}
          <div className="p-2 mb-2 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-medium text-gray-900">
                {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
              </h2>
            </div>

            <div className="space-y-1">
              {/* Row 1: Customer Search and Credit Note No */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'معرف العميل:' : 'Customer ID:'}
                  </label>
                  <div className="relative w-[170px]">
                    <input 
                      type="text" 
                      className="w-full px-2 input-compact-20 border border-gray-300 credit-note-input cursor-pointer"
                      value={customerSearchQuery}
                      onChange={(e) => handleCustomerSearchChange(e.target.value)}
                      onClick={() => setShowCustomerSelectionModal(true)}
                      placeholder={language === 'ar' ? 'بحث عن العميل' : 'Search customer'}
                      data-testid="input-customer-search"
                      readOnly
                    />
                    {showCustomerDropdown && customerSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                        {customerSearchResults.map((customer: Customer) => (
                          <div
                            key={customer.id}
                            className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-gray-600">{customer.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Credit Note No */}
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'رقم مذكرة الائتمان:' : 'Credit Note No.:'}
                  </label>
                  <input 
                    type="text" 
                    className="w-[170px] px-2 input-compact-20 border border-gray-300 bg-gray-100 cursor-not-allowed"
                    disabled
                    value={nextCreditNoteNumber || 'Loading...'}
                    data-testid="input-credit-note-no"
                    style={{ marginLeft: '29px', marginRight: '10px' }}
                  />
                </div>
              </div>

              {/* Row 2: Customer Name and Posting Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'اسم العميل:' : 'Customer Name:'}
                  </label>
                  <input 
                    type="text" 
                    className={`w-[170px] px-2 input-compact-20 border border-gray-300 credit-note-input cursor-pointer ${
                      selectedCustomer ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onClick={() => setShowCustomerSelectionModal(true)}
                    disabled={selectedCustomer !== null}
                    data-testid="input-customer-name"
                    placeholder={language === 'ar' ? 'أدخل اسم العميل' : 'Enter customer name'}
                    readOnly
                  />
                </div>

                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'تاريخ الترحيل:' : 'Posting Date:'}
                  </label>
                  <input 
                    type="text" 
                    className="w-[170px] px-2 input-compact-20 border border-gray-300 credit-note-input"
                    placeholder={language === 'ar' ? '+2 أو -3' : '+2 or -3'}
                    value={postingDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPostingDate(value);
                      // Parse relative dates on blur or when complete
                      if (value.match(/^[+-]?\d+$/)) {
                        const parsedDate = parseRelativeDate(value);
                        if (parsedDate !== value) {
                          setPostingDate(parsedDate);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const parsedDate = parseRelativeDate(e.target.value);
                      setPostingDate(parsedDate);
                    }}
                    data-testid="input-posting-date"
                    style={{ marginLeft: '29px' }}
                  />
                </div>
              </div>

              {/* Row 3: Customer Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2" style={{ borderBottomWidth: '2px', paddingBottom: '4px' }}>
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'هاتف العميل:' : 'Customer Phone:'}
                  </label>
                  <input 
                    type="text" 
                    className={`w-[170px] px-2 input-compact-20 border border-gray-300 credit-note-input ${
                      selectedCustomer ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    disabled={selectedCustomer !== null}
                    data-testid="input-customer-phone"
                    placeholder={language === 'ar' ? 'أدخل هاتف العميل' : 'Enter customer phone'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mb-2">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-4">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`py-1 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'content'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  data-testid="tab-content"
                >
                  {language === 'ar' ? 'المحتوى' : 'Content'}
                </button>
                <button
                  onClick={() => setActiveTab('attachment')}
                  className={`py-1 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'attachment'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  data-testid="tab-attachment"
                >
                  {language === 'ar' ? 'المرفقات' : 'Attachment'}
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'content' && (
            <div className="space-y-2">
              {/* Items Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-2 py-1 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    {language === 'ar' ? 'عناصر مذكرة الائتمان' : 'Credit Note Items'}
                  </h3>
                  <button
                    onClick={handleAddItem}
                    className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 bg-white hover:bg-purple-50"
                    style={{ 
                      borderColor: '#852085', 
                      color: '#852085'
                    }}
                    data-testid="button-add-item"
                  >
                    <Plus className="w-4 h-4" style={{ color: '#852085' }} />
                    {language === 'ar' ? 'إضافة عنصر' : 'Add Item'}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'وصف العنصر/الخدمة' : 'Item/Service Description'}
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'الكمية' : 'Quantity'}
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'المجموع ق.ض.ق' : 'Total B.VAT'}
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'}
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'المجموع ب.ض.ق' : 'Total A.VAT'}
                        </th>
                        <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'إجراءات' : 'Actions'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder={language === 'ar' ? 'وصف العنصر' : 'Item description'}
                              data-testid={`input-description-${item.id}`}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              min="1"
                              data-testid={`input-quantity-${item.id}`}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              min="0"
                              step="0.01"
                              data-testid={`input-unit-price-${item.id}`}
                            />
                          </td>
                          <td className="px-2 py-1 text-sm text-gray-900">
                            {item.totalBeforeVAT.toFixed(2)}
                          </td>
                          <td className="px-2 py-1 text-sm text-gray-900">
                            {item.vat.toFixed(2)}
                          </td>
                          <td className="px-2 py-1 text-sm text-gray-900">
                            {item.totalAfterVAT.toFixed(2)}
                          </td>
                          <td className="px-2 py-1 text-center">
                            {items.length > 1 && (
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-800"
                                data-testid={`button-remove-${item.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-medium">
                        <td colSpan={3} className="px-2 py-1 text-right text-sm font-medium text-gray-900">
                          {language === 'ar' ? 'المجموع:' : 'Total:'}
                        </td>
                        <td className="px-2 py-1 text-sm text-gray-900">
                          {totals.totalBeforeVAT.toFixed(2)}
                        </td>
                        <td className="px-2 py-1 text-sm text-gray-900">
                          {totals.vat.toFixed(2)}
                        </td>
                        <td className="px-2 py-1 text-sm text-gray-900">
                          {totals.totalAfterVAT.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              
              {/* Payment Methods Section */}
              <div className="space-y-2 pt-2">
                <div dir={getDirection(language)}>
                  <label className="block text-sm font-medium mb-2 text-gray-700" style={{ borderTopWidth: '2px', paddingTop: '5px' }}>
                    {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                  </label>
                  
                  <div className="space-y-2">
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
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          className="w-[170px] px-2 input-compact-20 border border-gray-300"
                          placeholder={language === 'ar' ? 'المبلغ' : 'Amount'}
                          value={paymentMethods.cash.amount || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (value >= 0) {
                              handlePaymentMethodChange('cash', 'amount', value);
                            }
                          }}
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
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          className="w-[170px] px-2 input-compact-20 border border-gray-300"
                          placeholder={language === 'ar' ? 'المبلغ' : 'Amount'}
                          value={paymentMethods.card.amount || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (value >= 0) {
                              handlePaymentMethodChange('card', 'amount', value);
                            }
                          }}
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
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          className="w-[170px] px-2 input-compact-20 border border-gray-300"
                          placeholder={language === 'ar' ? 'المبلغ' : 'Amount'}
                          value={paymentMethods.bank.amount || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (value >= 0) {
                              handlePaymentMethodChange('bank', 'amount', value);
                            }
                          }}
                          disabled={!paymentMethods.bank.checked}
                        />
                      </div>
                    </div>
                    
                    {/* Total Amount */}
                    <div className="mt-2 pt-1">
                      <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <label className="flex items-center min-w-[120px] font-semibold">
                          <span className="text-sm text-gray-800">
                            {language === 'ar' ? 'المبلغ الإجمالي:' : 'Total Amount:'}
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            className="w-[170px] px-2 input-compact-20 border border-gray-300 bg-gray-100 cursor-not-allowed font-semibold"
                            placeholder={language === 'ar' ? 'الإجمالي' : 'Total'}
                            value={calculatePaymentTotal()}
                            readOnly
                            disabled
                            data-testid="input-total-payment-amount"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Description Section */}
                    <div className="mt-2 pt-1">
                      <div dir="ltr">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'ar' ? 'الوصف' : 'Description'}
                        </label>
                        <textarea 
                          className="description-field border border-gray-300 w-full p-2 rounded-md resize-none"
                          placeholder={language === 'ar' ? 'أدخل الوصف' : 'Enter description'}
                          rows={3}
                          data-testid="textarea-description"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attachment' && (
            <div className="rounded-lg p-4 text-center">
              <p className="text-gray-500">
                {language === 'ar' ? 'قسم المرفقات سيتم تطويره قريباً' : 'Attachment section will be developed soon'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-2 mt-3 pt-2">
            {/* Left side buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 bg-white hover:bg-purple-50"
                style={{ 
                  borderColor: '#852085', 
                  color: '#852085'
                }}
                data-testid="button-save"
              >
                <FilePlus className="h-4 w-4" style={{ color: '#852085' }} />
                {language === 'ar' ? 'إنشاء إشعار دائن' : 'Create Credit Note'}
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                data-testid="button-cancel"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
            
            {/* Right side Copy From dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                {language === 'ar' ? 'نسخ من:' : 'Copy From:'}
              </label>
              <select
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                data-testid="select-copy-from"
                defaultValue=""
                onChange={handleCopyFromChange}
              >
                <option value="" disabled>
                  {language === 'ar' ? 'اختر...' : 'Select...'}
                </option>
                <option value="ar-invoice">
                  {language === 'ar' ? 'فاتورة الذمم المدينة' : 'A/R Invoice'}
                </option>
              </select>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Invoice Selection Modal */}
    <InvoiceSelectionModal
      isOpen={showInvoiceSelectionModal}
      onClose={() => setShowInvoiceSelectionModal(false)}
      onSelect={handleInvoiceSelected}
      title={language === 'ar' ? 'اختيار فاتورة للنسخ منها' : 'Select Invoice to Copy From'}
      adminToken={adminToken || undefined}
      mode="invoice"
    />
    
    {/* Customer Selection Modal */}
    <InvoiceSelectionModal
      isOpen={showCustomerSelectionModal}
      onClose={() => setShowCustomerSelectionModal(false)}
      onSelect={handleCustomerSelected}
      title={language === 'ar' ? 'قائمة شركاء الأعمال' : 'List Of Business Partner'}
      adminToken={adminToken || undefined}
      mode="customer"
    />
  </>
  );
}