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

  // Check authentication and permissions
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/current-user-permissions');
        if (response.ok) {
          const permissions = await response.json();
          setAdminToken(response.headers.get('authorization') || 'authenticated');
          setIsReadOnlyMode(!permissions.creditNoteFullControl);
          setCanExport(permissions.creditNoteExport);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();
  }, []);

  // Fetch credit notes
  const fetchCreditNotes = async () => {
    if (!adminToken) return;
    
    setIsLoadingCreditNotes(true);
    try {
      const response = await fetch('/api/admin/credit-notes', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCreditNotes(data);
      }
    } catch (error) {
      console.error('Failed to fetch credit notes:', error);
    } finally {
      setIsLoadingCreditNotes(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchCreditNotes();
    }
  }, [adminToken]);

  const fetchNextCreditNoteNumber = async () => {
    try {
      const response = await fetch('/api/admin/credit-notes/next-number', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentCreditNoteNumber(data.nextNumber);
      }
    } catch (error) {
      console.error('Failed to fetch next credit note number:', error);
    }
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
    console.log("TODO: Handle map click", creditNote);
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
        {/* Header Section */}
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
              if (isReadOnlyMode) return;
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
            data-testid="button-create-credit-note"
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
              <div className="h-12 w-12 mx-auto mb-4 text-gray-400">📄</div>
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
                      {language === 'ar' ? 'المبلغ النهائي' : 'Final Amount'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === 'ar' ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCreditNotes.map((creditNote) => (
                    <tr key={creditNote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        CRN{creditNote.creditNoteNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {creditNote.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {creditNote.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(creditNote.postingDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        -{parseFloat(creditNote.finalTotal).toFixed(2)} SAR
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCreditNoteToView(creditNote);
                              setIsViewCreditNoteModalOpen(true);
                            }}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded-md hover:bg-purple-50"
                            title={language === 'ar' ? 'عرض مذكرة الائتمان' : 'View Credit Note'}
                            data-testid={`button-view-credit-note-${creditNote.id}`}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMapClick(creditNote)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                            title={language === 'ar' ? 'عرض الخريطة' : 'View Map'}
                            data-testid={`button-map-credit-note-${creditNote.id}`}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-4 mt-6">
            {/* Results Info & Items Per Page */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-sm text-gray-700" style={{ 
                direction: getDirection(language), 
                textAlign: getTextAlign(language) 
              }}>
                {language === 'ar' 
                  ? `عرض ${paginatedCreditNotes.length} من أصل ${filteredCreditNotes.length} مذكرة ائتمان (المجموع: ${Array.isArray(creditNotes) ? creditNotes.length : 0})`
                  : `Showing ${paginatedCreditNotes.length} of ${filteredCreditNotes.length} credit notes (Total: ${Array.isArray(creditNotes) ? creditNotes.length : 0})`
                }
              </div>
              
              <div className="flex items-center gap-2" style={{ direction: getDirection(language) }}>
                <span className="text-sm text-gray-600">
                  {language === 'ar' ? 'عرض:' : 'Show:'}
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    handlePageChange(1);
                  }}
                  className="border border-purple-300 rounded px-3 py-1 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white"
                  style={{ direction: 'ltr' }}
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">
                  {language === 'ar' ? 'لكل صفحة' : 'per page'}
                </span>
              </div>
            </div>
            
            {/* Navigation Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === 'ar' ? 'السابق' : 'Previous'}
              </Button>
              
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-md">
                <span className="text-sm font-medium text-purple-700">
                  {language === 'ar' 
                    ? `صفحة ${currentPage} من ${totalPages}`
                    : `Page ${currentPage} of ${totalPages}`
                  }
                </span>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === 'ar' ? 'التالي' : 'Next'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Load lord-icon script */}
      <script src="https://cdn.lordicon.com/lordicon.js"></script>
    </AdminLayout>
  );
}