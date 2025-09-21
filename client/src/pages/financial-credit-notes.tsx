import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { FilePlus } from 'lucide-react';
import { SearchActionBar } from '@/components/ui/search-action-bar';

export default function FinancialCreditNotes() {
  const { language } = useTranslation();
  const [searchInput, setSearchInput] = useState('');

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
    // TODO: Implement create credit note functionality
    console.log('Create Credit Note clicked');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
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

        {/* Placeholder for future content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">
              {language === 'ar' ? 'محتوى إضافي سيتم إضافته هنا' : 'Additional content will be added here'}
            </p>
            <p className="text-sm">
              {language === 'ar' ? 'يتم العمل على تطوير هذه الصفحة' : 'This page is under development'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}