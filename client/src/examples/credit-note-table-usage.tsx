// Example: How to use DataTable in Financial Credit Note screen
import { DataTable, DataTableColumn, DataTableAction } from '@/components/ui/data-table';
import { Eye, Printer, MapPin } from 'lucide-react';

// Define your data type
interface CreditNote {
  id: number;
  creditNoteNumber: string;
  invoiceNumber: string;
  customerName: string;
  postingDate: string;
  finalTotal: number;
}

// Example usage in your component
export function CreditNoteTableExample() {
  // Sample data
  const creditNotes: CreditNote[] = [
    {
      id: 1,
      creditNoteNumber: '001',
      invoiceNumber: 'INV-001',
      customerName: 'Ahmed Al-Rashid',
      postingDate: '2025-01-15',
      finalTotal: 1500.00
    }
  ];

  // 🎯 CONFIGURE COLUMNS - Add or remove as needed for each screen
  const columns: DataTableColumn<CreditNote>[] = [
    {
      key: 'creditNoteNumber',
      label: { ar: 'رقم مذكرة الائتمان', en: 'Credit Note No.' },
      render: (item) => (
        <span className="font-medium text-gray-900">
          CRN{item.creditNoteNumber}
        </span>
      )
    },
    {
      key: 'invoiceNumber',
      label: { ar: 'رقم الفاتورة', en: 'Invoice No.' }
    },
    {
      key: 'customerName',
      label: { ar: 'اسم العميل', en: 'Customer Name' }
    },
    {
      key: 'postingDate',
      label: { ar: 'تاريخ الترحيل', en: 'Posting Date' },
      render: (item) => new Date(item.postingDate).toLocaleDateString()
    },
    {
      key: 'finalTotal',
      label: { ar: 'المجموع النهائي', en: 'Final Total' },
      render: (item) => `-${item.finalTotal} SAR`,
      className: 'font-medium'
    }
  ];

  // 🎯 CONFIGURE ACTIONS - Add or remove as needed for each screen
  const actions: DataTableAction<CreditNote>[] = [
    {
      label: { ar: 'عرض', en: 'View' },
      onClick: (creditNote) => console.log('View:', creditNote.id),
      className: 'text-purple-600 hover:text-purple-900',
      icon: <Eye className="h-4 w-4" />
    },
    {
      label: { ar: 'طباعة', en: 'Print' },
      onClick: (creditNote) => console.log('Print:', creditNote.id),
      className: 'text-blue-600 hover:text-blue-900',
      icon: <Printer className="h-4 w-4" />
    },
    {
      label: { ar: 'خريطة', en: 'Map' },
      onClick: (creditNote) => console.log('Map:', creditNote.id),
      className: 'text-green-600 hover:text-green-900',
      icon: <MapPin className="h-4 w-4" />,
      condition: (creditNote) => creditNote.finalTotal > 1000 // Show only for high amounts
    }
  ];

  return (
    <DataTable
      data={creditNotes}
      columns={columns}
      actions={actions}
      isLoading={false}
      emptyStateText={{ ar: 'لا توجد مذكرات ائتمان', en: 'No credit notes found' }}
      className="bg-white rounded-lg shadow"
      hover={true}
      responsive={true}
    />
  );
}

// 🎯 DIFFERENT SCREEN EXAMPLE - Admin VetsVan Requests
interface VetsVanRequest {
  id: number;
  customerName: string;
  petName: string;
  status: string;
  createdAt: string;
}

export function VetsVanTableExample() {
  const requests: VetsVanRequest[] = [];

  // 📝 Different columns for VetsVan requests
  const columns: DataTableColumn<VetsVanRequest>[] = [
    {
      key: 'customerName',
      label: { ar: 'اسم العميل', en: 'Customer Name' }
    },
    {
      key: 'petName', 
      label: { ar: 'اسم الحيوان الأليف', en: 'Pet Name' }
    },
    {
      key: 'status',
      label: { ar: 'الحالة', en: 'Status' },
      render: (item) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          item.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
          item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {item.status}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: { ar: 'تاريخ الإنشاء', en: 'Created Date' },
      render: (item) => new Date(item.createdAt).toLocaleDateString()
    }
  ];

  // 📝 Different actions for VetsVan requests
  const actions: DataTableAction<VetsVanRequest>[] = [
    {
      label: { ar: 'تفاصيل', en: 'Details' },
      onClick: (request) => console.log('Details:', request.id),
      className: 'text-purple-600 hover:text-purple-900'
    },
    {
      label: { ar: 'قبول', en: 'Accept' },
      onClick: (request) => console.log('Accept:', request.id),
      className: 'text-green-600 hover:text-green-900',
      condition: (request) => request.status === 'pending' // Only show for pending
    },
    {
      label: { ar: 'رفض', en: 'Reject' },
      onClick: (request) => console.log('Reject:', request.id),
      className: 'text-red-600 hover:text-red-900',
      condition: (request) => request.status === 'pending' // Only show for pending
    }
  ];

  return (
    <DataTable
      data={requests}
      columns={columns}
      actions={actions}
      emptyStateText={{ ar: 'لا توجد طلبات', en: 'No requests found' }}
      rowClassName="hover:bg-purple-50" // Custom hover color
    />
  );
}

// 🎯 SIMPLE TABLE EXAMPLE - No actions, minimal columns  
interface Product {
  id: number;
  name: string;
  price: number;
}

export function SimpleProductTable() {
  const products: Product[] = [];

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'name',
      label: { ar: 'اسم المنتج', en: 'Product Name' }
    },
    {
      key: 'price',
      label: { ar: 'السعر', en: 'Price' },
      render: (item) => `${item.price} SAR`
    }
  ];

  // NO ACTIONS - just data display
  return (
    <DataTable
      data={products}
      columns={columns}
      // No actions prop = no actions column
      emptyStateText={{ ar: 'لا توجد منتجات', en: 'No products found' }}
      striped={true} // Alternating row colors
    />
  );
}