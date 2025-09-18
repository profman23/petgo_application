import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { FilePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import { PaymentModal } from "@/components/PaymentModal";
import { SearchActionBar } from "@/components/ui/search-action-bar";
import { DataTable, DataTableColumn, DataTableAction } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { PaginationControls } from "@/components/ui/pagination-controls";

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
  const { language } = useTranslation();
  const { toast } = useToast();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Search and pagination state
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Lord-icon animation trigger state
  const [triggerAnimation, setTriggerAnimation] = useState("hover");

  // Fetch income payments data
  const { data: incomePayments = [], isLoading } = useQuery({
    queryKey: ['/api/admin/income-payments'],
    staleTime: 5 * 60 * 1000,
  });

  // Define table columns for income payments
  const paymentColumns: DataTableColumn[] = [
    {
      key: 'incomePaymentId',
      label: { ar: 'رقم الدفعة الواردة', en: 'Income Payment No.' },
      render: (payment) => (
        <span className="font-medium text-purple-600">
          {payment.incomePaymentId}
        </span>
      ),
      className: 'font-medium text-purple-600'
    },
    {
      key: 'businessPartnerId',
      label: { ar: 'معرف العميل', en: 'Customer ID' },
      render: (payment) => payment.businessPartnerId || '-',
      className: 'text-gray-900'
    },
    {
      key: 'businessPartnerName',
      label: { ar: 'اسم العميل', en: 'Customer Name' },
      render: (payment) => payment.businessPartnerName || '-',
      className: 'text-gray-900'
    },
    {
      key: 'businessPartnerPhone',
      label: { ar: 'رقم الهاتف', en: 'Customer Phone' },
      render: (payment) => payment.businessPartnerPhone || '-',
      className: 'text-gray-500'
    },
    {
      key: 'totalAmount',
      label: { ar: 'المبلغ الإجمالي', en: 'Total Amount' },
      render: (payment) => `${payment.totalAmount} SAR`,
      className: 'text-gray-900 font-medium'
    },
    {
      key: 'actions',
      label: { ar: 'الإجراء', en: 'Action' },
      render: () => '-',
      className: 'text-gray-400 text-center'
    }
  ];

  // Define table actions (currently empty as requested)
  const paymentActions: DataTableAction[] = [
    // Empty for now as specified by user
  ];

  // Filter payments based on search input
  const filteredPayments = incomePayments.filter((payment: any) => {
    if (!searchInput.trim()) return true;
    const searchTerm = searchInput.toLowerCase();
    return (
      payment.businessPartnerName?.toLowerCase().includes(searchTerm) ||
      payment.businessPartnerPhone?.toLowerCase().includes(searchTerm) ||
      payment.incomePaymentId?.toLowerCase().includes(searchTerm) ||
      payment.documentNo?.toLowerCase().includes(searchTerm) ||
      payment.postingDate?.toLowerCase().includes(searchTerm)
    );
  });

  // Pagination logic
  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  // Reset pagination when search or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, itemsPerPage]);

  // Effect to trigger lord-icon animation every 1.5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setTriggerAnimation("loop");
      // Reset to hover after a brief moment
      setTimeout(() => setTriggerAnimation("hover"), 1000);
    }, 90000); // 90 seconds = 1.5 minutes

    return () => clearInterval(interval);
  }, []);

  // Search functionality handlers (placeholder - to be implemented)
  const handleSearchClick = () => {
    console.log('Income Payment search clicked with:', searchInput);
    toast({
      title: language === 'ar' ? 'البحث' : 'Search',
      description: language === 'ar' ? `البحث عن: ${searchInput}` : `Searching for: ${searchInput}`,
    });
  };

  const handleExportClick = () => {
    console.log('Income Payment export clicked');
    toast({
      title: language === 'ar' ? 'تصدير' : 'Export',
      description: language === 'ar' ? 'سيتم تنفيذ وظيفة التصدير قريباً' : 'Export functionality will be implemented soon',
    });
  };

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

        {/* Search Action Bar */}
        <div className="mb-6">
          <SearchActionBar
            placeholder={language === 'ar' ? 'البحث بحسب اسم العميل، رقم الهاتف، رقم الدفع، أو تاريخ الدفع' : 'Search by customer name, phone number, payment number, or payment date'}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchClick={handleSearchClick}
            onExportClick={handleExportClick}
            inputTestId="input-search-income-payments"
            searchButtonTestId="button-search-income-payments"
            exportButtonTestId="button-export-income-payments"
          />
        </div>

        {/* Income Payments Data Table */}
        <div className="bg-white rounded-lg shadow">
          <DataTable
            data={paginatedPayments}
            columns={paymentColumns}
            actions={paymentActions}
            isLoading={isLoading}
            loadingText={{ ar: 'جاري التحميل...', en: 'Loading...' }}
            emptyStateText={{ 
              ar: searchInput.trim() ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد مدفوعات واردة حتى الآن', 
              en: searchInput.trim() ? 'No income payments match your search' : 'No income payments found'
            }}
            emptySearchText={{ ar: 'جرب مصطلحات بحث مختلفة', en: 'Try different search terms' }}
            verticalSeparators={true}
            showEmptySearch={searchInput.trim().length > 0}
            hover={true}
            responsive={true}
            className="bg-white rounded-lg shadow"
            rowTestId="income-payment-row"
          />
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                language={language}
              />
            </div>
          )}
        </div>

        </div>

        {/* Create Income Payment Modal */}
        <PaymentModal 
          variant="income"
          isOpen={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
        />
      </div>
    </AdminLayout>
  );
}