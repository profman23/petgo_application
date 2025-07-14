import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/i18n';
import { ArrowLeft, FileText, User, Phone, Calendar, Mail, Plus, Minus, Receipt, Save, Stethoscope, Upload, AlertTriangle, Search, Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import PaymentModal from './payment-modal';
import UploadAttachmentModal from '@/components/UploadAttachmentModal';
import InvoiceGeneratorProfessional from '@/components/InvoiceGeneratorProfessional';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'percentage' | 'amount';
  vatRate: number;
  vatAmount: number;
  totalBeforeVat: number;
  totalAfterVat: number;
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

interface Payment {
  id: string;
  amount: number;
  type: string;
  description: string;
  date: string;
}

interface ProductService {
  id: string;
  name: string;
  price: number;
  category: string;
}

export default function DoctorInvoice() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute('/doctor-invoice/:bookingId');
  const { language, t } = useLanguage();
  const { toast } = useToast();

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isRecordLocked, setIsRecordLocked] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // Product/Service search states
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedResults, setSelectedResults] = useState<ProductService[]>([]);

  // Pet vitals states
  const [petVitals, setPetVitals] = useState({
    weight: '',
    temperature: '',
    heartRate: '',
    notes: ''
  });

  const bookingId = params?.bookingId;

  // Fetch booking details
  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['/api/doctor/booking', bookingId],
    enabled: !!bookingId
  });

  // Fetch products and services for search
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['/api/admin/products'],
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });

  const { data: services = [], isLoading: isServicesLoading } = useQuery({
    queryKey: ['/api/admin/services'],
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });

  // Helper functions
  const getDirection = (lang: string) => lang === 'ar' ? 'rtl' : 'ltr';
  const getTextAlign = (lang: string) => lang === 'ar' ? 'right' : 'left';

  // Initialize invoice items
  useEffect(() => {
    if (bookingId) {
      const loadInvoiceItems = async () => {
        try {
          const response = await apiRequest(`/api/invoice-items/${bookingId}`);
          if (response && Array.isArray(response)) {
            setInvoiceItems(response.map(item => ({
              ...item,
              discount: parseFloat(item.discount) || 0,
              unitPrice: parseFloat(item.unitPrice) || 0,
              quantity: parseFloat(item.quantity) || 1,
              vatRate: parseFloat(item.vatRate) || 15,
              vatAmount: parseFloat(item.vatAmount) || 0,
              totalBeforeVat: parseFloat(item.totalBeforeVat) || 0,
              totalAfterVat: parseFloat(item.totalAfterVat) || 0,
              total: parseFloat(item.total) || 0
            })));
          } else {
            // Initialize with default item
            setInvoiceItems([{
              id: Date.now().toString(),
              description: '',
              quantity: 1,
              unitPrice: 0,
              discount: 0,
              discountType: 'percentage',
              vatRate: 15,
              vatAmount: 0,
              totalBeforeVat: 0,
              totalAfterVat: 0,
              total: 0
            }]);
          }

          // Load invoice status
          const statusResponse = await apiRequest(`/api/invoice-status/${bookingId}`);
          if (statusResponse && statusResponse.isLocked) {
            setIsRecordLocked(true);
          }
        } catch (error) {
          console.error('Failed to load invoice items:', error);
          setInvoiceItems([{
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            discountType: 'percentage',
            vatRate: 15,
            vatAmount: 0,
            totalBeforeVat: 0,
            totalAfterVat: 0,
            total: 0
          }]);
        }
      };
      loadInvoiceItems();
    }
  }, [bookingId]);

  // Calculate item values
  const calculateItemValues = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice;
    let discountAmount = 0;
    
    if (item.discountType === 'percentage') {
      discountAmount = (subtotal * item.discount) / 100;
    } else {
      discountAmount = item.discount;
    }
    
    const totalBeforeVat = subtotal - discountAmount;
    const vatAmount = (totalBeforeVat * item.vatRate) / 100;
    const totalAfterVat = totalBeforeVat + vatAmount;
    
    return {
      totalBeforeVat,
      vatAmount,
      totalAfterVat
    };
  };

  // Update item function
  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const newItems = invoiceItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        const calculated = calculateItemValues(updatedItem);
        return {
          ...updatedItem,
          ...calculated,
          total: calculated.totalAfterVat
        };
      }
      return item;
    });
    setInvoiceItems(newItems);
    saveInvoiceItems(newItems);
  };

  // Add new item
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'percentage',
      vatRate: 15,
      vatAmount: 0,
      totalBeforeVat: 0,
      totalAfterVat: 0,
      total: 0
    };
    const newItems = [...invoiceItems, newItem];
    setInvoiceItems(newItems);
    saveInvoiceItems(newItems);
  };

  // Save invoice items with auto-save
  const saveInvoiceItems = async (items: InvoiceItem[]) => {
    if (!bookingId) return;
    
    const saveTimeout = setTimeout(async () => {
      try {
        await apiRequest(`/api/invoice-items/${bookingId}`, {
          method: 'POST',
          body: JSON.stringify({ items })
        });
      } catch (error) {
        console.error('Failed to save invoice items:', error);
      }
    }, 1000);
    
    return () => clearTimeout(saveTimeout);
  };

  // Search functionality
  const searchItems = (term: string) => {
    const allItems = [...(Array.isArray(products) ? products : []), ...(Array.isArray(services) ? services : [])];
    return allItems.filter(item => 
      item.name && item.name.toLowerCase().includes(term.toLowerCase())
    );
  };

  const handleSearchSelect = (item: ProductService) => {
    updateItem(invoiceItems[0]?.id || '', 'description', item.name);
    updateItem(invoiceItems[0]?.id || '', 'unitPrice', item.price);
    setSearchTerm(item.name);
    setShowSearchResults(false);
  };

  // Pet vitals functions
  const openVitalsModal = async (pet: Pet) => {
    setSelectedPet(pet);
    try {
      const response = await apiRequest(`/api/pet-vitals/${bookingId}`);
      const petVital = Array.isArray(response) ? response.find(v => v.petId === pet.id) : null;
      if (petVital) {
        setPetVitals({
          weight: petVital.weight?.toString() || '',
          temperature: petVital.temperature?.toString() || '',
          heartRate: petVital.heartRate?.toString() || '',
          notes: petVital.notes || ''
        });
      } else {
        setPetVitals({ weight: '', temperature: '', heartRate: '', notes: '' });
      }
    } catch (error) {
      console.error('Failed to load pet vitals:', error);
      setPetVitals({ weight: '', temperature: '', heartRate: '', notes: '' });
    }
    setShowVitalsModal(true);
  };

  const savePetVitals = async () => {
    if (!selectedPet || !bookingId) return;

    try {
      const vitalData = {
        bookingId: parseInt(bookingId),
        petId: selectedPet.id,
        weight: petVitals.weight ? parseFloat(petVitals.weight) : null,
        temperature: petVitals.temperature ? parseFloat(petVitals.temperature) : null,
        heartRate: petVitals.heartRate ? parseFloat(petVitals.heartRate) : null,
        notes: petVitals.notes || null
      };

      await apiRequest('/api/pet-vitals', {
        method: 'POST',
        body: JSON.stringify(vitalData)
      });

      toast({
        title: t('success'),
        description: t('vitalsUpdated'),
        variant: 'default'
      });
      setShowVitalsModal(false);
    } catch (error) {
      console.error('Failed to save pet vitals:', error);
      toast({
        title: t('error'),
        description: t('failedToSave'),
        variant: 'destructive'
      });
    }
  };

  // Upload modal
  const openUploadModal = (pet: Pet) => {
    setSelectedPet(pet);
    setShowUploadModal(true);
  };

  // Generate invoice
  const handleGenerateInvoiceClick = () => {
    setShowConfirmDialog(true);
  };

  const confirmGenerateInvoice = async () => {
    try {
      await apiRequest(`/api/invoice-status/${bookingId}`, {
        method: 'POST',
        body: JSON.stringify({ isLocked: true })
      });

      await apiRequest(`/api/send-invoice-email/${bookingId}`, {
        method: 'POST'
      });

      setIsRecordLocked(true);
      setShowConfirmDialog(false);
      
      toast({
        title: t('success'),
        description: t('invoiceGenerated'),
        variant: 'default'
      });
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      toast({
        title: t('error'),
        description: t('failedToGenerate'),
        variant: 'destructive'
      });
    }
  };

  // Calculate totals
  const subtotal = Array.isArray(invoiceItems) ? invoiceItems.reduce((sum, item) => sum + item.totalBeforeVat, 0) : 0;
  const totalVat = Array.isArray(invoiceItems) ? invoiceItems.reduce((sum, item) => sum + item.vatAmount, 0) : 0;
  const grandTotal = subtotal + totalVat;
  const totalPaid = Array.isArray(payments) ? payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
  const remainingBalance = grandTotal - totalPaid;

  if (bookingLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('bookingNotFound')}</h2>
          <p className="text-gray-600 mb-4">{t('bookingNotFoundDesc')}</p>
          <Button onClick={() => setLocation('/doctor-activity')}>
            {t('backToActivity')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-50 p-4" 
      dir={getDirection(language)} 
      style={{ textAlign: getTextAlign(language) }}
    >
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/doctor-activity')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              <FileText className="h-6 w-6 text-purple-600 ml-2 inline" />
              {t('invoice')}
            </h1>
          </div>
          {isRecordLocked && (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {t('invoiceGenerated')} ✓
            </div>
          )}
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          <User className="h-6 w-6 text-purple-600 ml-2 inline" />
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
        {booking?.pets && Array.isArray(booking.pets) && booking.pets.length > 0 ? booking.pets.map((pet, index) => (
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
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Stethoscope className="h-4 w-4 mr-2" />
                {t('vitals')}
              </Button>
              <Button 
                onClick={() => openUploadModal(pet)}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                {t('upload')}
              </Button>
            </div>
          </div>
        )) : (
          <p className="text-gray-500">{t('noPets')}</p>
        )}
      </div>

      {/* Invoice Items */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('invoiceItems')}
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 w-2/5" style={{ textAlign: getTextAlign(language) }}>
                  {t('description')}
                </th>
                <th className="text-center py-2 px-2 w-16">
                  {t('quantity')}
                </th>
                <th className="text-center py-2 px-2 w-20">
                  {t('unitPrice')} ({t('sar')})
                </th>
                <th className="text-center py-2 px-2 w-20">
                  {language === 'ar' ? 'الخصم' : 'Discount'}
                </th>
                <th className="text-center py-2 px-2 w-16">
                  {language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'} (15%)
                </th>
                <th className="text-center py-2 px-2 w-20">
                  {language === 'ar' ? 'المجموع بعد الضريبة' : 'Total After VAT'} ({t('sar')})
                </th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(invoiceItems) ? invoiceItems.map((item) => (
                <tr key={item.id} className="border-b">
                  {/* Description with Search */}
                  <td className="py-2 px-2">
                    <div className="relative">
                      <Input
                        value={item.description}
                        onChange={(e) => {
                          updateItem(item.id, 'description', e.target.value);
                          setSearchTerm(e.target.value);
                          setShowSearchResults(e.target.value.length > 0);
                        }}
                        placeholder={t('enterDescription')}
                        className="w-full"
                        disabled={isRecordLocked}
                      />
                      
                      {/* Search Results Dropdown */}
                      {showSearchResults && searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {searchItems(searchTerm).map((searchItem) => (
                            <div
                              key={searchItem.id}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleSearchSelect(searchItem)}
                            >
                              <div className="font-medium">{searchItem.name}</div>
                              <div className="text-sm text-gray-500">{searchItem.price} {t('sar')}</div>
                            </div>
                          ))}
                          {searchItems(searchTerm).length === 0 && (
                            <div className="px-3 py-2 text-gray-500">
                              {t('noResults')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Quantity */}
                  <td className="py-2 px-2 text-center">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-16 h-8 text-xs text-center"
                      disabled={isRecordLocked}
                    />
                  </td>
                  
                  {/* Unit Price */}
                  <td className="py-2 px-2 text-center">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-20 h-8 text-xs text-center"
                      disabled={isRecordLocked}
                    />
                  </td>
                  
                  {/* Discount */}
                  <td className="py-2 px-2">
                    <div className="flex items-center space-x-1">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-16 h-8 text-xs text-center"
                        disabled={isRecordLocked}
                      />
                      <Select
                        value={item.discountType}
                        onValueChange={(value) => updateItem(item.id, 'discountType', value)}
                        disabled={isRecordLocked}
                      >
                        <SelectTrigger className="w-16 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="amount">{t('sar')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  
                  {/* VAT Amount */}
                  <td className="py-2 px-2 text-center">
                    <div className="bg-green-100 p-2 rounded text-green-700">
                      {item.vatAmount.toFixed(2)}
                    </div>
                  </td>
                  
                  {/* Total After VAT */}
                  <td className="py-2 px-2 text-center">
                    <div className="bg-gray-100 p-2 rounded text-gray-700 font-semibold">
                      {item.totalAfterVat.toFixed(2)}
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="py-2 px-2">
                    {!isRecordLocked && invoiceItems.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newItems = invoiceItems.filter(i => i.id !== item.id);
                          setInvoiceItems(newItems);
                          saveInvoiceItems(newItems);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>

        {!isRecordLocked && (
          <div className="flex items-center justify-between mb-4 mt-4">
            <button
              onClick={addItem}
              className="flex items-center text-purple-600 hover:text-purple-700"
            >
              <Plus className="h-4 w-4 ml-1" />
              {t('addItem')}
            </button>
          </div>
        )}

        {/* Totals */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"></div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{t('subtotal')}:</span>
                <span>{subtotal.toFixed(2)} {t('sar')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('vat')} (15%):</span>
                <span>{totalVat.toFixed(2)} {t('sar')}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>{t('total')}:</span>
                <span>{grandTotal.toFixed(2)} {t('sar')}</span>
              </div>
              {totalPaid > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>{t('paid')}:</span>
                    <span>{totalPaid.toFixed(2)} {t('sar')}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>{t('remaining')}:</span>
                    <span className={remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                      {remainingBalance.toFixed(2)} {t('sar')}
                    </span>
                  </div>
                </>
              )}
              <div className="mt-4">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={remainingBalance <= 0}
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    remainingBalance <= 0
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {remainingBalance <= 0 ? `${t('paymentCompleted')} ✓` : t('addPayment')}
                </button>
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
          disabled={isRecordLocked}
        />
      </div>

      {/* Payment History */}
      {Array.isArray(payments) && payments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {t('paymentHistory')}
          </h2>
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <div>
                  <div className="font-semibold text-green-600">
                    {payment.amount.toFixed(2)} {t('sar')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {payment.type} • {payment.description}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(payment.date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </div>
                </div>
                <div className="text-green-500">
                  ✓
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between font-bold">
              <span>{t('totalPaid')}:</span>
              <span className="text-green-600">{totalPaid.toFixed(2)} {t('sar')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Generate Invoice Button */}
      <div className="flex justify-center mb-6">
        <Button
          onClick={handleGenerateInvoiceClick}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
          disabled={isRecordLocked}
        >
          <Receipt className="h-6 w-6 ml-2" />
          {isRecordLocked ? t('invoiceGenerated') : t('generateInvoice')}
        </Button>
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
                {t('petVitals')} - {selectedPet.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('weight')} (kg)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={petVitals.weight}
                    onChange={(e) => setPetVitals({...petVitals, weight: e.target.value})}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('temperature')} (°C)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={petVitals.temperature}
                    onChange={(e) => setPetVitals({...petVitals, temperature: e.target.value})}
                    placeholder="37.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('heartRate')} (bpm)
                  </label>
                  <Input
                    type="number"
                    value={petVitals.heartRate}
                    onChange={(e) => setPetVitals({...petVitals, heartRate: e.target.value})}
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('notes')}
                  </label>
                  <Textarea
                    value={petVitals.notes}
                    onChange={(e) => setPetVitals({...petVitals, notes: e.target.value})}
                    placeholder={t('enterNotes')}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowVitalsModal(false)}>
                  {t('cancel')}
                </Button>
                <Button onClick={savePetVitals} className="bg-purple-600 hover:bg-purple-700 text-white">
                  {t('save')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingId={bookingId || ''}
          remainingBalance={remainingBalance}
          onPaymentAdded={(payment) => {
            setPayments([...payments, payment]);
            setShowPaymentModal(false);
          }}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedPet && (
        <UploadAttachmentModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          petId={selectedPet.id}
        />
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent 
          className="sm:max-w-md"
          dir={getDirection(language)}
          style={{ textAlign: getTextAlign(language) }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              {t('confirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {t('confirmMessage')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowConfirmDialog(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              onClick={confirmGenerateInvoice}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}