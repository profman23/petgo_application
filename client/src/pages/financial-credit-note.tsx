import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Minus, FileText as InvoiceIcon, CreditCard, Download, FilePlus, FileText } from "lucide-react";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { AdminLayout } from "@/components/admin-layout/AdminLayout";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  const [boxPositions, setBoxPositions] = useState<{[key: string]: {x: number, y: number}}>({});
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
    try {
      // Find the full invoice details for this credit note
      const fullInvoice = allInvoices?.find((inv: any) => inv.invoiceNumber === creditNote.invoiceNumber);
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
      
      // Set initial positions for boxes
      const initialPositions: {[key: string]: {x: number, y: number}} = {};
      
      // Center invoice box
      initialPositions[`invoice-${invoice.invoiceNumber}`] = { x: 200, y: 300 };
      
      // Position credit notes to the right of invoice
      creditNotesForInvoice.forEach((cn, index) => {
        initialPositions[`creditnote-${cn.id}`] = { 
          x: 600, 
          y: 200 + (index * 150) 
        };
      });
      
      // Position payment boxes to the left of invoice (visible within canvas)
      paymentsForInvoice.forEach((payment, index) => {
        initialPositions[`payment-${payment.id}`] = { 
          x: Math.max(20, 200 - 350), // 20px margin from left edge, or left of invoice with spacing
          y: 200 + (index * 150) 
        };
      });
      
      setSelectedInvoiceForMap(invoice);
      setCreditNotesForMap(creditNotesForInvoice);
      setPaymentsForMap(paymentsForInvoice);
      setBoxPositions(initialPositions);
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
    setBoxPositions({});
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
    <AdminLayout>
      <div className="p-8">
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

        {/* Search Field */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={language === 'ar' ? 'البحث بحسب اسم العميل، رقم الهاتف، رقم الفاتورة، رقم مذكرة الائتمان، أو تاريخ النشر' : 'Search by customer name, phone number, invoice number, credit note number, or posting date'}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full focus:border-[#852085] focus-visible:ring-2 focus-visible:ring-[#852085] focus-visible:ring-offset-2"
                data-testid="input-search-credit-notes"
                dir={getDirection(language)}
              />
            </div>
            <div className="flex gap-3" style={{ width: buttonContainerWidth ? `${buttonContainerWidth}px` : 'auto' }}>
              <Button
                onClick={handleSearchClick}
                className="flex-1 px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
                data-testid="button-search-credit-notes"
              >
                <Search className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'بحث' : 'Search'}
              </Button>
              <Button
                onClick={canExport ? handleExportToExcel : undefined}
                disabled={!canExport}
                className={`flex-1 px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 ${
                  !canExport 
                    ? 'bg-gray-100 hover:bg-gray-100 cursor-not-allowed' 
                    : 'bg-white hover:bg-purple-50'
                }`}
                style={{ 
                  borderColor: !canExport ? '#D1D5DB' : '#852085', 
                  color: !canExport ? '#9CA3AF' : '#852085'
                }}
                data-testid="button-export-credit-notes"
                title={!canExport ? (language === 'ar' ? 'غير مسموح - لا توجد صلاحية تصدير' : 'Not allowed - No export permission') : ''}
              >
                <Download className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تصدير' : 'Export'}
              </Button>
            </div>
          </div>
        </div>

        {/* Credit Notes Table */}
        <div className="bg-white rounded-lg shadow">
          {isLoadingCreditNotes ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
            </div>
          ) : filteredCreditNotes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              {searchTerm.trim() ? (
                <>
                  <p>{language === 'ar' ? 'لا توجد نتائج مطابقة لبحثك' : 'No credit notes match your search'}</p>
                  <p className="text-sm">{language === 'ar' ? 'جرب مصطلحات بحث مختلفة' : 'Try different search terms'}</p>
                </>
              ) : (
                <>
                  <p>{language === 'ar' ? 'لا توجد مذكرات ائتمان حتى الآن' : 'No credit notes found'}</p>
                  <p className="text-sm">{language === 'ar' ? 'ابدأ بإنشاء مذكرة ائتمان جديدة' : 'Start by creating a new credit note'}</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'رقم مذكرة الائتمان' : 'Credit Note No.'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'رقم الفاتورة' : 'Invoice No.'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'اسم العميل' : 'Customer Name'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'تاريخ الترحيل' : 'Posting Date'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'المجموع النهائي (ر.س)' : 'Final Total (SAR)'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCreditNotes.map((creditNote, index) => (
                    <tr key={creditNote.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        CRN{creditNote.creditNoteNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {creditNote.invoiceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {creditNote.customerName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {creditNote.postingDate ? new Date(creditNote.postingDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        -{parseFloat(creditNote.finalTotal || 0).toFixed(2)} SAR
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleViewCreditNote(creditNote.id)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                          data-testid={`button-view-credit-note-${creditNote.id}`}
                        >
                          <InvoiceIcon className="h-4 w-4" />
                          {language === 'ar' ? 'عرض' : 'View'}
                        </button>
                        <button
                          onClick={() => handleMapClick(creditNote)}
                          className="text-green-600 hover:text-green-900 inline-flex items-center gap-1 ml-3"
                          data-testid={`button-map-credit-note-${creditNote.id}`}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          {language === 'ar' ? 'خريطة' : 'Map'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between items-center">
                    <p className="text-sm text-gray-700">
                      {language === 'ar' ? 
                        `عرض ${startIndex + 1} إلى ${Math.min(endIndex, filteredCreditNotes.length)} من ${filteredCreditNotes.length} مذكرة ائتمان` : 
                        `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredCreditNotes.length)} of ${filteredCreditNotes.length} credit notes`
                      }
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm"
                        data-testid="button-previous-page"
                      >
                        {language === 'ar' ? 'السابق' : 'Previous'}
                      </Button>
                      <span className="px-3 py-2 text-sm bg-gray-100 rounded">
                        {currentPage} of {totalPages}
                      </span>
                      <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm"
                        data-testid="button-next-page"
                      >
                        {language === 'ar' ? 'التالي' : 'Next'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Credit Note Modal */}
      <Dialog open={isCreateCreditNoteModalOpen} onOpenChange={setIsCreateCreditNoteModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto" data-testid="modal-create-credit-note">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إنشاء مذكرة ائتمان جديدة' : 'Create New Credit Note'}
              {currentCreditNoteNumber && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({language === 'ar' ? 'رقم' : 'Number'}: CRN{currentCreditNoteNumber})
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedInvoice ? (
                language === 'ar' ? 
                  `إنشاء مذكرة ائتمان للفاتورة ${selectedInvoice.invoiceNumber}` :
                  `Create credit note for invoice ${selectedInvoice.invoiceNumber}`
              ) : (
                language === 'ar' ? 
                  'ابحث عن الفاتورة لإنشاء مذكرة ائتمان' :
                  'Search for an invoice to create a credit note'
              )}
            </DialogDescription>
          </DialogHeader>

          {!selectedInvoice ? (
            /* Invoice Search Section */
            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder={language === 'ar' ? 'أدخل رقم الفاتورة...' : 'Enter invoice number...'}
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleInvoiceSearch();
                    }
                  }}
                  className="flex-1"
                  data-testid="input-invoice-search"
                  dir={getDirection(language)}
                />
                <Button
                  onClick={handleInvoiceSearch}
                  disabled={isSearching}
                  className="px-4 py-2"
                  data-testid="button-search-invoice"
                >
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">{language === 'ar' ? 'بحث' : 'Search'}</span>
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border rounded-lg">
                  <div className="p-3 border-b bg-gray-50">
                    <h3 className="font-medium text-gray-900">
                      {language === 'ar' ? 'نتائج البحث' : 'Search Results'}
                    </h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {searchResults.map((invoice, index) => (
                      <div
                        key={invoice.id || index}
                        className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSelectInvoice(invoice)}
                        data-testid={`invoice-result-${invoice.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {language === 'ar' ? 'فاتورة رقم' : 'Invoice'}: {invoice.invoiceNumber}
                            </p>
                            <p className="text-sm text-gray-600">
                              {language === 'ar' ? 'العميل' : 'Customer'}: {invoice.customerName}
                            </p>
                            {invoice.appointmentDate && (
                              <p className="text-sm text-gray-500">
                                {language === 'ar' ? 'التاريخ' : 'Date'}: {new Date(invoice.appointmentDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">
                              {parseFloat(invoice.finalTotal || 0).toFixed(2)} SAR
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.length === 0 && invoiceNumber.trim() && !isSearching && (
                <div className="text-center py-8 text-gray-500">
                  <InvoiceIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>{language === 'ar' ? 'لا توجد فواتير مطابقة لبحثك' : 'No invoices found matching your search'}</p>
                </div>
              )}
            </div>
          ) : (
            /* Credit Note Creation Section */
            <div className="space-y-6">
              {/* Selected Invoice Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-blue-900">
                      {language === 'ar' ? 'الفاتورة المحددة' : 'Selected Invoice'}
                    </h3>
                    <p className="text-sm text-blue-700">
                      {language === 'ar' ? 'رقم الفاتورة' : 'Invoice Number'}: {selectedInvoice.invoiceNumber}
                    </p>
                    <p className="text-sm text-blue-700">
                      {language === 'ar' ? 'العميل' : 'Customer'}: {selectedInvoice.customerName}
                    </p>
                    {selectedInvoice.appointmentDate && (
                      <p className="text-sm text-blue-700">
                        {language === 'ar' ? 'تاريخ الموعد' : 'Appointment Date'}: {new Date(selectedInvoice.appointmentDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleBackToSearch}
                    className="text-blue-600 hover:text-blue-900"
                    data-testid="button-back-to-search"
                  >
                    {language === 'ar' ? 'العودة للبحث' : 'Back to Search'}
                  </Button>
                </div>
              </div>

              {/* Invoice Items */}
              {loadingItems ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">{language === 'ar' ? 'جاري تحميل عناصر الفاتورة...' : 'Loading invoice items...'}</p>
                </div>
              ) : invoiceItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{language === 'ar' ? 'لا توجد عناصر متاحة للإرجاع في هذه الفاتورة' : 'No items available for credit in this invoice'}</p>
                  <p className="text-sm mt-2">{language === 'ar' ? 'قد تكون جميع العناصر قد تم إرجاعها بالفعل' : 'All items may have already been credited'}</p>
                </div>
              ) : (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    {language === 'ar' ? 'عناصر الفاتورة المتاحة للإرجاع' : 'Available Invoice Items for Credit'}
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {language === 'ar' ? 'الوصف' : 'Description'}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {language === 'ar' ? 'الكمية المتاحة' : 'Available Qty'}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {language === 'ar' ? 'كمية الائتمان' : 'Credit Qty'}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {language === 'ar' ? 'المجموع' : 'Total'}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {language === 'ar' ? 'إجراء' : 'Action'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoiceItems.filter(item => !removedItems.has(item.id)).map((item, index) => {
                          const unitPrice = parseFloat(item.unitPrice || 0);
                          const originalQuantity = parseInt(item.quantity || 1);
                          const currentQuantity = editedQuantities[item.id] ?? originalQuantity;
                          const discountType = item.discountType || 'none';
                          
                          // Calculate totals (same as original calculation but for credit)
                          const totalBeforeDiscount = currentQuantity * unitPrice;
                          
                          let discountAmount = 0;
                          if (discountType !== 'none') {
                            if (discountType.includes('%')) {
                              const discountPercent = parseFloat(discountType.replace('%', '')) / 100;
                              discountAmount = totalBeforeDiscount * discountPercent;
                            }
                          }
                          
                          const totalBeforeVat = totalBeforeDiscount - discountAmount;
                          const vatAmount = totalBeforeVat * 0.15; // 15% VAT
                          const totalAfterVat = totalBeforeVat + vatAmount;

                          return (
                            <tr key={item.id || index}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {item.description}
                                {discountType !== 'none' && (
                                  <span className="text-xs text-green-600 block">
                                    ({language === 'ar' ? 'خصم' : 'Discount'}: {discountType})
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {item.quantity}
                                {item.creditedQuantity > 0 && (
                                  <span className="text-xs text-orange-600 block">
                                    ({language === 'ar' ? 'مُرتجع' : 'Credited'}: {item.creditedQuantity})
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {unitPrice.toFixed(2)} SAR
                              </td>
                              <td className="px-4 py-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max={originalQuantity}
                                  value={currentQuantity}
                                  onChange={(e) => handleQuantityChange(item.id, originalQuantity, parseInt(e.target.value) || 0)}
                                  className="w-20 text-center"
                                  data-testid={`input-quantity-${item.id}`}
                                />
                              </td>
                              <td className="px-4 py-2 text-sm font-medium text-red-600">
                                -{totalAfterVat.toFixed(2)} SAR
                                <div className="text-xs text-gray-500">
                                  ({language === 'ar' ? 'قبل الضريبة' : 'Before VAT'}: -{totalBeforeVat.toFixed(2)})
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <Button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-red-600 hover:text-red-900 p-1"
                                  data-testid={`button-remove-item-${item.id}`}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Credit Note Totals */}
                  <div className="mt-4 bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-900 mb-2">
                      {language === 'ar' ? 'مجاميع مذكرة الائتمان' : 'Credit Note Totals'}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'المجموع قبل الضريبة:' : 'Total Before VAT:'}</span>
                        <span className="font-medium text-red-600">-{creditNoteTotals.totalBeforeVatSum.toFixed(2)} SAR</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'ar' ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</span>
                        <span className="font-medium text-red-600">-{creditNoteTotals.vatAmount.toFixed(2)} SAR</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>{language === 'ar' ? 'إجمالي مذكرة الائتمان:' : 'Credit Note Total:'}</span>
                        <span className="text-red-600">-{creditNoteTotals.finalTotal.toFixed(2)} SAR</span>
                      </div>
                    </div>
                  </div>

                  {/* Create Credit Note Button */}
                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      onClick={handleModalClose}
                      className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
                      data-testid="button-cancel-credit-note"
                    >
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                      onClick={handleCreateCreditNote}
                      disabled={invoiceItems.filter(item => !removedItems.has(item.id)).length === 0}
                      className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700"
                      data-testid="button-create-credit-note"
                    >
                      {language === 'ar' ? 'إنشاء مذكرة الائتمان' : 'Create Credit Note'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Credit Note Modal */}
      <Dialog open={isViewCreditNoteModalOpen} onOpenChange={setIsViewCreditNoteModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto" data-testid="modal-view-credit-note">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'عرض مذكرة الائتمان' : 'View Credit Note'}
              {selectedCreditNoteToView && (
                <span className="ml-2 text-lg">CRN{selectedCreditNoteToView.creditNoteNumber}</span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedCreditNoteToView && (
            <div className="space-y-6">
              {/* Credit Note Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'رقم الفاتورة' : 'Invoice Number'}
                  </label>
                  <p className="font-medium">{selectedCreditNoteToView.invoiceNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'اسم العميل' : 'Customer Name'}
                  </label>
                  <p className="font-medium">{selectedCreditNoteToView.customerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'تاريخ الترحيل' : 'Posting Date'}
                  </label>
                  <p className="font-medium">
                    {selectedCreditNoteToView.postingDate ? new Date(selectedCreditNoteToView.postingDate).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'تاريخ الموعد الأصلي' : 'Original Appointment Date'}
                  </label>
                  <p className="font-medium">
                    {selectedCreditNoteToView.appointmentDate ? new Date(selectedCreditNoteToView.appointmentDate).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>

              {/* Credit Note Items */}
              {selectedCreditNoteToView.items && selectedCreditNoteToView.items.length > 0 ? (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    {language === 'ar' ? 'عناصر مذكرة الائتمان' : 'Credit Note Items'}
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {language === 'ar' ? 'الوصف' : 'Description'}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {language === 'ar' ? 'الكمية' : 'Quantity'}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {language === 'ar' ? 'المجموع' : 'Total'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedCreditNoteToView.items.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {item.description}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {item.creditQuantity}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {parseFloat(item.unitPrice || 0).toFixed(2)} SAR
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-red-600">
                              -{parseFloat(item.totalAfterVat || 0).toFixed(2)} SAR
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>{language === 'ar' ? 'لا توجد عناصر في مذكرة الائتمان هذه' : 'No items found in this credit note'}</p>
                </div>
              )}

              {/* Credit Note Totals */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-900 mb-2">
                  {language === 'ar' ? 'المجاميع' : 'Totals'}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>{language === 'ar' ? 'المجموع قبل الضريبة:' : 'Total Before VAT:'}</span>
                    <span className="font-medium text-red-600">
                      -{parseFloat(selectedCreditNoteToView.totalBeforeVat || 0).toFixed(2)} SAR
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'ar' ? 'ضريبة القيمة المضافة:' : 'VAT:'}</span>
                    <span className="font-medium text-red-600">
                      -{parseFloat(selectedCreditNoteToView.vatAmount || 0).toFixed(2)} SAR
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>{language === 'ar' ? 'إجمالي مذكرة الائتمان:' : 'Credit Note Total:'}</span>
                    <span className="text-red-600">
                      -{parseFloat(selectedCreditNoteToView.finalTotal || 0).toFixed(2)} SAR
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleCloseViewModal}
                  className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700"
                  data-testid="button-close-view-credit-note"
                >
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Map Modal */}
      <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
        <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] p-0" data-testid="modal-map-view">
          <div className="relative w-full h-[80vh] bg-gray-100 overflow-hidden">
            {/* Close button */}
            <button
              onClick={handleCloseMapModal}
              className="absolute top-4 right-4 z-50 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
              data-testid="button-close-map"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <div className="absolute top-4 left-4 z-40 bg-white rounded-lg px-4 py-2 shadow-lg">
              <h3 className="font-semibold text-gray-800">
                {language === 'ar' ? 'خريطة المعاملات المالية' : 'Financial Transaction Map'}
              </h3>
              {selectedInvoiceForMap && (
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'الفاتورة' : 'Invoice'}: {selectedInvoiceForMap.invoiceNumber}
                </p>
              )}
            </div>

            <div className="w-full h-full relative overflow-auto bg-gradient-to-br from-blue-50 to-purple-50">
              {/* Invoice Box */}
              {selectedInvoiceForMap && (
                <div
                  className="absolute bg-white border-2 shadow-lg rounded-lg cursor-move z-20"
                  style={{
                    left: boxPositions[`invoice-${selectedInvoiceForMap.invoiceNumber}`]?.x || 200,
                    top: boxPositions[`invoice-${selectedInvoiceForMap.invoiceNumber}`]?.y || 300,
                    borderColor: '#3B82F6',
                    width: '250px',
                    height: '160px'
                  }}
                  onMouseDown={(e) => {
                    const position = boxPositions[`invoice-${selectedInvoiceForMap.invoiceNumber}`] || { x: 200, y: 300 };
                    const startX = e.clientX - position.x;
                    const startY = e.clientY - position.y;
                    
                    const handleMouseMove = (e: MouseEvent) => {
                      const newX = e.clientX - startX;
                      const newY = e.clientY - startY;
                      
                      setBoxPositions(prev => ({
                        ...prev,
                        [`invoice-${selectedInvoiceForMap.invoiceNumber}`]: { x: newX, y: newY }
                      }));
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  {/* Header Section */}
                  <div className="bg-blue-50 px-3 py-2 border-b border-blue-200 rounded-t-lg flex items-center justify-center gap-2">
                    <InvoiceIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700">
                      {language === 'ar' ? 'فاتورة' : 'Invoice'}
                    </span>
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-3 flex-1 flex flex-col justify-center" style={{ direction: language === 'ar' ? 'rtl' : 'ltr', textAlign: language === 'en' ? 'left' : 'right' }}>
                    <div className="text-base font-bold text-blue-600 mb-1">
                      {selectedInvoiceForMap.invoiceNumber}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {selectedInvoiceForMap.customerName}
                    </div>
                    <div className="text-sm font-semibold text-green-600 mb-2">
                      +{parseFloat(selectedInvoiceForMap.finalTotal || 0).toFixed(2)} SAR
                    </div>
                    {selectedInvoiceForMap.appointmentDate && (
                      <div className="text-xs text-gray-500">
                        {language === 'ar' ? 'التاريخ: ' : 'Date: '}
                        {new Date(selectedInvoiceForMap.appointmentDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Credit Note Boxes */}
              {creditNotesForMap.map((creditNote) => {
                const position = boxPositions[`creditnote-${creditNote.id}`];
                if (!position) return null;

                return (
                  <div
                    key={`box-${creditNote.id}`}
                    className="absolute bg-white border-2 shadow-lg rounded-lg cursor-move z-20"
                    style={{
                      left: position.x,
                      top: position.y,
                      borderColor: '#8B2F8B',
                      width: '250px',
                      height: '160px'
                    }}
                    onMouseDown={(e) => {
                      const startX = e.clientX - position.x;
                      const startY = e.clientY - position.y;
                      
                      const handleMouseMove = (e: MouseEvent) => {
                        const newX = e.clientX - startX;
                        const newY = e.clientY - startY;
                        
                        setBoxPositions(prev => ({
                          ...prev,
                          [`creditnote-${creditNote.id}`]: { x: newX, y: newY }
                        }));
                      };
                      
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  >
                    {/* Header Section */}
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 rounded-t-lg flex items-center justify-center gap-2">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-semibold text-gray-700">
                        {language === 'ar' ? 'مذكرة ائتمان' : 'Credit Note'}
                      </span>
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-3 flex-1 flex flex-col justify-center" style={{ direction: language === 'ar' ? 'rtl' : 'ltr', textAlign: language === 'en' ? 'left' : 'right' }}>
                      <div className="text-base font-bold text-gray-800 mb-1">
                        CRN{creditNote.creditNoteNumber}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {creditNote.customerName}
                      </div>
                      <div className="text-sm font-semibold text-red-600 mb-2">
                        -{creditNote.finalTotal} SAR
                      </div>
                      <div className="text-xs text-gray-500">
                        {language === 'ar' ? 'التاريخ: ' : 'Date: '}
                        {new Date(creditNote.postingDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Income Payment Boxes */}
              {paymentsForMap.map((payment) => {
                const position = boxPositions[`payment-${payment.id}`];
                if (!position) return null;

                return (
                  <div
                    key={`payment-box-${payment.id}`}
                    className="absolute bg-white border-2 shadow-lg rounded-lg cursor-move z-20"
                    style={{
                      left: position.x,
                      top: position.y,
                      borderColor: '#4CAF50',
                      width: '250px',
                      height: '160px'
                    }}
                    onMouseDown={(e) => {
                      const startX = e.clientX - position.x;
                      const startY = e.clientY - position.y;
                      
                      const handleMouseMove = (e: MouseEvent) => {
                        const newX = e.clientX - startX;
                        const newY = e.clientY - startY;
                        
                        setBoxPositions(prev => ({
                          ...prev,
                          [`payment-${payment.id}`]: { x: newX, y: newY }
                        }));
                      };
                      
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  >
                    {/* Header Section */}
                    <div className="bg-green-50 px-3 py-2 border-b border-green-200 rounded-t-lg flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                      </svg>
                      <span className="text-sm font-semibold text-green-700">
                        {language === 'ar' ? 'دفعة دخل' : 'Income Payment'}
                      </span>
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-3 flex-1 flex flex-col justify-center" style={{ direction: language === 'ar' ? 'rtl' : 'ltr', textAlign: language === 'en' ? 'left' : 'right' }}>
                      <div className="text-base font-bold text-green-600 mb-1">
                        +{parseFloat(payment.amount).toFixed(2)} SAR
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {language === 'ar' ? 'طريقة الدفع: ' : 'Method: '}
                        {payment.paymentType === 'cash' ? (language === 'ar' ? 'نقدي' : 'Cash') : 
                         payment.paymentType === 'card' ? (language === 'ar' ? 'كارت' : 'Card') : 
                         payment.paymentType === 'transfer' ? (language === 'ar' ? 'تحويل' : 'Transfer') : 
                         payment.paymentType}
                      </div>
                      {payment.description && (
                        <div className="text-xs text-gray-500 mb-2">
                          {payment.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {language === 'ar' ? 'التاريخ: ' : 'Date: '}
                        {new Date(payment.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}