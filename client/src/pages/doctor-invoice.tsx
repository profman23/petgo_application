import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/lib/i18n';
import { ArrowLeft, FileText, User, Phone, Calendar, Mail, Plus, Minus, Receipt, Save, Stethoscope, Upload, AlertTriangle, RefreshCw } from 'lucide-react';
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
import { Check, ChevronDown } from "lucide-react";

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

// UPDATED: Added 100% discount option - V2.1 with cache fixes
export default function DoctorInvoice() {
  const [, params] = useRoute('/doctor-invoice/:bookingId');
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'full'>('none');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Tax rate constant (15%)
  const TAX_RATE = 0.15;
  // Discount rate constant (10%)
  const DISCOUNT_RATE = 0.10;
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPetForUpload, setSelectedPetForUpload] = useState<Pet | null>(null);
  const [vitalsData, setVitalsData] = useState({
    weight: '',
    temperature: '',
    heartRate: '',
    notes: ''
  });
  const [totalPaid, setTotalPaid] = useState(0);
  const [payments, setPayments] = useState<any[]>([]);
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isRecordLocked, setIsRecordLocked] = useState(false);
  const [invoiceSubTab, setInvoiceSubTab] = useState<'products' | 'services'>('products');

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

  // Fetch saved invoice items
  const { data: savedInvoiceItems, refetch: refetchInvoiceItems } = useQuery({
    queryKey: [`/api/invoice-items/${params?.bookingId}`],
    queryFn: async () => {
      const token = localStorage.getItem('doctorToken');
      const response = await fetch(`/api/invoice-items/${params?.bookingId}?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      if (!response.ok) {
        if (response.status === 404) return []; // No items found
        throw new Error('Failed to fetch invoice items');
      }
      return await response.json();
    },
    enabled: !!params?.bookingId,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache to avoid stale data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false,
    retry: false
  });

  // Fetch invoice status
  const { data: invoiceStatus, refetch: refetchInvoiceStatus } = useQuery({
    queryKey: [`/api/invoice-status/${params?.bookingId}`],
    queryFn: async () => {
      const token = localStorage.getItem('doctorToken');
      const response = await fetch(`/api/invoice-status/${params?.bookingId}?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      if (!response.ok) {
        if (response.status === 404) return null; // No status found
        throw new Error('Failed to fetch invoice status');
      }
      return await response.json();
    },
    enabled: !!params?.bookingId,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache to avoid stale lock state
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: false, // Don't retry failed requests
  });

  // Fetch products for invoice item selection
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await apiRequest('/api/products');
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch services for invoice item selection
  const { data: services = [], isLoading: isServicesLoading } = useQuery({
    queryKey: ['/api/services'],
    queryFn: async () => {
      const response = await apiRequest('/api/services');
      return response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  // Load saved invoice items when data is available
  useEffect(() => {
    if (savedInvoiceItems && savedInvoiceItems.length > 0) {
      console.log('Loading saved invoice items:', savedInvoiceItems);
      const loadedItems = savedInvoiceItems.map((item: any, index: number) => ({
        id: (index + 1).toString(),
        description: item.description || '',
        quantity: parseInt(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        total: parseFloat(item.total) || 0
      }));
      console.log('Loaded items:', loadedItems);
      setInvoiceItems(loadedItems);
    } else if (savedInvoiceItems && savedInvoiceItems.length === 0) {
      // If no saved items, keep the default item
      setInvoiceItems([{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }]);
    }
  }, [savedInvoiceItems]);

  // Auto-save when items are modified
  useEffect(() => {
    if (invoiceItems.length > 0 && booking && !isRecordLocked) {
      const timeoutId = setTimeout(() => {
        saveInvoiceItems(invoiceItems);
      }, 1000); // Save after 1 second of inactivity
      
      return () => clearTimeout(timeoutId);
    }
  }, [invoiceItems, booking, isRecordLocked]);

  // Load invoice status when data is available
  useEffect(() => {
    if (invoiceStatus) {
      console.log('Invoice status loaded:', invoiceStatus);
      const isGenerated = invoiceStatus.isGenerated || invoiceStatus.is_generated;
      setIsRecordLocked(Boolean(isGenerated));
      console.log('Record lock status set to:', Boolean(isGenerated));
      
      if (isGenerated) {
        // Determine discount type based on discount amount
        const discountValue = parseFloat(invoiceStatus.discountAmount) || 0;
        const subtotalValue = parseFloat(invoiceStatus.subtotal) || 0;
        const totalWithTaxValue = subtotalValue * (1 + TAX_RATE);
        
        console.log('Discount analysis:', { 
          discountValue, 
          subtotalValue, 
          totalWithTaxValue,
          discountAmount: invoiceStatus.discountAmount,
          subtotal: invoiceStatus.subtotal 
        });
        
        // Force update discount type with immediate state change
        if (discountValue === 0) {
          console.log('Setting discount type to: none');
          setDiscountType(prev => {
            console.log('Discount type changed from', prev, 'to none');
            return 'none';
          });
        } else if (Math.abs(discountValue - totalWithTaxValue) < 0.01) {
          console.log('Setting discount type to: full');
          setDiscountType(prev => {
            console.log('Discount type changed from', prev, 'to full');
            return 'full';
          });
        } else {
          console.log('Setting discount type to: percentage');
          setDiscountType(prev => {
            console.log('Discount type changed from', prev, 'to percentage');
            return 'percentage';
          });
        }
        setNotes(invoiceStatus.notes || '');
      } else {
        console.log('Invoice not generated, resetting discount type to none');
        setDiscountType(prev => {
          console.log('Discount type reset from', prev, 'to none');
          return 'none';
        });
      }
    } else {
      console.log('No invoice status data available');
      // Set default discount type when no status available
      setDiscountType(prev => {
        if (prev !== 'none') {
          console.log('Default discount type set from', prev, 'to none');
          return 'none';
        }
        return prev;
      });
    }
  }, [invoiceStatus]);

  // Initialize and force refresh on component mount
  useEffect(() => {
    console.log('Component mounted, clearing cache and initializing...');
    
    // Clear any existing cache for this booking
    queryClient.removeQueries({ queryKey: [`/api/invoice-status/${params?.bookingId}`] });
    queryClient.removeQueries({ queryKey: [`/api/invoice-items/${params?.bookingId}`] });
    
    // Set initial discount type
    if (discountType === '') {
      console.log('Discount type is empty, setting to none immediately');
      setDiscountType('none');
    }
  }, [params?.bookingId]); // Run when bookingId changes

  // Separate effect for invoice status updates
  useEffect(() => {
    if (!invoiceStatus && discountType === '') {
      console.log('No invoice status and empty discount, setting to none');
      setDiscountType('none');
    }
  }, [invoiceStatus]);

  // Force refresh function with cache invalidation
  const forceRefresh = async () => {
    console.log('Force refreshing all data with cache invalidation...');
    
    // Clear all React Query cache for this booking
    queryClient.removeQueries({ queryKey: [`/api/invoice-status/${params?.bookingId}`] });
    queryClient.removeQueries({ queryKey: [`/api/invoice-items/${params?.bookingId}`] });
    
    // Reset discount type before refetch
    setDiscountType('none');
    
    // Force refetch with new requests
    await Promise.all([
      refetchInvoiceStatus(),
      refetchInvoiceItems()
    ]);
    
    toast({
      title: language === 'ar' ? 'تم تحديث البيانات' : 'Data refreshed',
      description: language === 'ar' ? 'تم تحديث جميع البيانات بنجاح' : 'All data has been refreshed successfully'
    });
  };


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
      tax: 'الضريبة (15%)',
      discount: 'الخصم',
      finalTotal: 'المجموع النهائي',
      addPayment: 'إضافة دفعة',
      paymentAdded: 'تمت إضافة الدفعة',
      paymentSuccess: 'تمت إضافة الدفعة بنجاح',
      remainingBalance: 'الرصيد المتبقي',
      totalPaid: 'إجمالي المدفوع',
      paymentHistory: 'سجل المدفوعات',
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
      confirmTitle: 'تأكيد إنشاء الفاتورة',
      confirmMessage: 'هل أنت متأكد من إنشاء الفاتورة؟ سيتم حفظ جميع بنود الفاتورة وجعلها للمشاهدة فقط. لن تتمكن من تعديلها لاحقاً.',
      confirm: 'موافق',
      invoiceGenerated: 'تم إنشاء الفاتورة بنجاح',
      readOnly: 'للمشاهدة فقط',
      selectProduct: 'اختر المنتج أو الخدمة',
      products: 'المنتجات',
      services: 'الخدمات',
      importedItems: 'عناصر مستوردة',
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
      tax: 'Tax (15%)',
      discount: 'Discount',
      finalTotal: 'Final Total',
      addPayment: 'Add Payment',
      paymentAdded: 'Payment Added',
      paymentSuccess: 'Payment has been added successfully',
      remainingBalance: 'Remaining Balance',
      totalPaid: 'Total Paid',
      paymentHistory: 'Payment History',
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
      confirmTitle: 'Confirm Invoice Generation',
      confirmMessage: 'Are you sure you want to generate the invoice? All invoice items will be saved and made read-only. You will not be able to edit them later.',
      confirm: 'Confirm',
      invoiceGenerated: 'Invoice generated successfully',
      readOnly: 'Read Only',
      selectProduct: 'Select Product or Service',
      products: 'Products',
      services: 'Services',
      importedItems: 'Imported Items',
    }
  };

  const t = (key: keyof typeof translations.ar) => translations[language as keyof typeof translations][key];

  // Handle payment submission
  const handlePaymentSubmit = (paymentData: any) => {
    const newPayment = {
      id: Date.now(),
      amount: parseFloat(paymentData.amount),
      type: paymentData.paymentType,
      description: paymentData.description,
      date: new Date().toISOString()
    };
    
    setPayments(prev => [...prev, newPayment]);
    setTotalPaid(prev => prev + newPayment.amount);
    setShowPaymentModal(false);
    
    toast({
      title: t('paymentAdded'),
      description: `${t('paymentSuccess')} - ${newPayment.amount} ${t('sar')}`,
      variant: 'default',
    });
  };

  // Calculate totals
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * TAX_RATE;
  const totalWithTax = subtotal + taxAmount;
  const discountAmount = discountType === 'percentage' ? totalWithTax * DISCOUNT_RATE : 
                        discountType === 'full' ? totalWithTax : 0;
  const finalTotal = totalWithTax - discountAmount;
  const remainingBalance = finalTotal - totalPaid;

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

  // Save invoice items to database (auto-save)
  const saveInvoiceItems = async (itemsToSave: InvoiceItem[]) => {
    if (!booking || isRecordLocked) return;
    
    try {
      await apiRequest(`/api/invoice-items/${booking.id}`, {
        method: 'POST',
        body: { items: itemsToSave }
      });
    } catch (error) {
      console.error('Error auto-saving invoice items:', error);
    }
  };

  // Add new item
  const addItem = () => {
    const newId = (invoiceItems.length + 1).toString();
    const newItems = [...invoiceItems, { 
      id: newId, 
      description: '', 
      quantity: 1, 
      unitPrice: 0, 
      total: 0 
    }];
    setInvoiceItems(newItems);
    saveInvoiceItems(newItems);
  };

  // Handle product/service selection - shows only imported data
  const handleProductServiceSelect = (itemId: string, selectedId: string) => {
    const selectedProduct = products.find(p => p.id.toString() === selectedId);
    const selectedService = services.find(s => s.id.toString() === selectedId);
    
    const currentItem = invoiceItems.find(item => item.id === itemId);
    
    if (selectedProduct) {
      updateItem(itemId, 'description', selectedProduct.name);
      updateItem(itemId, 'unitPrice', parseFloat(selectedProduct.price));
      updateItem(itemId, 'total', parseFloat(selectedProduct.price) * (currentItem?.quantity || 1));
    } else if (selectedService) {
      updateItem(itemId, 'description', selectedService.name);
      updateItem(itemId, 'unitPrice', parseFloat(selectedService.price));
      updateItem(itemId, 'total', parseFloat(selectedService.price) * (currentItem?.quantity || 1));
    }
  };

  // Remove item
  const removeItem = (id: string) => {
    if (invoiceItems.length > 1) {
      const newItems = invoiceItems.filter(item => item.id !== id);
      setInvoiceItems(newItems);
      saveInvoiceItems(newItems);
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
        // Get the most recent vitals for this pet (sorted by recordedAt descending)
        const petVitalsArray = existingVitals.filter((vital: any) => vital.petId === pet.id);
        const petVitals = petVitalsArray.length > 0 ? 
          petVitalsArray.sort((a: any, b: any) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0] : 
          null;
        
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
      
      // Get the most recent vitals for this pet
      const petVitalsArray = existingVitals.filter((vital: any) => vital.petId === selectedPet.id);
      const existingPetVital = petVitalsArray.length > 0 ? 
        petVitalsArray.sort((a: any, b: any) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0] : 
        null;
        
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

  // Fetch doctor info for invoice
  const { data: doctorInfo } = useQuery({
    queryKey: ['/api/doctor/vetsvan-location'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/doctor/vetsvan-location', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch doctor info');
      return response.json();
    }
  });

  // Show confirmation dialog for invoice generation
  const handleGenerateInvoiceClick = () => {
    setShowConfirmDialog(true);
  };

  // Generate invoice after confirmation
  const confirmGenerateInvoice = async () => {
    try {
      if (!booking || !doctorInfo) {
        toast({
          title: language === 'ar' ? 'بيانات غير مكتملة' : 'Incomplete data',
          description: language === 'ar' ? 'يرجى التأكد من توفر جميع البيانات' : 'Please ensure all data is available',
          variant: 'destructive',
        });
        return;
      }

      // Save invoice items to database
      await apiRequest(`/api/invoice-items/${booking.id}`, {
        method: 'POST',
        body: { items: invoiceItems }
      });

      // Save invoice status to database with lock flag
      await apiRequest(`/api/invoice-status/${booking.id}`, {
        method: 'POST',
        body: {
          subtotal,
          taxAmount,
          discountAmount,
          finalTotal,
          notes,
          isGenerated: true // Mark as generated and locked
        }
      });

      // Lock the record (make invoice items read-only)
      setIsRecordLocked(true);
      setShowConfirmDialog(false);
      setShowInvoiceGenerator(true);

      // Send invoice link via email
      try {
        const emailResponse = await apiRequest(`/api/send-invoice-email/${booking.id}`, {
          method: 'POST'
        });
        
        if (emailResponse.success) {
          toast({
            title: t('invoiceGenerated'),
            description: language === 'ar' ? 'تم حفظ بنود الفاتورة وإرسال رابط الفاتورة للعميل' : 'Invoice items saved and invoice link sent to customer',
            variant: 'default',
          });
        } else {
          toast({
            title: t('invoiceGenerated'),
            description: language === 'ar' ? 'تم حفظ بنود الفاتورة ولكن فشل إرسال الرابط' : 'Invoice items saved but failed to send email link',
            variant: 'default',
          });
        }
      } catch (emailError) {
        console.error('Error sending invoice email:', emailError);
        toast({
          title: t('invoiceGenerated'),
          description: language === 'ar' ? 'تم حفظ بنود الفاتورة ولكن فشل إرسال الرابط' : 'Invoice items saved but failed to send email link',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: language === 'ar' ? '❌ خطأ في إنشاء الفاتورة' : '❌ Error generating invoice',
        description: language === 'ar' ? 'حدث خطأ أثناء إنشاء الفاتورة' : 'An error occurred while generating the invoice',
        variant: 'destructive',
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
                  className="bg-purple-600 hover:bg-purple-600 text-white"
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  {t('vitals')}
                </Button>
                <Button 
                  onClick={() => openUploadModal(pet)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'رفع مرفق' : 'Upload'}
                </Button>
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-gray-500">
              {language === 'ar' ? 'لا توجد حيوانات أليفة مسجلة' : 'No pets registered'}
            </div>
          )}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {t('invoiceItems')}
            </h2>
            {isRecordLocked && (
              <div className="flex items-center bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {t('readOnly')}
              </div>
            )}
          </div>
          
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
                      {isRecordLocked ? (
                        <div className="bg-gray-100 p-2 rounded text-gray-700">
                          {item.description || t('description')}
                        </div>
                      ) : (
                        <div>
                          {/* Searchable dropdown for products/services */}
                          {(products.length > 0 || services.length > 0) ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between"
                                >
                                  {item.description || t('selectProduct')}
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder={language === 'ar' ? 'ابحث...' : 'Search...'} />
                                  <CommandEmpty>{language === 'ar' ? 'لا توجد نتائج' : 'No results found'}</CommandEmpty>
                                  
                                  {/* Sub Tabs for Products/Services */}
                                  <div className="flex border-b border-gray-200 bg-gray-50 p-2">
                                    <button
                                      onClick={() => setInvoiceSubTab('products')}
                                      className={`px-3 py-1 text-xs font-medium border-b-2 transition-colors flex-1 ${
                                        invoiceSubTab === 'products'
                                          ? 'border-purple-600 text-purple-600 #85208550'
                                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                      }`}
                                    >
                                      {language === 'ar' ? '📦 المنتجات' : '📦 Products'}
                                    </button>
                                    <button
                                      onClick={() => setInvoiceSubTab('services')}
                                      className={`px-3 py-1 text-xs font-medium border-b-2 transition-colors flex-1 ${
                                        invoiceSubTab === 'services'
                                          ? 'border-purple-600 text-purple-600 #85208550'
                                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                      }`}
                                    >
                                      {language === 'ar' ? '🩺 الخدمات' : '🩺 Services'}
                                    </button>
                                  </div>
                                  {invoiceSubTab === 'products' && products.length > 0 && (
                                    <CommandGroup heading={t('products')}>
                                      {products.map((product: any) => (
                                        <CommandItem
                                          key={`product-${product.id}`}
                                          onSelect={() => handleProductServiceSelect(item.id, product.id.toString())}
                                        >
                                          <Check
                                            className={`mr-2 h-4 w-4 ${
                                              item.description === product.name ? 'opacity-100' : 'opacity-0'
                                            }`}
                                          />
                                          {product.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  )}
                                  {invoiceSubTab === 'services' && services.length > 0 && (
                                    <CommandGroup heading={t('services')}>
                                      {services.map((service: any) => (
                                        <CommandItem
                                          key={`service-${service.id}`}
                                          onSelect={() => handleProductServiceSelect(item.id, service.id.toString())}
                                        >
                                          <Check
                                            className={`mr-2 h-4 w-4 ${
                                              item.description === service.name ? 'opacity-100' : 'opacity-0'
                                            }`}
                                          />
                                          {service.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  )}
                                </Command>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              placeholder={t('description')}
                              className="w-full"
                            />
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {isRecordLocked ? (
                        <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                          {item.quantity}
                        </div>
                      ) : (
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full text-center"
                        />
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {isRecordLocked ? (
                        <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                          {item.unitPrice.toFixed(2)}
                        </div>
                      ) : (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full text-center"
                        />
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {item.total.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {!isRecordLocked && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                          disabled={invoiceItems.length === 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isRecordLocked && (
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={addItem}
                className="flex items-center text-purple-600 hover:text-purple-600"
              >
                <Plus className="h-4 w-4 ml-1" />
                {t('addItem')}
              </button>
              
              {/* Loading indicator for products/services */}
              {(isProductsLoading || isServicesLoading) && (
                <div className="flex items-center text-gray-500 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                  {t('importedItems')}...
                </div>
              )}
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
                    {isRecordLocked ? (language === 'ar' ? 'مؤمن - للمشاهدة فقط' : 'Locked - View Only') : 
                     (remainingBalance <= 0 ? `${t('paymentAdded')} ✓` : t('addPayment'))}
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
          />
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
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

        {/* Actions */}
        <div className="flex justify-center mb-6">
          {isRecordLocked ? (
            <div className="flex items-center bg-green-100 text-green-700 px-8 py-3 rounded-lg text-lg font-semibold">
              <svg className="h-6 w-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {language === 'ar' ? 'تم إنشاء الفاتورة ✓' : 'Invoice Generated ✓'}
            </div>
          ) : (
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
      {showInvoiceGenerator && booking && doctorInfo && (
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
            doctorName: doctorInfo.name || 'Dr. VETS VAN',
            vetsVanCode: doctorInfo.vetsvanCode || 'VETS001'
          }}
          onClose={() => setShowInvoiceGenerator(false)}
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
              className="bg-purple-600 hover:bg-purple-600 text-white"
            >
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}