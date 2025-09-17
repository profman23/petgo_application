import { Button } from "@/components/ui/button";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";

interface PaginationControlsProps {
  // Data counts
  currentCount: number;        // Items currently shown (e.g. 10)
  filteredCount: number;       // Items after filtering (e.g. 25) 
  totalCount: number;          // Total items in dataset (e.g. 100)
  
  // Item type for display
  itemType: 'customers' | 'credit-notes' | 'suppliers' | 'invoices' | 'payments';
  
  // Pagination settings
  itemsPerPage: number;
  onItemsPerPageChange: (newItemsPerPage: number) => void;
  
  // Navigation controls (optional - only show if more than 1 page)
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function PaginationControls({
  currentCount,
  filteredCount, 
  totalCount,
  itemType,
  itemsPerPage,
  onItemsPerPageChange,
  currentPage,
  totalPages,
  onPageChange
}: PaginationControlsProps) {
  const { language } = useTranslation();

  // Get item type text for different languages
  const getItemTypeText = () => {
    const itemTexts = {
      'customers': {
        ar: 'عميل',
        en: 'customers'
      },
      'credit-notes': {
        ar: 'مذكرة ائتمان', 
        en: 'credit notes'
      },
      'suppliers': {
        ar: 'مورد',
        en: 'suppliers'
      },
      'invoices': {
        ar: 'فاتورة',
        en: 'invoices'
      },
      'payments': {
        ar: 'دفعة',
        en: 'payments'
      }
    };
    
    return itemTexts[itemType]?.[language] || itemTexts[itemType]?.en || itemType;
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = Number(e.target.value);
    onItemsPerPageChange(newItemsPerPage);
    // Reset to page 1 when changing items per page
    if (onPageChange) {
      onPageChange(1);
    }
  };

  const handlePreviousPage = () => {
    if (onPageChange && currentPage && currentPage > 1) {
      onPageChange(Math.max(1, currentPage - 1));
    }
  };

  const handleNextPage = () => {
    if (onPageChange && currentPage && totalPages && currentPage < totalPages) {
      onPageChange(Math.min(totalPages, currentPage + 1));
    }
  };

  return (
    <div className="bg-white px-4 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-4 mt-10">
      {/* Results Info & Items Per Page */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div 
          className="text-sm text-gray-700" 
          style={{ 
            direction: getDirection(language), 
            textAlign: getTextAlign(language) 
          }}
        >
          {language === 'ar' 
            ? `عرض ${currentCount} من أصل ${filteredCount} ${getItemTypeText()} (المجموع: ${totalCount})`
            : `Showing ${currentCount} of ${filteredCount} ${getItemTypeText()} (Total: ${totalCount})`
          }
        </div>
        
        <div className="flex items-center gap-2" style={{ direction: getDirection(language) }}>
          <span className="text-sm text-gray-600">
            {language === 'ar' ? 'عرض:' : 'Show:'}
          </span>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
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
      
      {/* Navigation Controls - Only show if we have pagination data */}
      {totalPages && totalPages > 1 && currentPage && onPageChange && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePreviousPage}
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
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {language === 'ar' ? 'التالي' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
}