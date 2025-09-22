import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { FilePlus, Eye, FileText, MapPin } from 'lucide-react';
import { SearchActionBar } from '@/components/ui/search-action-bar';
import { AdminLayout } from '@/components/admin-layout/AdminLayout';
import { CreditNoteModal } from '@/components/CreditNoteModal';
import { useQuery } from '@tanstack/react-query';
import { DataTable, DataTableColumn, DataTableAction } from '@/components/ui/data-table';

export default function FinancialCreditNotes() {
  const { language } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  
  // Fetch credit notes data
  const { data: creditNotes = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['/api/admin/credit-notes'],
    retry: false,
  });

  // Add lord-icon script to head when component mounts
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.lordicon.com/lordicon.js';
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script when component unmounts
      const existingScript = document.querySelector('script[src="https://cdn.lordicon.com/lordicon.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const handleSearchClick = () => {
    // TODO: Implement search functionality
    console.log('Search clicked with:', searchInput);
  };

  const handleExportToExcel = () => {
    // TODO: Implement export functionality
    console.log('Export to Excel clicked');
  };

  const handleCreateCreditNote = () => {
    setIsCreditNoteModalOpen(true);
  };
  
  const handleCreditNoteCreated = () => {
    // Refresh the data when a new credit note is created
    refetch();
  };
  
  const handleSelectCreditNote = (creditNote: any) => {
    // Handle credit note selection if needed
    console.log('Selected credit note:', creditNote);
  };
  
  const handleViewCreditNote = (creditNote: any) => {
    console.log('View credit note:', creditNote);
  };
  
  const handlePrintCreditNote = (creditNote: any) => {
    console.log('Print credit note:', creditNote);
  };
  
  const handleMapCreditNote = (creditNote: any) => {
    console.log('Map credit note:', creditNote);
  };
  
  // Define table columns for credit notes
  const creditNoteColumns: DataTableColumn[] = [
    {
      key: 'creditNoteNumber',
      label: { ar: 'رقم إشعار دائن', en: 'Credit Note No' },
      render: (creditNote) => (
        <span className="font-semibold text-purple-600">
          CRN{creditNote.creditNoteNumber}
        </span>
      ),
      className: 'font-semibold text-purple-600'
    },
    {
      key: 'customerName',
      label: { ar: 'اسم العميل', en: 'Customer Name' },
      render: (creditNote) => creditNote.customerName || '-',
      className: 'text-gray-900'
    },
    {
      key: 'customerPhone',
      label: { ar: 'رقم الهاتف', en: 'Phone Number' },
      render: (creditNote) => creditNote.customerPhone || '-',
      className: 'text-gray-600'
    },
    {
      key: 'postingDate',
      label: { ar: 'تاريخ الترحيل', en: 'Posting Date' },
      render: (creditNote) => {
        const date = new Date(creditNote.postingDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      },
      className: 'text-gray-600'
    },
    {
      key: 'totalAfterVAT',
      label: { ar: 'المبلغ', en: 'Amount' },
      render: (creditNote) => {
        const amount = typeof creditNote.totalAfterVAT === 'string' 
          ? parseFloat(creditNote.totalAfterVAT) 
          : creditNote.totalAfterVAT;
        return `${(isNaN(amount) ? 0 : amount).toFixed(2)} SAR`;
      },
      className: 'text-green-600 font-medium'
    },
    {
      key: 'status',
      label: { ar: 'الحالة', en: 'Status' },
      render: (creditNote) => (
        <span className="text-blue-600 font-medium">
          {creditNote.status || 'Open'}
        </span>
      ),
      className: 'text-blue-600 font-medium'
    }
  ];
  
  // Define table actions for credit notes
  const creditNoteActions: DataTableAction[] = [
    {
      label: { ar: 'عرض', en: 'View' },
      onClick: handleViewCreditNote,
      className: 'text-purple-600 hover:text-purple-900 transition-colors duration-200',
      icon: <Eye className="h-4 w-4" />
    },
    {
      label: { ar: 'طباعة', en: 'Print' },
      onClick: handlePrintCreditNote,
      className: 'text-blue-600 hover:text-blue-900 transition-colors duration-200',
      icon: <FileText className="h-4 w-4" />
    },
    {
      label: { ar: 'خريطة', en: 'Map' },
      onClick: handleMapCreditNote,
      className: 'text-green-600 hover:text-green-900 transition-colors duration-200',
      icon: <MapPin className="h-4 w-4" />
    }
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          {/* Left side - Lord Icon and Title */}
          <div className="flex items-center gap-4">
            {/* Lord Icon */}
            <div className="flex-shrink-0">
              <div 
                dangerouslySetInnerHTML={{
                  __html: '<lord-icon src="https://cdn.lordicon.com/lbrbofig.json" trigger="loop" delay="1500" colors="primary:#852085,secondary:#848484" style="width:80px;height:80px"></lord-icon>'
                }}
              />
            </div>
            
            {/* Credit Notes Title */}
            <h1 className="text-2xl font-bold text-gray-600" style={{fontFamily: 'Arimo'}}>
              {language === 'ar' ? 'إشعارات دائنة' : 'Credit Notes'}
            </h1>
          </div>

          {/* Right side - Create Credit Note Button */}
          <button
            onClick={handleCreateCreditNote}
            className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 bg-white hover:bg-purple-50"
            style={{ 
              borderColor: '#852085', 
              color: '#852085'
            }}
            data-testid="button-create-credit-note"
          >
            <FilePlus className="h-4 w-4" style={{ color: '#852085' }} />
            {language === 'ar' ? 'إنشاء إشعار دائن' : 'Create Credit Note'}
          </button>
        </div>

        {/* Search Action Bar */}
        <div className="mb-6">
          <SearchActionBar
            placeholder={language === 'ar' ? 'البحث بحسب اسم العميل، رقم الهاتف، رقم الفاتورة، رقم مذكرة الائتمان، أو تاريخ النشر' : 'Search by customer name, phone number, invoice number, credit note number, or posting date'}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchClick={handleSearchClick}
            onExportClick={handleExportToExcel}
            exportDisabled={false}
            inputTestId="input-search-credit-notes"
            searchButtonTestId="button-search-credit-notes"
            exportButtonTestId="button-export-credit-notes"
          />
        </div>

        {/* Credit Notes DataTable */}
        <DataTable
          data={creditNotes}
          columns={creditNoteColumns}
          actions={creditNoteActions}
          isLoading={isLoading}
          loadingText={{ ar: 'جاري التحميل...', en: 'Loading...' }}
          emptyStateText={{ ar: 'لا توجد إشعارات دائنة', en: 'No credit notes available' }}
          verticalSeparators={true}
          hover={true}
          responsive={true}
          className="bg-white rounded-lg shadow"
          rowTestId="credit-note-row"
          keyField="creditNoteNumber"
        />
      </div>

      {/* Credit Note Modal */}
      <CreditNoteModal
        isOpen={isCreditNoteModalOpen}
        onOpenChange={setIsCreditNoteModalOpen}
        onCreditNoteCreated={handleCreditNoteCreated}
      />
    </AdminLayout>
  );
}