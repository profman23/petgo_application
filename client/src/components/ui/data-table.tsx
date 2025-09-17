import { ReactNode } from 'react';
import { useTranslation } from '@/lib/i18n';
import { FileText, Loader2 } from 'lucide-react';

// Define column configuration interface
export interface DataTableColumn<T = any> {
  key: string;
  label: { ar: string; en: string };
  render?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
}

// Define action button interface
export interface DataTableAction<T = any> {
  label: { ar: string; en: string };
  onClick: (item: T) => void;
  className?: string;
  icon?: ReactNode;
  condition?: (item: T) => boolean; // Optional: show action conditionally
}

// Main DataTable props
export interface DataTableProps<T = any> {
  // Data
  data: T[];
  keyField?: string; // Field to use as React key (defaults to 'id')
  
  // Columns configuration
  columns: DataTableColumn<T>[];
  
  // Actions configuration (optional)
  actions?: DataTableAction<T>[];
  actionsLabel?: { ar: string; en: string };
  
  // Loading and empty states
  isLoading?: boolean;
  loadingText?: { ar: string; en: string };
  emptyStateText?: { ar: string; en: string };
  emptySearchText?: { ar: string; en: string };
  showEmptySearch?: boolean;
  
  // Styling customization
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  
  // Table features
  hover?: boolean;
  striped?: boolean;
  bordered?: boolean;
  responsive?: boolean;
  verticalSeparators?: boolean;
  
  // Optional features
  onRowClick?: (item: T) => void;
  rowTestId?: string;
}

export function DataTable<T = any>({
  data,
  keyField = 'id',
  columns,
  actions,
  actionsLabel = { ar: 'الإجراءات', en: 'Actions' },
  isLoading = false,
  loadingText = { ar: 'جاري التحميل...', en: 'Loading...' },
  emptyStateText = { ar: 'لا توجد بيانات', en: 'No data found' },
  emptySearchText = { ar: 'لا توجد نتائج مطابقة لبحثك', en: 'No results match your search' },
  showEmptySearch = false,
  className = 'bg-white rounded-lg shadow',
  tableClassName = 'min-w-full',
  headerClassName = 'bg-gray-50',
  rowClassName = 'hover:bg-gray-50',
  hover = true,
  striped = false,
  bordered = false,
  responsive = true,
  verticalSeparators = false,
  onRowClick,
  rowTestId = 'table-row'
}: DataTableProps<T>) {
  const { language } = useTranslation();

  // Generate row className
  const getRowClassName = (item: T, index: number) => {
    let classes = 'transition-colors duration-200';
    
    if (typeof rowClassName === 'function') {
      classes += ` ${rowClassName(item, index)}`;
    } else if (rowClassName) {
      classes += ` ${rowClassName}`;
    }
    
    if (hover) classes += ' hover:bg-gray-50';
    if (striped && index % 2 === 1) classes += ' bg-gray-25';
    if (onRowClick) classes += ' cursor-pointer';
    
    return classes;
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className="p-8 text-center">
          <Loader2 className="animate-spin h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">{language === 'ar' ? loadingText.ar : loadingText.en}</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (data.length === 0) {
    return (
      <div className={className}>
        <div className="p-8 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          {showEmptySearch ? (
            <>
              <p>{language === 'ar' ? emptySearchText.ar : emptySearchText.en}</p>
              <p className="text-sm mt-1">{language === 'ar' ? 'جرب مصطلحات بحث مختلفة' : 'Try different search terms'}</p>
            </>
          ) : (
            <p>{language === 'ar' ? emptyStateText.ar : emptyStateText.en}</p>
          )}
        </div>
      </div>
    );
  }

  // Show actions column if actions are provided
  const showActions = actions && actions.length > 0;

  return (
    <div className={className}>
      {responsive ? (
        <div className="overflow-x-auto">
          <TableContent />
        </div>
      ) : (
        <TableContent />
      )}
    </div>
  );

  function TableContent() {
    return (
      <table className={tableClassName} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <thead className={headerClassName}>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.headerClassName || ''} ${
                  verticalSeparators && index < columns.length - 1 ? 'border-r border-gray-200' : ''
                }`}
              >
                {language === 'ar' ? column.label.ar : column.label.en}
              </th>
            ))}
            {showActions && (
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                verticalSeparators ? 'border-l border-gray-200' : ''
              }`}>
                {language === 'ar' ? actionsLabel.ar : actionsLabel.en}
              </th>
            )}
          </tr>
        </thead>
        <tbody className={`bg-white divide-y divide-gray-200 ${bordered ? 'border border-gray-200' : ''}`}>
          {data.map((item, index) => (
            <tr
              key={(item as any)[keyField] || index}
              className={getRowClassName(item, index)}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              data-testid={`${rowTestId}-${index}`}
            >
              {columns.map((column, index) => (
                <td
                  key={column.key}
                  className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || 'text-gray-500'} ${
                    verticalSeparators && index < columns.length - 1 ? 'border-r border-gray-200' : ''
                  }`}
                >
                  {column.render ? column.render(item) : (item as any)[column.key]}
                </td>
              ))}
              {showActions && (
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  verticalSeparators ? 'border-l border-gray-200' : ''
                }`}>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    {actions.map((action, actionIndex) => {
                      // Check if action should be shown conditionally
                      if (action.condition && !action.condition(item)) {
                        return null;
                      }
                      
                      return (
                        <button
                          key={actionIndex}
                          onClick={() => action.onClick(item)}
                          className={action.className || 'text-purple-600 hover:text-purple-900 transition-colors duration-200'}
                          data-testid={`action-${actionIndex}-${index}`}
                        >
                          {action.icon && <span className="mr-1">{action.icon}</span>}
                          {language === 'ar' ? action.label.ar : action.label.en}
                        </button>
                      );
                    })}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

// Export additional utilities for external use
export const createDataTableColumn = <T,>(column: DataTableColumn<T>): DataTableColumn<T> => column;
export const createDataTableAction = <T,>(action: DataTableAction<T>): DataTableAction<T> => action;