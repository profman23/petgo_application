import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import { SearchActionBar } from "@/components/ui/search-action-bar";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// AR Balance data interface
interface ARBalanceData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  balance: string;
  invoiceTotal: string;
  paymentsTotal: string;
  creditNotesTotal: string;
}

// Transaction detail interface
interface TransactionDetail {
  reference: string;
  type: string;
  date: string;
  amount: string;
  debitCredit: string;
  runningBalance: string;
  booking_id: number;
}

export default function FinancialARBalance() {
  const { language } = useTranslation();
  const { toast } = useToast();
  const [lordIconKey, setLordIconKey] = useState(0);
  
  // Search functionality state
  const [searchInput, setSearchInput] = useState("");
  
  // Modal state for transaction details
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ARBalanceData | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetail[]>([]);

  useEffect(() => {
    setLordIconKey(prev => prev + 1);
  }, []);

  // Fetch AR Balance data
  const { data: arBalanceData = [], isLoading } = useQuery<ARBalanceData[]>({
    queryKey: ['/api/admin/ar-balance'],
  });

  // Filter data based on search input
  const filteredData = arBalanceData.filter(customer => 
    customer.customerName.toLowerCase().includes(searchInput.toLowerCase()) ||
    customer.customerPhone.includes(searchInput) ||
    (customer.customerEmail && customer.customerEmail.toLowerCase().includes(searchInput.toLowerCase())) ||
    customer.balance.includes(searchInput)
  );

  // Handle row click to show transaction details
  const handleRowClick = async (customer: ARBalanceData) => {
    setSelectedCustomer(customer);
    try {
      const transactions = await apiRequest(`/api/admin/ar-balance/transactions/${customer.customerPhone}`);
      setTransactionDetails(transactions);
      setIsTransactionModalOpen(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في جلب تفاصيل المعاملات' : 'Failed to fetch transaction details',
        variant: "destructive",
      });
    }
  };

  // Search functionality handlers
  const handleSearchClick = () => {
    console.log('A/R Balance search clicked with:', searchInput);
    toast({
      title: language === 'ar' ? 'البحث' : 'Search',
      description: language === 'ar' ? `البحث عن: ${searchInput}` : `Searching for: ${searchInput}`,
    });
  };

  const handleExportClick = () => {
    console.log('A/R Balance export clicked');
    toast({
      title: language === 'ar' ? 'تصدير' : 'Export',
      description: language === 'ar' ? 'سيتم تنفيذ وظيفة التصدير قريباً' : 'Export functionality will be implemented soon',
    });
  };

  // Define table columns
  const columns: DataTableColumn<ARBalanceData>[] = [
    {
      key: 'customerName',
      label: { ar: 'اسم العميل', en: 'Customer Name' },
      className: 'font-medium text-gray-900'
    },
    {
      key: 'customerPhone',
      label: { ar: 'رقم الهاتف', en: 'Phone' },
      className: 'text-gray-600'
    },
    {
      key: 'balance',
      label: { ar: 'الرصيد', en: 'Balance' },
      className: 'text-right font-semibold',
      render: (customer) => (
        <span className={`${parseFloat(customer.balance) > 0 ? 'text-red-600' : parseFloat(customer.balance) < 0 ? 'text-green-600' : 'text-gray-600'}`}>
          {customer.balance} {language === 'ar' ? 'ريال' : 'SAR'}
        </span>
      )
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
          isLoading={isLoading}
          onRowClick={handleRowClick}
          loadingText={{ ar: 'جاري تحميل رصيد الحسابات المدينة...', en: 'Loading AR Balance data...' }}
          emptyStateText={{ ar: 'لا توجد بيانات رصيد متاحة', en: 'No AR Balance data available' }}
          emptySearchText={{ ar: 'لا توجد نتائج مطابقة للبحث', en: 'No results match your search' }}
          showEmptySearch={searchInput.length > 0}
          hover={true}
          rowTestId="ar-balance-row"
        />

        {/* Transaction Details Modal */}
        <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {language === 'ar' ? 'تفاصيل المعاملات - ' : 'Transaction Details - '}
                {selectedCustomer?.customerName}
              </DialogTitle>
            </DialogHeader>
            
            {/* Customer Summary */}
            {selectedCustomer && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">{language === 'ar' ? 'الهاتف:' : 'Phone:'}</p>
                    <p className="font-medium">{selectedCustomer.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{language === 'ar' ? 'الرصيد الحالي:' : 'Current Balance:'}</p>
                    <p className={`font-bold text-lg ${parseFloat(selectedCustomer.balance) > 0 ? 'text-red-600' : parseFloat(selectedCustomer.balance) < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {selectedCustomer.balance} {language === 'ar' ? 'ريال' : 'SAR'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Details Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'المرجع' : 'Reference'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'النوع' : 'Type'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'التاريخ' : 'Date'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'المبلغ' : 'Amount'}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'مدين/دائن' : 'Dr/Cr'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'الرصيد الجاري' : 'Running Balance'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactionDetails.map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {transaction.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(transaction.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {transaction.amount} {language === 'ar' ? 'ريال' : 'SAR'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.debitCredit === 'Dr' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {transaction.debitCredit}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                        <span className={`${parseFloat(transaction.runningBalance) > 0 ? 'text-red-600' : parseFloat(transaction.runningBalance) < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {transaction.runningBalance} {language === 'ar' ? 'ريال' : 'SAR'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state for transactions */}
            {transactionDetails.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {language === 'ar' ? 'لا توجد معاملات لهذا العميل' : 'No transactions found for this customer'}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}