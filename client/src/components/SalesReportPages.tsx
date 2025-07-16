import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BarChart3, Calendar, TrendingUp, Car, Stethoscope, DollarSign, Clock, FileText } from "lucide-react";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";

// Invoice Card Component
const InvoiceCard = ({ invoice, language }: { invoice: any; language: string }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {language === 'ar' ? 'فاتورة رقم:' : 'Invoice #'} {invoice.invoiceNumber}
          </h3>
          <p className="text-sm text-gray-600">
            {language === 'ar' ? 'العميل:' : 'Customer:'} {invoice.customerName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-purple-600">
            {parseFloat(invoice.finalTotal).toFixed(2)} SAR
          </p>
          <p className="text-xs text-gray-500">
            {new Date(invoice.appointmentDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
          <span className="font-medium ml-2">{parseFloat(invoice.subtotal).toFixed(2)} SAR</span>
        </div>
        <div>
          <span className="text-gray-500">{language === 'ar' ? 'الضريبة:' : 'Tax:'}</span>
          <span className="font-medium ml-2">{parseFloat(invoice.vatAmount).toFixed(2)} SAR</span>
        </div>
      </div>
    </div>
  );
};

// All Invoices Page
const AllInvoicesPage = ({ language, generatedInvoices, isLoadingInvoices }: { 
  language: string; 
  generatedInvoices: any[];
  isLoadingInvoices: boolean;
}) => {
  if (isLoadingInvoices) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          {language === 'ar' ? 'جميع الفواتير' : 'All Invoices'}
        </h4>
        <p className="text-sm text-gray-600">
          {language === 'ar' ? 'جميع الفواتير المولدة في النظام' : 'All generated invoices in the system'}
        </p>
      </div>

      {generatedInvoices && generatedInvoices.length > 0 ? (
        <div className="space-y-4">
          {generatedInvoices.map((invoice) => (
            <InvoiceCard 
              key={invoice.id} 
              invoice={invoice} 
              language={language}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد فواتير' : 'No Invoices'}
          </h3>
          <p className="text-gray-500">
            {language === 'ar' ? 'لم يتم إنشاء أي فواتير بعد' : 'No invoices have been generated yet'}
          </p>
        </div>
      )}
    </div>
  );
};

// Daily Report Page
const DailyReportPage = ({ language, generatedInvoices }: { language: string; generatedInvoices: any[] }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayInvoices = generatedInvoices?.filter(invoice => 
    new Date(invoice.appointmentDate).toISOString().split('T')[0] === today
  ) || [];

  const totalSales = todayInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.finalTotal), 0);
  const totalTax = todayInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.vatAmount), 0);

  return (
    <div>
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          {language === 'ar' ? 'التقرير اليومي' : 'Daily Report'}
        </h4>
        <p className="text-sm text-gray-600">
          {language === 'ar' ? 'مبيعات اليوم الحالي' : 'Today\'s sales report'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-1">
              <h4 className="text-sm font-medium opacity-90">
                {language === 'ar' ? 'عدد الفواتير' : 'Total Invoices'}
              </h4>
              <p className="text-2xl font-bold">{todayInvoices.length}</p>
            </div>
            <FileText className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-1">
              <h4 className="text-sm font-medium opacity-90">
                {language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}
              </h4>
              <p className="text-2xl font-bold">{totalSales.toFixed(2)} SAR</p>
            </div>
            <DollarSign className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-1">
              <h4 className="text-sm font-medium opacity-90">
                {language === 'ar' ? 'إجمالي الضرائب' : 'Total Tax'}
              </h4>
              <p className="text-2xl font-bold">{totalTax.toFixed(2)} SAR</p>
            </div>
            <TrendingUp className="h-8 w-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Today's Invoices */}
      {todayInvoices.length > 0 ? (
        <div className="space-y-4">
          <h5 className="text-md font-medium text-gray-900">
            {language === 'ar' ? 'فواتير اليوم' : 'Today\'s Invoices'}
          </h5>
          {todayInvoices.map((invoice) => (
            <InvoiceCard 
              key={invoice.id} 
              invoice={invoice} 
              language={language}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد مبيعات اليوم' : 'No Sales Today'}
          </h3>
          <p className="text-gray-500">
            {language === 'ar' ? 'لا توجد فواتير لهذا اليوم' : 'No invoices for today'}
          </p>
        </div>
      )}
    </div>
  );
};

// Monthly Report Page
const MonthlyReportPage = ({ language, generatedInvoices }: { language: string; generatedInvoices: any[] }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyInvoices = generatedInvoices?.filter(invoice => {
    const invoiceDate = new Date(invoice.appointmentDate);
    return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
  }) || [];

  const totalSales = monthlyInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.finalTotal), 0);
  const totalTax = monthlyInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.vatAmount), 0);
  const averageSale = monthlyInvoices.length > 0 ? totalSales / monthlyInvoices.length : 0;

  return (
    <div>
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          {language === 'ar' ? 'التقرير الشهري' : 'Monthly Report'}
        </h4>
        <p className="text-sm text-gray-600">
          {language === 'ar' ? 'مبيعات الشهر الحالي' : 'Current month sales report'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-1">
              <h4 className="text-sm font-medium opacity-90">
                {language === 'ar' ? 'عدد الفواتير' : 'Total Invoices'}
              </h4>
              <p className="text-2xl font-bold">{monthlyInvoices.length}</p>
            </div>
            <FileText className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-1">
              <h4 className="text-sm font-medium opacity-90">
                {language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}
              </h4>
              <p className="text-2xl font-bold">{totalSales.toFixed(2)} SAR</p>
            </div>
            <DollarSign className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-1">
              <h4 className="text-sm font-medium opacity-90">
                {language === 'ar' ? 'متوسط الفاتورة' : 'Average Sale'}
              </h4>
              <p className="text-2xl font-bold">{averageSale.toFixed(2)} SAR</p>
            </div>
            <TrendingUp className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-1">
              <h4 className="text-sm font-medium opacity-90">
                {language === 'ar' ? 'إجمالي الضرائب' : 'Total Tax'}
              </h4>
              <p className="text-2xl font-bold">{totalTax.toFixed(2)} SAR</p>
            </div>
            <BarChart3 className="h-8 w-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Monthly Invoices */}
      {monthlyInvoices.length > 0 ? (
        <div className="space-y-4">
          <h5 className="text-md font-medium text-gray-900">
            {language === 'ar' ? 'فواتير هذا الشهر' : 'This Month\'s Invoices'}
          </h5>
          {monthlyInvoices.map((invoice) => (
            <InvoiceCard 
              key={invoice.id} 
              invoice={invoice} 
              language={language}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد مبيعات هذا الشهر' : 'No Sales This Month'}
          </h3>
          <p className="text-gray-500">
            {language === 'ar' ? 'لا توجد فواتير لهذا الشهر' : 'No invoices for this month'}
          </p>
        </div>
      )}
    </div>
  );
};

// VetsVan Report Page
const VetsVanReportPage = ({ language, generatedInvoices }: { language: string; generatedInvoices: any[] }) => {
  // Group invoices by VetsVan
  const vetsVanSales = generatedInvoices?.reduce((acc, invoice) => {
    const vetsVanCode = invoice.vetsvanCode || 'Unknown';
    if (!acc[vetsVanCode]) {
      acc[vetsVanCode] = {
        code: vetsVanCode,
        name: invoice.vetsvanName || 'Unknown VetsVan',
        invoices: [],
        totalSales: 0,
        totalTax: 0
      };
    }
    acc[vetsVanCode].invoices.push(invoice);
    acc[vetsVanCode].totalSales += parseFloat(invoice.finalTotal);
    acc[vetsVanCode].totalTax += parseFloat(invoice.vatAmount);
    return acc;
  }, {} as any) || {};

  const vetsVanList = Object.values(vetsVanSales);

  return (
    <div>
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          {language === 'ar' ? 'تقرير حسب VETS VAN' : 'VetsVan Report'}
        </h4>
        <p className="text-sm text-gray-600">
          {language === 'ar' ? 'مبيعات كل سيارة VETS VAN' : 'Sales report by each VetsVan vehicle'}
        </p>
      </div>

      {vetsVanList.length > 0 ? (
        <div className="space-y-6">
          {vetsVanList.map((vetsVan: any) => (
            <div key={vetsVan.code} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Car className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold text-gray-900">{vetsVan.code}</h5>
                    <p className="text-sm text-gray-600">{vetsVan.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-purple-600">
                    {vetsVan.totalSales.toFixed(2)} SAR
                  </p>
                  <p className="text-sm text-gray-500">
                    {vetsVan.invoices.length} {language === 'ar' ? 'فاتورة' : 'invoices'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-500">{language === 'ar' ? 'إجمالي الضرائب:' : 'Total Tax:'}</span>
                  <span className="font-medium ml-2">{vetsVan.totalTax.toFixed(2)} SAR</span>
                </div>
                <div>
                  <span className="text-gray-500">{language === 'ar' ? 'متوسط الفاتورة:' : 'Average Invoice:'}</span>
                  <span className="font-medium ml-2">
                    {(vetsVan.totalSales / vetsVan.invoices.length).toFixed(2)} SAR
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد بيانات' : 'No Data Available'}
          </h3>
          <p className="text-gray-500">
            {language === 'ar' ? 'لا توجد مبيعات لأي VETS VAN' : 'No sales data for any VetsVan'}
          </p>
        </div>
      )}
    </div>
  );
};

// Service Report Page  
const ServiceReportPage = ({ language, generatedInvoices }: { language: string; generatedInvoices: any[] }) => {
  // Group invoices by service type
  const serviceSales = generatedInvoices?.reduce((acc, invoice) => {
    const serviceType = invoice.serviceType || 'general_checkup';
    if (!acc[serviceType]) {
      acc[serviceType] = {
        type: serviceType,
        invoices: [],
        totalSales: 0,
        totalTax: 0
      };
    }
    acc[serviceType].invoices.push(invoice);
    acc[serviceType].totalSales += parseFloat(invoice.finalTotal);
    acc[serviceType].totalTax += parseFloat(invoice.vatAmount);
    return acc;
  }, {} as any) || {};

  const serviceList = Object.values(serviceSales);

  const getServiceName = (serviceType: string) => {
    switch(serviceType) {
      case 'general_checkup':
        return language === 'ar' ? 'كشف عام' : 'General Check Up';
      case 'grooming':
        return language === 'ar' ? 'تنظيف' : 'Grooming';
      default:
        return serviceType;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          {language === 'ar' ? 'تقرير حسب الخدمة' : 'Service Report'}
        </h4>
        <p className="text-sm text-gray-600">
          {language === 'ar' ? 'مبيعات كل نوع خدمة' : 'Sales report by service type'}
        </p>
      </div>

      {serviceList.length > 0 ? (
        <div className="space-y-6">
          {serviceList.map((service: any) => (
            <div key={service.type} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold text-gray-900">
                      {getServiceName(service.type)}
                    </h5>
                    <p className="text-sm text-gray-600">
                      {service.invoices.length} {language === 'ar' ? 'فاتورة' : 'invoices'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-600">
                    {service.totalSales.toFixed(2)} SAR
                  </p>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'إجمالي المبيعات' : 'Total Sales'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-500">{language === 'ar' ? 'إجمالي الضرائب:' : 'Total Tax:'}</span>
                  <span className="font-medium ml-2">{service.totalTax.toFixed(2)} SAR</span>
                </div>
                <div>
                  <span className="text-gray-500">{language === 'ar' ? 'متوسط الفاتورة:' : 'Average Invoice:'}</span>
                  <span className="font-medium ml-2">
                    {(service.totalSales / service.invoices.length).toFixed(2)} SAR
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد بيانات' : 'No Data Available'}
          </h3>
          <p className="text-gray-500">
            {language === 'ar' ? 'لا توجد مبيعات لأي خدمة' : 'No sales data for any service'}
          </p>
        </div>
      )}
    </div>
  );
};

// Main Sales Report Component with Multi Page Route
export const SalesReportPages = ({ 
  language, 
  generatedInvoices, 
  isLoadingInvoices 
}: { 
  language: string; 
  generatedInvoices: any[];
  isLoadingInvoices: boolean;
}) => {
  const [activePage, setActivePage] = useState('all');

  const pages = [
    { id: 'all', nameAr: 'جميع الفواتير', nameEn: 'All Invoices', icon: FileText },
    { id: 'daily', nameAr: 'التقرير اليومي', nameEn: 'Daily Report', icon: Calendar },
    { id: 'monthly', nameAr: 'التقرير الشهري', nameEn: 'Monthly Report', icon: BarChart3 },
    { id: 'vetsvan', nameAr: 'تقرير VETS VAN', nameEn: 'VetsVan Report', icon: Car },
    { id: 'service', nameAr: 'تقرير الخدمات', nameEn: 'Service Report', icon: Stethoscope }
  ];

  const renderActivePage = () => {
    switch(activePage) {
      case 'all':
        return <AllInvoicesPage 
          language={language} 
          generatedInvoices={generatedInvoices} 
          isLoadingInvoices={isLoadingInvoices} 
        />;
      case 'daily':
        return <DailyReportPage language={language} generatedInvoices={generatedInvoices} />;
      case 'monthly':
        return <MonthlyReportPage language={language} generatedInvoices={generatedInvoices} />;
      case 'vetsvan':
        return <VetsVanReportPage language={language} generatedInvoices={generatedInvoices} />;
      case 'service':
        return <ServiceReportPage language={language} generatedInvoices={generatedInvoices} />;
      default:
        return <AllInvoicesPage 
          language={language} 
          generatedInvoices={generatedInvoices} 
          isLoadingInvoices={isLoadingInvoices} 
        />;
    }
  };

  return (
    <div dir={getDirection(language)}>
      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
            {pages.map((page) => {
              const Icon = page.icon;
              return (
                <button
                  key={page.id}
                  onClick={() => setActivePage(page.id)}
                  className={`whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activePage === page.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  style={{ textAlign: getTextAlign(language) }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{language === 'ar' ? page.nameAr : page.nameEn}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Active Page Content */}
      <div>
        {renderActivePage()}
      </div>
    </div>
  );
};