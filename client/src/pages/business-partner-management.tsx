import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useTranslation, getDirection } from "@/lib/i18n";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import { FilePlus } from "lucide-react";
import { SearchActionBar } from "@/components/ui/search-action-bar";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";

// Customer data type from backend API
interface CustomerData {
  userId: number;
  userName: string;
  userPhone: string;
  userEmail: string;
  patientId: number | null;
  patientType: string;
  patientName: string;
}

// Declare lord-icon custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any;
    }
  }
}

export default function BusinessPartnerManagement() {
  const [, setLocation] = useLocation();
  const { language } = useTranslation();
  const [selectedPartnerType, setSelectedPartnerType] = useState<'customer' | 'supplier'>('customer');
  const [triggerAnimation, setTriggerAnimation] = useState('loop');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch current user's permissions
  const {
    data: currentUserPermissions,
    isLoading: permissionsLoading
  } = useQuery({
    queryKey: ['/api/admin/current-user-permissions'],
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Route guard - redirect if user doesn't have permission to access Partner Management page
  useEffect(() => {
    if (!permissionsLoading && currentUserPermissions?.rolePermissions?.PartnerManagement?.noPermission === true) {
      setLocation('/admin-home');
    }
  }, [currentUserPermissions, permissionsLoading, setLocation]);

  const getButtonText = () => {
    if (selectedPartnerType === 'customer') {
      return language === 'ar' 
        ? 'إنشاء البيانات الرئيسية لعميل الأعمال' 
        : 'Create Customer Business Master Data';
    } else {
      return language === 'ar' 
        ? 'إنشاء البيانات الرئيسية لمورد الأعمال' 
        : 'Create Supplier Business Master Data';
    }
  };

  const getSearchPlaceholder = () => {
    const partnerType = selectedPartnerType === 'customer' 
      ? (language === 'ar' ? 'العميل' : 'customer') 
      : (language === 'ar' ? 'المورد' : 'supplier');
    
    return language === 'ar'
      ? `البحث بحسب اسم ${partnerType}، رقم الهاتف، رقم ${partnerType}، أو تاريخ الإنشاء`
      : `Search by ${partnerType} name, phone number, ${partnerType} ID, or creation date`;
  };

  const handleSearchClick = () => {
    setSearchTerm(searchInput.trim());
    console.log('Search clicked:', searchInput, 'Type:', selectedPartnerType);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const handleExportClick = () => {
    console.log('Export clicked for:', selectedPartnerType);
    // Export functionality will be implemented later
  };

  // Fetch customer data from Users and Patients tables when Customer is selected
  const { data: customersData, isLoading: isLoadingCustomers, error: customersError } = useQuery({
    queryKey: ['/api/admin/customers', searchTerm],
    queryFn: async () => {
      const url = searchTerm ? `/api/admin/customers?search=${encodeURIComponent(searchTerm)}` : '/api/admin/customers';
      const response = await apiRequest(url);
      return response;
    },
    enabled: selectedPartnerType === 'customer' // Only fetch when Customer is selected
  });

  const customers = customersData?.customers || [];

  // Pagination calculations for customers
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = customers.slice(startIndex, endIndex);
  const totalPages = Math.ceil(customers.length / itemsPerPage);

  // 🔑 Create unique keys for DataTable (customer may have multiple patients)
  const customersWithUniqueKeys = useMemo(() => {
    return paginatedCustomers.map((customer: CustomerData, index: number) => ({
      ...customer,
      rowKey: `${customer.userId}-${customer.patientId || index}`
    }));
  }, [paginatedCustomers]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Reset search when partner type changes
  useEffect(() => {
    if (selectedPartnerType === 'supplier') {
      setSearchInput('');
      setSearchTerm('');
    }
  }, [selectedPartnerType]);

  // Reset to first page when search results change
  useEffect(() => {
    setCurrentPage(1);
  }, [customers.length]);

  // 🎯 DATATABLE CONFIGURATION - Customer columns in exact current order
  const customerColumns: DataTableColumn<CustomerData>[] = [
    {
      key: 'userId',
      label: { ar: 'معرف المستخدم', en: 'User ID' },
      className: 'font-medium text-gray-900'
    },
    {
      key: 'userName',
      label: { ar: 'اسم المستخدم', en: 'User Name' },
      className: 'text-gray-500'
    },
    {
      key: 'userPhone',
      label: { ar: 'رقم الهاتف', en: 'Phone Number' },
      className: 'text-gray-500'
    },
    {
      key: 'userEmail',
      label: { ar: 'البريد الإلكتروني', en: 'Email' },
      render: (customer) => customer.userEmail || (language === 'ar' ? 'غير متوفر' : 'N/A'),
      className: 'text-gray-500'
    },
    {
      key: 'patientId',
      label: { ar: 'معرف المريض', en: 'Patient ID' },
      render: (customer) => customer.patientId || (language === 'ar' ? 'لا يوجد' : 'None'),
      className: 'text-gray-500'
    },
    {
      key: 'patientType',
      label: { ar: 'نوع المريض', en: 'Patient Type' },
      render: (customer) => customer.patientType || (language === 'ar' ? 'لا يوجد' : 'None'),
      className: 'text-gray-500'
    },
    {
      key: 'patientName',
      label: { ar: 'اسم المريض', en: 'Patient Name' },
      render: (customer) => customer.patientName || (language === 'ar' ? 'لا يوجد' : 'None'),
      className: 'text-gray-500'
    }
  ];

  return (
    <AdminLayout>
      <div className="flex-1 p-8" dir={getDirection(language)}>
        {/* Content Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {/* Lord Icon */}
            <script src="https://cdn.lordicon.com/lordicon.js"></script>
            <lord-icon
              src="https://cdn.lordicon.com/rcuovkuy.json"
              trigger={triggerAnimation}
              delay="1500"
              colors="primary:#852085,secondary:#545454"
              style={{width:'80px',height:'80px'}}
            />
            
            {/* Page Title */}
            <div>
              <h1 
                className="text-2xl font-bold text-gray-600"
                style={{ fontFamily: 'Arimo' }}
              >
                {language === 'ar' ? 'إدارة الشركاء التجاريين' : 'Business Partner Management'}
              </h1>
              <p 
                className="text-sm text-gray-500 mt-2" 
                style={{ fontFamily: 'Arimo' }}
              >
                {language === 'ar' 
                  ? 'إنشاء وإدارة البيانات الرئيسية للعملاء والموردين' 
                  : 'Create and manage master data for customers and suppliers'
                }
              </p>
            </div>
            
            {/* Radio Buttons */}
            <div className="flex items-center gap-6 ml-8">
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="businessPartnerType" 
                  value="customer"
                  checked={selectedPartnerType === 'customer'}
                  onChange={() => setSelectedPartnerType('customer')}
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
                  checked={selectedPartnerType === 'supplier'}
                  onChange={() => setSelectedPartnerType('supplier')}
                  className="text-purple-600 focus:ring-purple-500"
                  data-testid="radio-partner-supplier"
                />
                <span className="text-sm text-gray-700">
                  {language === 'ar' ? 'مورد' : 'Supplier'}
                </span>
              </label>
            </div>
          </div>

          {/* Create Button */}
          <div className="flex items-center gap-4">
            <button
              className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
              onClick={() => {
                console.log('Create new partner:', selectedPartnerType);
              }}
              data-testid="button-create-partner"
            >
              <FilePlus className="h-4 w-4" style={{ color: '#852085' }} />
              <span style={{ fontFamily: 'Arimo' }}>
                {getButtonText()}
              </span>
            </button>
          </div>
        </div>

        {/* Search Action Bar */}
        <div className="mb-6">
          <SearchActionBar
            placeholder={getSearchPlaceholder()}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchClick={handleSearchClick}
            onExportClick={handleExportClick}
            searchDisabled={selectedPartnerType === 'supplier'}
            exportDisabled={selectedPartnerType === 'supplier'}
            inputTestId="input-search-partners"
            searchButtonTestId="button-search-partners"
            exportButtonTestId="button-export-partners"
          />
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {selectedPartnerType === 'customer' ? (
            // Customer data display
            isLoadingCustomers ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600" style={{ fontFamily: 'Arimo' }}>
                  {language === 'ar' ? 'جاري تحميل بيانات العملاء...' : 'Loading customer data...'}
                </p>
              </div>
            ) : customersError ? (
              <div className="text-center py-12">
                <div className="text-red-400 mb-4">
                  <FilePlus className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-red-600 mb-2" style={{ fontFamily: 'Arimo' }}>
                  {language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading data'}
                </h3>
                <p className="text-gray-500" style={{ fontFamily: 'Arimo' }}>
                  {customersError.message || (language === 'ar' ? 'حدث خطأ أثناء تحميل بيانات العملاء' : 'An error occurred while loading customer data')}
                </p>
              </div>
            ) : customers.length > 0 ? (
              // Customer data table - Now using unified DataTable component! 🎉
              <DataTable
                data={customersWithUniqueKeys}
                columns={customerColumns}
                keyField="rowKey"
                isLoading={false}
                emptyStateText={{
                  ar: searchTerm ? 'لم يتم العثور على عملاء' : 'لا توجد بيانات عملاء حتى الآن',
                  en: searchTerm ? 'No customers found' : 'No customer data yet'
                }}
                emptySearchText={{
                  ar: 'جرب البحث بكلمات مختلفة',
                  en: 'Try searching with different terms'
                }}
                showEmptySearch={!!searchTerm}
                hover={true}
                responsive={true}
                verticalSeparators={true}
                className="bg-white"
                rowTestId="customer-row"
              />
            ) : (
              // No customers found
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <FilePlus className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2" style={{ fontFamily: 'Arimo' }}>
                  {searchTerm 
                    ? (language === 'ar' ? 'لم يتم العثور على عملاء' : 'No customers found')
                    : (language === 'ar' ? 'لا توجد بيانات عملاء حتى الآن' : 'No customer data yet')
                  }
                </h3>
                <p className="text-gray-500" style={{ fontFamily: 'Arimo' }}>
                  {searchTerm 
                    ? (language === 'ar' ? 'جرب البحث بكلمات مختلفة' : 'Try searching with different terms')
                    : (language === 'ar' ? 'لا توجد عملاء مسجلين في النظام' : 'No customers registered in the system')
                  }
                </p>
              </div>
            )
          ) : (
            // Supplier empty state (not implemented yet)
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FilePlus className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2" style={{ fontFamily: 'Arimo' }}>
                {language === 'ar' 
                  ? 'لا توجد بيانات موردين حتى الآن' 
                  : 'No supplier data yet'
                }
              </h3>
              <p className="text-gray-500" style={{ fontFamily: 'Arimo' }}>
                {language === 'ar'
                  ? 'ابدأ بإنشاء البيانات الرئيسية للموردين باستخدام الزر أعلاه'
                  : 'Start by creating supplier master data using the button above'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination Controls for Customers - Only show when customer data exists */}
        {selectedPartnerType === 'customer' && customers.length > 0 && (
          <PaginationControls
            currentCount={paginatedCustomers.length}
            filteredCount={customers.length}
            totalCount={customers.length}
            itemType="customers"
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </AdminLayout>
  );
}