import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useTranslation, getDirection } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { User, Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
      
      // Reset state when opening
      setCustomerSearchQuery('');
      setCustomerPhone('');
      setCustomerName('');
      setSelectedCustomer(null);
      setShowCustomerDropdown(false);
      setActiveTab('content');
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {language === 'ar' ? 'إنشاء إشعار دائن' : 'Create Credit Note'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {language === 'ar' ? 'قم بإنشاء إشعار دائن جديد للعميل' : 'Create a new credit note for customer'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6" dir={getDirection(language)}>
          {/* Customer Information Section */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-medium text-gray-900">
                {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
              </h2>
            </div>

            <div className="space-y-4">
              {/* Customer Search */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'العميل:' : 'Customer:'}
                  </label>
                  <div className="relative w-[170px]">
                    <input 
                      type="text" 
                      className="w-full px-2 input-compact-20 border border-gray-300"
                      value={customerSearchQuery}
                      onChange={(e) => handleCustomerSearchChange(e.target.value)}
                      placeholder={language === 'ar' ? 'بحث عن العميل' : 'Search customer'}
                      data-testid="input-customer-search"
                    />
                    {showCustomerDropdown && customerSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                        {customerSearchResults.map((customer: Customer) => (
                          <div
                            key={customer.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
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
                    style={{ marginLeft: '13px' }}
                  />
                </div>
              </div>

              {/* Customer Phone and Customer Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'هاتف العميل:' : 'Customer Phone:'}
                  </label>
                  <input 
                    type="text" 
                    className={`w-[170px] px-2 input-compact-20 border border-gray-300 ${
                      selectedCustomer ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    disabled={selectedCustomer !== null}
                    data-testid="input-customer-phone"
                    placeholder={language === 'ar' ? 'أدخل هاتف العميل' : 'Enter customer phone'}
                  />
                </div>

                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'اسم العميل:' : 'Customer Name:'}
                  </label>
                  <input 
                    type="text" 
                    className={`w-[170px] px-2 input-compact-20 border border-gray-300 ${
                      selectedCustomer ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={selectedCustomer !== null}
                    data-testid="input-customer-name"
                    placeholder={language === 'ar' ? 'أدخل اسم العميل' : 'Enter customer name'}
                  />
                </div>
              </div>

              {/* Posting Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ borderBottomWidth: '2px', paddingBottom: '10px' }}>
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'تاريخ الترحيل:' : 'Posting Date:'}
                  </label>
                  <input 
                    type="date" 
                    className="w-[170px] px-2 input-compact-20 border border-gray-300"
                    value={postingDate}
                    onChange={(e) => setPostingDate(e.target.value)}
                    data-testid="input-posting-date"
                    style={{ marginLeft: '29px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mb-4">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
            <div className="space-y-4">
              {/* Items Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    {language === 'ar' ? 'عناصر مذكرة الائتمان' : 'Credit Note Items'}
                  </h3>
                  <button
                    onClick={handleAddItem}
                    className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-1 text-sm"
                    data-testid="button-add-item"
                  >
                    <Plus className="w-4 h-4" />
                    {language === 'ar' ? 'إضافة عنصر' : 'Add Item'}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'وصف العنصر/الخدمة' : 'Item/Service Description'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'الكمية' : 'Quantity'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'المجموع ق.ض.ق' : 'Total B.VAT'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'المجموع ب.ض.ق' : 'Total A.VAT'}
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'إجراءات' : 'Actions'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder={language === 'ar' ? 'وصف العنصر' : 'Item description'}
                              data-testid={`input-description-${item.id}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              min="1"
                              data-testid={`input-quantity-${item.id}`}
                            />
                          </td>
                          <td className="px-4 py-3">
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
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.totalBeforeVAT.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.vat.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.totalAfterVAT.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
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
                    <tfoot className="bg-gray-50">
                      <tr className="font-medium">
                        <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {language === 'ar' ? 'المجموع:' : 'Total:'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {totals.totalBeforeVAT.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {totals.vat.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {totals.totalAfterVAT.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attachment' && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500">
                {language === 'ar' ? 'قسم المرفقات سيتم تطويره قريباً' : 'Attachment section will be developed soon'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              data-testid="button-cancel"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              data-testid="button-save"
            >
              {language === 'ar' ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}