import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { FilePlus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function BusinessPartnerManagement() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const [selectedPartnerType, setSelectedPartnerType] = useState<'customer' | 'supplier'>('customer');
  const [triggerAnimation, setTriggerAnimation] = useState('hover');

  // Animate icon every 1.5 minutes (90 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setTriggerAnimation('morph');
      setTimeout(() => setTriggerAnimation('hover'), 1000);
    }, 90000); // 1.5 minutes = 90,000 milliseconds

    return () => clearInterval(interval);
  }, []);

  const getDirection = (lang: string) => lang === 'ar' ? 'rtl' : 'ltr';

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

  return (
    <div className="min-h-screen bg-gray-50" dir={getDirection(language)}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          {/* Left side - Lord Icon and Title */}
          <div className="flex items-center gap-4">
            {/* Lord Icon */}
            <div className="flex-shrink-0">
              <lord-icon 
                src="https://cdn.lordicon.com/rcuovkuy.json" 
                trigger={triggerAnimation}
                style={{ width: '80px', height: '80px' }}
              />
            </div>
            
            {/* Business Partner Management Title */}
            <h1 className="text-2xl font-bold text-gray-600" style={{fontFamily: 'Arimo'}}>
              {language === 'ar' ? 'إدارة شريك الأعمال' : 'Business Partner Management'}
            </h1>
          </div>

          {/* Right side - Business Partner Type Selection */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              {language === 'ar' ? 'شريك الأعمال:' : 'Business Partner:'}
            </span>
            <select
              value={selectedPartnerType}
              onChange={(e) => setSelectedPartnerType(e.target.value as 'customer' | 'supplier')}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-600 focus:border-purple-600 bg-white"
              data-testid="select-partner-type"
            >
              <option value="customer">
                {language === 'ar' ? 'عميل' : 'Customer'}
              </option>
              <option value="supplier">
                {language === 'ar' ? 'مورد' : 'Supplier'}
              </option>
            </select>
          </div>
        </div>

        {/* Create Business Master Data Button */}
        <button
          onClick={() => {
            // Placeholder for now - no functionality
          }}
          className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
          data-testid="button-create-business-master-data"
        >
          <FilePlus className="h-4 w-4" style={{ color: '#852085' }} />
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}