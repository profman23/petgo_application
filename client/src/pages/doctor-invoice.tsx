import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/i18n';
import { ArrowLeft, FileText, User, Phone, Calendar, Mail, Plus, Minus, Receipt, Save, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Customer {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface Pet {
  id: number;
  name: string;
  type: string;
  ageYear: number;
  ageMonth: number;
  ageDay: number;
}

interface PetVital {
  id?: number;
  bookingId: number;
  petId: number;
  weight?: number | null;
  temperature?: number | null;
  heartRate?: number | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface BookingDetails {
  id: number;
  customer: Customer;
  pets: Pet[];
  appointmentDate: string;
  appointmentTime: string;
  serviceType: string;
  location: any;
  status: string;
}

export default function DoctorInvoice() {
  const [, params] = useRoute('/doctor-invoice/:bookingId');
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [vitalsData, setVitalsData] = useState({
    weight: '',
    temperature: '',
    heartRate: '',
    notes: ''
  });

  // Fetch booking details
  const { data: booking, isLoading } = useQuery({
    queryKey: [`/api/doctor/booking/${params?.bookingId}`],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/doctor/booking/${params?.bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch booking details');
      return await response.json() as BookingDetails;
    },
    enabled: !!params?.bookingId,
  });

  const getDirection = (lang: string) => lang === 'ar' ? 'rtl' : 'ltr';
  const getTextAlign = (lang: string) => lang === 'ar' ? 'right' : 'left';

  const translations = {
    ar: {
      invoiceTitle: 'فاتورة خدمة VETS VAN',
      customerInfo: 'بيانات العميل',
      petInfo: 'بيانات الأليف',
      serviceDetails: 'تفاصيل الخدمة',
      invoiceItems: 'أصناف الفاتورة',
      description: 'الوصف',
      quantity: 'الكمية',
      unitPrice: 'السعر للوحدة',
      total: 'المجموع',
      addItem: 'إضافة صنف',
      removeItem: 'حذف الصنف',
      subtotal: 'المجموع الفرعي',
      discount: 'الخصم',
      finalTotal: 'المجموع النهائي',
      notes: 'ملاحظات',
      generateInvoice: 'إنشاء الفاتورة',
      back: 'رجوع',
      name: 'الاسم',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      date: 'التاريخ',
      time: 'الوقت',
      service: 'نوع الخدمة',
      vitals: 'المؤشرات الحيوية',
      weight: 'الوزن (كيلو)',
      temperature: 'درجة الحرارة (°س)',
      heartRate: 'نبضات القلب',
      save: 'حفظ',
      cancel: 'إلغاء',
      vitalsFor: 'المؤشرات الحيوية لـ',
      petName: 'اسم الأليف',
      petType: 'نوع الأليف',
      age: 'العمر',
      years: 'سنة',
      months: 'شهر',
      days: 'يوم',
      sar: 'ريال',
    },
    en: {
      invoiceTitle: 'VETS VAN Service Invoice',
      customerInfo: 'Customer Information',
      petInfo: 'Pet Information',
      serviceDetails: 'Service Details',
      invoiceItems: 'Invoice Items',
      description: 'Description',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      total: 'Total',
      addItem: 'Add Item',
      removeItem: 'Remove Item',
      subtotal: 'Subtotal',
      discount: 'Discount',
      finalTotal: 'Final Total',
      notes: 'Notes',
      generateInvoice: 'Generate Invoice',
      back: 'Back',
      name: 'Name',
      phone: 'Phone',
      email: 'Email',
      date: 'Date',
      time: 'Time',
      service: 'Service Type',
      vitals: 'Pet Vitals',
      weight: 'Weight (KG)',
      temperature: 'Temperature (°C)',
      heartRate: 'Heart Rate',
      save: 'Save',
      cancel: 'Cancel',
      vitalsFor: 'Vitals for',
      petName: 'Pet Name',
      petType: 'Pet Type',
      age: 'Age',
      years: 'years',
      months: 'months',
      days: 'days',
      sar: 'SAR',
    }
  };

  const t = (key: keyof typeof translations.ar) => translations[language as keyof typeof translations][key];

  // Calculate totals
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const finalTotal = subtotal - discount;

  // Update item total when quantity or price changes
  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems(items => 
      items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Add new item
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

  // Remove item
  const removeItem = (id: string) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(items => items.filter(item => item.id !== id));
    }
  };

  // Handle pet vitals
  const openVitalsModal = async (pet: Pet) => {
    setSelectedPet(pet);
    setShowVitalsModal(true);
    
    // Load existing vitals data if available
    if (booking) {
      try {
        const existingVitals = await apiRequest(`/api/pet-vitals/booking/${booking.id}`);
        const petVitals = existingVitals.find((vital: any) => vital.petId === pet.id);
        
        if (petVitals) {
          setVitalsData({
            weight: petVitals.weight?.toString() || '',
            temperature: petVitals.temperature?.toString() || '',
            heartRate: petVitals.heartRate?.toString() || '',
            notes: petVitals.notes || ''
          });
        } else {
          setVitalsData({ weight: '', temperature: '', heartRate: '', notes: '' });
        }
      } catch (error) {
        console.error('Error loading existing vitals:', error);
        setVitalsData({ weight: '', temperature: '', heartRate: '', notes: '' });
      }
    } else {
      setVitalsData({ weight: '', temperature: '', heartRate: '', notes: '' });
    }
  };

  const saveVitals = async () => {
    if (!selectedPet || !booking) return;

    try {
      const vitalsPayload = {
        bookingId: booking.id,
        petId: selectedPet.id,
        weight: vitalsData.weight ? parseFloat(vitalsData.weight) : null,
        temperature: vitalsData.temperature ? parseFloat(vitalsData.temperature) : null,
        heartRate: vitalsData.heartRate ? parseInt(vitalsData.heartRate) : null,
        notes: vitalsData.notes || null,
        recordedBy: 'doctor'
      };

      console.log('Sending vitals payload:', vitalsPayload);
      console.log('Selected pet:', selectedPet);
      console.log('Booking:', booking);

      // Check if vitals already exist for this pet
      const existingVitals = await apiRequest(`/api/pet-vitals/booking/${booking.id}`);
      let isUpdate = false;
      let existingVitalId = null;
      
      const existingPetVital = existingVitals.find((vital: any) => vital.petId === selectedPet.id);
      if (existingPetVital) {
        isUpdate = true;
        existingVitalId = existingPetVital.id;
      }

      if (isUpdate && existingVitalId) {
        // Update existing vitals
        await apiRequest(`/api/pet-vitals/${existingVitalId}`, {
          method: 'PUT',
          body: vitalsPayload
        });
        
        toast({
          title: language === 'ar' ? "تم تحديث المؤشرات الحيوية" : "Pet vitals updated successfully",
          variant: "default"
        });
      } else {
        // Create new vitals
        await apiRequest('/api/pet-vitals', {
          method: 'POST',
          body: vitalsPayload
        });
        
        toast({
          title: language === 'ar' ? "تم حفظ المؤشرات الحيوية" : "Pet vitals saved successfully",
          variant: "default"
        });
      }

      setShowVitalsModal(false);
    } catch (error) {
      console.error('Error saving pet vitals:', error);
      toast({
        title: language === 'ar' ? "فشل في حفظ المؤشرات الحيوية" : "Failed to save pet vitals",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  // Generate invoice
  const generateInvoice = async () => {
    try {
      const invoiceData = {
        bookingId: params?.bookingId,
        items: invoiceItems,
        discount,
        notes,
        subtotal,
        total: finalTotal,
      };

      // Here you would typically send this to your backend
      console.log('Invoice data:', invoiceData);
      
      toast({
        title: language === 'ar' ? '✅ تم إنشاء الفاتورة بنجاح' : '✅ Invoice generated successfully',
        description: language === 'ar' ? 'تم حفظ الفاتورة في النظام' : 'Invoice has been saved to the system',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? '❌ خطأ في إنشاء الفاتورة' : '❌ Error generating invoice',
        description: language === 'ar' ? 'حدث خطأ أثناء إنشاء الفاتورة' : 'An error occurred while generating the invoice',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
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
              <p className="text-gray-900">{booking.customer.firstName} {booking.customer.lastName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('phone')}
              </label>
              <p className="text-gray-900">{booking.customer.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')}
              </label>
              <p className="text-gray-900">{booking.customer.email}</p>
            </div>
          </div>
        </div>

        {/* Pet Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {t('petInfo')}
          </h2>
          {booking.pets.map((pet, index) => (
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
              <div className="mt-4">
                <Button 
                  onClick={() => openVitalsModal(pet)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  {t('vitals')}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Service Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="h-6 w-6 text-purple-600 ml-2" />
            {t('serviceDetails')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('date')}
              </label>
              <p className="text-gray-900">{booking.appointmentDate}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('time')}
              </label>
              <p className="text-gray-900">{booking.appointmentTime}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('service')}
              </label>
              <p className="text-gray-900">{booking.serviceType}</p>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {t('invoiceItems')}
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2" style={{ textAlign: getTextAlign(language) }}>
                    {t('description')}
                  </th>
                  <th className="text-center py-2 px-2 w-24">
                    {t('quantity')}
                  </th>
                  <th className="text-center py-2 px-2 w-32">
                    {t('unitPrice')} ({t('sar')})
                  </th>
                  <th className="text-center py-2 px-2 w-32">
                    {t('total')} ({t('sar')})
                  </th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {invoiceItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2 px-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder={t('description')}
                        className="w-full"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full text-center"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full text-center"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      {item.total.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={invoiceItems.length === 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addItem}
            className="flex items-center text-purple-600 hover:text-purple-800 mb-4"
          >
            <Plus className="h-4 w-4 ml-1" />
            {t('addItem')}
          </button>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-80">
                <div className="flex justify-between mb-2">
                  <span>{t('subtotal')}:</span>
                  <span>{subtotal.toFixed(2)} {t('sar')}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>{t('discount')}:</span>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-24 text-center ml-2"
                    />
                    <span className="ml-2">{t('sar')}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>{t('finalTotal')}:</span>
                  <span>{finalTotal.toFixed(2)} {t('sar')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {t('notes')}
          </h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notes')}
            rows={4}
            className="w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={generateInvoice}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
          >
            <Receipt className="h-6 w-6 ml-2" />
            {t('generateInvoice')}
          </Button>
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
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {t('save')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}