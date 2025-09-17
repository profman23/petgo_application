import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download } from 'lucide-react';
import { useTranslation, getDirection } from '@/lib/i18n';

interface SearchActionBarProps {
  // Search functionality
  placeholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  
  // Action buttons configuration
  showSearchButton?: boolean;
  showExportButton?: boolean;
  searchButtonText?: { ar: string; en: string };
  exportButtonText?: { ar: string; en: string };
  
  // Event handlers
  onSearchClick?: () => void;
  onExportClick?: () => void;
  
  // Button states
  searchDisabled?: boolean;
  exportDisabled?: boolean;
  
  // Test IDs for testing
  inputTestId?: string;
  searchButtonTestId?: string;
  exportButtonTestId?: string;
  
  // Additional props
  className?: string;
}

export function SearchActionBar({
  placeholder,
  searchValue: externalSearchValue,
  onSearchChange,
  onSearchSubmit,
  showSearchButton = true,
  showExportButton = true,
  searchButtonText = { ar: 'بحث', en: 'Search' },
  exportButtonText = { ar: 'تصدير', en: 'Export' },
  onSearchClick,
  onExportClick,
  searchDisabled = false,
  exportDisabled = false,
  inputTestId = 'input-search',
  searchButtonTestId = 'button-search',
  exportButtonTestId = 'button-export',
  className = ''
}: SearchActionBarProps) {
  const { language } = useTranslation();
  const [internalSearchValue, setInternalSearchValue] = useState('');
  
  // Use external search value if provided, otherwise use internal state
  const searchValue = externalSearchValue !== undefined ? externalSearchValue : internalSearchValue;
  const setSearchValue = onSearchChange || setInternalSearchValue;

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleSearchSubmit = () => {
    if (onSearchClick) {
      onSearchClick();
    } else if (onSearchSubmit) {
      onSearchSubmit(searchValue.trim());
    }
  };

  const handleExportAction = () => {
    if (onExportClick) {
      onExportClick();
    }
  };

  // Default placeholder based on language
  const defaultPlaceholder = language === 'ar' 
    ? 'البحث...' 
    : 'Search...';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1">
        <Input
          type="text"
          placeholder={placeholder || defaultPlaceholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyPress={handleSearchKeyPress}
          className="w-full focus:border-[#852085] focus-visible:ring-2 focus-visible:ring-[#852085] focus-visible:ring-offset-2"
          data-testid={inputTestId}
          dir={getDirection(language)}
        />
      </div>
      
      <div className="flex gap-3" style={{ width: 'auto' }}>
        {showSearchButton && (
          <Button
            onClick={handleSearchSubmit}
            className="flex-1 px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 border-purple-600 bg-white text-purple-600 hover:bg-purple-50"
            data-testid={searchButtonTestId}
            disabled={searchDisabled}
          >
            <Search className="h-4 w-4 mr-2" />
            {language === 'ar' ? searchButtonText.ar : searchButtonText.en}
          </Button>
        )}
        
        {showExportButton && (
          <Button
            onClick={handleExportAction}
            className="flex-1 px-4 py-2 border-2 font-medium rounded-md transition-colors duration-200 bg-white hover:bg-purple-50"
            style={{ 
              borderColor: '#852085', 
              color: '#852085'
            }}
            data-testid={exportButtonTestId}
            disabled={exportDisabled}
          >
            <Download className="h-4 w-4 mr-2" />
            {language === 'ar' ? exportButtonText.ar : exportButtonText.en}
          </Button>
        )}
      </div>
    </div>
  );
}