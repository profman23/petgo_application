import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { FilePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import { PaymentModal } from "@/components/PaymentModal";
import { SearchActionBar } from "@/components/ui/search-action-bar";

// Declare lord-icon custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any;
    }
  }
}

export default function FinancialOutgoingPayment() {
  const [location, setLocation] = useLocation();
  const { language } = useTranslation();
  const { toast } = useToast();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Search functionality state
  const [searchInput, setSearchInput] = useState("");
  
  // Lord-icon animation trigger state
  const [triggerAnimation, setTriggerAnimation] = useState("hover");

  // Effect to trigger lord-icon animation every 1.5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setTriggerAnimation("loop");
      // Reset to hover after a brief moment
      setTimeout(() => setTriggerAnimation("hover"), 1000);
    }, 90000); // 90 seconds = 1.5 minutes

    return () => clearInterval(interval);
  }, []);

  // Create Outgoing Payment handler
  const handleCreateOutgoingPayment = () => {
    setIsCreateModalOpen(true);
  };

  // Search functionality handlers (placeholder - to be implemented)
  const handleSearchClick = () => {
    console.log('Outgoing Payment search clicked with:', searchInput);
    toast({
      title: language === 'ar' ? 'البحث' : 'Search',
      description: language === 'ar' ? `البحث عن: ${searchInput}` : `Searching for: ${searchInput}`,
    });
  };

  const handleExportClick = () => {
    console.log('Outgoing Payment export clicked');
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
            
            {/* Outgoing Payment Title */}
            <h1 className="text-2xl font-bold text-gray-600" style={{fontFamily: 'Arimo'}}>
              {language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment'}
            </h1>
          </div>

          {/* Right side - Create Outgoing Payment Button */}
          <button
            onClick={handleCreateOutgoingPayment}
            className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
            data-testid="button-create-outgoing-payment"
          >
            <FilePlus className="h-4 w-4" style={{ color: '#852085' }} />
            {language === 'ar' ? 'إنشاء دفع صادر' : 'Create Outgoing Payment'}
          </button>
        </div>

        {/* Search Action Bar */}
        <div className="mb-6">
          <SearchActionBar
            placeholder={language === 'ar' ? 'البحث بحسب اسم المستلم، رقم الهاتف، رقم الدفع، أو تاريخ الدفع' : 'Search by recipient name, phone number, payment number, or payment date'}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearchClick={handleSearchClick}
            onExportClick={handleExportClick}
            inputTestId="input-search-outgoing-payments"
            searchButtonTestId="button-search-outgoing-payments"
            exportButtonTestId="button-export-outgoing-payments"
          />
        </div>

        {/* Payments Table Placeholder */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">
            {language === 'ar' ? 'سيتم عرض جدول المدفوعات الصادرة هنا' : 'Outgoing payments table will be displayed here'}
          </p>
        </div>
        </div>

        {/* Create Outgoing Payment Modal */}
        <PaymentModal 
          variant="outgoing"
          isOpen={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
        />
      </div>
    </AdminLayout>
  );
}