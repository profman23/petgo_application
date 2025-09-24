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
  invoiceItemId?: number; // Link to original invoice_items.id for proper filtering
  description: string;
  quantity: number;
  unitPrice: number;
  discount: string | number; // Support percentage format like "10%"
  originalQuantity?: number; // Store original invoice quantity for validation
  totalBeforeVAT: number;
  vat: number;
  totalAfterVAT: number;
}

interface CreditNoteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreditNoteCreated?: () => void;
  viewMode?: boolean;  // New prop for view-only mode
  creditNoteData?: any;  // Existing credit note data for viewing
}

export function CreditNoteModal({ isOpen, onOpenChange, onCreditNoteCreated, viewMode = false, creditNoteData }: CreditNoteModalProps) {
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
  const { data: nextCreditNoteResponse } = useQuery<{nextNumber: string}>({
    queryKey: ['/api/admin/credit-notes/next-number'],
    enabled: isOpen,
    refetchOnMount: 'always', // Force fresh fetch every time modal opens
  });
  
  // Extract and format the credit note number
  const nextCreditNoteNumber = nextCreditNoteResponse?.nextNumber ? `CRN${nextCreditNoteResponse.nextNumber}` : 'Loading...';

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
  
  // Selected invoice state (when copying from invoice)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  // Status state (starts as Closed)
  const [status, setStatus] = useState<'Open' | 'Closed'>('Closed');
  
  // Admin token for API calls
  const adminToken = localStorage.getItem('adminToken');
  
  
  // Credit Note Items state
  const [items, setItems] = useState<CreditNoteItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      totalBeforeVAT: 0,
      vat: 0,
      totalAfterVAT: 0
    },
    {
      id: '2',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      totalBeforeVAT: 0,
      vat: 0,
      totalAfterVAT: 0
    },
    {
      id: '3',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      totalBeforeVAT: 0,
      vat: 0,
      totalAfterVAT: 0
    },
    {
      id: '4',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      totalBeforeVAT: 0,
      vat: 0,
      totalAfterVAT: 0
    },
    {
      id: '5',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      totalBeforeVAT: 0,
      vat: 0,
      totalAfterVAT: 0
    },
    {
      id: '6',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
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
      
      if (viewMode && creditNoteData) {
        // Load existing data when in view mode
        setCustomerName(creditNoteData.customerName || '');
        setCustomerPhone(creditNoteData.customerPhone || '');
        setCustomerSearchQuery(creditNoteData.customerName || '');
        setSelectedCustomer({
          id: creditNoteData.customerId || 0,
          name: creditNoteData.customerName || '',
          phone: creditNoteData.customerPhone || ''
        });
        setPostingDate(creditNoteData.postingDate || defaultDate);
        setStatus(creditNoteData.status || 'Closed');
        
        // Load existing items
        if (creditNoteData.items && Array.isArray(creditNoteData.items)) {
          const loadedItems = creditNoteData.items.map((item: any, index: number) => ({
            id: (index + 1).toString(),
            description: item.description || '',
            quantity: item.creditQuantity || item.originalQuantity || 1,
            unitPrice: item.unitPrice || 0,
            discount: item.discount || 0,
            totalBeforeVAT: item.totalBeforeVat || 0,
            vat: item.vatAmount || 0,
            totalAfterVAT: item.totalAfterVat || 0
          }));
          setItems(loadedItems);
        }
      } else {
        // Reset state when opening in create mode
        setCustomerSearchQuery('');
        setCustomerPhone('');
        setCustomerName('');
        setSelectedCustomer(null);
        setSelectedInvoice(null);
        setStatus('Closed');
        setItems([
          {
            id: '1',
            description: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            totalBeforeVAT: 0,
            vat: 0,
            totalAfterVAT: 0
          },
          {
            id: '2',
            description: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            totalBeforeVAT: 0,
            vat: 0,
            totalAfterVAT: 0
          },
          {
            id: '3',
            description: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            totalBeforeVAT: 0,
            vat: 0,
            totalAfterVAT: 0
          },
          {
            id: '4',
            description: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            totalBeforeVAT: 0,
            vat: 0,
            totalAfterVAT: 0
          },
          {
            id: '5',
            description: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            totalBeforeVAT: 0,
            vat: 0,
            totalAfterVAT: 0
          },
          {
            id: '6',
            description: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            totalBeforeVAT: 0,
            vat: 0,
            totalAfterVAT: 0
          }
        ]);
      }
      
      setShowCustomerDropdown(false);
      setActiveTab('content');
      setShowInvoiceSelectionModal(false);
    }
  }, [isOpen, viewMode, creditNoteData]);

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
      discount: 0,
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
      // Only open modal if customer is selected
      if (selectedCustomer) {
        setShowInvoiceSelectionModal(true);
      } else {
        // Show alert or toast that customer must be selected first
        alert(language === 'ar' ? 'يجب تحديد العميل أولاً' : 'Please select a customer first');
      }
    }
    // Reset the dropdown
    event.target.value = '';
  };

  // Handle invoice selection from the modal
  const handleInvoiceSelected = async (invoice: any) => {
    try {
      // Store the selected invoice for later use when saving
      setSelectedInvoice(invoice);
      
      // Fix Issue 1: Preserve originally selected customer ID, only update name/phone from invoice
      if (selectedCustomer) {
        // If customer was already selected, preserve their ID but update name/phone if needed
        setCustomerName(invoice.customerName || selectedCustomer.name);
        setCustomerPhone(invoice.customerPhone || selectedCustomer.phone);
        // Keep the original customer ID in the search query
        setCustomerSearchQuery(selectedCustomer.id.toString());
      } else {
        // If no customer was selected yet, use invoice customer data
        setSelectedCustomer({
          id: invoice.bookingId || 0,
          name: invoice.customerName || '',
          phone: invoice.customerPhone || ''
        });
        setCustomerName(invoice.customerName || '');
        setCustomerPhone(invoice.customerPhone || '');
        setCustomerSearchQuery(invoice.bookingId?.toString() || '');
      }

      // Fix Issue 2: Implement item-level filtering like the old screen
      if (invoice.bookingId && adminToken) {
        // Fetch both invoice items and credited items in parallel
        const [itemsResponse, creditedItemsResponse] = await Promise.all([
          fetch(`/api/invoice-items/${invoice.bookingId}`, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }),
          fetch(`/api/admin/credit-notes/credited-items/${invoice.invoiceNumber}`, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          })
        ]);
        
        if (itemsResponse.ok && creditedItemsResponse.ok) {
          const invoiceItems = await itemsResponse.json();
          const creditedItems = await creditedItemsResponse.json();
          
          // Create a map of credited items by invoiceItemId for proper matching
          const creditedItemsMap = new Map();
          creditedItems.forEach((creditedItem: any) => {
            // Backend now returns invoiceItemId and creditedQuantity
            const itemId = creditedItem.invoiceItemId;
            const existingCredited = creditedItemsMap.get(itemId) || 0;
            creditedItemsMap.set(itemId, existingCredited + creditedItem.creditedQuantity);
          });
          
          // Filter items to exclude those that are fully credited
          const availableItems = invoiceItems.filter((item: any) => {
            const totalCredited = creditedItemsMap.get(item.id) || 0; // item.id is the invoice item DB id
            const originalQuantity = parseInt(item.quantity);
            return totalCredited < originalQuantity; // Only show items that haven't been fully credited
          });
          
          // Transform available invoice items to credit note items format
          const creditNoteItems: CreditNoteItem[] = availableItems.map((item: any, index: number) => {
            const totalCredited = creditedItemsMap.get(item.id) || 0;
            const originalQuantity = parseInt(item.quantity);
            const availableQuantity = originalQuantity - totalCredited;
            
            return {
              id: Date.now().toString() + index, // UI-only ID for React keys
              invoiceItemId: item.id, // CRITICAL: Link back to original invoice item for filtering
              description: item.description || '',
              quantity: availableQuantity, // Use available quantity (original - credited)
              unitPrice: parseFloat(item.unitPrice) || 0,
              discount: item.discountType && item.discountType !== 'none' ? item.discountType : '0%', // Show percentage format
              originalQuantity: originalQuantity, // Store original quantity for validation
              totalBeforeVAT: parseFloat(item.totalBeforeVat) || 0,
              vat: parseFloat(item.vatAmount) || 0,
              totalAfterVAT: parseFloat(item.totalAfterVat) || 0
            };
          });
          
          // If we have available items, replace the current items, otherwise keep the default empty item
          if (creditNoteItems.length > 0) {
            setItems(creditNoteItems);
          }
        } else {
          console.error('Failed to fetch invoice items or credited items');
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
  const totals = items.reduce((acc, item) => {
    // Calculate discount amount from percentage
    let discountAmount = 0;
    if (item.discount && typeof item.discount === 'string' && item.discount.includes('%')) {
      const discountPercent = parseFloat(item.discount.replace('%', '')) / 100;
      const itemTotal = item.quantity * item.unitPrice;
      discountAmount = itemTotal * discountPercent;
    }
    
    return {
      totalBeforeVAT: acc.totalBeforeVAT + item.totalBeforeVAT,
      vat: acc.vat + item.vat,
      totalAfterVAT: acc.totalAfterVAT + item.totalAfterVAT,
      discount: acc.discount + discountAmount
    };
  }, { totalBeforeVAT: 0, vat: 0, totalAfterVAT: 0, discount: 0 });


  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!selectedCustomer || !adminToken) {
      alert(language === 'ar' ? 'يرجى تحديد عميل أولاً' : 'Please select a customer first');
      return;
    }

    try {
      // Fetch a fresh credit note number for each save attempt
      const freshCreditNoteResponse = await fetch('/api/admin/credit-notes/next-number', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      
      if (!freshCreditNoteResponse.ok) {
        alert('Failed to generate credit note number');
        return;
      }
      
      const freshCreditNoteData = await freshCreditNoteResponse.json();
      
      // Prepare items in correct format for database
      const filteredItems = items.filter(item => item.description.trim() !== '').map(item => ({
        id: parseInt(item.id),
        invoiceItemId: item.invoiceItemId, // CRITICAL: Include invoiceItemId for proper filtering
        description: item.description,
        originalQuantity: item.quantity,
        creditQuantity: item.quantity,
        unitPrice: item.unitPrice,
        totalBeforeVat: item.totalBeforeVAT,
        vatAmount: item.vat,
        totalAfterVat: item.totalAfterVAT
      }));


      const creditNoteData = {
        creditNoteNumber: freshCreditNoteData.nextNumber,  // Use fresh credit note number
        invoiceId: selectedInvoice?.bookingId || null,  // Add missing invoiceId
        invoiceNumber: selectedInvoice?.invoiceNumber || null,  // Add missing invoiceNumber  
        customerName: selectedCustomer.name,
        appointmentDate: selectedInvoice?.appointmentDate || postingDate,  // Add missing appointmentDate
        postingDate,
        items: filteredItems,
        totalBeforeVat: totals.totalBeforeVAT.toFixed(2),  // Fix field name
        vatAmount: totals.vat.toFixed(2),
        finalTotal: totals.totalAfterVAT.toFixed(2),  // Fix field name
        status: 'Closed',  // Save as Closed instead of Open
        createdBy: adminToken
      };

      const response = await fetch('/api/admin/credit-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(creditNoteData),
      });

      if (response.ok) {
        console.log('Credit Note created successfully');
        // Change status to Closed after successful save
        setStatus('Closed');
        
        // Short delay to show the status change, then close modal
        setTimeout(() => {
          onOpenChange(false);
          // Call the callback to refresh the data
          if (onCreditNoteCreated) {
            onCreditNoteCreated();
          }
          // Reset form
          setSelectedCustomer(null);
          setSelectedInvoice(null);
          setCustomerName('');
          setCustomerPhone('');
          setCustomerSearchQuery('');
          setStatus('Closed');
          setItems([{
            id: '1',
            description: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            totalBeforeVAT: 0,
            vat: 0,
            totalAfterVAT: 0
          }]);
        }, 1500); // 1.5 second delay to show "Closed" status
      } else {
        const error = await response.json();
        console.error('Failed to create credit note:', error);
        alert(language === 'ar' ? 'فشل في إنشاء إشعار دائن' : 'Failed to create credit note');
      }
    } catch (error) {
      console.error('Error creating credit note:', error);
      alert(language === 'ar' ? 'حدث خطأ أثناء إنشاء إشعار دائن' : 'An error occurred while creating the credit note');
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0">
        <DialogHeader className="p-3 pb-2" dir={getDirection(language)}>
          <DialogTitle className="sr-only">
            {viewMode 
              ? (language === 'ar' ? 'عرض إشعار دائن' : 'View Credit Note')
              : (language === 'ar' ? 'إنشاء إشعار دائن' : 'Create Credit Note')
            }
          </DialogTitle>
          <DialogDescription className="sr-only">
            {viewMode 
              ? (language === 'ar' ? 'عرض تفاصيل إشعار دائن موجود' : 'View details of an existing credit note')
              : (language === 'ar' ? 'إنشاء إشعار دائن جديد للعميل' : 'Create a new credit note for a customer')
            }
          </DialogDescription>
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
              {viewMode 
                ? (language === 'ar' ? 'عرض إشعار دائن' : 'View Credit Note')
                : (language === 'ar' ? 'إنشاء إشعار دائن' : 'Create Credit Note')
              }
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

            <div className="space-y-0.5">
              {/* Row 1: Customer Search and Credit Note No */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'معرف العميل:' : 'Customer ID:'}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative w-[170px]">
                    <input 
                      type="text" 
                      className={`w-full px-2 input-compact-20 border border-gray-600 credit-note-input ${
                        viewMode ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'cursor-pointer'
                      }`}
                      value={customerSearchQuery}
                      onChange={(e) => viewMode ? null : handleCustomerSearchChange(e.target.value)}
                      onClick={() => viewMode ? null : setShowCustomerSelectionModal(true)}
                      placeholder={language === 'ar' ? 'بحث عن العميل' : 'Search customer'}
                      data-testid="input-customer-search"
                      disabled={viewMode}
                      readOnly
                    />
                    {showCustomerDropdown && customerSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-600 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
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
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`} style={{ marginLeft: '240px' }}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'رقم مذكرة الائتمان:' : 'Credit Note No.:'}
                  </label>
                  <input 
                    type="text" 
                    className="w-[170px] px-2 input-compact-20 border border-gray-600 bg-gray-100 cursor-not-allowed"
                    disabled
                    value={nextCreditNoteNumber || 'Loading...'}
                    data-testid="input-credit-note-no"
                    style={{ marginLeft: '29px', marginRight: '10px' }}
                  />
                </div>

              </div>

              {/* Row 2: Customer Name and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Customer Name on left side */}
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'اسم العميل:' : 'Customer Name:'}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input 
                    type="text" 
                    className={`w-[170px] px-2 input-compact-20 border border-gray-600 credit-note-input ${
                      viewMode || selectedCustomer ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    value={customerName}
                    onChange={(e) => viewMode ? null : setCustomerName(e.target.value)}
                    onClick={() => viewMode ? null : setShowCustomerSelectionModal(true)}
                    disabled={viewMode || selectedCustomer !== null}
                    data-testid="input-customer-name"
                    placeholder={language === 'ar' ? 'أدخل اسم العميل' : 'Enter customer name'}
                    readOnly
                  />
                </div>
                
                {/* Status - on right side */}
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`} style={{ marginLeft: '240px' }}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'الحالة:' : 'Status:'}
                  </label>
                  <input 
                    type="text" 
                    className="w-[170px] px-2 input-compact-20 border border-gray-600 bg-gray-100 cursor-not-allowed text-gray-500"
                    disabled
                    readOnly
                    value={language === 'ar' ? (status === 'Open' ? 'مفتوح' : 'مغلق') : status}
                    data-testid="input-status"
                    style={{ marginLeft: '29px' }}
                  />
                </div>
              </div>

              {/* Row 3: Customer Phone and Posting Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2" style={{ borderBottomWidth: '0px', paddingBottom: '4px' }}>
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'هاتف العميل:' : 'Customer Phone:'}
                  </label>
                  <input 
                    type="text" 
                    className={`w-[170px] px-2 input-compact-20 border border-gray-600 credit-note-input ${
                      viewMode || selectedCustomer ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    value={customerPhone}
                    onChange={(e) => viewMode ? null : setCustomerPhone(e.target.value)}
                    disabled={viewMode || selectedCustomer !== null}
                    data-testid="input-customer-phone"
                    placeholder={language === 'ar' ? 'أدخل هاتف العميل' : 'Enter customer phone'}
                  />
                </div>

                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`} style={{ marginLeft: '240px' }}>
                  <label className={`text-sm font-medium text-gray-700 ${language === 'ar' ? 'min-w-[120px] text-right' : 'min-w-[120px] text-left'}`}>
                    {language === 'ar' ? 'تاريخ الترحيل:' : 'Posting Date:'}
                  </label>
                  <input 
                    type="text" 
                    className={`w-[170px] px-2 input-compact-20 border border-gray-600 credit-note-input ${
                      viewMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    placeholder={language === 'ar' ? '+2 أو -3' : '+2 or -3'}
                    value={postingDate}
                    onChange={(e) => {
                      if (!viewMode) {
                        const value = e.target.value;
                        setPostingDate(value);
                        // Parse relative dates on blur or when complete
                        if (value.match(/^[+-]?\d+$/)) {
                          const parsedDate = parseRelativeDate(value);
                          if (parsedDate !== value) {
                            setPostingDate(parsedDate);
                          }
                        }
                      }
                    }}
                    onBlur={(e) => {
                      if (!viewMode) {
                        const parsedDate = parseRelativeDate(e.target.value);
                        setPostingDate(parsedDate);
                      }
                    }}
                    data-testid="input-posting-date"
                    disabled={viewMode}
                    readOnly={viewMode}
                    style={{ marginLeft: '29px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mb-2">
            <div className="border-b border-gray-600">
              <nav className="-mb-px flex space-x-4">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`py-1 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'content'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-600'
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
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-600'
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
              <div className="border border-gray-600 rounded-lg overflow-hidden">
                <div className="px-2 py-1 border-b border-gray-600 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    {language === 'ar' ? 'عناصر مذكرة الائتمان' : 'Credit Note Items'}
                  </h3>
                  {!viewMode && (
                    <button
                      onClick={handleAddItem}
                      className="px-4 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 bg-white hover:bg-purple-50"
                      style={{ 
                        borderColor: '#852085', 
                        color: '#852085',
                        height: '25px'
                      }}
                      data-testid="button-add-item"
                    >
                      <Plus className="w-4 h-4" style={{ color: '#852085' }} />
                      {language === 'ar' ? 'إضافة عنصر' : 'Add Item'}
                    </button>
                  )}
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
                          {language === 'ar' ? 'الخصم' : 'Discount'}
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
                              onChange={(e) => (viewMode || item.originalQuantity) ? null : handleItemChange(item.id, 'description', e.target.value)}
                              className={`w-full px-2 border border-gray-600 rounded text-sm h-6 ${
                                (viewMode || item.originalQuantity) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                              }`}
                              placeholder={language === 'ar' ? 'وصف العنصر' : 'Item description'}
                              disabled={viewMode || !!item.originalQuantity}
                              data-testid={`input-description-${item.id}`}
                              readOnly={!!item.originalQuantity}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                if (viewMode) return;
                                const newValue = Number(e.target.value);
                                // Prevent values > original invoice quantity or = 0
                                if (newValue > 0 && newValue <= (item.originalQuantity || item.quantity)) {
                                  handleItemChange(item.id, 'quantity', newValue);
                                }
                              }}
                              className={`w-20 px-2 border border-gray-600 rounded text-sm h-6 ${
                                viewMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                              }`}
                              min="1"
                              max={item.originalQuantity || item.quantity}
                              disabled={viewMode}
                              data-testid={`input-quantity-${item.id}`}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              value={item.unitPrice}
                              className="w-24 px-2 border border-gray-600 rounded text-sm h-6 bg-gray-100 text-gray-500 cursor-not-allowed"
                              disabled
                              readOnly
                              data-testid={`input-unit-price-${item.id}`}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="text"
                              value={item.discount}
                              className="w-24 px-2 border border-gray-600 rounded text-sm h-6 bg-gray-100 text-gray-500 cursor-not-allowed"
                              disabled
                              readOnly
                              data-testid={`input-discount-${item.id}`}
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
                            {items.length > 1 && !viewMode && (
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
                  </table>
                </div>
              </div>
              
              {/* Customer Transaction Details Section */}
              <div className="space-y-2 pt-2" style={{ borderBottomWidth: '2px', borderBottomColor: '#4b5563', paddingBottom: '10px' }}>
                <div className={`ml-auto max-w-xs ${language === 'ar' ? 'mr-auto ml-0' : ''}`}>
                  <div className="space-y-2">
                    {/* Total Before VAT */}
                    <div className={`flex justify-between items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm font-medium text-gray-700">
                        {language === 'ar' ? 'المجموع قبل الضريبة:' : 'Total Before VAT:'}
                      </span>
                      <span className="text-sm text-gray-900 font-medium">
                        {totals.totalBeforeVAT.toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Discount */}
                    <div className={`flex justify-between items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm font-medium text-gray-700">
                        {language === 'ar' ? 'الخصم:' : 'Discount:'}
                      </span>
                      <span className="text-sm text-gray-900 font-medium">
                        {totals.discount.toFixed(2)}
                      </span>
                    </div>
                    
                    {/* VAT 15% */}
                    <div className={`flex justify-between items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm font-medium text-gray-700">
                        {language === 'ar' ? 'ضريبة القيمة المضافة 15%:' : 'VAT 15%:'}
                      </span>
                      <span className="text-sm text-gray-900 font-medium">
                        {totals.vat.toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Line separator */}
                    <div className="border-t border-gray-600 my-2"></div>
                    
                    {/* Final Total */}
                    <div className={`flex justify-between items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm font-semibold text-gray-800">
                        {language === 'ar' ? 'المجموع النهائي:' : 'Final Total:'}
                      </span>
                      <span className="text-sm text-gray-900 font-semibold">
                        {totals.totalAfterVAT.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attachment' && (
            <div className="space-y-4 p-4" style={{ minHeight: '400px', maxHeight: '65vh', overflowY: 'auto' }}>
              {/* Attachment Header */}
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {language === 'ar' ? 'المرفقات' : 'Attachments'}
                </h2>
              </div>
              
              {/* Attachment Content - Full Width */}
              <div className="w-full">
                {/* Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <div className="space-y-4">
                    <div className="text-gray-400">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        {language === 'ar' ? 'رفع المرفقات' : 'Upload Attachments'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {language === 'ar' ? 'اسحب الملفات هنا أو انقر لتحديد الملفات' : 'Drag files here or click to select files'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {language === 'ar' ? 'الحد الأقصى لحجم الملف: 10 ميجابايت' : 'Maximum file size: 10MB'}
                      </p>
                    </div>
                    <button 
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      disabled={viewMode}
                    >
                      {language === 'ar' ? 'اختر الملفات' : 'Select Files'}
                    </button>
                  </div>
                </div>
                
                {/* Existing Attachments List */}
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-800 mb-3">
                    {language === 'ar' ? 'المرفقات الموجودة' : 'Existing Attachments'}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-500 text-sm">
                      {language === 'ar' ? 'لا توجد مرفقات' : 'No attachments found'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-2 mt-3 pt-2">
            {/* Left side buttons */}
            <div className="flex gap-2">
              {!viewMode && (
                <button
                  onClick={handleSave}
                  disabled={!selectedCustomer}
                  className={`px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 ${
                    selectedCustomer 
                      ? 'bg-white hover:bg-purple-50 cursor-pointer' 
                      : 'bg-gray-100 cursor-not-allowed'
                  }`}
                  style={{ 
                    borderColor: selectedCustomer ? '#852085' : '#9CA3AF',
                    color: selectedCustomer ? '#852085' : '#9CA3AF'
                  }}
                  data-testid="button-save"
                >
                  <FilePlus className="h-4 w-4" style={{ color: selectedCustomer ? '#852085' : '#9CA3AF' }} />
                  {language === 'ar' ? 'إنشاء إشعار دائن' : 'Create Credit Note'}
                </button>
              )}
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-600 rounded-md text-gray-700 hover:bg-gray-50"
                data-testid={viewMode ? "button-close" : "button-cancel"}
              >
                {viewMode ? (language === 'ar' ? 'إغلاق' : 'Close') : (language === 'ar' ? 'إلغاء' : 'Cancel')}
              </button>
            </div>
            
            {/* Right side Copy From dropdown - hidden in view mode */}
            {!viewMode && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  {language === 'ar' ? 'نسخ من:' : 'Copy From:'}
                </label>
                <select
                  className="px-2 py-1 border border-gray-600 rounded-md text-sm"
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
            )}
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
      selectedCustomerId={selectedCustomer?.id}
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