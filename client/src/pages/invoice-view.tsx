import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/i18n';
import { InvoiceGeneratorProfessional } from '@/components/InvoiceGeneratorProfessional';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Download, Eye } from 'lucide-react';

const InvoiceView = () => {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [invoiceStatus, setInvoiceStatus] = useState<any>(null);

  // Extract booking ID from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('bookingId');
    if (id) {
      setBookingId(id);
    }
  }, []);

  // Fetch invoice data
  const { data: invoiceData, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice-view', bookingId],
    queryFn: async () => {
      const response = await apiRequest(`/api/invoice-view/${bookingId}`);
      // Ensure invoice number is set
      if (response && !response.invoiceNumber && response.booking) {
        response.invoiceNumber = response.booking.invoiceNumber || `VETSVAN-${bookingId}`;
      }
      return response;
    },
    enabled: !!bookingId
  });

  const booking = invoiceData?.booking;
  const items = invoiceData?.invoiceItems || [];
  const isGenerated = invoiceData?.isGenerated || false;

  useEffect(() => {
    if (items) {
      setInvoiceItems(items);
    }
  }, [items]);

  useEffect(() => {
    if (invoiceData?.invoiceStatus) {
      setInvoiceStatus(invoiceData.invoiceStatus);
    }
  }, [invoiceData]);

  useEffect(() => {
    if (booking) {
      // Set doctor info based on booking
      const doctorData = {
        name: booking.vetsVan?.name || 'VETS VAN Doctor',
        license: 'VET-2024-001',
        specialty: language === 'ar' ? 'طب بيطري عام' : 'General Veterinary Medicine',
        phone: '+966 50 123 4567',
        email: 'doctor@vetsvan.com'
      };
      setDoctorInfo(doctorData);
    }
  }, [booking, language]);

  const translations = {
    ar: {
      invoiceView: 'عرض الفاتورة',
      loading: 'جاري التحميل...',
      viewInvoice: 'عرض الفاتورة',
      downloadInvoice: 'تحميل الفاتورة',
      backToHome: 'العودة للرئيسية',
      invoiceNotFound: 'لم يتم العثور على الفاتورة',
      errorLoadingInvoice: 'خطأ في تحميل الفاتورة'
    },
    en: {
      invoiceView: 'Invoice View',
      loading: 'Loading...',
      viewInvoice: 'View Invoice',
      downloadInvoice: 'Download Invoice',
      backToHome: 'Back to Home',
      invoiceNotFound: 'Invoice not found',
      errorLoadingInvoice: 'Error loading invoice'
    }
  };

  const t = (key: string) => translations[language as keyof typeof translations][key as keyof typeof translations['ar']];

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/invoice-pdf/${bookingId}?lang=${language}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invoiceStatus?.invoiceNumber || bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (invoiceLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!booking || !bookingId || !isGenerated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{t('invoiceNotFound')}</p>
          <Button onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-600">
            {t('backToHome')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hide on print */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                {language === 'ar' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                <span>{t('backToHome')}</span>
              </Button>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{t('invoiceView')}</h1>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowInvoice(!showInvoice)}
                className="bg-purple-600 hover:bg-purple-600"
              >
                <Eye className="h-4 w-4 mr-2" />
                {t('viewInvoice')}
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-100"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('downloadInvoice')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-6xl mx-auto p-4">
        {showInvoice && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <DirectInvoiceViewer
              invoiceData={{
                bookingId: parseInt(bookingId),
                invoiceNumber: invoiceStatus?.invoiceNumber || booking?.invoiceNumber || `VETSVAN-${bookingId}`,
                customer: {
                  firstName: booking.customerFirstName,
                  lastName: booking.customerLastName,
                  phone: booking.customerPhone,
                  email: booking.customerEmail || ''
                },
                pets: booking.pets || [],
                appointmentDate: booking.appointmentDate,
                appointmentTime: booking.appointmentTime,
                serviceType: booking.serviceType || 'General Service',
                items: invoiceItems || [],
                subtotal: invoiceStatus?.subtotal || 0,
                discount: invoiceStatus?.discountAmount || 0,
                tax: invoiceStatus?.taxAmount || 0,
                total: invoiceStatus?.finalTotal || 0,
                notes: invoiceStatus?.notes || '',
                doctorName: booking.doctorName || doctorInfo?.name || 'Dr. VetsVan',
                vetsVanCode: booking.vetsVanCode || 'VETS001',
                paymentMethods: invoiceData?.payments || []
              }}
              onClose={() => setShowInvoice(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Direct Invoice Viewer Component - بدون Dialog
const DirectInvoiceViewer = ({ invoiceData, onClose }: any) => {
  const { language } = useLanguage();

  console.log('DirectInvoiceViewer received data:', invoiceData);

  const formatCurrency = (amount: number) => {
    return (
      <span className="inline-flex items-center">
        {amount.toFixed(2)}
        <img 
          src={riyalLogo} 
          alt="SAR"
          className="ml-1 h-4 w-4 bg-white rounded"
        />
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return language === 'ar' 
      ? date.toLocaleDateString('ar-SA')
      : date.toLocaleDateString('en-US');
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return language === 'ar'
      ? time.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      : time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full bg-white" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
      {/* Company Logo Header */}
      <div className="text-center mb-6">
        <img 
          src={logoImage}
          alt="Vets Van Logo"
          className="mx-auto h-20 object-contain"
        />
      </div>
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="text-3xl font-black text-purple-600 mb-2">
            VETS VAN
          </div>
          <div className="text-gray-600 font-medium mb-4">
            {language === 'ar' ? 'خدمات بيطرية متنقلة في منزلك' : 'Mobile Veterinary Services at Your Home'}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-purple-600" />
              <span>+966 50 123 4567</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-purple-600" />
              <span>info@vetsvan.com</span>
            </div>
            <div>
              <span>{language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          {/* رقم الفاتورة - مع تأكيد العرض */}
          <div 
            className="text-lg font-bold mb-4"
            style={{ 
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#000000',
              backgroundColor: '#f0f0f0',
              padding: '12px',
              border: '2px solid #333',
              borderRadius: '8px',
              display: 'block',
              textAlign: 'center'
            }}
          >
            <strong>Invoice: {invoiceData.invoiceNumber}</strong>
          </div>
          
          <div className="flex items-center justify-end mb-2">
            <Calendar className="h-4 w-4 mr-2 text-purple-600" />
            {formatDate(invoiceData.appointmentDate)}
          </div>
          <div className="flex items-center justify-end mb-2">
            <Clock className="h-4 w-4 mr-2 text-purple-600" />
            {formatTime(invoiceData.appointmentTime)}
          </div>
          <div className="text-sm text-gray-600" style={{ direction: 'rtl', textAlign: 'right' }}>
            <span className="font-semibold">{language === 'ar' ? 'الطبيب:' : 'Doctor:'}</span> {invoiceData.doctorName}
          </div>
          <div className="text-sm text-gray-600" style={{ direction: 'rtl', textAlign: 'right' }}>
            <span className="font-semibold">{language === 'ar' ? 'المركبة:' : 'Vehicle:'}</span> {invoiceData.vetsVanCode}
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-200">
          {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-3" style={{ direction: 'rtl', textAlign: 'right' }}>
              <span className="font-bold">{language === 'ar' ? 'الاسم:' : 'Name:'}</span>
              <span className="ml-2">{invoiceData.customer.firstName} {invoiceData.customer.lastName}</span>
            </div>
            <div className="mb-3" style={{ direction: 'rtl', textAlign: 'right' }}>
              <span className="font-bold">{language === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
              <span className="ml-2">{invoiceData.customer.phone}</span>
            </div>
          </div>
          <div>
            {invoiceData.customer.email && (
              <div className="mb-3" style={{ direction: 'rtl', textAlign: 'right' }}>
                <span className="font-bold">{language === 'ar' ? 'الإيميل:' : 'Email:'}</span>
                <span className="ml-2">{invoiceData.customer.email}</span>
              </div>
            )}
            <div className="mb-3" style={{ direction: 'rtl', textAlign: 'right' }}>
              <span className="font-bold">{language === 'ar' ? 'الخدمة:' : 'Service:'}</span>
              <span className="ml-2">{invoiceData.serviceType}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pet Information */}
      {invoiceData.pets && invoiceData.pets.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-200">
            {language === 'ar' ? 'معلومات الحيوانات الأليفة' : 'Pet Information'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoiceData.pets.map((pet: any, index: number) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center mb-2">
                  <PawPrint className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-bold text-purple-600">{pet.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>{language === 'ar' ? 'النوع:' : 'Type:'}</strong> {pet.type}</p>
                  <p><strong>{language === 'ar' ? 'العمر:' : 'Age:'}</strong> {pet.ageYear} {language === 'ar' ? 'سنة' : 'years'} {pet.ageMonth} {language === 'ar' ? 'شهر' : 'months'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Items Table */}
      {invoiceData.items && invoiceData.items.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-200">
            {language === 'ar' ? 'تفاصيل الخدمات' : 'Service Details'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <th className="border border-gray-300 p-3 text-left font-bold text-sm">
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </th>
                  <th className="border border-gray-300 p-3 text-center font-bold text-sm">
                    {language === 'ar' ? 'الكمية' : 'Qty'}
                  </th>
                  <th className="border border-gray-300 p-3 text-center font-bold text-sm">
                    {language === 'ar' ? 'السعر' : 'Price'}
                  </th>
                  <th className="border border-gray-300 p-3 text-center font-bold text-sm">
                    {language === 'ar' ? 'المجموع' : 'Total'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item: any, index: number) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border border-gray-300 p-3 text-sm">{item.description}</td>
                    <td className="border border-gray-300 p-3 text-center text-sm">{item.quantity}</td>
                    <td className="border border-gray-300 p-3 text-center text-sm">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="border border-gray-300 p-3 text-center text-sm font-semibold">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* التوتالات - مع تأكيد النقطتين العربية */}
      <div className="flex justify-end mb-6">
        <div className="bg-white border border-gray-300 rounded-lg shadow-md p-4 w-80">
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2">
              <span 
                className="text-sm font-medium text-gray-700"
                style={{ 
                  fontWeight: 'bold',
                  direction: 'rtl',
                  textAlign: 'right',
                  width: '100%',
                  display: 'inline-block'
                }}
              >
                {language === 'ar' ? 'المجموع قبل الضريبة:' : 'Total Before VAT:'}
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {formatCurrency(invoiceData.subtotal - (invoiceData.discount || 0))}
              </span>
            </div>
            <div className="border-b border-gray-200"></div>
            
            <div className="flex justify-between items-center py-2">
              <span 
                className="text-sm font-medium text-gray-700"
                style={{ 
                  fontWeight: 'bold',
                  direction: 'rtl',
                  textAlign: 'right',
                  width: '100%',
                  display: 'inline-block'
                }}
              >
                {language === 'ar' ? 'ضريبة القيمة المضافة:' : 'VAT:'}
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {formatCurrency(invoiceData.tax)}
              </span>
            </div>
            <div className="border-b border-gray-200"></div>
            
            <div className="flex justify-between items-center py-2">
              <span 
                className="text-sm font-medium text-gray-700"
                style={{ 
                  fontWeight: 'bold',
                  direction: 'rtl',
                  textAlign: 'right',
                  width: '100%',
                  display: 'inline-block'
                }}
              >
                {language === 'ar' ? 'المجموع النهائي:' : 'Final Total:'}
              </span>
              <span className="text-sm font-bold text-purple-600">
                {formatCurrency(invoiceData.total)}
              </span>
            </div>
            <div className="border-b border-gray-200"></div>
            
            <div className="flex justify-between items-center py-2">
              <span 
                className="text-sm font-medium text-gray-700"
                style={{ 
                  fontWeight: 'bold',
                  direction: 'rtl',
                  textAlign: 'right',
                  width: '100%',
                  display: 'inline-block'
                }}
              >
                {language === 'ar' ? 'المبلغ المدفوع:' : 'Total Paid:'}
              </span>
              <span className="text-sm font-semibold text-green-600">
                {formatCurrency((invoiceData.paymentMethods || []).reduce((sum: number, p: any) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 0))}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span 
                className="text-sm font-medium text-gray-700"
                style={{ 
                  fontWeight: 'bold',
                  direction: 'rtl',
                  textAlign: 'right',
                  width: '100%',
                  display: 'inline-block'
                }}
              >
                {language === 'ar' ? 'الرصيد المتبقي:' : 'Remaining Balance:'}
              </span>
              <span className="text-sm font-semibold text-red-600">
                {formatCurrency(Math.max(0, (invoiceData.total || 0) - ((invoiceData.paymentMethods || []).reduce((sum: number, p: any) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 0))))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      {invoiceData.paymentMethods && invoiceData.paymentMethods.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-200">
            {language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
          </h3>
          <div className="space-y-2">
            {invoiceData.paymentMethods.map((payment: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium">
                  {payment.method || payment.paymentType}
                </span>
                <span className="text-sm font-semibold">
                  {formatCurrency(typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceView;