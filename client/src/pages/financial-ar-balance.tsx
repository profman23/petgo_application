import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import { SearchActionBar } from "@/components/ui/search-action-bar";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { TransactionDetailsModal } from "@/components/TransactionDetailsModal";

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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

  // Handle modal close
  const handleCloseModal = () => {
    setShowTransactionModal(false);
    setSelectedCustomer(null);
  };

  // Filter data based on search input
  const filteredData = arBalanceData.filter((customer: ARBalanceData) => {
    if (!searchInput) return true;
    const searchLower = searchInput.toLowerCase();
    return (
      customer.customerId?.toString().includes(searchLower) ||
      customer.customerName?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.balance?.toString().includes(searchLower)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput]);

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
      key: 'customerId',
      label: { ar: 'معرف العميل', en: 'Customer ID' },
      render: (customer) => (
        <span className="font-mono text-sm text-gray-600">{customer.customerId || 'N/A'}</span>
      )
    },
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
              trigger="loop"
              delay="1500"
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
            placeholder={language === 'ar' ? 'البحث بحسب معرف العميل، اسم العميل، رقم الهاتف، أو الرصيد' : 'Search by customer ID, customer name, phone number, or balance amount'}
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
          data={paginatedData}
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

        {/* Pagination Controls */}
        <PaginationControls
          currentCount={paginatedData.length}
          filteredCount={filteredData.length}
          totalCount={arBalanceData.length}
          itemType="customers"
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        {/* Transaction Details Modal */}
        <TransactionDetailsModal
          customerId={selectedCustomer?.customerId ?? null}
          customerName={selectedCustomer?.customerName ?? ''}
          isOpen={showTransactionModal}
          onClose={handleCloseModal}
        />
      </div>
    </AdminLayout>
  );
}