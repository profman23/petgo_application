import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { InvoiceDataTable } from './InvoiceDataTable';

interface Invoice {
  id?: number;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  appointmentDate: string;
  finalTotal: string | number;
  bookingId?: number;
}

interface Customer {
  id: number;
  customerName: string;
  customerPhone?: string;
}

interface InvoiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: Invoice | Customer | any) => void;
  title?: string;
  adminToken?: string;
  mode?: 'invoice' | 'customer';
  selectedCustomerId?: number;
}

export function InvoiceSelectionModal({
  isOpen,
  onClose,
  onSelect,
  title,
  adminToken,
  mode = 'invoice',
  selectedCustomerId
}: InvoiceSelectionModalProps) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Invoice | Customer)[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [fullyCreditedInvoices, setFullyCreditedInvoices] = useState<Set<string>>(new Set());

  const getDirection = () => language === 'ar' ? 'rtl' : 'ltr';
  const getTextAlign = () => language === 'ar' ? 'right' : 'left';

  // Check if an invoice is fully credited
  const checkIfInvoiceFullyCredited = async (invoice: Invoice): Promise<boolean> => {
    if (!adminToken || !invoice.bookingId || !invoice.invoiceNumber) {
      return false;
    }

    try {
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
        const items = await itemsResponse.json();
        const creditedItems = await creditedItemsResponse.json();
        
        // Create a map of credited items for easy lookup
        const creditedItemsMap = new Map();
        creditedItems.forEach((creditedItem: any) => {
          const existingCredited = creditedItemsMap.get(creditedItem.id) || 0;
          creditedItemsMap.set(creditedItem.id, existingCredited + creditedItem.creditedQuantity);
        });
        
        // Check if ALL items are fully credited
        const allItemsFullyCredited = items.every((item: any) => {
          const totalCredited = creditedItemsMap.get(item.id) || 0;
          const originalQuantity = parseInt(item.quantity);
          return totalCredited >= originalQuantity; // Item is fully credited
        });
        
        return allItemsFullyCredited && items.length > 0; // Ensure there are items to credit
      }
    } catch (error) {
      console.error('Error checking if invoice is fully credited:', error);
    }
    
    return false;
  };

  // Filter invoices by selected customer and exclude fully credited invoices
  const getFilteredInvoices = () => {
    console.log('🔍 getFilteredInvoices called:', { mode, selectedCustomerId, allInvoicesCount: allInvoices.length, allCustomersCount: allCustomers.length, fullyCreditedCount: fullyCreditedInvoices.size });
    
    let baseInvoices = allInvoices;
    
    // First filter by customer if in invoice mode and customer is selected
    if (mode === 'invoice' && selectedCustomerId) {
      // Get the selected customer data to match by name and phone
      const selectedCustomer = allCustomers.find(customer => customer.id === selectedCustomerId);
      console.log('🎯 Selected customer found:', selectedCustomer);
      
      if (selectedCustomer) {
        // Filter invoices by customer name and phone (more reliable than ID matching)
        baseInvoices = allInvoices.filter((invoice: Invoice) => {
          const nameMatch = invoice.customerName?.toLowerCase() === selectedCustomer.customerName?.toLowerCase();
          const phoneMatch = invoice.customerPhone === selectedCustomer.customerPhone;
          return nameMatch || phoneMatch;
        });
        console.log('✅ Customer filtered invoices:', baseInvoices.length, 'out of', allInvoices.length);
      }
    }
    
    // Then filter out fully credited invoices
    const availableInvoices = baseInvoices.filter((invoice: Invoice) => {
      const isFullyCredited = fullyCreditedInvoices.has(invoice.invoiceNumber);
      if (isFullyCredited) {
        console.log('🚫 Excluding fully credited invoice:', invoice.invoiceNumber);
      }
      return !isFullyCredited;
    });
    
    console.log('✅ Final filtered invoices (excluding fully credited):', availableInvoices.length, 'out of', baseInvoices.length);
    return availableInvoices;
  };

  // Fetch data when modal opens based on mode
  useEffect(() => {
    if (isOpen && adminToken) {
      if (mode === 'invoice') {
        fetchInvoices();
        // If we have a selectedCustomerId, also fetch customers for filtering
        if (selectedCustomerId) {
          fetchCustomers();
        }
      } else if (mode === 'customer') {
        fetchCustomers();
      }
    }
  }, [isOpen, adminToken, mode, selectedCustomerId]);

  // Reset search when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [isOpen]);

  const fetchInvoices = async () => {
    if (!adminToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/generated-invoices', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      
      if (response.ok) {
        const invoices = await response.json();
        setAllInvoices(invoices);
        
        // Check which invoices are fully credited
        await checkFullyCreditedInvoices(invoices);
      } else {
        console.error('Failed to fetch invoices:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check all invoices to see which ones are fully credited
  const checkFullyCreditedInvoices = async (invoices: Invoice[]) => {
    const fullyCredited = new Set<string>();
    
    // Check each invoice in parallel (but limit concurrency to avoid overwhelming the server)
    const checkPromises = invoices.map(async (invoice) => {
      const isFullyCredited = await checkIfInvoiceFullyCredited(invoice);
      if (isFullyCredited) {
        fullyCredited.add(invoice.invoiceNumber);
      }
    });
    
    await Promise.all(checkPromises);
    
    console.log('🔄 Fully credited invoices found:', Array.from(fullyCredited));
    setFullyCreditedInvoices(fullyCredited);
  };

  const fetchCustomers = async () => {
    if (!adminToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/customers', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Extract customers array from API response structure {success: true, customers: [...]}
        const rawCustomers = data.customers || data || [];
        
        // Transform the data structure to match Customer interface
        // API returns: {userId, userName, userPhone} but we need: {id, customerName, customerPhone}
        const customers = rawCustomers.map((item: any) => ({
          id: item.userId || item.id,
          customerName: item.userName || item.customerName || item.name || '',
          customerPhone: item.userPhone || item.customerPhone || item.phone || ''
        }));
        
        setAllCustomers(customers);
      } else {
        console.error('Failed to fetch customers:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change - search as user types
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (!value.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (value.length >= 2) {
      setIsSearching(true);
      setShowDropdown(true);
      
      let results: (Invoice | Customer)[] = [];
      
      if (mode === 'invoice') {
        // Filter invoices by invoice number or customer name (partial match)
        // and exclude fully credited invoices
        const baseInvoices = getFilteredInvoices(); // This already excludes fully credited invoices
        results = baseInvoices.filter((invoice: Invoice) => {
          const invoiceNum = invoice.invoiceNumber || '';
          const customerName = invoice.customerName || '';
          const searchTerm = value.toLowerCase();
          return (
            invoiceNum.toLowerCase().includes(searchTerm) ||
            customerName.toLowerCase().includes(searchTerm)
          );
        });
      } else if (mode === 'customer') {
        // Filter customers by customer name, phone or ID
        results = (allCustomers || []).filter((customer: Customer) => {
          const customerName = customer.customerName || '';
          const customerPhone = customer.customerPhone || '';
          const customerId = customer.id?.toString() || '';
          const searchTerm = value.toLowerCase();
          return (
            customerName.toLowerCase().includes(searchTerm) ||
            customerPhone.includes(searchTerm) ||
            customerId.includes(searchTerm)
          );
        });
      }
      
      setTimeout(() => {
        setSearchResults(results);
        setIsSearching(false);
      }, 300);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectItem = (item: Invoice | Customer) => {
    if (mode === 'invoice') {
      setSearchQuery((item as Invoice).invoiceNumber);
    } else {
      setSearchQuery((item as Customer).customerName);
    }
    setShowDropdown(false);
    onSelect(item);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(
      language === 'ar' ? 'ar-SA' : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
    );
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" dir={getDirection()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-700">
            <div 
              dangerouslySetInnerHTML={{
                __html: '<lord-icon src="https://cdn.lordicon.com/wlkedhqk.json" trigger="hover" colors="primary:#852085,secondary:#848484" style="width:60px;height:60px"></lord-icon>'
              }}
            />
            <span style={{ textAlign: getTextAlign() }}>
              {title || (mode === 'invoice' 
                ? (language === 'ar' ? 'اختيار فاتورة' : 'Select Invoice')
                : (language === 'ar' ? 'قائمة شركاء الأعمال' : 'List Of Business Partner'))}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 h-full flex flex-col" dir={getDirection()}>
          {/* Search Section */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
              <Input
                type="text"
                placeholder={mode === 'invoice' 
                  ? (language === 'ar' ? 'ابحث برقم الفاتورة أو اسم العميل...' : 'Search by invoice number or customer name...')
                  : (language === 'ar' ? 'ابحث بمعرف العميل أو الاسم أو رقم الهاتف...' : 'Search by customer ID, name or phone...')}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className={`${language === 'ar' ? 'pr-10' : 'pl-10'} credit-note-input focus-visible:ring-0 focus-visible:ring-offset-0`}
                data-testid={mode === 'invoice' ? 'input-invoice-search' : 'input-customer-search'}
              />
              
              {/* Dropdown Results */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto mt-1">
                  {searchResults.map((item) => {
                    if (mode === 'invoice') {
                      const invoice = item as Invoice;
                      return (
                        <div
                          key={invoice.invoiceNumber}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleSelectItem(invoice)}
                          data-testid={`dropdown-invoice-${invoice.invoiceNumber}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-purple-600" />
                              <div>
                                <p className="font-semibold text-purple-600 text-sm">{invoice.invoiceNumber}</p>
                                <p className="text-xs text-gray-600">{invoice.customerName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-800">{formatAmount(invoice.finalTotal)} SAR</p>
                              <p className="text-xs text-gray-500">{formatDate(invoice.appointmentDate)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      const customer = item as Customer;
                      return (
                        <div
                          key={customer.id}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleSelectItem(customer)}
                          data-testid={`dropdown-customer-${customer.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-purple-600" />
                              <div>
                                <p className="font-semibold text-purple-600 text-sm">{customer.id}</p>
                                <p className="text-xs text-gray-600">{customer.customerName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-800">{customer.customerPhone || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              )}
              
              {/* No Results Dropdown */}
              {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 mt-1">
                  <div className="px-4 py-6 text-center text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium">
                      {mode === 'invoice'
                        ? (language === 'ar' ? 'لم يتم العثور على فواتير' : 'No invoices found')
                        : (language === 'ar' ? 'لم يتم العثور على عملاء' : 'No customers found')}
                    </p>
                    <p className="text-xs">
                      {language === 'ar' ? 'جرب كلمات بحث مختلفة' : 'Try different search terms'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Loading Dropdown */}
              {showDropdown && isSearching && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 mt-1">
                  <div className="px-4 py-6 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'جاري البحث...' : 'Searching...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <Button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
              disabled={!searchQuery.trim()}
              data-testid={mode === 'invoice' ? 'button-search-invoices' : 'button-search-customers'}
            >
              <Search className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'بحث' : 'Search'}
            </Button>
          </div>

          {/* Data Table */}
          <div className="flex-1 min-h-0">
            <InvoiceDataTable
              invoices={mode === 'invoice' 
                ? (searchQuery ? searchResults as Invoice[] : getFilteredInvoices())
                : (searchQuery ? searchResults as Customer[] : allCustomers) as any}
              onSelectInvoice={handleSelectItem}
              isLoading={isLoading}
              mode={mode}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
            data-testid={mode === 'invoice' ? 'button-cancel-invoice-selection' : 'button-cancel-customer-selection'}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}