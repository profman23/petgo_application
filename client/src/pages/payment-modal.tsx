import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, CreditCard, Banknote, DollarSign, Smartphone, ShoppingBag } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  totalAmount: number;
  totalPaid: number;
  payments: any[];
  onPaymentAdded: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  bookingId,
  totalAmount,
  totalPaid,
  payments,
  onPaymentAdded
}: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [cardSubtype, setCardSubtype] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const translations = {
    ar: {
      addPayment: 'إضافة دفعة',
      amount: 'المبلغ',
      paymentType: 'نوع الدفعة',
      cardType: 'نوع البطاقة',
      description: 'الوصف',
      cash: 'نقد',
      card: 'بطاقة',
      transfer: 'تحويل بنكي',
      tabby: 'تابي',
      tamara: 'تمارا',
      madaPay: 'مدى باي',
      masterCard: 'ماستر كارد',
      visa: 'فيزا',
      cancel: 'إلغاء',
      save: 'حفظ',
      paymentHistory: 'سجل المدفوعات',
      totalAmount: 'المبلغ الإجمالي',
      totalPaid: 'إجمالي المدفوع',
      remainingBalance: 'الرصيد المتبقي',
      date: 'التاريخ',
      type: 'النوع',
      paymentAdded: 'تمت إضافة الدفعة بنجاح',
      paymentDeleted: 'تم حذف الدفعة بنجاح',
      error: 'خطأ',
      delete: 'حذف',
      noPayments: 'لا توجد دفعات',
      optional: 'اختياري',
      selectCardType: 'اختر نوع البطاقة'
    },
    en: {
      addPayment: 'Add Payment',
      amount: 'Amount',
      paymentType: 'Payment Type',
      cardType: 'Card Type',
      description: 'Description',
      cash: 'Cash',
      card: 'Card',
      transfer: 'Bank Transfer',
      tabby: 'Tabby',
      tamara: 'Tamara',
      madaPay: 'Mada Pay',
      masterCard: 'Master Card',
      visa: 'Visa',
      cancel: 'Cancel',
      save: 'Save',
      paymentHistory: 'Payment History',
      totalAmount: 'Total Amount',
      totalPaid: 'Total Paid',
      remainingBalance: 'Remaining Balance',
      date: 'Date',
      type: 'Type',
      paymentAdded: 'Payment added successfully',
      paymentDeleted: 'Payment deleted successfully',
      error: 'Error',
      delete: 'Delete',
      noPayments: 'No payments',
      optional: 'Optional',
      selectCardType: 'Select card type'
    }
  };

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !paymentType || (paymentType === 'card' && !cardSubtype)) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    const finalPaymentType = paymentType === 'card' ? `${paymentType}-${cardSubtype}` : paymentType;
    
    try {
      await apiRequest('/api/invoice-payments', {
        method: 'POST',
        body: {
          bookingId,
          amount: parseFloat(amount),
          paymentType: finalPaymentType,
          description: description || null
        }
      });

      toast({
        title: t.paymentAdded,
        variant: 'default',
      });

      // Reset form
      setAmount('');
      setPaymentType('');
      setCardSubtype('');
      setDescription('');
      
      // Refresh payments
      onPaymentAdded();
      
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: t.error,
        description: language === 'ar' ? 'فشل في إضافة الدفعة' : 'Failed to add payment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    try {
      await apiRequest(`/api/invoice-payments/${paymentId}`, {
        method: 'DELETE'
      });

      toast({
        title: t.paymentDeleted,
        variant: 'default',
      });

      // Refresh payments
      onPaymentAdded();
      
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: t.error,
        description: language === 'ar' ? 'فشل في حذف الدفعة' : 'Failed to delete payment',
        variant: 'destructive',
      });
    }
  };

  const remainingBalance = totalAmount - totalPaid;

  const getPaymentIcon = (type: string) => {
    if (type.startsWith('card-')) {
      return <CreditCard className="h-4 w-4" />;
    }
    switch (type) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'transfer':
        return <DollarSign className="h-4 w-4" />;
      case 'tabby':
        return <ShoppingBag className="h-4 w-4" />;
      case 'tamara':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Plus className="h-4 w-4" />;
    }
  };

  const getPaymentTypeDisplay = (paymentType: string) => {
    if (paymentType.startsWith('card-')) {
      const cardType = paymentType.split('-')[1];
      const cardDisplay = {
        'mada': t.madaPay,
        'mastercard': t.masterCard,
        'visa': t.visa
      };
      return `${t.card} - ${cardDisplay[cardType] || cardType}`;
    }
    
    return t[paymentType] || paymentType;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto" 
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        aria-labelledby="payment-dialog-title"
        aria-describedby="payment-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="payment-dialog-title" className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t.addPayment}
          </DialogTitle>
          <DialogDescription id="payment-dialog-description" className="sr-only">
            {language === 'ar' ? 'نافذة إضافة دفعة جديدة للفاتورة' : 'Add new payment dialog for invoice'}
          </DialogDescription>
        </DialogHeader>

        {/* Payment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">{t.totalAmount}</p>
              <p className="text-lg font-bold text-gray-900">{totalAmount.toFixed(2)} SAR</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">{t.totalPaid}</p>
              <p className="text-lg font-bold text-green-600">{totalPaid.toFixed(2)} SAR</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">{t.remainingBalance}</p>
              <p className={`text-lg font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {remainingBalance.toFixed(2)} SAR
              </p>
            </div>
          </div>
        </div>

        {/* Add Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t.amount} <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t.paymentType} <span className="text-red-500">*</span>
            </label>
            <Select value={paymentType} onValueChange={(value) => {
              setPaymentType(value);
              setCardSubtype(''); // Reset card subtype when payment type changes
            }} required>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'اختر نوع الدفعة' : 'Select payment type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    {t.cash}
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {t.card}
                  </div>
                </SelectItem>
                <SelectItem value="transfer">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {t.transfer}
                  </div>
                </SelectItem>
                <SelectItem value="tabby">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    {t.tabby}
                  </div>
                </SelectItem>
                <SelectItem value="tamara">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    {t.tamara}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Card Subtype Selection - Only shown when Card is selected */}
          {paymentType === 'card' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.cardType} <span className="text-red-500">*</span>
              </label>
              <Select value={cardSubtype} onValueChange={setCardSubtype} required>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectCardType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mada">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {t.madaPay}
                    </div>
                  </SelectItem>
                  <SelectItem value="mastercard">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {t.masterCard}
                    </div>
                  </SelectItem>
                  <SelectItem value="visa">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {t.visa}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              {t.description} <span className="text-gray-500">({t.optional})</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'ar' ? 'وصف الدفعة...' : 'Payment description...'}
              className="w-full"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t.save}
            </Button>
          </div>
        </form>

        {/* Payment History */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">{t.paymentHistory}</h3>
          
          {payments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{t.noPayments}</p>
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPaymentIcon(payment.paymentType)}
                    <div>
                      <p className="font-medium">
                        {payment.amount} SAR - {getPaymentTypeDisplay(payment.paymentType)}
                      </p>
                      {payment.description && (
                        <p className="text-sm text-gray-600">{payment.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePayment(payment.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}