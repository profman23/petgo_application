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
            <InvoiceGeneratorProfessional
              invoiceData={{
                bookingId: parseInt(bookingId),
                invoiceNumber: invoiceStatus?.invoiceNumber,
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

export default InvoiceView;