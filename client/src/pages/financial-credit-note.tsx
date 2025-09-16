import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Minus, FileText as InvoiceIcon, Download, FilePlus } from "lucide-react";
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

  // Add authentication and permission states
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [canExport, setCanExport] = useState(false);

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

  // TODO: Add all the essential functions here
  const fetchCreditNotes = async () => {
    console.log("TODO: Fetch credit notes");
  };

  const handleModalClose = () => {
    setIsCreateCreditNoteModalOpen(false);
    setSelectedInvoice(null);
    setInvoiceItems([]);
    setEditedQuantities({});
    setRemovedItems(new Set());
    setSearchResults([]);
    setInvoiceNumber("");
  };

  const handleMapClick = (creditNote: any) => {
    console.log("TODO: Handle map click");
  };

  const handleCloseViewModal = () => {
    setIsViewCreditNoteModalOpen(false);
    setSelectedCreditNoteToView(null);
  };

  const handleCloseMapModal = () => {
    setIsMapModalOpen(false);
    setSelectedInvoiceForMap(null);
    setCreditNotesForMap([]);
    setPaymentsForMap([]);
  };

  const handleExportToExcel = () => {
    console.log("TODO: Export to Excel");
  };

  return (
    <AdminLayout>
      <div dir={getDirection(language)} className="p-8">
        <h1 className="text-2xl font-bold text-gray-600 mb-8">
          {language === 'ar' ? 'مذكرة الائتمان' : 'Credit Note'}
        </h1>
        
        <div className="text-center py-8">
          <p className="text-gray-500">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}