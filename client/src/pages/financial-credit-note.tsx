import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Shield, LogOut, Car, Clock, BarChart3, FileText, User, Users, Upload, Package, Stethoscope, ChevronDown, ChevronUp, TrendingUp, Volume2, VolumeX, Bell, Home, Menu, DollarSign, Receipt, Search, Minus, FileText as InvoiceIcon, CreditCard, FilePlus, Handshake } from "lucide-react";
import { SearchActionBar } from "@/components/ui/search-action-bar";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import vetsVanLogo from "@assets/Screenshot 2025-07-10 182605_1753012202060.png";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { PaginationControls } from "@/components/ui/pagination-controls";
import { DataTable, DataTableColumn, DataTableAction } from "@/components/ui/data-table";
import { InvoiceMapModal } from "@/components/InvoiceMapModal";

// Declare lord-icon custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any;
    }
  }
}

export default function FinancialCreditNote() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const [isAdministrationExpanded, setIsAdministrationExpanded] = useState(() => {
    const savedState = localStorage.getItem('isAdministrationExpanded');
    return savedState !== null ? JSON.parse(savedState) : false;
  });
  const [isFinancialExpanded, setIsFinancialExpanded] = useState(() => {
    const savedState = localStorage.getItem('isFinancialExpanded');
    return savedState !== null ? JSON.parse(savedState) : true; // Default to expanded since we're on Financial page
  });
  
  // Business Partner menu state - persist across navigation
  const [isBusinessPartnerExpanded, setIsBusinessPartnerExpanded] = useState(() => {
    const savedState = localStorage.getItem('isBusinessPartnerExpanded');
    if (savedState !== null) {
      return JSON.parse(savedState);
    }
    return false; // Default collapsed
  });
  const [isNewReportsExpanded, setIsNewReportsExpanded] = useState(false);
  const [isCreateCreditNoteModalOpen, setIsCreateCreditNoteModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [editedQuantities, setEditedQuantities] = useState<{[key: number]: number}>({});
  const [removedItems, setRemovedItems] = useState<Set<number>>(new Set());
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [isLoadingCreditNotes, setIsLoadingCreditNotes] = useState(false);
  const [currentCreditNoteNumber, setCurrentCreditNoteNumber] = useState<string>("");
  const [selectedCreditNoteToView, setSelectedCreditNoteToView] = useState<any>(null);
  const [isViewCreditNoteModalOpen, setIsViewCreditNoteModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedInvoiceForMap, setSelectedInvoiceForMap] = useState<any>(null);
  const [creditNotesForMap, setCreditNotesForMap] = useState<any[]>([]);
  const [paymentsForMap, setPaymentsForMap] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [buttonContainerWidth, setButtonContainerWidth] = useState<number | undefined>(undefined);
  const createButtonRef = useRef<HTMLButtonElement>(null);

  // Filter credit notes based on search term
  const filteredCreditNotes = useMemo(() => {
    if (!searchTerm.trim()) {
      return creditNotes;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return creditNotes.filter((creditNote) => {
      const creditNoteNumberMatch = creditNote.creditNoteNumber?.toString().toLowerCase().includes(searchLower);
      const invoiceNumberMatch = creditNote.invoiceNumber?.toString().toLowerCase().includes(searchLower);
      const customerNameMatch = creditNote.customerName?.toLowerCase().includes(searchLower);
      const customerPhoneMatch = creditNote.customerPhone?.toString().toLowerCase().includes(searchLower);
      const postingDateMatch = creditNote.postingDate?.toString().toLowerCase().includes(searchLower);
      
      return creditNoteNumberMatch || invoiceNumberMatch || customerNameMatch || customerPhoneMatch || postingDateMatch;
    });
  }, [creditNotes, searchTerm]);

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCreditNotes = filteredCreditNotes.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredCreditNotes.length / itemsPerPage);

  // 🎯 DATATABLE CONFIGURATION - Customize columns for this screen
  const creditNoteColumns: DataTableColumn[] = [
    {
      key: 'creditNoteNumber',
      label: { ar: 'رقم مذكرة الائتمان', en: 'Credit Note No.' },
      render: (creditNote) => (
        <span className="font-medium text-gray-900">
          CRN{creditNote.creditNoteNumber}
        </span>
      ),
      className: 'font-medium text-gray-900'
    },
    {
      key: 'invoiceNumber',
      label: { ar: 'رقم الفاتورة', en: 'Invoice No.' },
      className: 'text-gray-500'
    },
    {
      key: 'customerName',
      label: { ar: 'اسم العميل', en: 'Customer Name' },
      className: 'text-gray-500'
    },
    {
      key: 'postingDate',
      label: { ar: 'تاريخ الترحيل', en: 'Posting Date' },
      render: (creditNote) => new Date(creditNote.postingDate).toLocaleDateString(),
      className: 'text-gray-500'
    },
    {
      key: 'finalTotal',
      label: { ar: 'المجموع النهائي', en: 'Final Total' },
      render: (creditNote) => `-${creditNote.finalTotal} SAR`,
      className: 'text-gray-500'
    }
  ];

  // 🎯 DATATABLE ACTIONS - Customize actions for this screen
  const creditNoteActions: DataTableAction[] = [
    {
      label: { ar: 'عرض', en: 'View' },
      onClick: (creditNote) => handleViewCreditNote(creditNote.id),
      className: 'text-purple-600 hover:text-purple-900 transition-colors duration-200'
    },
    {
      label: { ar: 'طباعة', en: 'Print' },
      onClick: (creditNote) => console.log('Print credit note:', creditNote.id),
      className: 'text-blue-600 hover:text-blue-900 transition-colors duration-200'
    },
    {
      label: { ar: 'خريطة', en: 'Map' },
      onClick: (creditNote) => handleMapClick(creditNote),
      className: 'text-green-600 hover:text-green-900 transition-colors duration-200'
    }
  ];

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle search button click
  const handleSearchClick = () => {
    setSearchTerm(searchInput.trim());
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle Enter key press in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  // Export credit notes to Excel
  const handleExportToExcel = () => {
    try {
      // Check if there's data to export
      if (!filteredCreditNotes || filteredCreditNotes.length === 0) {
        alert(language === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export');
        return;
      }

      // Helper function to safely convert values to numbers
      const safeNumber = (value: any): number => {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
      };

      // Helper function to format dates consistently
      const formatDate = (dateStr: string): string => {
        try {
          return new Date(dateStr).toISOString().split('T')[0]; // YYYY-MM-DD format
        } catch {
          return dateStr || '';
        }
      };

      // Create localized headers
      const headers = {
        creditNoteNo: language === 'ar' ? 'رقم مذكرة الائتمان' : 'Credit Note No.',
        invoiceNo: language === 'ar' ? 'رقم الفاتورة' : 'Invoice No.',
        customerName: language === 'ar' ? 'اسم العميل' : 'Customer Name',
        postingDate: language === 'ar' ? 'تاريخ الترحيل' : 'Posting Date',
        appointmentDate: language === 'ar' ? 'تاريخ الموعد الأصلي' : 'Appointment Date',
        itemDescription: language === 'ar' ? 'وصف المنتج/الخدمة' : 'Item/Service Description',
        creditQuantity: language === 'ar' ? 'الكمية المرتجعة' : 'Credit Quantity',
        unitPrice: language === 'ar' ? 'سعر الوحدة (ر.س)' : 'Unit Price (SAR)',
        totalBeforeVAT: language === 'ar' ? 'المجموع قبل الضريبة (ر.س)' : 'Total Before VAT (SAR)',
        vatAmount: language === 'ar' ? 'مبلغ الضريبة (ر.س)' : 'VAT Amount (SAR)',
        totalAfterVAT: language === 'ar' ? 'المجموع بعد الضريبة (ر.س)' : 'Total After VAT (SAR)',
        creditNoteTotal: language === 'ar' ? 'مجموع مذكرة الائتمان (ر.س)' : 'Credit Note Total (SAR)'
      };

      const dataToExport = filteredCreditNotes.flatMap(creditNote => {
        if (creditNote.items && creditNote.items.length > 0) {
          return creditNote.items.map((item: any, index: number) => ({
            [headers.creditNoteNo]: `CRN${creditNote.creditNoteNumber}`,
            [headers.invoiceNo]: creditNote.invoiceNumber || '',
            [headers.customerName]: creditNote.customerName || '',
            [headers.postingDate]: formatDate(creditNote.postingDate),
            [headers.appointmentDate]: creditNote.appointmentDate ? formatDate(creditNote.appointmentDate) : '',
            [headers.itemDescription]: item.description || '',
            [headers.creditQuantity]: safeNumber(item.creditQuantity),
            [headers.unitPrice]: safeNumber(item.unitPrice),
            [headers.totalBeforeVAT]: -safeNumber(item.totalBeforeVat), // Negative for credit
            [headers.vatAmount]: -safeNumber(item.vatAmount), // Negative for credit
            [headers.totalAfterVAT]: -safeNumber(item.totalAfterVat), // Negative for credit
            [headers.creditNoteTotal]: index === 0 ? -safeNumber(creditNote.finalTotal) : '' // Only show on first item
          }));
        } else {
          return [{
            [headers.creditNoteNo]: `CRN${creditNote.creditNoteNumber}`,
            [headers.invoiceNo]: creditNote.invoiceNumber || '',
            [headers.customerName]: creditNote.customerName || '',
            [headers.postingDate]: formatDate(creditNote.postingDate),
            [headers.appointmentDate]: creditNote.appointmentDate ? formatDate(creditNote.appointmentDate) : '',
            [headers.itemDescription]: language === 'ar' ? 'لا توجد عناصر' : 'No items found',
            [headers.creditQuantity]: '',
            [headers.unitPrice]: '',
            [headers.totalBeforeVAT]: '',
            [headers.vatAmount]: '',
            [headers.totalAfterVAT]: '',
            [headers.creditNoteTotal]: -safeNumber(creditNote.finalTotal)
          }];
        }
      });

      // Create worksheet with proper number formatting
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, language === 'ar' ? 'مذكرات الائتمان' : 'Credit Notes');

      // Set column widths for better readability
      const columnWidths = [
        { wch: 18 }, // Credit Note No.
        { wch: 15 }, // Invoice No.
        { wch: 25 }, // Customer Name
        { wch: 15 }, // Posting Date
        { wch: 18 }, // Appointment Date
        { wch: 40 }, // Item/Service Description
        { wch: 12 }, // Credit Quantity
        { wch: 15 }, // Unit Price
        { wch: 20 }, // Total Before VAT
        { wch: 15 }, // VAT Amount
        { wch: 20 }, // Total After VAT
        { wch: 22 }  // Credit Note Total
      ];
      worksheet['!cols'] = columnWidths;

      // Apply number formatting to numeric columns
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        // Format numeric columns with 2 decimal places
        [7, 8, 9, 10, 11].forEach(col => { // Unit Price, Total Before VAT, VAT Amount, Total After VAT, Credit Note Total
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (worksheet[cellAddress] && typeof worksheet[cellAddress].v === 'number') {
            worksheet[cellAddress].z = '#,##0.00';
          }
        });
      }

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const fileName = `${language === 'ar' ? 'تصدير_مذكرات_الائتمان' : 'Credit_Notes_Export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(data, fileName);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(language === 'ar' ? 'حدث خطأ أثناء تصدير البيانات' : 'Error exporting data');
    }
  };

  // Measure the "Create New Credit Note" button width and apply it to search buttons container
  useLayoutEffect(() => {
    const measureButtonWidth = () => {
      if (createButtonRef.current) {
        const width = createButtonRef.current.offsetWidth;
        setButtonContainerWidth(width);
      }
    };

    measureButtonWidth();
    window.addEventListener('resize', measureButtonWidth);
    
    return () => {
      window.removeEventListener('resize', measureButtonWidth);
    };
  }, []);

  // Handle quantity changes (decrease only for credit notes)
  const handleQuantityChange = (itemId: number, originalQuantity: number, newQuantity: number) => {
    if (newQuantity <= originalQuantity && newQuantity >= 0) {
      setEditedQuantities(prev => ({
        ...prev,
        [itemId]: newQuantity
      }));
    }
  };

  // Handle item removal
  const handleRemoveItem = (itemId: number) => {
    setRemovedItems(prev => new Set(prev).add(itemId));
  };

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation]);

  const adminToken = localStorage.getItem("adminToken");
  
  // Fetch current user permissions
  const { data: currentUserPermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["/api/admin/current-user-permissions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/current-user-permissions", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) throw new Error("Failed to fetch permissions");
      return response.json();
    },
    enabled: !!adminToken,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache the data
  });

  // Permission check - redirect users with "No Permission" for Credit Note
  useEffect(() => {
    if (currentUserPermissions) {
      console.log('🔍 Current user permissions:', currentUserPermissions);
      console.log('🔍 Credit Note No Permission status:', currentUserPermissions.creditNoteNoPermission);
      
      if (currentUserPermissions.creditNoteNoPermission === true) {
        console.log('🚫 User has no permission for Credit Note - redirecting to admin home');
        setLocation('/admin-home');
      }
    }
  }, [currentUserPermissions, setLocation]);

  // Determine if user is in READ-ONLY mode (has read access but not full control)
  const isReadOnlyMode = currentUserPermissions && 
    currentUserPermissions.creditNoteRead === true && 
    currentUserPermissions.creditNoteFullControl !== true;

  // Determine if user can export (requires separate export permission)
  const canExport = currentUserPermissions && currentUserPermissions.creditNoteExport === true;

  // Fetch all VetsVan requests for notification counter
  const { data: allVetsVanRequests } = useQuery({
    queryKey: ["/api/admin/vetsvan-requests"],
    queryFn: async () => {
      const response = await fetch("/api/admin/vetsvan-requests", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch requests");
      return response.json();
    },
    refetchInterval: 3000,
    enabled: !!adminToken,
  });

  // Fetch generated invoices for search
  const { data: allInvoices } = useQuery({
    queryKey: ["/api/admin/generated-invoices"],
    queryFn: async () => {
      const response = await fetch("/api/admin/generated-invoices", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch invoices");
      return response.json();
    },
    enabled: !!adminToken,
  });

  const [currentRequestCount, setCurrentRequestCount] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const savedState = localStorage.getItem('audioNotificationsEnabled');
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  // Update request count when data changes - match admin-home.tsx logic
  useEffect(() => {
    if (allVetsVanRequests && Array.isArray(allVetsVanRequests) && allVetsVanRequests.length > 0) {
      const currentCount = allVetsVanRequests.length; // Use total count like other admin pages
      setCurrentRequestCount(currentCount);
    }
  }, [allVetsVanRequests]);

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    localStorage.setItem('audioNotificationsEnabled', JSON.stringify(newState));
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    setLocation("/admin-login");
  };

  // Handle invoice search
  const handleInvoiceSearch = () => {
    if (!invoiceNumber.trim()) return;

    setIsSearching(true);
    
    if (!allInvoices) {
      setIsSearching(false);
      return;
    }
    
    // Filter invoices by invoice number (partial match)
    const results = allInvoices.filter((invoice: any) => {
      const invoiceNum = invoice.invoiceNumber || '';
      const searchTerm = invoiceNumber.toLowerCase();
      return invoiceNum.toLowerCase().includes(searchTerm);
    });
    
    setTimeout(() => {
      setSearchResults(results);
      setIsSearching(false);
    }, 500); // Small delay for better UX
  };

  // Handle selecting an invoice for credit note creation
  const handleSelectInvoice = async (invoice: any) => {
    setSelectedInvoice(invoice);
    setSearchResults([]); // Hide search results
    setInvoiceNumber(""); // Clear search field
    
    // Reset credit note editing states for clean slate
    setEditedQuantities({});
    setRemovedItems(new Set());
    
    // Fetch invoice items from database
    if (invoice.bookingId) {
      setLoadingItems(true);
      try {
        // Fetch both invoice items and credited items in parallel
        const [itemsResponse, creditedItemsResponse] = await Promise.all([
          fetch(`/api/invoice-items/${invoice.bookingId}`, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }),
          fetch(`/api/admin/credit-notes/credited-items/${invoice.invoiceNumber}`, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          })
        ]);
        
        if (itemsResponse.ok && creditedItemsResponse.ok) {
          const items = await itemsResponse.json();
          const creditedItems = await creditedItemsResponse.json();
          
          // Create a map of credited items for easy lookup
          const creditedItemsMap = new Map();
          creditedItems.forEach((creditedItem: any) => {
            const existingCredited = creditedItemsMap.get(creditedItem.id) || 0;
            creditedItemsMap.set(creditedItem.id, existingCredited + creditedItem.creditedQuantity);
          });
          
          // Filter items to exclude those that are fully credited
          const availableItems = items.filter((item: any) => {
            const totalCredited = creditedItemsMap.get(item.id) || 0;
            const originalQuantity = parseInt(item.quantity);
            return totalCredited < originalQuantity; // Only show items that haven't been fully credited
          }).map((item: any) => {
            // Adjust available quantity by subtracting credited quantity
            const totalCredited = creditedItemsMap.get(item.id) || 0;
            const originalQuantity = parseInt(item.quantity);
            const availableQuantity = originalQuantity - totalCredited;
            
            return {
              ...item,
              quantity: availableQuantity.toString(), // Update quantity to show only available amount
              originalQuantity: originalQuantity, // Keep track of original quantity for reference
              creditedQuantity: totalCredited // Keep track of how much has been credited
            };
          });
          
          setInvoiceItems(availableItems);
        } else {
          console.error('Failed to fetch invoice items or credited items');
          setInvoiceItems([]);
        }
      } catch (error) {
        console.error('Failed to fetch invoice items:', error);
        setInvoiceItems([]);
      } finally {
        setLoadingItems(false);
      }
    }
  };

  // Handle going back to search
  const handleBackToSearch = () => {
    setSelectedInvoice(null);
    setInvoiceNumber("");
    setSearchResults([]);
    setInvoiceItems([]);
    // Reset credit note editing states when returning to search
    setEditedQuantities({});
    setRemovedItems(new Set());
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsCreateCreditNoteModalOpen(false);
    setSelectedInvoice(null);
    setInvoiceNumber("");
    setSearchResults([]);
    setInvoiceItems([]);
    // Reset credit note editing states when closing modal
    setEditedQuantities({});
    setRemovedItems(new Set());
    // Reset credit note number so a fresh one is generated next time
    setCurrentCreditNoteNumber("");
  };

  // Calculate credit note totals (negative values)
  const creditNoteTotals = useMemo(() => {
    const activeItems = invoiceItems.filter(item => !removedItems.has(item.id));
    
    let totalBeforeVatSum = 0;
    
    activeItems.forEach(item => {
      const unitPrice = parseFloat(item.unitPrice || 0);
      const originalQuantity = parseInt(item.quantity || 1);
      const currentQuantity = editedQuantities[item.id] ?? originalQuantity;
      const discountType = item.discountType || 'none';
      
      // Same calculation as individual items
      const totalBeforeDiscount = currentQuantity * unitPrice;
      
      let discountAmount = 0;
      if (discountType !== 'none') {
        if (discountType.includes('%')) {
          const discountPercent = parseFloat(discountType.replace('%', '')) / 100;
          discountAmount = totalBeforeDiscount * discountPercent;
        }
      }
      
      // Total Before VAT (after discount) - same as displayed in individual rows
      const totalBeforeVat = totalBeforeDiscount - discountAmount;
      totalBeforeVatSum += totalBeforeVat;
    });
    
    const vatAmount = totalBeforeVatSum * 0.15; // 15% VAT
    const finalTotal = totalBeforeVatSum + vatAmount;
    
    return {
      totalBeforeVatSum,
      vatAmount,
      finalTotal
    };
  }, [invoiceItems, editedQuantities, removedItems]);

  // Fetch credit notes from API
  const fetchCreditNotes = async () => {
    setIsLoadingCreditNotes(true);
    try {
      const response = await fetch('/api/admin/credit-notes', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreditNotes(data);
      } else {
        console.error('Failed to fetch credit notes:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching credit notes:', error);
    } finally {
      setIsLoadingCreditNotes(false);
    }
  };

  // Fetch credit notes on component mount
  useEffect(() => {
    fetchCreditNotes();
  }, []);

  // Fetch next credit note number
  const fetchNextCreditNoteNumber = async () => {
    try {
      const response = await fetch('/api/admin/credit-notes/next-number', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentCreditNoteNumber(data.nextNumber);
      } else {
        console.error('Failed to fetch next credit note number:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching next credit note number:', error);
    }
  };

  // Handle viewing credit note
  const handleViewCreditNote = async (creditNoteId: number) => {
    try {
      const response = await fetch(`/api/admin/credit-notes/${creditNoteId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      
      if (response.ok) {
        const creditNoteDetails = await response.json();
        setSelectedCreditNoteToView(creditNoteDetails);
        setIsViewCreditNoteModalOpen(true);
      } else {
        console.error('Failed to fetch credit note details:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching credit note details:', error);
    }
  };

  // Handle closing view modal
  const handleCloseViewModal = () => {
    setIsViewCreditNoteModalOpen(false);
    setSelectedCreditNoteToView(null);
  };

  // Handle opening map modal
  const handleMapClick = async (creditNote: any) => {
    console.log('🗺️ DEBUG: Map button clicked!', creditNote);
    console.log('🗺️ DEBUG: allInvoices data:', allInvoices);
    try {
      // Find the full invoice details for this credit note
      const fullInvoice = allInvoices?.find((inv: any) => inv.invoiceNumber === creditNote.invoiceNumber);
      console.log('🗺️ DEBUG: fullInvoice found:', fullInvoice);
      const invoice = {
        invoiceNumber: creditNote.invoiceNumber,
        customerName: creditNote.customerName,
        finalTotal: fullInvoice?.finalTotal,
        appointmentDate: fullInvoice?.appointmentDate
      };
      
      // Fetch all credit notes for this invoice
      const creditNotesForInvoice = creditNotes.filter(cn => cn.invoiceNumber === creditNote.invoiceNumber);
      
      // Fetch payments for this invoice's booking
      let paymentsForInvoice: any[] = [];
      if (fullInvoice?.bookingId) {
        try {
          const paymentsResponse = await fetch(`/api/invoice-payments/${fullInvoice.bookingId}`, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          if (paymentsResponse.ok) {
            paymentsForInvoice = await paymentsResponse.json();
          }
        } catch (paymentError) {
          console.error('Error fetching payments:', paymentError);
        }
      }
      
      setSelectedInvoiceForMap(invoice);
      setCreditNotesForMap(creditNotesForInvoice);
      setPaymentsForMap(paymentsForInvoice);
      setIsMapModalOpen(true);
    } catch (error) {
      console.error('Error opening map:', error);
    }
  };

  // Handle closing map modal
  const handleCloseMapModal = () => {
    setIsMapModalOpen(false);
    setSelectedInvoiceForMap(null);
    setCreditNotesForMap([]);
    setPaymentsForMap([]);
  };

  // Handle creating credit note
  const handleCreateCreditNote = async () => {
    if (!selectedInvoice || invoiceItems.length === 0 || !currentCreditNoteNumber) {
      console.error('No invoice selected, no items, or no credit note number generated');
      return;
    }

    try {
      // Prepare credit note data
      const activeItems = invoiceItems.filter(item => !removedItems.has(item.id));
      const creditNoteItems = activeItems.map(item => ({
        id: item.id,
        description: item.description,
        originalQuantity: item.quantity,
        creditQuantity: editedQuantities[item.id] || item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        totalBeforeVat: (editedQuantities[item.id] || item.quantity) * parseFloat(item.unitPrice),
        vatAmount: (editedQuantities[item.id] || item.quantity) * parseFloat(item.unitPrice) * 0.15,
        totalAfterVat: (editedQuantities[item.id] || item.quantity) * parseFloat(item.unitPrice) * 1.15
      }));

      const creditNoteData = {
        creditNoteNumber: currentCreditNoteNumber, // Use the pre-generated number
        invoiceId: selectedInvoice.id,
        invoiceNumber: selectedInvoice.invoiceNumber,
        customerName: selectedInvoice.customerName,
        appointmentDate: selectedInvoice.appointmentDate,
        postingDate: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
        items: creditNoteItems,
        totalBeforeVat: creditNoteTotals.totalBeforeVatSum.toFixed(2),
        vatAmount: creditNoteTotals.vatAmount.toFixed(2),
        finalTotal: creditNoteTotals.finalTotal.toFixed(2),
        createdBy: adminToken // Using admin token as created by identifier
      };

      // Save credit note via API
      const response = await fetch('/api/admin/credit-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(creditNoteData),
      });

      if (response.ok) {
        const newCreditNote = await response.json();
        console.log('Credit note created successfully:', newCreditNote);
        
        // Refresh credit notes list
        await fetchCreditNotes();
        
        // Close the modal
        handleModalClose();
      } else {
        console.error('Failed to create credit note:', response.statusText);
      }
    } catch (error) {
      console.error('Error creating credit note:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={getDirection(language)}>
      {/* Full-width Header with logo and controls */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4">
          {/* Logo */}
          <div className="flex-shrink-0 -ml-6">
            <img 
              src={vetsVanLogo} 
              alt="VETS VAN" 
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-4">
            <LanguageSelector />
            
            {/* Audio notification toggle */}
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-full transition-colors duration-200 ${
                audioEnabled 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={audioEnabled 
                ? (language === 'ar' ? 'إيقاف الإشعارات الصوتية' : 'Disable audio notifications') 
                : (language === 'ar' ? 'تفعيل الإشعارات الصوتية' : 'Enable audio notifications')
              }
            >
              {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>

            {/* Notifications counter */}
            <div className="relative">
              <Bell className="h-6 w-6 text-purple-600" />
              {currentRequestCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {currentRequestCount > 99 ? '99+' : currentRequestCount}
                </span>
              )}
            </div>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 ml-2" />
              {t('logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu sheet */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetTrigger asChild>
          <button className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 fixed top-4 right-4 z-50">
            <Menu className="h-6 w-6" />
          </button>
        </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex flex-col h-full bg-white">
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-2">
                      <img src={vetsVanLogo} alt="VetsVan Logo" className="h-8 w-8" />
                      <span className="text-lg font-semibold text-purple-800">VetsVan</span>
                    </div>
                  </div>
                  <nav className="flex-1 px-2 py-4 space-y-1">
                    {/* Home Page */}
                    <button
                      onClick={() => {
                        setLocation('/admin-home');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Home className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'الصفحة الرئيسية' : 'Home Page'}</span>
                    </button>

                    {/* Administration Module */}
                    <div className="mb-2">
                      <button
                        onClick={() => {
                          const newState = !isAdministrationExpanded;
                          setIsAdministrationExpanded(newState);
                          localStorage.setItem('isAdministrationExpanded', JSON.stringify(newState));
                        }}
                        className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <Users className="h-6 w-6 flex-shrink-0" />
                        <span className="flex-1 text-left">
                          {language === 'ar' ? 'الإدارة' : 'Administration'}
                        </span>
                        {isAdministrationExpanded ? (
                          <ChevronUp className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 flex-shrink-0" />
                        )}
                      </button>

                      {isAdministrationExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          <button
                            onClick={() => {
                              setLocation('/administration/users');
                              setIsMobileSidebarOpen(false);
                            }}
                            className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          >
                            <User className="h-5 w-5 flex-shrink-0" />
                            <span>{language === 'ar' ? 'المستخدمين' : 'Users'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setLocation('/administration/authorization');
                              setIsMobileSidebarOpen(false);
                            }}
                            className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          >
                            <Shield className="h-5 w-5 flex-shrink-0" />
                            <span>{language === 'ar' ? 'التصريح' : 'Authorization'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Financial Section */}
                    <div className="mb-2">
                      <button
                        onClick={() => {
                          const newState = !isFinancialExpanded;
                          setIsFinancialExpanded(newState);
                          localStorage.setItem('isFinancialExpanded', JSON.stringify(newState));
                        }}
                        className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <DollarSign className="h-6 w-6 flex-shrink-0" />
                        <span className="flex-1 text-left">
                          {language === 'ar' ? 'المالية' : 'Financial'}
                        </span>
                        {isFinancialExpanded ? (
                          <ChevronUp className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 flex-shrink-0" />
                        )}
                      </button>

                      {isFinancialExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          <button
                            onClick={() => {
                              setLocation('/sales-reports');
                              setIsMobileSidebarOpen(false);
                            }}
                            className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          >
                            <BarChart3 className="h-5 w-5 flex-shrink-0" />
                            <span>{language === 'ar' ? 'التقارير المالية' : 'Financial Reports'}</span>
                          </button>
                          <button
                            className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full bg-purple-50 border-l-4 border-purple-600"
                          >
                            <Receipt className="h-5 w-5 flex-shrink-0 text-purple-600" />
                            <span className="text-purple-600">{language === 'ar' ? 'مذكرة الائتمان' : 'Credit Note'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setLocation('/financial/outgoing-payment');
                              setIsMobileSidebarOpen(false);
                            }}
                            className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          >
                            <DollarSign className="h-5 w-5 flex-shrink-0" />
                            <span>{language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setLocation('/financial/income-payment');
                              setIsMobileSidebarOpen(false);
                            }}
                            className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          >
                            <DollarSign className="h-5 w-5 flex-shrink-0" />
                            <span>{language === 'ar' ? 'الدفع الوارد' : 'Income Payment'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setLocation('/financial/ar-balance');
                              setIsMobileSidebarOpen(false);
                            }}
                            className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          >
                            <DollarSign className="h-5 w-5 flex-shrink-0" />
                            <span>{language === 'ar' ? 'رصيد الحسابات المدينة' : 'A/R Balance'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* VetsVan Management */}
                    <button
                      onClick={() => {
                        setLocation('/admin-dashboard');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Car className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'إدارة الفيتس فان' : 'Vets Van Management'}</span>
                    </button>

                    {/* Vets Van Shifts */}
                    <button
                      onClick={() => {
                        setLocation('/vets-van-shifts');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Clock className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'مناوبات VETS VAN' : 'Vets Van Shifts'}</span>
                    </button>

                    {/* Reports */}
                    <button
                      onClick={() => {
                        setLocation('/admin-dashboard?tab=reports');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <BarChart3 className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'التقارير' : 'Reports'}</span>
                    </button>

                    {/* New Reports & Analytics Dropdown */}
                    <div className="mb-2">
                      <button
                        onClick={() => setIsNewReportsExpanded(!isNewReportsExpanded)}
                        className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <TrendingUp className="h-6 w-6 flex-shrink-0" />
                        <span className="flex-1 text-left whitespace-nowrap">
                          {language === 'ar' ? 'تقارير وتحليلات جديدة' : 'New Reports & Analytics'}
                        </span>
                        {isNewReportsExpanded ? (
                          <ChevronUp className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 flex-shrink-0" />
                        )}
                      </button>
                      
                      {/* Dropdown Items */}
                      {isNewReportsExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          <button
                            onClick={() => {
                              setLocation('/new-reports-analytics/sales-report');
                              setIsMobileSidebarOpen(false);
                            }}
                            className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          >
                            <BarChart3 className="h-5 w-5 flex-shrink-0" />
                            <span>{language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* VetsVan Requests */}
                    <button
                      onClick={() => {
                        setLocation('/admin-vetsvan-requests');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 relative"
                    >
                      <FileText className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'طلبات VETS VAN' : 'Vets Van Requests'}</span>
                    </button>

                    {/* Import */}
                    <button
                      onClick={() => {
                        setLocation('/admin-dashboard/import');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Upload className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'استيراد البيانات' : 'Import'}</span>
                    </button>

                    {/* Services */}
                    <button
                      onClick={() => {
                        setLocation('/admin-dashboard/services');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Stethoscope className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'الخدمات' : 'Services'}</span>
                    </button>

                    {/* Products */}
                    <button
                      onClick={() => {
                        setLocation('/admin-dashboard/products');
                        setIsMobileSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Package className="h-6 w-6 flex-shrink-0" />
                      <span>{language === 'ar' ? 'المنتجات' : 'Products'}</span>
                    </button>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="mt-4 px-2">
            {/* Home Page */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-home');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Home className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'الصفحة الرئيسية' : 'Home Page'}</span>
            </button>
            
            {/* Administration Module */}
            <div className="mb-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newState = !isAdministrationExpanded;
                  setIsAdministrationExpanded(newState);
                  localStorage.setItem('isAdministrationExpanded', JSON.stringify(newState));
                }}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <Users className="h-6 w-6 flex-shrink-0" />
                <span className="flex-1 text-left">
                  {language === 'ar' ? 'الإدارة' : 'Administration'}
                </span>
                {isAdministrationExpanded ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
              </button>
              
              {/* Administration Submenu */}
              {isAdministrationExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/administration/users');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <User className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'المستخدمين' : 'Users'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/administration/authorization');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'التصريح' : 'Authorization'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Financial Section */}
            <div className="mb-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newState = !isFinancialExpanded;
                  setIsFinancialExpanded(newState);
                  localStorage.setItem('isFinancialExpanded', JSON.stringify(newState));
                }}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <DollarSign className="h-6 w-6 flex-shrink-0" />
                <span className="flex-1 text-left">
                  {language === 'ar' ? 'المالية' : 'Financial'}
                </span>
                {isFinancialExpanded ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
              </button>

              {isFinancialExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/sales-reports');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <BarChart3 className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'التقارير المالية' : 'Financial Reports'}</span>
                  </button>
                  <button
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full bg-purple-50 border-l-4 border-purple-600"
                  >
                    <Receipt className="h-5 w-5 flex-shrink-0 text-purple-600" />
                    <span className="text-purple-600">{language === 'ar' ? 'مذكرة الائتمان' : 'Credit Note'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/financial/outgoing-payment');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <DollarSign className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'الدفع الصادر' : 'Outgoing Payment'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/financial/income-payment');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <DollarSign className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'الدفع الوارد' : 'Income Payment'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/financial/ar-balance');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <DollarSign className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'رصيد الحسابات المدينة' : 'A/R Balance'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Business Partner Section */}
            <div className="mb-2">
              <button
                data-testid="button-toggle-business-partner"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newState = !isBusinessPartnerExpanded;
                  setIsBusinessPartnerExpanded(newState);
                  localStorage.setItem('isBusinessPartnerExpanded', JSON.stringify(newState));
                }}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <Handshake className="h-6 w-6 flex-shrink-0" />
                <span className="flex-1 text-left">
                  {language === 'ar' ? 'شريك الأعمال' : 'Business Partner'}
                </span>
                {isBusinessPartnerExpanded ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
              </button>

              {isBusinessPartnerExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  <button
                    data-testid="button-business-partner-partner-management"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLocation('/business-partner/partner-management');
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <Users className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'إدارة الشركاء' : 'Partner Management'}</span>
                  </button>
                  
                  <button
                    data-testid="button-business-partner-contracts"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Placeholder for now
                    }}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <FileText className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'عقود الشراكة' : 'Partnership Contracts'}</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* VetsVan Management */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-dashboard');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Car className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'إدارة الفيتس فان' : 'Vets Van Management'}</span>
            </button>

            {/* Vets Van Shifts */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/vets-van-shifts');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Clock className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'مناوبات VETS VAN' : 'Vets Van Shifts'}</span>
            </button>
            
            {/* Reports */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-dashboard?tab=reports');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <BarChart3 className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'التقارير' : 'Reports'}</span>
            </button>
            
            {/* New Reports & Analytics Dropdown */}
            <div className="mb-2">
              <button
                onClick={() => setIsNewReportsExpanded(!isNewReportsExpanded)}
                className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <TrendingUp className="h-6 w-6 flex-shrink-0" />
                <span className="flex-1 text-left whitespace-nowrap">
                  {language === 'ar' ? 'تقارير وتحليلات جديدة' : 'New Reports & Analytics'}
                </span>
                {isNewReportsExpanded ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
              </button>
              
              {/* Dropdown Items */}
              {isNewReportsExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  <button
                    onClick={() => setLocation('/new-reports-analytics/sales-report')}
                    className="group flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-md w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <BarChart3 className="h-5 w-5 flex-shrink-0" />
                    <span>{language === 'ar' ? 'تقرير المبيعات' : 'Sales Report'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* VetsVan Requests */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-vetsvan-requests');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 relative"
            >
              <FileText className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'طلبات VETS VAN' : 'Vets Van Requests'}</span>
            </button>
            
            {/* Import */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-dashboard/import');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Upload className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'استيراد البيانات' : 'Import'}</span>
            </button>
            
            {/* Services */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-dashboard/services');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Stethoscope className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'الخدمات' : 'Services'}</span>
            </button>
            
            {/* Products */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation('/admin-dashboard/products');
              }}
              className="group flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md w-full mb-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Package className="h-6 w-6 flex-shrink-0" />
              <span>{language === 'ar' ? 'المنتجات' : 'Products'}</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            {/* Left side - Lord Icon and Title */}
            <div className="flex items-center gap-4">
              {/* Lord Icon */}
              <div className="flex-shrink-0">
                <div 
                  dangerouslySetInnerHTML={{
                    __html: '<lord-icon src="https://cdn.lordicon.com/lbrbofig.json" trigger="loop" delay="1500" colors="primary:#852085,secondary:#848484" style="width:80px;height:80px"></lord-icon>'
                  }}
                />
              </div>
              
              {/* Credit Note Title */}
              <h1 className="text-2xl font-bold text-gray-600" style={{fontFamily: 'Arimo'}}>
                {language === 'ar' ? 'مذكرة الائتمان' : 'Credit Note'}
              </h1>
            </div>

            {/* Right side - Create New Credit Note Button */}
            <button
              ref={createButtonRef}
              onClick={async () => {
                if (isReadOnlyMode) return; // Prevent action in read-only mode
                await fetchNextCreditNoteNumber();
                setIsCreateCreditNoteModalOpen(true);
              }}
              disabled={isReadOnlyMode}
              className={`px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 flex items-center gap-2 ${
                isReadOnlyMode 
                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'border-purple-600 bg-white text-purple-600 hover:bg-purple-50'
              }`}
              title={isReadOnlyMode ? (language === 'ar' ? 'غير مسموح - صلاحية القراءة فقط' : 'Not allowed - Read-only permission') : ''}
            >
              <FilePlus className="h-4 w-4" style={{ color: isReadOnlyMode ? '#9CA3AF' : '#852085' }} />
              {language === 'ar' ? 'إنشاء مذكرة ائتمان جديدة' : 'Create New Credit Note'}
            </button>
          </div>

          {/* Search Action Bar */}
          <div className="mb-6">
            <SearchActionBar
              placeholder={language === 'ar' ? 'البحث بحسب اسم العميل، رقم الهاتف، رقم الفاتورة، رقم مذكرة الائتمان، أو تاريخ النشر' : 'Search by customer name, phone number, invoice number, credit note number, or posting date'}
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              onSearchClick={handleSearchClick}
              onExportClick={handleExportToExcel}
              exportDisabled={!canExport}
              inputTestId="input-search-credit-notes"
              searchButtonTestId="button-search-credit-notes"
              exportButtonTestId="button-export-credit-notes"
            />
          </div>

          {/* Credit Notes Table - Now using unified DataTable component! 🎉 */}
          <DataTable
            data={paginatedCreditNotes}
            columns={creditNoteColumns}
            actions={creditNoteActions}
            isLoading={isLoadingCreditNotes}
            loadingText={{ ar: 'جاري التحميل...', en: 'Loading...' }}
            emptyStateText={{ 
              ar: searchTerm.trim() ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد مذكرات ائتمان حتى الآن', 
              en: searchTerm.trim() ? 'No credit notes match your search' : 'No credit notes found'
            }}
            emptySearchText={{ ar: 'جرب مصطلحات بحث مختلفة', en: 'Try different search terms' }}
            verticalSeparators={true}
            showEmptySearch={searchTerm.trim().length > 0}
            hover={true}
            responsive={true}
            className="bg-white rounded-lg shadow"
            rowTestId="credit-note-row"
          />

          {/* Pagination Controls */}
          <PaginationControls
            currentCount={paginatedCreditNotes.length}
            filteredCount={filteredCreditNotes.length}
            totalCount={Array.isArray(creditNotes) ? creditNotes.length : 0}
            itemType="credit-notes"
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Create New Credit Note Modal */}
      <Dialog open={isCreateCreditNoteModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto" dir={getDirection(language)}>
          <DialogHeader>
            <DialogTitle className="flex justify-between items-start text-xl font-bold text-gray-600" style={{fontFamily: 'Arimo'}}>
              {/* Left side - Icon and Title */}
              <div className="flex items-center gap-3" style={{textAlign: getTextAlign(language)}}>
                <div 
                  dangerouslySetInnerHTML={{
                    __html: '<lord-icon src="https://cdn.lordicon.com/wlkedhqk.json" trigger="hover" colors="primary:#852085,secondary:#848484" style="width:80px;height:80px"></lord-icon>'
                  }}
                />
                <span>{language === 'ar' ? 'إنشاء مذكرة ائتمان جديدة' : 'Create New Credit Note'}</span>
              </div>
              
              {/* Right side - Credit Note Details */}
              <div className="flex flex-col gap-2">
                {/* Credit Note Number */}
                <div className="flex items-center w-80" style={{textAlign: getTextAlign(language)}}>
                  <label className="text-sm font-medium text-gray-700 w-28 text-left">
                    {language === 'ar' ? 'رقم مذكرة الائتمان:' : 'Credit Note No.:'}
                  </label>
                  <div className="flex gap-2 ml-2">
                    <Input
                      value="CRN"
                      disabled
                      className="w-16 text-center bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                      readOnly
                    />
                    <Input
                      value={currentCreditNoteNumber || "..."}
                      disabled
                      className="w-20 text-center bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                      readOnly
                    />
                  </div>
                </div>
                
                {/* Posting Date */}
                <div className="flex items-center w-80" style={{textAlign: getTextAlign(language)}}>
                  <label className="text-sm font-medium text-gray-700 w-28 text-left">
                    {language === 'ar' ? 'تاريخ الترحيل:' : 'Posting Date:'}
                  </label>
                  <div className="flex gap-2 ml-2">
                    <Input
                      value={new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      disabled
                      className="w-36 text-center bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              {language === 'ar' ? 'نموذج لإنشاء مذكرة ائتمان جديدة للعملاء' : 'Form to create a new credit note for customers'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4" dir={getDirection(language)}>
            <div className="space-y-2">
              <label htmlFor="invoice-search" className="text-sm font-medium text-gray-700" style={{textAlign: getTextAlign(language)}}>
                {language === 'ar' ? 'البحث برقم الفاتورة' : 'Search by Invoice Number'}
              </label>
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4`} />
                  <Input
                    id="invoice-search"
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder={language === 'ar' ? 'أدخل رقم الفاتورة...' : 'Enter invoice number...'}
                    className={`${language === 'ar' ? 'pr-10' : 'pl-10'} w-full max-w-md`}
                    style={{textAlign: getTextAlign(language)}}
                    dir={getDirection(language)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleInvoiceSearch();
                      }
                    }}
                  />
                </div>
                
                {/* Search Button */}
                <Button
                  onClick={handleInvoiceSearch}
                  className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 border-purple-600 bg-white text-purple-600 hover:bg-purple-50 flex-shrink-0"
                  disabled={!invoiceNumber.trim() || isSearching}
                >
                  {isSearching ? (language === 'ar' ? 'جاري البحث...' : 'Searching...') : (language === 'ar' ? 'بحث' : 'Search')}
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2" dir={getDirection(language)}>
                <label className="text-sm font-medium text-gray-700" style={{textAlign: getTextAlign(language)}}>
                  {language === 'ar' ? 'نتائج البحث' : 'Search Results'}
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2 bg-gray-50">
                  {searchResults.map((invoice: any) => (
                    <div 
                      key={invoice.id} 
                      className="bg-white p-3 rounded border cursor-pointer hover:bg-purple-50 transition-colors"
                      onClick={() => handleSelectInvoice(invoice)}
                    >
                      <div className="flex justify-between items-start mb-2" style={{textAlign: getTextAlign(language)}}>
                        <div>
                          <div className="font-semibold text-purple-600">
                            {invoice.invoiceNumber}
                          </div>
                          <div className="text-sm text-gray-600">
                            {invoice.customerName}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          {invoice.finalTotal} SAR
                        </div>
                      </div>
                      <div className="text-xs text-gray-500" style={{textAlign: getTextAlign(language)}}>
                        {language === 'ar' ? 'التاريخ: ' : 'Date: '}
                        {new Date(invoice.appointmentDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results Message */}
            {!isSearching && searchResults.length === 0 && invoiceNumber.trim() && (
              <div className="text-center py-4 text-gray-500" style={{textAlign: getTextAlign(language)}}>
                {language === 'ar' ? 'لم يتم العثور على فواتير' : 'No invoices found'}
              </div>
            )}

            {/* Selected Invoice Display */}
            {selectedInvoice && (
              <div className="space-y-4" dir={getDirection(language)}>

                {/* Invoice Details */}
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 items-start">
                    {/* Invoice Information */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-purple-800 mb-3" style={{textAlign: getTextAlign(language)}}>
                        {language === 'ar' ? 'معلومات الفاتورة' : 'Invoice Information'}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between" style={{textAlign: getTextAlign(language)}}>
                          <span className="font-medium text-gray-700">
                            {language === 'ar' ? 'رقم الفاتورة:' : 'Invoice Number:'}
                          </span>
                          <span className="text-purple-600 font-semibold">{selectedInvoice.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between" style={{textAlign: getTextAlign(language)}}>
                          <span className="font-medium text-gray-700">
                            {language === 'ar' ? 'التاريخ:' : 'Date:'}
                          </span>
                          <span className="text-gray-600">
                            {new Date(selectedInvoice.appointmentDate).toLocaleDateString(
                              language === 'ar' ? 'ar-SA' : 'en-US'
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between" style={{textAlign: getTextAlign(language)}}>
                          <span className="font-medium text-gray-700">
                            {language === 'ar' ? 'المجموع النهائي:' : 'Final Total:'}
                          </span>
                          <span className="text-green-600 font-bold">{selectedInvoice.finalTotal} SAR</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-purple-800 mb-3" style={{textAlign: getTextAlign(language)}}>
                        {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between" style={{textAlign: getTextAlign(language)}}>
                          <span className="font-medium text-gray-700">
                            {language === 'ar' ? 'اسم العميل:' : 'Customer Name:'}
                          </span>
                          <span className="text-gray-600">{selectedInvoice.customerName}</span>
                        </div>
                        <div className="flex justify-between" style={{textAlign: getTextAlign(language)}}>
                          <span className="font-medium text-gray-700">
                            {language === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}
                          </span>
                          <span className="text-gray-600">{selectedInvoice.customerPhone}</span>
                        </div>
                        <div className="flex justify-between" style={{textAlign: getTextAlign(language)}}>
                          <span className="font-medium text-gray-700">
                            {language === 'ar' ? 'العنوان:' : 'Address:'}
                          </span>
                          <span className="text-gray-600">{selectedInvoice.customerAddress}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider Line */}
                  <hr className="border-t border-gray-200 my-6" />

                  {/* Items and Services */}
                  <div className="space-y-4">
                    {/* Loading Items */}
                    {loadingItems && (
                      <div className="text-center py-4">
                        <div className="text-gray-600" style={{textAlign: getTextAlign(language)}}>
                          {language === 'ar' ? 'جاري تحميل عناصر الفاتورة...' : 'Loading invoice items...'}
                        </div>
                      </div>
                    )}

                    {/* Items and Services Table */}
                    {!loadingItems && invoiceItems.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-purple-800 mb-3" style={{textAlign: getTextAlign(language)}}>
                          {language === 'ar' ? 'المنتجات والخدمات' : 'Items and Services'}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full mb-4">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-2" style={{textAlign: getTextAlign(language), width: '35%'}}>
                                  {language === 'ar' ? 'الوصف' : 'Description'}
                                </th>
                                <th className="text-center py-2 px-2 w-24">
                                  {language === 'ar' ? 'الكمية' : 'Quantity'}
                                </th>
                                <th className="text-center py-2 px-2 w-32">
                                  {language === 'ar' ? 'سعر الوحدة (ر.س)' : 'Unit Price (SAR)'}
                                </th>
                                <th className="text-center py-2 px-2 w-28">
                                  {language === 'ar' ? 'الخصم' : 'Discount'}
                                </th>
                                <th className="text-center py-2 px-2 w-24">
                                  {language === 'ar' ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)'}
                                </th>
                                <th className="text-center py-2 px-2 w-32">
                                  {language === 'ar' ? 'المجموع قبل الضريبة (ر.س)' : 'Total Before VAT (SAR)'}
                                </th>
                                <th className="text-center py-2 px-2 w-32">
                                  {language === 'ar' ? 'المجموع بعد الضريبة (ر.س)' : 'Total After VAT (SAR)'}
                                </th>
                                <th className="text-center py-2 px-2 w-16">
                                  {language === 'ar' ? 'حذف' : 'Remove'}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoiceItems.filter(item => !removedItems.has(item.id)).map((item: any, index: number) => {
                                // Calculate remaining active items for delete protection
                                const activeItemsCount = invoiceItems.filter(i => !removedItems.has(i.id)).length;
                                const isLastItem = activeItemsCount <= 1;
                                
                                // Use the correct field names from the database  
                                const unitPrice = parseFloat(item.unitPrice || 0);
                                const originalQuantity = parseInt(item.quantity || 1);
                                const currentQuantity = editedQuantities[item.id] ?? originalQuantity;
                                const itemName = item.description || 'Unknown Item';
                                
                                // Get the discount from discountType field
                                const discountType = item.discountType || 'none';
                                
                                // Real-time calculations for Credit Note screen
                                // Step 1: Quantity × Unit Price = Total Before VAT (before discount)
                                const totalBeforeDiscount = currentQuantity * unitPrice;
                                
                                // Step 2: Apply discount if any
                                let discountAmount = 0;
                                if (discountType !== 'none') {
                                  if (discountType.includes('%')) {
                                    const discountPercent = parseFloat(discountType.replace('%', '')) / 100;
                                    discountAmount = totalBeforeDiscount * discountPercent;
                                  }
                                }
                                
                                // Step 3: Total Before VAT (after discount)
                                const totalBeforeVat = totalBeforeDiscount - discountAmount;
                                
                                // Step 4: Calculate VAT (15%)
                                const vatAmount = totalBeforeVat * 0.15;
                                
                                // Step 5: Total After VAT = Total Before VAT + VAT (negative for credit notes)
                                const totalAfterVat = -(totalBeforeVat + vatAmount);
                                
                                return (
                                  <tr key={index} className="border-b">
                                    <td className="py-2 px-2" style={{width: '35%'}}>
                                      <div className="bg-gray-100 p-2 rounded text-gray-700" style={{textAlign: getTextAlign(language)}}>
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${
                                          item.type === 'product' 
                                            ? 'bg-blue-100 text-blue-800' 
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                          {item.type === 'product' 
                                            ? (language === 'ar' ? 'منتج' : 'Product')
                                            : (language === 'ar' ? 'خدمة' : 'Service')
                                          }
                                        </span>
                                        {itemName}
                                      </div>
                                    </td>
                                    <td className="py-2 px-2">
                                      <div className="flex items-center space-x-2 bg-white border rounded p-1">
                                        <button
                                          onClick={() => handleQuantityChange(item.id, originalQuantity, currentQuantity - 1)}
                                          disabled={currentQuantity <= 0}
                                          className="w-8 h-8 rounded bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white text-sm font-bold"
                                        >
                                          -
                                        </button>
                                        <input
                                          type="number"
                                          value={currentQuantity}
                                          onChange={(e) => {
                                            const newValue = parseInt(e.target.value) || 0;
                                            handleQuantityChange(item.id, originalQuantity, newValue);
                                          }}
                                          className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                                          min="0"
                                          max={originalQuantity}
                                        />
                                        <button
                                          onClick={() => handleQuantityChange(item.id, originalQuantity, currentQuantity + 1)}
                                          disabled={currentQuantity >= originalQuantity}
                                          className="w-8 h-8 rounded bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white text-sm font-bold"
                                        >
                                          +
                                        </button>
                                      </div>
                                      <div className="text-xs text-gray-500 text-center mt-1">
                                        {language === 'ar' ? `الأصلي: ${originalQuantity}` : `Original: ${originalQuantity}`}
                                      </div>
                                    </td>
                                    <td className="py-2 px-2">
                                      <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                                        {unitPrice.toFixed(2)}
                                      </div>
                                    </td>
                                    <td className="py-2 px-2">
                                      <div className="bg-gray-100 p-2 rounded text-center text-gray-700">
                                        {discountType === 'none' 
                                          ? (language === 'ar' ? 'لا يوجد خصم' : 'No Discount')
                                          : discountType
                                        }
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <div className="bg-green-100 p-2 rounded text-green-700">
                                        {vatAmount.toFixed(2)}
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <div className="bg-gray-100 p-2 rounded text-gray-700">
                                        {totalBeforeVat.toFixed(2)}
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <div className="bg-gray-100 p-2 rounded text-gray-700 font-semibold">
                                        {totalAfterVat.toFixed(2)}
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <Button
                                        onClick={() => !isLastItem && handleRemoveItem(item.id)}
                                        disabled={isLastItem}
                                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md h-8 w-8 p-0"
                                        title={isLastItem ? (language === 'ar' ? 'لا يمكن حذف العنصر الأخير' : 'Cannot delete the last item') : ''}
                                      >
                                        <Minus className="h-4 w-4 text-gray-700 font-bold" />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* No Items Message */}
                    {!loadingItems && invoiceItems.length === 0 && selectedInvoice && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-lg mb-2">📋</div>
                        <div style={{textAlign: getTextAlign(language)}}>
                          {language === 'ar' ? 'لا توجد عناصر في هذه الفاتورة' : 'No items found for this invoice'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Credit Note Totals and Action Buttons */}
                  <div className="pt-6 border-t">
                    {/* Credit Note Totals */}
                    {invoiceItems.length > 0 && (
                      <div className="flex justify-end mb-4">
                        <div className="w-80">
                          <div className="flex justify-between mb-2">
                            <span>{language === 'ar' ? 'المجموع قبل الضريبة:' : 'Total Before VAT:'}</span>
                            <span>-{creditNoteTotals.totalBeforeVatSum.toFixed(2)} SAR</span>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span>{language === 'ar' ? 'ضريبة القيمة المضافة 15%:' : 'VAT 15%:'}</span>
                            <span>-{creditNoteTotals.vatAmount.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>{language === 'ar' ? 'المجموع النهائي:' : 'Final Total:'}</span>
                            <span>-{creditNoteTotals.finalTotal.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons - Left Aligned Below Totals */}
                    <div className="flex gap-3">
                      <Button
                        className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
                        onClick={handleCreateCreditNote}
                      >
                        {language === 'ar' ? 'إنشاء مذكرة ائتمان' : 'Create Credit Note'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleBackToSearch}
                        className="text-gray-600 border-gray-300 hover:bg-gray-50"
                      >
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </DialogContent>
      </Dialog>

      {/* View Credit Note Modal */}
      <Dialog open={isViewCreditNoteModalOpen} onOpenChange={handleCloseViewModal}>
        <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto" dir={getDirection(language)}>
          <DialogHeader>
            <DialogTitle className="flex justify-between items-start text-xl font-bold text-gray-600" style={{fontFamily: 'Arimo'}}>
              {/* Left side - Icon and Title */}
              <div className="flex items-center gap-3" style={{textAlign: getTextAlign(language)}}>
                <div 
                  dangerouslySetInnerHTML={{
                    __html: '<lord-icon src="https://cdn.lordicon.com/lbrbofig.json" trigger="hover" colors="primary:#852085,secondary:#848484" style="width:60px;height:60px"></lord-icon>'
                  }}
                />
                <span>{language === 'ar' ? 'تفاصيل مذكرة الائتمان' : 'Credit Note Details'}</span>
              </div>
              
              {/* Right side - Credit Note Info */}
              {selectedCreditNoteToView && (
                <div className="flex flex-col gap-1 text-right">
                  <div className="text-sm text-gray-500">
                    {language === 'ar' ? 'رقم مذكرة الائتمان:' : 'Credit Note No.:'}
                  </div>
                  <div className="text-lg font-bold text-purple-600">
                    CRN{selectedCreditNoteToView.creditNoteNumber}
                  </div>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCreditNoteToView && (
            <div className="space-y-6 py-4" dir={getDirection(language)}>
              {/* Credit Note Header Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'رقم الفاتورة الأصلية:' : 'Original Invoice No.:'}
                    </label>
                    <p className="text-gray-900">{selectedCreditNoteToView.invoiceNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'اسم العميل:' : 'Customer Name:'}
                    </label>
                    <p className="text-gray-900">{selectedCreditNoteToView.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'تاريخ الترحيل:' : 'Posting Date:'}
                    </label>
                    <p className="text-gray-900">
                      {new Date(selectedCreditNoteToView.postingDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'تاريخ الموعد الأصلي:' : 'Original Appointment Date:'}
                    </label>
                    <p className="text-gray-900">
                      {new Date(selectedCreditNoteToView.appointmentDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Credit Note Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {language === 'ar' ? 'العناصر المعتمدة' : 'Credited Items'}
                </h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'الوصف' : 'Description'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'الكمية المعتمدة' : 'Credit Quantity'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'المجموع قبل الضريبة' : 'Total Before VAT'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT Amount'}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'المجموع بعد الضريبة' : 'Total After VAT'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedCreditNoteToView.items && selectedCreditNoteToView.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-4 text-sm text-gray-900">{item.description}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{item.creditQuantity}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{item.unitPrice.toFixed(2)} SAR</td>
                          <td className="px-4 py-4 text-sm text-gray-900">-{item.totalBeforeVat.toFixed(2)} SAR</td>
                          <td className="px-4 py-4 text-sm text-gray-900">-{item.vatAmount.toFixed(2)} SAR</td>
                          <td className="px-4 py-4 text-sm text-gray-900">-{item.totalAfterVat.toFixed(2)} SAR</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Credit Note Totals */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-end">
                  <div className="w-80">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{language === 'ar' ? 'المجموع قبل الضريبة:' : 'Total Before VAT:'}</span>
                      <span className="font-semibold text-red-600">-{parseFloat(selectedCreditNoteToView.totalBeforeVat).toFixed(2)} SAR</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{language === 'ar' ? 'ضريبة القيمة المضافة 15%:' : 'VAT 15%:'}</span>
                      <span className="font-semibold text-red-600">-{parseFloat(selectedCreditNoteToView.vatAmount).toFixed(2)} SAR</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>{language === 'ar' ? 'المجموع النهائي:' : 'Final Total:'}</span>
                      <span className="text-red-600">-{parseFloat(selectedCreditNoteToView.finalTotal).toFixed(2)} SAR</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => console.log('Print credit note:', selectedCreditNoteToView.id)}
                  className="px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 border-blue-600 bg-white text-blue-600 hover:bg-blue-50"
                >
                  {language === 'ar' ? 'طباعة' : 'Print'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCloseViewModal}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Map Modal */}
      <InvoiceMapModal
        isOpen={isMapModalOpen}
        onClose={handleCloseMapModal}
        invoice={selectedInvoiceForMap}
        creditNotes={creditNotesForMap}
        payments={paymentsForMap}
        modalType="creditnote"
      />

      {/* Load lord-icon script */}
      <script src="https://cdn.lordicon.com/lordicon.js"></script>
    </div>
  );
}