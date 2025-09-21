import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText, Calendar, User, DollarSign } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

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

interface InvoiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (invoice: Invoice) => void;
  title?: string;
  adminToken?: string;
}

export function InvoiceSelectionModal({
  isOpen,
  onClose,
  onSelect,
  title,
  adminToken
}: InvoiceSelectionModalProps) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Invoice[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getDirection = () => language === 'ar' ? 'rtl' : 'ltr';
  const getTextAlign = () => language === 'ar' ? 'right' : 'left';

  // Fetch all invoices when modal opens
  useEffect(() => {
    if (isOpen && adminToken) {
      fetchInvoices();
    }
  }, [isOpen, adminToken]);

  // Reset search when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
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
      } else {
        console.error('Failed to fetch invoices:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Filter invoices by invoice number (partial match)
    const results = allInvoices.filter((invoice: Invoice) => {
      const invoiceNum = invoice.invoiceNumber || '';
      const customerName = invoice.customerName || '';
      const searchTerm = searchQuery.toLowerCase();
      return (
        invoiceNum.toLowerCase().includes(searchTerm) ||
        customerName.toLowerCase().includes(searchTerm)
      );
    });
    
    setTimeout(() => {
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  };

  const handleSelectInvoice = (invoice: Invoice) => {
    onSelect(invoice);
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
              {title || (language === 'ar' ? 'اختيار فاتورة' : 'Select Invoice')}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4" dir={getDirection()}>
          {/* Search Section */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
              <Input
                type="text"
                placeholder={language === 'ar' ? 'ابحث برقم الفاتورة أو اسم العميل...' : 'Search by invoice number or customer name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className={`${language === 'ar' ? 'pr-10' : 'pl-10'} credit-note-input`}
                data-testid="input-invoice-search"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6"
              data-testid="button-search-invoices"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                language === 'ar' ? 'بحث' : 'Search'
              )}
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">
                {language === 'ar' ? 'جاري تحميل الفواتير...' : 'Loading invoices...'}
              </span>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-800 mb-3" style={{ textAlign: getTextAlign() }}>
                {language === 'ar' ? 'نتائج البحث:' : 'Search Results:'}
              </h3>
              
              {searchResults.map((invoice) => (
                <div
                  key={invoice.invoiceNumber}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSelectInvoice(invoice)}
                  data-testid={`invoice-result-${invoice.invoiceNumber}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Invoice Number */}
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-500">
                          {language === 'ar' ? 'رقم الفاتورة' : 'Invoice No.'}
                        </p>
                        <p className="font-semibold text-purple-600">{invoice.invoiceNumber}</p>
                      </div>
                    </div>

                    {/* Customer Name */}
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">
                          {language === 'ar' ? 'اسم العميل' : 'Customer'}
                        </p>
                        <p className="font-medium text-gray-800">{invoice.customerName}</p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">
                          {language === 'ar' ? 'التاريخ' : 'Date'}
                        </p>
                        <p className="font-medium text-gray-800">{formatDate(invoice.appointmentDate)}</p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">
                          {language === 'ar' ? 'المبلغ' : 'Amount'}
                        </p>
                        <p className="font-bold text-green-600">{formatAmount(invoice.finalTotal)} SAR</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {searchQuery && searchResults.length === 0 && !isSearching && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">
                {language === 'ar' ? 'لم يتم العثور على فواتير' : 'No invoices found'}
              </p>
              <p className="text-sm">
                {language === 'ar' ? 'جرب كلمات بحث مختلفة' : 'Try different search terms'}
              </p>
            </div>
          )}

          {/* Initial State */}
          {!searchQuery && searchResults.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">
                {language === 'ar' ? 'ابحث عن فاتورة' : 'Search for an invoice'}
              </p>
              <p className="text-sm">
                {language === 'ar' ? 'أدخل رقم الفاتورة أو اسم العميل للبحث' : 'Enter invoice number or customer name to search'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
            data-testid="button-cancel-invoice-selection"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}