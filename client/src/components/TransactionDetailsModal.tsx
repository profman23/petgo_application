import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TransactionDetail {
  type: string;
  description: string;
  amount: number;
  date: string | null;
  documentNumber: string | null;
}

interface TransactionDetailsModalProps {
  customerId: number | null;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailsModal({ 
  customerId, 
  customerName, 
  isOpen, 
  onClose 
}: TransactionDetailsModalProps) {
  const { language } = useTranslation();

  // Fetch transaction details for the selected customer
  const { data: transactionDetails = [], isLoading } = useQuery<TransactionDetail[]>({
    queryKey: ['/api/admin/ar-balance/details', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID is required');
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/ar-balance/details/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        }
      });
      if (!response.ok) throw new Error('Failed to fetch transaction details');
      return response.json();
    },
    enabled: !!customerId && isOpen
  });

  // Format amount with currency
  const formatAmount = (amount: number, isBalance = false) => {
    const absAmount = Math.abs(amount);
    const currency = language === 'ar' ? 'ر.س' : 'SAR';
    
    if (isBalance) {
      if (amount < 0) {
        return `${absAmount.toFixed(2)} ${currency} (CR)`;
      }
      return `${absAmount.toFixed(2)} ${currency}`;
    }
    
    return `${amount.toFixed(2)} ${currency}`;
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return language === 'ar' ? 'غير محدد' : 'N/A';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: language === 'ar' ? ar : undefined });
  };

  // Calculate running balance
  let runningBalance = 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle 
            className="text-lg font-semibold"
            style={{ fontFamily: language === 'ar' ? 'Cairo Play' : 'Arimo' }}
          >
            {language === 'ar' ? 'تفاصيل المعاملات - ' : 'Transaction Details - '}
            {customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">
                {language === 'ar' ? 'جاري تحميل تفاصيل المعاملات...' : 'Loading transaction details...'}
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-4">
                {transactionDetails.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {language === 'ar' ? 'لا توجد معاملات لهذا العميل' : 'No transactions found for this customer'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Header Row */}
                    <div 
                      className="grid grid-cols-6 gap-4 p-3 bg-gray-50 rounded-lg font-semibold text-sm"
                      style={{ fontFamily: language === 'ar' ? 'Cairo Play' : 'Arimo' }}
                    >
                      <div>{language === 'ar' ? 'التاريخ' : 'Date'}</div>
                      <div>{language === 'ar' ? 'النوع' : 'Type'}</div>
                      <div>{language === 'ar' ? 'الوصف' : 'Description'}</div>
                      <div>{language === 'ar' ? 'رقم المستند' : 'Document No.'}</div>
                      <div className="text-right">{language === 'ar' ? 'المبلغ' : 'Amount'}</div>
                      <div className="text-right">{language === 'ar' ? 'الرصيد' : 'Balance'}</div>
                    </div>
                    
                    {/* Transaction Rows */}
                    {transactionDetails.map((transaction: TransactionDetail, index: number) => {
                      runningBalance += transaction.amount;
                      
                      return (
                        <div key={index}>
                          <div 
                            className="grid grid-cols-6 gap-4 p-3 text-sm hover:bg-gray-50 rounded-lg"
                            data-testid={`row-transaction-${index}`}
                          >
                            <div className="text-gray-600">
                              {formatDate(transaction.date)}
                            </div>
                            <div className="font-medium">
                              {language === 'ar' 
                                ? (transaction.type === 'Opening Balance' ? 'الرصيد الافتتاحي' :
                                   transaction.type === 'Invoice' ? 'فاتورة' :
                                   transaction.type === 'Income Payment' ? 'دفعة دخل' :
                                   transaction.type === 'Credit Note' ? 'إشعار دائن' :
                                   transaction.type === 'Outgoing Payment' ? 'دفعة صادرة' :
                                   transaction.type)
                                : transaction.type
                              }
                            </div>
                            <div className="text-gray-700">
                              {transaction.description}
                            </div>
                            <div className="text-gray-600">
                              {transaction.documentNumber || (language === 'ar' ? 'غير محدد' : 'N/A')}
                            </div>
                            <div className={`text-right font-medium ${
                              transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatAmount(transaction.amount)}
                            </div>
                            <div className={`text-right font-semibold ${
                              runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatAmount(runningBalance, true)}
                            </div>
                          </div>
                          {index < transactionDetails.length - 1 && <Separator />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-start mt-6">
          <Button 
            onClick={onClose} 
            variant="outline"
            data-testid="button-close-transaction-modal"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}