import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import { SearchActionBar } from "@/components/ui/search-action-bar";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// AR Balance data interface
interface ARBalanceData {
  customerId: number;
  customerName: string;
  phone: string;
  balance: string;
}

// Transaction detail interface
interface TransactionDetail {
  type: string;
  description: string;
  amount: number;
  date: string | null;
  documentNumber: string | null;
  runningBalance: string;
}

export default function FinancialARBalance() {
  const { language } = useTranslation();
  const { toast } = useToast();
  const [lordIconKey, setLordIconKey] = useState(0);
  
  // Search functionality state
  const [searchInput, setSearchInput] = useState("");
  
  // Modal state
  const [selectedCustomer, setSelectedCustomer] = useState<ARBalanceData | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  useEffect(() => {
    setLordIconKey(prev => prev + 1);
  }, []);

  // Fetch AR Balance data
  const { data: arBalanceData = [], isLoading } = useQuery<ARBalanceData[]>({
    queryKey: ['/api/admin/ar-balance'],
    enabled: true
  });

  // Fetch transaction details for selected customer
  const { data: transactionDetails = [], isLoading: isLoadingDetails } = useQuery<TransactionDetail[]>({
    queryKey: ['/api/admin/ar-balance/details', selectedCustomer?.customerId],
    enabled: !!selectedCustomer?.customerId
  });

  // Filter data based on search input
  const filteredData = arBalanceData.filter((customer: ARBalanceData) => {
    if (!searchInput) return true;
    const searchLower = searchInput.toLowerCase();
    return (
      customer.customerName?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.balance?.toString().includes(searchLower)
    );
  });

  // Search functionality handlers
  const handleSearchClick = () => {
    // Search is handled by the filter above
    toast({
      title: language === 'ar' ? 'البحث' : 'Search',
      description: language === 'ar' ? `تم العثور على ${filteredData.length} نتيجة` : `Found ${filteredData.length} results`,
    });
  };

  const handleExportClick = () => {
    console.log('A/R Balance export clicked');
    toast({
      title: language === 'ar' ? 'تصدير' : 'Export',
      description: language === 'ar' ? 'سيتم تنفيذ وظيفة التصدير قريباً' : 'Export functionality will be implemented soon',
    });
  };

  // Handle row click to show transaction details
  const handleRowClick = (customer: ARBalanceData) => {
    setSelectedCustomer(customer);
    setShowTransactionModal(true);
  };

  // Define columns for the AR Balance table
  const columns: DataTableColumn<ARBalanceData>[] = [
    {
      key: 'customerName',
      label: { ar: 'اسم العميل', en: 'Customer Name' },
      render: (customer) => (
        <span className="font-medium text-gray-900">{customer.customerName || 'N/A'}</span>
      )
    },
    {
      key: 'phone',
      label: { ar: 'رقم الهاتف', en: 'Phone' },
      render: (customer) => (
        <span className="text-gray-600">{customer.phone || 'N/A'}</span>
      )
    },
    {
      key: 'balance',
      label: { ar: 'الرصيد', en: 'Balance' },
      render: (customer) => {
        const balance = parseFloat(customer.balance || '0');
        const isPositive = balance >= 0;
        return (
          <span className={`font-semibold ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {language === 'ar' ? `${Math.abs(balance).toFixed(2)} ر.س` : `${Math.abs(balance).toFixed(2)} SAR`}
            {balance < 0 && ' (CR)'}
          </span>
        );
      }
    }
  ];

  return (
    <AdminLayout>
      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Content Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {/* Lord Icon */}
            <script src="https://cdn.lordicon.com/lordicon.js"></script>
            <lord-icon
              key={lordIconKey}
              src="https://cdn.lordicon.com/mrniyolg.json"
              trigger="hover"
              colors="primary:#852085,secondary:#848484"
              style={{width:'80px',height:'80px'}}
            />
            
            {/* Page Title */}
            <div>
              <h1 
                className="text-2xl font-bold text-gray-600"
                style={{ fontFamily: 'Arimo' }}
              >
                {language === 'ar' ? 'رصيد الحسابات المدينة' : 'A/R Balance'}
              </h1>
            </div>
          </div>
        </div>

        {/* Search Action Bar */}
        <div className="mb-6">
          <SearchActionBar
            placeholder={language === 'ar' ? 'البحث بحسب اسم العميل، رقم الهاتف، رقم الحساب، أو الرصيد' : 'Search by customer name, phone number, account number, or balance amount'}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchClick={handleSearchClick}
            onExportClick={handleExportClick}
            inputTestId="input-search-ar-balance"
            searchButtonTestId="button-search-ar-balance"
            exportButtonTestId="button-export-ar-balance"
          />
        </div>

        {/* A/R Balance Table */}
        <DataTable
          data={filteredData}
          columns={columns}
          keyField="customerId"
          isLoading={isLoading}
          loadingText={{ ar: 'جاري تحميل بيانات الحسابات المدينة...', en: 'Loading AR Balance data...' }}
          emptyStateText={{ ar: 'لا توجد حسابات مدينة', en: 'No AR Balance records found' }}
          emptySearchText={{ ar: 'لا توجد نتائج مطابقة لبحثك', en: 'No results match your search' }}
          showEmptySearch={searchInput.length > 0 && filteredData.length === 0}
          onRowClick={handleRowClick}
          rowTestId="row-ar-balance"
          hover={true}
          className="bg-white rounded-lg shadow"
        />

        {/* Transaction Details Modal */}
        <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
          <DialogContent className="max-w-4xl max-h-[80vh]" data-testid="modal-transaction-details">
            <DialogHeader>
              <DialogTitle className="text-left">
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-semibold">
                    {language === 'ar' ? 'تفاصيل المعاملات' : 'Transaction Details'}
                  </span>
                  {selectedCustomer && (
                    <span className="text-sm text-gray-600">
                      {language === 'ar' ? 'العميل:' : 'Customer:'} {selectedCustomer.customerName} ({selectedCustomer.phone})
                    </span>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {isLoadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-gray-500">
                      {language === 'ar' ? 'جاري تحميل التفاصيل...' : 'Loading details...'}
                    </span>
                  </div>
                ) : transactionDetails.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left border-b text-sm font-medium text-gray-700">
                            {language === 'ar' ? 'النوع' : 'Type'}
                          </th>
                          <th className="px-4 py-2 text-left border-b text-sm font-medium text-gray-700">
                            {language === 'ar' ? 'الوصف' : 'Description'}
                          </th>
                          <th className="px-4 py-2 text-left border-b text-sm font-medium text-gray-700">
                            {language === 'ar' ? 'التاريخ' : 'Date'}
                          </th>
                          <th className="px-4 py-2 text-right border-b text-sm font-medium text-gray-700">
                            {language === 'ar' ? 'المبلغ' : 'Amount'}
                          </th>
                          <th className="px-4 py-2 text-right border-b text-sm font-medium text-gray-700">
                            {language === 'ar' ? 'الرصيد الجاري' : 'Running Balance'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactionDetails.map((transaction: TransactionDetail, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 border-b text-sm text-gray-900">
                              {transaction.type}
                            </td>
                            <td className="px-4 py-2 border-b text-sm text-gray-600">
                              {transaction.description}
                            </td>
                            <td className="px-4 py-2 border-b text-sm text-gray-600">
                              {transaction.date ? new Date(transaction.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                            </td>
                            <td className={`px-4 py-2 border-b text-sm text-right font-medium ${
                              transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 border-b text-sm text-right font-semibold text-gray-900">
                              {transaction.runningBalance}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-gray-500">
                      {language === 'ar' ? 'لا توجد معاملات' : 'No transactions found'}
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}