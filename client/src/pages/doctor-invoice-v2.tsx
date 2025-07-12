import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useLanguage } from '@/lib/i18n';
import { ArrowLeft, FileText, User, Plus, Minus, Receipt, Stethoscope, Upload, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import PaymentModal from './payment-modal';
import UploadAttachmentModal from '@/components/UploadAttachmentModal';
import InvoiceGeneratorProfessional from '@/components/InvoiceGeneratorProfessional';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Pet {
  id: number;
  name: string;
  type: string;
  ageYear: number;
  ageMonth: number;
  ageDay: number;
}

interface BookingDetails {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pets: Pet[];
  appointmentDate: string;
  appointmentTime: string;
  serviceType: string;
  location: any;
  status: string;
}

interface PetVital {
  id?: number;
  bookingId: number;
  petId: number;
  weight?: number | null;
  temperature?: number | null;
  heartRate?: number | null;
  notes?: string | null;
}

export default function DoctorInvoiceV2() {
  const [, params] = useRoute('/doctor-invoice-v2/:bookingId');
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  // States - no React Query, direct API calls
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'full'>('none');
  const [isRecordLocked, setIsRecordLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPetForUpload, setSelectedPetForUpload] = useState<Pet | null>(null);
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Vitals data
  const [vitalsData, setVitalsData] = useState({
    weight: '',
    temperature: '',
    heartRate: '',
    notes: ''
  });
  
  // Payment states
  const [totalPaid, setTotalPaid] = useState(0);
  const [payments, setPayments] = useState<any[]>([]);

  // Constants
  const TAX_RATE = 0.15;
  const DISCOUNT_RATE = 0.10;

  // Direct API calls without React Query
  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      const response = await fetch(`/api/doctor/booking/${params?.bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
    }
  };

  const fetchInvoiceStatus = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      const response = await fetch(`/api/invoice-status/${params?.bookingId}?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Invoice status loaded:', data);
        setIsRecordLocked(data.isGenerated || false);
        // Set discount type from saved data immediately
        if (data.discountAmount !== undefined) {
          const amount = parseFloat(data.discountAmount);
          if (amount === 0) {
            setDiscountType('none');
          } else {
            // Calculate if it's 10% or 100% based on subtotal
            const subtotal = parseFloat(data.subtotal || '0');
            if (subtotal > 0) {
              const discountPercent = (amount / subtotal) * 100;
              if (discountPercent >= 99) {
                setDiscountType('full');
              } else {
                setDiscountType('percentage');
              }
            }
          }
        } else {
          setDiscountType('none');
        }
      } else {
        // No status found, set default
        setDiscountType('none');
        setIsRecordLocked(false);
      }
    } catch (error) {
      console.error('Error fetching invoice status:', error);
      setDiscountType('none');
      setIsRecordLocked(false);
    }
  };

  const fetchInvoiceItems = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      const response = await fetch(`/api/invoice-items/${params?.bookingId}?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const loadedItems = data.map((item: any, index: number) => ({
            id: (index + 1).toString(),
            description: item.description || '',
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            total: parseFloat(item.total) || 0
          }));
          setInvoiceItems(loadedItems);
        }
      }
    } catch (error) {
      console.error('Error fetching invoice items:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      const response = await fetch('/api/services', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Force refresh function
  const forceRefresh = async () => {
    setLoading(true);
    console.log('Force refreshing all data...');
    
    // Reset states
    setDiscountType('none');
    setIsRecordLocked(false);
    
    // Fetch all data fresh
    await Promise.all([
      fetchBookingDetails(),
      fetchInvoiceStatus(),
      fetchInvoiceItems(),
      fetchProducts(),
      fetchServices()
    ]);
    
    setLoading(false);
    
    toast({
      title: language === 'ar' ? 'تم تحديث البيانات' : 'Data refreshed',
      description: language === 'ar' ? 'تم تحديث جميع البيانات بنجاح' : 'All data has been refreshed successfully'
    });
  };

  // Initial load
  useEffect(() => {
    if (params?.bookingId) {
      const loadData = async () => {
        setLoading(true);
        
        await Promise.all([
          fetchBookingDetails(),
          fetchInvoiceStatus(),
          fetchInvoiceItems(),
          fetchProducts(),
          fetchServices()
        ]);
        
        setLoading(false);
      };
      
      loadData();
    }
  }, [params?.bookingId]);

  // Auto-save invoice items
  useEffect(() => {
    if (invoiceItems.length > 0 && booking && !isRecordLocked) {
      const timeoutId = setTimeout(() => {
        saveInvoiceItems();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [invoiceItems, booking, isRecordLocked]);

  const saveInvoiceItems = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      await fetch(`/api/invoice-items/${params?.bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(invoiceItems),
      });
    } catch (error) {
      console.error('Error saving invoice items:', error);
    }
  };

  // Calculations
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * TAX_RATE;
  
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = subtotal * DISCOUNT_RATE;
  } else if (discountType === 'full') {
    discountAmount = subtotal;
  }
  
  const finalTotal = subtotal + taxAmount - discountAmount;
  const remainingBalance = Math.max(0, finalTotal - totalPaid);

  // Helper functions
  const getDirection = (lang: string) => lang === 'ar' ? 'rtl' : 'ltr';
  const getTextAlign = (lang: string) => lang === 'ar' ? 'right' : 'left';

  const translations = {
    ar: {
      invoiceTitle: 'فاتورة خدمة VETS VAN',
      customerInfo: 'بيانات العميل',
      petInfo: 'بيانات الأليف',
      serviceDetails: 'تفاصيل الخدمة',
      back: 'العودة',
      name: 'الاسم',
      phone: 'الهاتف',
      email: 'البريد الإلكتروني',
      petName: 'اسم الأليف',
      petType: 'نوع الأليف',
      age: 'العمر',
      years: 'سنة',
      months: 'شهر',
      days: 'يوم',
      vitals: 'العلامات الحيوية',
      upload: 'رفع ملف',
      description: 'الوصف',
      quantity: 'الكمية',
      unitPrice: 'السعر',
      total: 'المجموع',
      addItem: 'إضافة عنصر',
      subtotal: 'المجموع الفرعي',
      tax: 'الضريبة (15%)',
      discount: 'الخصم',
      finalTotal: 'المجموع النهائي',
      totalPaid: 'المدفوع',
      remainingBalance: 'المتبقي',
      generateInvoice: 'إنشاء الفاتورة',
      save: 'حفظ',
      cancel: 'إلغاء',
      weight: 'الوزن',
      temperature: 'درجة الحرارة',
      heartRate: 'نبضات القلب',
      notes: 'ملاحظات',
      sar: 'ريال',
      vitalsFor: 'العلامات الحيوية لـ'
    },
    en: {
      invoiceTitle: 'VETS VAN Service Invoice',
      customerInfo: 'Customer Information',
      petInfo: 'Pet Information',
      serviceDetails: 'Service Details',
      back: 'Back',
      name: 'Name',
      phone: 'Phone',
      email: 'Email',
      petName: 'Pet Name',
      petType: 'Pet Type',
      age: 'Age',
      years: 'years',
      months: 'months',
      days: 'days',
      vitals: 'Vitals',
      upload: 'Upload',
      description: 'Description',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      total: 'Total',
      addItem: 'Add Item',
      subtotal: 'Subtotal',
      tax: 'Tax (15%)',
      discount: 'Discount',
      finalTotal: 'Final Total',
      totalPaid: 'Total Paid',
      remainingBalance: 'Remaining Balance',
      generateInvoice: 'Generate Invoice',
      save: 'Save',
      cancel: 'Cancel',
      weight: 'Weight',
      temperature: 'Temperature',
      heartRate: 'Heart Rate',
      notes: 'Notes',
      sar: 'SAR',
      vitalsFor: 'Vitals for'
    }
  };

  const t = (key: string) => translations[language as keyof typeof translations]?.[key as keyof typeof translations['ar']] || key;

  // Item manipulation functions
  const addItem = () => {
    const newId = (invoiceItems.length + 1).toString();
    setInvoiceItems([...invoiceItems, { 
      id: newId, 
      description: '', 
      quantity: 1, 
      unitPrice: 0, 
      total: 0 
    }]);
  };

  const removeItem = (id: string) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceItems(items => items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  // Modal handlers
  const openVitalsModal = (pet: Pet) => {
    setSelectedPet(pet);
    setShowVitalsModal(true);
    // Load existing vitals if any
    loadPetVitals(pet.id);
  };

  const loadPetVitals = async (petId: number) => {
    try {
      const token = localStorage.getItem('doctorToken');
      const response = await fetch(`/api/pet-vitals/${params?.bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const vitals = await response.json();
        const petVitals = vitals.find((v: PetVital) => v.petId === petId);
        if (petVitals) {
          setVitalsData({
            weight: petVitals.weight?.toString() || '',
            temperature: petVitals.temperature?.toString() || '',
            heartRate: petVitals.heartRate?.toString() || '',
            notes: petVitals.notes || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading pet vitals:', error);
    }
  };

  const saveVitals = async () => {
    if (!selectedPet) return;
    
    try {
      const token = localStorage.getItem('doctorToken');
      await fetch('/api/pet-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: params?.bookingId,
          petId: selectedPet.id,
          weight: vitalsData.weight ? parseFloat(vitalsData.weight) : null,
          temperature: vitalsData.temperature ? parseFloat(vitalsData.temperature) : null,
          heartRate: vitalsData.heartRate ? parseInt(vitalsData.heartRate) : null,
          notes: vitalsData.notes || null
        }),
      });
      
      setShowVitalsModal(false);
      setVitalsData({ weight: '', temperature: '', heartRate: '', notes: '' });
      
      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم حفظ العلامات الحيوية بنجاح' : 'Pet vitals saved successfully'
      });
    } catch (error) {
      console.error('Error saving vitals:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في حفظ البيانات' : 'Failed to save data',
        variant: 'destructive'
      });
    }
  };

  const openUploadModal = (pet: Pet) => {
    setSelectedPetForUpload(pet);
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedPetForUpload(null);
  };

  const handleGenerateInvoiceClick = () => {
    setShowConfirmDialog(true);
  };

  const confirmGenerateInvoice = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      await fetch(`/api/invoice-status/${params?.bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          isGenerated: true,
          notes,
          subtotal: subtotal.toString(),
          taxAmount: taxAmount.toString(),
          discountAmount: discountAmount.toString(),
          finalTotal: finalTotal.toString()
        }),
      });
      
      setIsRecordLocked(true);
      setShowConfirmDialog(false);
      setShowInvoiceGenerator(true);
      
      toast({
        title: language === 'ar' ? 'تم إنشاء الفاتورة' : 'Invoice Generated',
        description: language === 'ar' ? 'تم إنشاء الفاتورة بنجاح' : 'Invoice has been generated successfully'
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
    }
  };

  const handlePaymentSubmit = async (paymentData: any) => {
    try {
      // Handle payment logic here
      setTotalPaid(prev => prev + paymentData.amount);
      setShowPaymentModal(false);
      
      toast({
        title: language === 'ar' ? 'تم تسجيل الدفع' : 'Payment Recorded',
        description: language === 'ar' ? 'تم تسجيل الدفعة بنجاح' : 'Payment recorded successfully'
      });
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">
            {language === 'ar' ? 'لم يتم العثور على بيانات الموعد' : 'Booking data not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir={getDirection(language)}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setLocation('/doctor-activity')}
              className="flex items-center text-gray-600 hover:text-purple-600"
            >
              <ArrowLeft className="h-5 w-5 ml-2" />
              {t('back')}
            </button>
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600 ml-3" />
              <h1 className="text-2xl font-bold text-gray-900">{t('invoiceTitle')}</h1>
              <Button
                onClick={forceRefresh}
                variant="outline"
                size="sm"
                className="mr-3 text-purple-600 border-purple-600 hover:bg-purple-50"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Discount Status Indicator */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">
                {language === 'ar' ? 'حالة الخصم:' : 'Discount Status:'}
              </span>
              <span className="text-sm text-blue-600">
                {discountType === 'none' && (language === 'ar' ? 'بدون خصم ✘' : 'No Discount ✘')}
                {discountType === 'percentage' && (language === 'ar' ? 'خصم 10% ✓' : '10% Discount ✓')}
                {discountType === 'full' && (language === 'ar' ? 'خصم 100% مجاني ✓' : '100% FREE Discount ✓')}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User className="h-6 w-6 text-purple-600 ml-2" />
            {t('customerInfo')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('name')}
              </label>
              <p className="text-gray-900">{booking.customerName || 'غير محدد'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('phone')}
              </label>
              <p className="text-gray-900">{booking.customerPhone || 'غير محدد'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')}
              </label>
              <p className="text-gray-900">{booking.customerEmail || 'غير محدد'}</p>
            </div>
          </div>
        </div>

        {/* Pet Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {t('petInfo')}
          </h2>
          {booking.pets && booking.pets.length > 0 ? booking.pets.map((pet, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:mb-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('petName')}
                  </label>
                  <p className="text-gray-900">{pet.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('petType')}
                  </label>
                  <p className="text-gray-900">{pet.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('age')}
                  </label>
                  <p className="text-gray-900">
                    {pet.ageYear} {t('years')} {pet.ageMonth} {t('months')} {pet.ageDay} {t('days')}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button
                  onClick={() => openVitalsModal(pet)}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Stethoscope className="h-4 w-4 ml-1" />
                  {t('vitals')}
                </Button>
                <Button
                  onClick={() => openUploadModal(pet)}
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <Upload className="h-4 w-4 ml-1" />
                  {t('upload')}
                </Button>
              </div>
            </div>
          )) : (
            <p className="text-gray-500">لا توجد بيانات حيوانات أليفة</p>
          )}
        </div>

        {/* Service Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {t('serviceDetails')}
          </h2>
          
          {/* Invoice Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-right font-semibold">{t('description')}</th>
                  <th className="border border-gray-300 p-3 text-right font-semibold">{t('quantity')}</th>
                  <th className="border border-gray-300 p-3 text-right font-semibold">{t('unitPrice')}</th>
                  <th className="border border-gray-300 p-3 text-right font-semibold">{t('total')}</th>
                  {!isRecordLocked && <th className="border border-gray-300 p-3 text-center font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {invoiceItems.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2">
                      {isRecordLocked ? (
                        <span className="text-gray-700">{item.description}</span>
                      ) : (
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full"
                          placeholder={t('description')}
                        />
                      )}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {isRecordLocked ? (
                        <span className="text-gray-700">{item.quantity}</span>
                      ) : (
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-20"
                          min="1"
                        />
                      )}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {isRecordLocked ? (
                        <span className="text-gray-700">{item.unitPrice.toFixed(2)}</span>
                      ) : (
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-24"
                          step="0.01"
                          min="0"
                        />
                      )}
                    </td>
                    <td className="border border-gray-300 p-2 text-right font-medium">
                      {item.total.toFixed(2)} {t('sar')}
                    </td>
                    {!isRecordLocked && (
                      <td className="border border-gray-300 p-2 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                          disabled={invoiceItems.length === 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isRecordLocked && (
            <div className="flex items-center justify-between mb-4 mt-4">
              <button
                onClick={addItem}
                className="flex items-center text-purple-600 hover:text-purple-600"
              >
                <Plus className="h-4 w-4 ml-1" />
                {t('addItem')}
              </button>
            </div>
          )}

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-80">
                <div className="flex justify-between mb-2">
                  <span>{t('subtotal')}:</span>
                  <span>{subtotal.toFixed(2)} {t('sar')}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>{t('tax')}:</span>
                  <span>{taxAmount.toFixed(2)} {t('sar')}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>{t('discount')}:</span>
                  <div className="flex items-center space-x-2">
                    {isRecordLocked ? (
                      <div className="bg-gray-100 p-2 rounded text-gray-700">
                        {discountType === 'none' && (language === 'ar' ? 'بدون خصم ✘' : 'No Discount ✘')}
                        {discountType === 'percentage' && (language === 'ar' ? 'خصم 10% ✓' : '10% Discount ✓')}
                        {discountType === 'full' && (language === 'ar' ? 'خصم 100% مجاني ✓' : '100% FREE Discount ✓')}
                      </div>
                    ) : (
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as 'none' | 'percentage' | 'full')}
                        className="border border-gray-300 rounded px-3 py-1 text-sm"
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                      >
                        <option value="none">{language === 'ar' ? 'بدون خصم ✘' : 'No Discount ✘'}</option>
                        <option value="percentage">{language === 'ar' ? 'خصم 10% ✓' : '10% Discount ✓'}</option>
                        <option value="full">{language === 'ar' ? 'خصم 100% مجاني ✓' : '100% FREE Discount ✓'}</option>
                      </select>
                    )}
                    <span className="text-lg font-medium">{discountAmount.toFixed(2)} {t('sar')}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mb-4">
                  <span>{t('finalTotal')}:</span>
                  <span>{finalTotal.toFixed(2)} {t('sar')}</span>
                </div>

                {/* Payment Summary */}
                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between text-green-600 font-semibold mb-2">
                    <span>{t('totalPaid')}:</span>
                    <span>{totalPaid.toFixed(2)} {t('sar')}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-semibold mb-4">
                    <span>{t('remainingBalance')}:</span>
                    <span>{remainingBalance.toFixed(2)} {t('sar')}</span>
                  </div>
                </div>
                
                {/* Add Payment Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={remainingBalance <= 0 || isRecordLocked}
                    className={`px-6 py-2 rounded-lg flex items-center transition-colors ${
                      (remainingBalance <= 0 || isRecordLocked)
                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{t('notes')}</h3>
          {isRecordLocked ? (
            <p className="text-gray-700 bg-gray-50 p-3 rounded border">
              {notes || (language === 'ar' ? 'لا توجد ملاحظات' : 'No notes')}
            </p>
          ) : (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notes')}
              rows={4}
              className="w-full"
            />
          )}
        </div>

        {/* Generate Invoice Button */}
        <div className="flex justify-center mb-6">
          {!isRecordLocked && (
            <Button
              onClick={handleGenerateInvoiceClick}
              className="bg-purple-600 hover:bg-purple-600 text-white px-8 py-3 text-lg"
            >
              <Receipt className="h-6 w-6 ml-2" />
              {t('generateInvoice')}
            </Button>
          )}
        </div>
      </div>

      {/* Pet Vitals Modal */}
      {showVitalsModal && selectedPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            dir={getDirection(language)}
            style={{ textAlign: getTextAlign(language) }}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {t('vitalsFor')} {selectedPet.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('weight')}
                  </label>
                  <Input
                    type="number"
                    value={vitalsData.weight}
                    onChange={(e) => setVitalsData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="0.0"
                    step="0.1"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('temperature')}
                  </label>
                  <Input
                    type="number"
                    value={vitalsData.temperature}
                    onChange={(e) => setVitalsData(prev => ({ ...prev, temperature: e.target.value }))}
                    placeholder="0.0"
                    step="0.1"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('heartRate')}
                  </label>
                  <Input
                    type="number"
                    value={vitalsData.heartRate}
                    onChange={(e) => setVitalsData(prev => ({ ...prev, heartRate: e.target.value }))}
                    placeholder="0"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('notes')}
                  </label>
                  <Textarea
                    value={vitalsData.notes}
                    onChange={(e) => setVitalsData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('notes')}
                    rows={3}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowVitalsModal(false)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={saveVitals}
                  className="bg-purple-600 hover:bg-purple-600 text-white"
                >
                  {t('save')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        currentTotal={finalTotal}
        remainingBalance={remainingBalance}
        onPaymentSubmit={handlePaymentSubmit}
      />

      {/* Upload Attachment Modal */}
      {showUploadModal && selectedPetForUpload && booking && (
        <UploadAttachmentModal
          isOpen={showUploadModal}
          onClose={closeUploadModal}
          petId={selectedPetForUpload.id}
          petName={selectedPetForUpload.name}
          bookingId={booking.id}
        />
      )}

      {/* Invoice Generator */}
      {showInvoiceGenerator && booking && (
        <InvoiceGeneratorProfessional
          invoiceData={{
            bookingId: booking.id,
            customer: {
              firstName: booking.customerName?.split(' ')[0] || '',
              lastName: booking.customerName?.split(' ').slice(1).join(' ') || '',
              phone: booking.customerPhone || '',
              email: booking.customerEmail || ''
            },
            pets: booking.pets,
            appointmentDate: booking.appointmentDate,
            appointmentTime: booking.appointmentTime,
            serviceType: booking.serviceType,
            items: invoiceItems,
            subtotal: subtotal,
            discount: discountAmount,
            tax: taxAmount,
            total: finalTotal,
            notes: notes,
            doctorName: 'Dr. VETS VAN',
            vetsVanCode: 'VETS001'
          }}
          onClose={() => setShowInvoiceGenerator(false)}
        />
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تأكيد إنشاء الفاتورة' : 'Confirm Invoice Generation'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'سيتم قفل عناصر الفاتورة ولن يمكن تعديلها بعد الإنشاء. هل أنت متأكد؟'
                : 'Invoice items will be locked and cannot be edited after generation. Are you sure?'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={confirmGenerateInvoice} className="bg-purple-600 hover:bg-purple-600 text-white">
              {t('generateInvoice')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}