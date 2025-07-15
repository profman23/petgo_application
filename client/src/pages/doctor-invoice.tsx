import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/i18n';
import { ArrowLeft, FileText, User, Phone, Calendar, Mail, Plus, Minus, Receipt, Save, Stethoscope, Upload, AlertTriangle } from 'lucide-react';
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
import { Check, ChevronDown, Search, X } from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'none' | '10%' | '100%';
  vatRate: number;
  vatAmount: number;
  totalBeforeVat: number;
  totalAfterVat: number;
  total: number; // Keep for backward compatibility
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

export default function DoctorInvoice() {
  const [, params] = useRoute('/doctor-invoice/:bookingId');
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { 
      id: '1', 
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
    }
  ]);
  const [notes, setNotes] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Tax rate constant (15%)
  const TAX_RATE = 0.15;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState('');

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
  const { data: savedInvoiceItems } = useQuery({
    queryKey: [`/api/invoice-items/${params?.bookingId}`],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoice-items/${params?.bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 404) return []; // No items found
        throw new Error('Failed to fetch invoice items');
      }
      return await response.json();
    },
    enabled: !!params?.bookingId,
  });

  // Fetch invoice status
  const { data: invoiceStatus } = useQuery({
    queryKey: [`/api/invoice-status/${params?.bookingId}`],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoice-status/${params?.bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 404) return null; // No status found
        throw new Error('Failed to fetch invoice status');
      }
      return await response.json();
    },
    enabled: !!params?.bookingId,
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
        discount: parseFloat(item.discount) || 0,
        discountType: item.discountType || 'none',
        vatRate: parseFloat(item.vatRate) || 15,
        vatAmount: parseFloat(item.vatAmount) || 0,
        totalBeforeVat: parseFloat(item.totalBeforeVat) || 0,
        totalAfterVat: parseFloat(item.totalAfterVat) || 0,
        total: parseFloat(item.total) || 0
      }));
      console.log('Loaded items:', loadedItems);
      setInvoiceItems(loadedItems);
    } else if (savedInvoiceItems && savedInvoiceItems.length === 0) {
      // If no saved items, keep the default item
      setInvoiceItems([{ 
        id: '1', 
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
      if (invoiceStatus.isGenerated) {
        setIsRecordLocked(true);
        
        // Check if this is a generated invoice with invoice number (new system)
        if (invoiceStatus.invoiceNumber) {
          console.log('✅ Invoice found:', invoiceStatus.invoiceNumber);
          // Invoice is permanently generated - show as read-only
          setShowInvoiceGenerator(true);
          
          // Load the complete generated invoice data
          loadGeneratedInvoiceData(invoiceStatus.invoiceNumber);
        } else {
          // Old system compatibility
          if (invoiceStatus.discountAmount) {
            setApplyDiscount(parseFloat(invoiceStatus.discountAmount) > 0);
          }
          if (invoiceStatus.notes) {
            setNotes(invoiceStatus.notes);
          }
        }
      }
    }
  }, [invoiceStatus]);

  // Function to load generated invoice data
  const loadGeneratedInvoiceData = async (invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/generated-invoice/${invoiceNumber}`);
      if (response.ok) {
        const generatedInvoice = await response.json();
        console.log('📄 Loading generated invoice data:', generatedInvoice);
        
        // Restore invoice items from generated invoice
        if (generatedInvoice.items) {
          setInvoiceItems(generatedInvoice.items.map((item: any) => ({
            id: item.id || Date.now().toString(),
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            discountType: item.discountType || 'none',
            vatRate: item.vatRate || 15,
            vatAmount: item.vatAmount || 0,
            totalBeforeVat: item.totalBeforeVat || item.total,
            totalAfterVat: item.totalAfterVat || (item.total * 1.15),
            total: item.total
          })));
        }
        
        // Restore notes
        if (generatedInvoice.notes) {
          setNotes(generatedInvoice.notes);
        }
        
        console.log('✅ Generated invoice data loaded successfully');
      }
    } catch (error) {
      console.error('Error loading generated invoice data:', error);
    }
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
      subtotal: 'المجموع قبل الضريبة',
      tax: 'ضريبة القيمة المضافة 15%',
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
      searchPlaceholder: 'ابحث في المنتجات والخدمات...',
      noResults: 'لا توجد نتائج',
      searchResults: 'نتائج البحث',
      exactMatch: 'تطابق تام',
      partialMatch: 'تطابق جزئي',
      categoryFilter: 'تصفية حسب الفئة',
      priceRange: 'نطاق السعر',
      sortBy: 'ترتيب حسب',
      sortByName: 'الاسم',
      sortByPrice: 'السعر',
      clearFilters: 'مسح الفلاتر',
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
      subtotal: 'Total Before VAT',
      tax: 'VAT 15%',
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
      searchPlaceholder: 'Search products and services...',
      noResults: 'No results found',
      searchResults: 'Search Results',
      exactMatch: 'Exact Match',
      partialMatch: 'Partial Match',
      categoryFilter: 'Filter by Category',
      priceRange: 'Price Range',
      sortBy: 'Sort By',
      sortByName: 'Name',
      sortByPrice: 'Price',
      clearFilters: 'Clear Filters',
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
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.totalBeforeVat, 0);
  const taxAmount = invoiceItems.reduce((sum, item) => sum + item.vatAmount, 0);
  // Calculate total discount amount from all items
  const totalDiscountAmount = invoiceItems.reduce((sum, item) => {
    const itemSubtotal = item.unitPrice * item.quantity;
    if (item.discountType === '10%') {
      return sum + (itemSubtotal * 0.10);
    } else if (item.discountType === '100%') {
      return sum + itemSubtotal;
    }
    return sum;
  }, 0);
  const totalWithTax = subtotal + taxAmount;
  const finalTotal = totalWithTax;
  const remainingBalance = finalTotal - totalPaid;
  
  // Calculate values for each item automatically
  const calculateItemValues = (item: InvoiceItem) => {
    // Calculate discount amount based on new discount types
    let discountAmount = 0;
    const subtotal = item.unitPrice * item.quantity;
    
    if (item.discountType === '10%') {
      discountAmount = subtotal * 0.10; // 10% discount
    } else if (item.discountType === '100%') {
      discountAmount = subtotal; // 100% discount (free)
    } else {
      discountAmount = 0; // No discount
    }
    
    // Calculate total before VAT
    const totalBeforeVat = subtotal - discountAmount;
    
    // Calculate VAT amount (15% of total before VAT)
    const vatAmount = totalBeforeVat * (item.vatRate / 100);
    
    // Calculate total after VAT
    const totalAfterVat = totalBeforeVat + vatAmount;
    
    return {
      ...item,
      vatAmount,
      totalBeforeVat,
      totalAfterVat,
      total: totalAfterVat // Keep for backward compatibility
    };
  };

  // Update item and recalculate all values
  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems(items => 
      items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Recalculate all values whenever any field changes
          return calculateItemValues(updated);
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
    const newItem = { 
      id: newId, 
      description: '', 
      quantity: 1, 
      unitPrice: 0, 
      discount: 0,
      discountType: 'none' as const,
      vatRate: 15,
      vatAmount: 0,
      totalBeforeVat: 0,
      totalAfterVat: 0,
      total: 0 
    };
    const newItems = [...invoiceItems, calculateItemValues(newItem)];
    setInvoiceItems(newItems);
    saveInvoiceItems(newItems);
  };

  // Mobile-optimized search filtering function
  const filterItems = (items: any[], query: string) => {
    // Show first 8 items when no search query (mobile-friendly)
    if (!query.trim()) return items.slice(0, 8);
    
    const searchTerm = query.toLowerCase().trim();
    
    const filteredItems = items.filter(item => {
      // Get all searchable fields
      const name = item.name?.toLowerCase() || '';
      const nameAr = item.name_ar?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      const descriptionAr = item.description_ar?.toLowerCase() || '';
      const category = item.category?.toLowerCase() || '';
      const categoryAr = item.category_ar?.toLowerCase() || '';
      const sku = item.sku?.toLowerCase() || '';
      const unit = item.unit?.toLowerCase() || '';
      const unitAr = item.unit_ar?.toLowerCase() || '';
      
      // Create array of all searchable text
      const searchableFields = [
        name, nameAr, description, descriptionAr, 
        category, categoryAr, sku, unit, unitAr
      ].filter(field => field.length > 0);
      
      // Multiple search strategies
      return searchableFields.some(field => {
        // Exact match
        if (field.includes(searchTerm)) return true;
        
        // Arabic letter variations
        const normalizedField = field.replace(/[ي]/g, 'ى').replace(/[ک]/g, 'ك').replace(/[ؤ]/g, 'و');
        const normalizedSearch = searchTerm.replace(/[ي]/g, 'ى').replace(/[ک]/g, 'ك').replace(/[ؤ]/g, 'و');
        if (normalizedField.includes(normalizedSearch)) return true;
        
        // Word boundary search (each word in search term)
        const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 0);
        if (searchWords.length > 1) {
          return searchWords.every(word => field.includes(word));
        }
        
        // Partial word match for Arabic (minimum 2 characters)
        if (searchTerm.length >= 2 && /[\u0600-\u06FF]/.test(searchTerm)) {
          const searchChars = searchTerm.split('');
          return searchChars.every(char => field.includes(char));
        }
        
        return false;
      });
    }).sort((a, b) => {
      // Smart sorting: exact matches first, then partial matches
      const aName = a.name?.toLowerCase() || '';
      const bName = b.name?.toLowerCase() || '';
      
      const aExact = aName.startsWith(searchTerm) ? 1 : 0;
      const bExact = bName.startsWith(searchTerm) ? 1 : 0;
      
      if (aExact !== bExact) return bExact - aExact;
      
      // Then sort by name length (shorter names first)
      return aName.length - bName.length;
    });

    // Limit search results to 6 items for mobile optimization
    return filteredItems.slice(0, 6);
  };

  // Get filtered products and services based on search
  const filteredProducts = filterItems(products, searchQuery);
  const filteredServices = filterItems(services, searchQuery);

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
    
    // Clear search after selection
    setSearchQuery('');
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

      // Save invoice status to database
      await apiRequest(`/api/invoice-status/${booking.id}`, {
        method: 'POST',
        body: {
          subtotal,
          taxAmount,
          discountAmount: totalDiscountAmount,
          finalTotal,
          notes
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 relative" style={{ overflow: 'visible', zIndex: 1 }}>
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
          
          <div className="overflow-x-auto relative" style={{ overflow: 'visible' }}>
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b">
                  {/* Field order for English: Description, Quantity, Unit Price, Discount, VAT, Total Before VAT, Total After VAT */}
                  {/* Field order for Arabic: Total After VAT, Total Before VAT, VAT, Discount, Unit Price, Quantity, Description */}
                  {language === 'ar' ? (
                    // Arabic RTL order
                    <>
                      <th className="text-center py-2 px-2 w-32">
                        {language === 'ar' ? 'المجموع بعد الضريبة' : 'Total After VAT'} ({t('sar')})
                      </th>
                      <th className="text-center py-2 px-2 w-32">
                        {language === 'ar' ? 'المجموع قبل الضريبة' : 'Total Before VAT'} ({t('sar')})
                      </th>
                      <th className="text-center py-2 px-2 w-24">
                        {language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'} (15%)
                      </th>
                      <th className="text-center py-2 px-2 w-28">
                        {language === 'ar' ? 'الخصم' : 'Discount'}
                      </th>
                      <th className="text-center py-2 px-2 w-32">
                        {t('unitPrice')} ({t('sar')})
                      </th>
                      <th className="text-center py-2 px-2 w-24">
                        {t('quantity')}
                      </th>
                      <th className="text-left py-2 px-2" style={{ textAlign: getTextAlign(language), width: '35%' }}>
                        {t('description')}
                      </th>
                      <th className="w-16"></th>
                    </>
                  ) : (
                    // English LTR order
                    <>
                      <th className="text-left py-2 px-2" style={{ textAlign: getTextAlign(language), width: '35%' }}>
                        {t('description')}
                      </th>
                      <th className="text-center py-2 px-2 w-24">
                        {t('quantity')}
                      </th>
                      <th className="text-center py-2 px-2 w-32">
                        {t('unitPrice')} ({t('sar')})
                      </th>
                      <th className="text-center py-2 px-2 w-28">
                        {language === 'ar' ? 'الخصم' : 'Discount'}
                      </th>
                      <th className="text-center py-2 px-2 w-24">
                        {language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'} (15%)
                      </th>
                      <th className="text-center py-2 px-2 w-32">
                        {language === 'ar' ? 'المجموع قبل الضريبة' : 'Total Before VAT'} ({t('sar')})
                      </th>
                      <th className="text-center py-2 px-2 w-32">
                        {language === 'ar' ? 'المجموع بعد الضريبة' : 'Total After VAT'} ({t('sar')})
                      </th>
                      <th className="w-16"></th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {invoiceItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    {/* Render cells in different order based on language */}
                    {language === 'ar' ? (
                      // Arabic RTL order: Total After VAT, Total Before VAT, VAT, Discount, Unit Price, Quantity, Description
                      <>
                        {/* Total After VAT */}
                        <td className="py-2 px-2 text-center">
                          <div className="bg-gray-100 p-2 rounded text-gray-700 font-semibold">
                            {item.totalAfterVat.toFixed(2)}
                          </div>
                        </td>
                        
                        {/* Total Before VAT */}
                        <td className="py-2 px-2 text-center">
                          <div className="bg-gray-100 p-2 rounded text-gray-700">
                            {item.totalBeforeVat.toFixed(2)}
                          </div>
                        </td>
                        
                        {/* VAT Amount */}
                        <td className="py-2 px-2 text-center">
                          <div className="bg-green-100 p-2 rounded text-green-700">
                            {item.vatAmount.toFixed(2)}
                          </div>
                        </td>
                        
                        {/* Discount */}
                        <td className="py-2 px-2">
                          {isRecordLocked ? (
                            <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                              {item.discountType === 'none' 
                                ? (language === 'ar' ? 'بدون خصم' : 'No Discount')
                                : item.discountType === '10%' 
                                  ? (language === 'ar' ? 'خصم 10%' : '10% Discount')
                                  : (language === 'ar' ? 'خصم 100%' : '100% Discount')
                              }
                            </div>
                          ) : (
                            <Select
                              value={item.discountType}
                              onValueChange={(value) => updateItem(item.id, 'discountType', value)}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">{language === 'ar' ? 'بدون خصم' : 'No Discount'}</SelectItem>
                                <SelectItem value="10%">{language === 'ar' ? 'خصم 10%' : '10% Discount'}</SelectItem>
                                <SelectItem value="100%">{language === 'ar' ? 'خصم 100%' : '100% Discount'}</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        
                        {/* Unit Price */}
                        <td className="py-2 px-2">
                          <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                            {item.unitPrice.toFixed(2)}
                          </div>
                        </td>
                        
                        {/* Quantity */}
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
                        
                        {/* Description with Enhanced Search */}
                        <td className="py-2 px-2" style={{ width: '35%' }}>
                          {isRecordLocked ? (
                            <div className="bg-gray-100 p-2 rounded text-gray-700">
                              {item.description || t('description')}
                            </div>
                          ) : (
                            <div className="relative">
                              {/* Enhanced Search Field for products/services */}
                              {(products.length > 0 || services.length > 0) ? (
                                <div className="relative">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                      type="text"
                                      value={item.description || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        updateItem(item.id, 'description', value);
                                        setSearchQuery(value);
                                        setDropdownOpen(value.length > 0 ? item.id : '');
                                      }}
                                      onFocus={() => {
                                        setSearchQuery(item.description || '');
                                        setDropdownOpen(item.id);
                                      }}
                                      onBlur={() => {
                                        setTimeout(() => setDropdownOpen(''), 200);
                                      }}
                                      placeholder={language === 'ar' ? 'ابحث أو اكتب اسم المنتج/الخدمة...' : 'Search or type product/service name...'}
                                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                                    />
                                    {(item.description || searchQuery) && (
                                      <button
                                        onClick={() => {
                                          updateItem(item.id, 'description', '');
                                          setSearchQuery('');
                                          setDropdownOpen('');
                                        }}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-sm opacity-70 hover:opacity-100 hover:bg-gray-100"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                  
                                  {/* Search Results Dropdown */}
                                  {dropdownOpen === item.id && (filteredProducts.length > 0 || filteredServices.length > 0) && (
                                    <div className="absolute bottom-full mb-2 left-0 z-50 bg-white border border-gray-200 rounded-md shadow-2xl max-h-96 overflow-hidden" style={{ 
                                      zIndex: 9999,
                                      width: '100%',
                                      maxWidth: '400px'
                                    }}>
                                      <div className="p-0">
                                        <div className="px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                                          <div className="flex items-center justify-between">
                                            <div className="text-xs font-medium text-purple-700">
                                              {language === 'ar' ? 'المنتجات والخدمات' : 'Products & Services'}
                                              <span className="ml-2 text-purple-600">
                                                ({filteredProducts.length + filteredServices.length})
                                              </span>
                                            </div>
                                            {searchQuery && (
                                              <div className="text-xs text-purple-600 bg-white px-2 py-1 rounded-full">
                                                "{searchQuery}"
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Combined Products & Services List */}
                                        <div className="max-h-60 overflow-y-auto">
                                          {/* Products Section */}
                                          {filteredProducts.length > 0 && (
                                            <>
                                              <div className="px-3 py-2 bg-purple-50 border-b border-purple-100">
                                                <div className="flex items-center text-xs font-medium text-purple-700">
                                                  <span className="mr-2">📦</span>
                                                  {language === 'ar' ? 'المنتجات' : 'Products'} ({filteredProducts.length})
                                                </div>
                                              </div>
                                              {filteredProducts.map((product: any, index: number) => (
                                                <div
                                                  key={`product-${product.id}-arabic`}
                                                  onClick={() => {
                                                    updateItem(item.id, 'description', product.name);
                                                    updateItem(item.id, 'unitPrice', parseFloat(product.price) || 0);
                                                    setDropdownOpen('');
                                                    setSearchQuery('');
                                                  }}
                                                  className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 transition-all duration-200 group"
                                                >
                                                  <div className="flex items-center w-full">
                                                    <Check
                                                      className={`mr-3 h-4 w-4 transition-all duration-200 ${
                                                        item.description === product.name 
                                                          ? 'opacity-100 text-purple-600' 
                                                          : 'opacity-0 group-hover:opacity-30'
                                                      }`}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                      <div className="flex items-center justify-between">
                                                        <div className="text-sm font-medium text-gray-900 truncate max-w-40">
                                                          {product.name}
                                                        </div>
                                                        <div className="text-xs font-bold text-purple-600 ml-1 bg-purple-100 px-1.5 py-0.5 rounded">
                                                          {product.price} {language === 'ar' ? 'ر.س' : 'SAR'}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </>
                                          )}
                                          
                                          {/* Services Section */}
                                          {filteredServices.length > 0 && (
                                            <>
                                              <div className="px-3 py-2 bg-blue-50 border-b border-blue-100">
                                                <div className="flex items-center text-xs font-medium text-blue-700">
                                                  <span className="mr-2">🩺</span>
                                                  {language === 'ar' ? 'الخدمات' : 'Services'} ({filteredServices.length})
                                                </div>
                                              </div>
                                              {filteredServices.map((service: any, index: number) => (
                                                <div
                                                  key={`service-${service.id}-arabic`}
                                                  onClick={() => {
                                                    updateItem(item.id, 'description', service.name);
                                                    updateItem(item.id, 'unitPrice', parseFloat(service.price) || 0);
                                                    setDropdownOpen('');
                                                    setSearchQuery('');
                                                  }}
                                                  className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-all duration-200 group"
                                                >
                                                  <div className="flex items-center w-full">
                                                    <Check
                                                      className={`mr-3 h-4 w-4 transition-all duration-200 ${
                                                        item.description === service.name 
                                                          ? 'opacity-100 text-blue-600' 
                                                          : 'opacity-0 group-hover:opacity-30'
                                                      }`}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                      <div className="flex items-center justify-between">
                                                        <div className="text-sm font-medium text-gray-900 truncate max-w-40">
                                                          {service.name}
                                                        </div>
                                                        <div className="text-xs font-bold text-blue-600 ml-1 bg-blue-100 px-1.5 py-0.5 rounded">
                                                          {service.price} {language === 'ar' ? 'ر.س' : 'SAR'}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                  placeholder={language === 'ar' ? 'اكتب وصف المنتج أو الخدمة...' : 'Type product or service description...'}
                                  className="w-full"
                                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                                  style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                                />
                              )}
                            </div>
                          )}
                        </td>
                      </>
                    ) : (
                      // English LTR order: Description, Quantity, Unit Price, Discount, VAT, Total Before VAT, Total After VAT
                      <>
                        {/* Description with Enhanced Search */}
                        <td className="py-2 px-2" style={{ width: '35%' }}>
                          {isRecordLocked ? (
                            <div className="bg-gray-100 p-2 rounded text-gray-700">
                              {item.description || t('description')}
                            </div>
                          ) : (
                            <div className="relative">
                              {/* Enhanced Search Field for products/services */}
                              {(products.length > 0 || services.length > 0) ? (
                                <div className="relative">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                      type="text"
                                      value={item.description || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        updateItem(item.id, 'description', value);
                                        setSearchQuery(value);
                                        setDropdownOpen(value.length > 0 ? item.id : '');
                                      }}
                                      onFocus={() => {
                                        setSearchQuery(item.description || '');
                                        setDropdownOpen(item.id);
                                      }}
                                      onBlur={() => {
                                        setTimeout(() => setDropdownOpen(''), 200);
                                      }}
                                      placeholder={language === 'ar' ? 'ابحث أو اكتب اسم المنتج/الخدمة...' : 'Search or type product/service name...'}
                                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                                    />
                                    {(item.description || searchQuery) && (
                                      <button
                                        onClick={() => {
                                          updateItem(item.id, 'description', '');
                                          setSearchQuery('');
                                          setDropdownOpen('');
                                        }}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-sm opacity-70 hover:opacity-100 hover:bg-gray-100"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                  
                                  {/* Search Results Dropdown */}
                                  {dropdownOpen === item.id && (filteredProducts.length > 0 || filteredServices.length > 0) && (
                                    <div className="absolute bottom-full mb-2 left-0 z-50 bg-white border border-gray-200 rounded-md shadow-2xl max-h-96 overflow-hidden" style={{ 
                                      zIndex: 9999,
                                      width: '100%',
                                      maxWidth: '400px'
                                    }}>
                                      <div className="p-0">
                                        <div className="px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                                          <div className="flex items-center justify-between">
                                            <div className="text-xs font-medium text-purple-700">
                                              {language === 'ar' ? 'المنتجات والخدمات' : 'Products & Services'}
                                              <span className="ml-2 text-purple-600">
                                                ({filteredProducts.length + filteredServices.length})
                                              </span>
                                            </div>
                                            {searchQuery && (
                                              <div className="text-xs text-purple-600 bg-white px-2 py-1 rounded-full">
                                                "{searchQuery}"
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Combined Products & Services List */}
                                        <div className="max-h-60 overflow-y-auto">
                                          {/* Products Section */}
                                          {filteredProducts.length > 0 && (
                                            <>
                                              <div className="px-3 py-2 bg-purple-50 border-b border-purple-100">
                                                <div className="flex items-center text-xs font-medium text-purple-700">
                                                  <span className="mr-2">📦</span>
                                                  {language === 'ar' ? 'المنتجات' : 'Products'} ({filteredProducts.length})
                                                </div>
                                              </div>
                                              {filteredProducts.map((product: any, index: number) => (
                                                <div
                                                  key={`product-${product.id}`}
                                                  onClick={() => {
                                                    updateItem(item.id, 'description', product.name);
                                                    updateItem(item.id, 'unitPrice', parseFloat(product.price) || 0);
                                                    setDropdownOpen('');
                                                    setSearchQuery('');
                                                  }}
                                                  className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 transition-all duration-200 group"
                                                >
                                                  <div className="flex items-center w-full">
                                                    <Check
                                                      className={`mr-3 h-4 w-4 transition-all duration-200 ${
                                                        item.description === product.name 
                                                          ? 'opacity-100 text-purple-600' 
                                                          : 'opacity-0 group-hover:opacity-30'
                                                      }`}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                      <div className="flex items-center justify-between">
                                                        <div className="text-sm font-medium text-gray-900 truncate max-w-40">
                                                          {product.name}
                                                        </div>
                                                        <div className="text-xs font-bold text-purple-600 ml-1 bg-purple-100 px-1.5 py-0.5 rounded">
                                                          {product.price} {language === 'ar' ? 'ر.س' : 'SAR'}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </>
                                          )}
                                          
                                          {/* Services Section */}
                                          {filteredServices.length > 0 && (
                                            <>
                                              <div className="px-3 py-2 bg-blue-50 border-b border-blue-100">
                                                <div className="flex items-center text-xs font-medium text-blue-700">
                                                  <span className="mr-2">🩺</span>
                                                  {language === 'ar' ? 'الخدمات' : 'Services'} ({filteredServices.length})
                                                </div>
                                              </div>
                                              {filteredServices.map((service: any, index: number) => (
                                                <div
                                                  key={`service-${service.id}`}
                                                  onClick={() => {
                                                    updateItem(item.id, 'description', service.name);
                                                    updateItem(item.id, 'unitPrice', parseFloat(service.price) || 0);
                                                    setDropdownOpen('');
                                                    setSearchQuery('');
                                                  }}
                                                  className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-all duration-200 group"
                                                >
                                                  <div className="flex items-center w-full">
                                                    <Check
                                                      className={`mr-3 h-4 w-4 transition-all duration-200 ${
                                                        item.description === service.name 
                                                          ? 'opacity-100 text-blue-600' 
                                                          : 'opacity-0 group-hover:opacity-30'
                                                      }`}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                      <div className="flex items-center justify-between">
                                                        <div className="text-sm font-medium text-gray-900 truncate max-w-40">
                                                          {service.name}
                                                        </div>
                                                        <div className="text-xs font-bold text-blue-600 ml-1 bg-blue-100 px-1.5 py-0.5 rounded">
                                                          {service.price} {language === 'ar' ? 'ر.س' : 'SAR'}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                  placeholder={language === 'ar' ? 'اكتب وصف المنتج أو الخدمة...' : 'Type product or service description...'}
                                  className="w-full"
                                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                                  style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                                />
                              )}
                            </div>
                          )}
                        </td>
                        
                        {/* Quantity */}
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
                        
                        {/* Unit Price */}
                        <td className="py-2 px-2">
                          <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                            {item.unitPrice.toFixed(2)}
                          </div>
                        </td>
                        
                        {/* Discount */}
                        <td className="py-2 px-2">
                          {isRecordLocked ? (
                            <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                              {item.discountType === 'none' 
                                ? (language === 'ar' ? 'بدون خصم' : 'No Discount')
                                : item.discountType === '10%' 
                                  ? (language === 'ar' ? 'خصم 10%' : '10% Discount')
                                  : (language === 'ar' ? 'خصم 100%' : '100% Discount')
                              }
                            </div>
                          ) : (
                            <Select
                              value={item.discountType}
                              onValueChange={(value) => updateItem(item.id, 'discountType', value)}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">{language === 'ar' ? 'بدون خصم' : 'No Discount'}</SelectItem>
                                <SelectItem value="10%">{language === 'ar' ? 'خصم 10%' : '10% Discount'}</SelectItem>
                                <SelectItem value="100%">{language === 'ar' ? 'خصم 100%' : '100% Discount'}</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        
                        {/* VAT Amount */}
                        <td className="py-2 px-2 text-center">
                          <div className="bg-green-100 p-2 rounded text-green-700">
                            {item.vatAmount.toFixed(2)}
                          </div>
                        </td>
                        
                        {/* Total Before VAT */}
                        <td className="py-2 px-2 text-center">
                          <div className="bg-gray-100 p-2 rounded text-gray-700">
                            {item.totalBeforeVat.toFixed(2)}
                          </div>
                        </td>
                        
                        {/* Total After VAT */}
                        <td className="py-2 px-2 text-center">
                          <div className="bg-gray-100 p-2 rounded text-gray-700 font-semibold">
                            {item.totalAfterVat.toFixed(2)}
                          </div>
                        </td>
                      </>
                    )}
                    
                    {/* Action buttons (same for both languages) */}
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
                {totalDiscountAmount > 0 && (
                  <div className="flex justify-between mb-2 text-green-600">
                    <span>{t('discount')}:</span>
                    <span>-{totalDiscountAmount.toFixed(2)} {t('sar')}</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span>{t('tax')}:</span>
                  <span>{taxAmount.toFixed(2)} {t('sar')}</span>
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
                    disabled={remainingBalance <= 0}
                    className={`px-6 py-2 rounded-lg flex items-center transition-colors ${
                      remainingBalance <= 0 
                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {remainingBalance <= 0 ? `${t('paymentAdded')} ✓` : t('addPayment')}
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
          <Button
            onClick={handleGenerateInvoiceClick}
            disabled={isRecordLocked}
            className={`px-8 py-3 text-lg ${
              isRecordLocked 
                ? 'bg-gray-400 hover:bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-600 text-white'
            }`}
          >
            <Receipt className="h-6 w-6 ml-2" />
            {isRecordLocked ? `${t('generateInvoice')} ✓` : t('generateInvoice')}
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
            discount: totalDiscountAmount,
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