import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { FilePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import { PaymentModal } from "@/components/PaymentModal";

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