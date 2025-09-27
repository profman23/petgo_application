import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import { SearchActionBar } from "@/components/ui/search-action-bar";

export default function FinancialARBalance() {
  const { language } = useTranslation();
  const { toast } = useToast();
  const [lordIconKey, setLordIconKey] = useState(0);
  
  // Search functionality state
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    setLordIconKey(prev => prev + 1);
  }, []);

  // Search functionality handlers (placeholder - to be implemented)
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

        {/* A/R Balance Table Placeholder */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">
            {language === 'ar' ? 'سيتم عرض جدول رصيد الحسابات المدينة هنا' : 'A/R Balance table will be displayed here'}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}