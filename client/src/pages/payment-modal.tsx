import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTotal: number;
  remainingBalance?: number;
  onPaymentSubmit: (payment: PaymentData) => void;
}

interface PaymentData {
  amount: number;
  paymentType: string;
  description: string;
}

const translations = {
  ar: {
    currentInvoice: 'الفاتورة الحالية',
    amount: 'المبلغ',
    paymentType: 'نوع الدفع',
    description: 'الوصف',
    cash: 'نقداً',
    card: 'بطاقة',
    tabby: 'تابي',
    tamara: 'تمارا',
    submitPayment: 'تأكيد الدفعة',
    cancel: 'إلغاء',
    sar: 'ريال',
    enterAmount: 'أدخل المبلغ',
    enterDescription: 'أدخل وصف الدفعة',
    selectPaymentType: 'اختر نوع الدفع',
    remainingBalance: 'الرصيد المتبقي',
    amountError: 'المبلغ لا يمكن أن يتجاوز الرصيد المتبقي'
  },
  en: {
    currentInvoice: 'Current Invoice',
    amount: 'Amount',
    paymentType: 'Payment Type',
    description: 'Description',
    cash: 'Cash',
    card: 'Card',
    tabby: 'Tabby',
    tamara: 'Tamara',
    submitPayment: 'Submit Payment',
    cancel: 'Cancel',
    sar: 'SAR',
    enterAmount: 'Enter amount',
    enterDescription: 'Enter payment description',
    selectPaymentType: 'Select payment type',
    remainingBalance: 'Remaining Balance',
    amountError: 'Amount cannot exceed remaining balance'
  }
};

export default function PaymentModal({ isOpen, onClose, currentTotal, remainingBalance, onPaymentSubmit }: PaymentModalProps) {
  const { language } = useLanguage();
  const [amount, setAmount] = useState(0);
  const [paymentType, setPaymentType] = useState('');
  const [description, setDescription] = useState('');

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setAmount(remainingBalance || currentTotal);
      setPaymentType('');
      setDescription('');
    }
  }, [isOpen, remainingBalance, currentTotal]);

  const t = (key: keyof typeof translations.ar) => translations[language as keyof typeof translations][key];

  const handleSubmit = () => {
    if (!amount || !paymentType) return;
    
    const remainingAmount = remainingBalance || currentTotal;
    if (amount > remainingAmount) {
      alert(t('amountError'));
      return;
    }
    
    onPaymentSubmit({
      amount,
      paymentType,
      description
    });
    
    // Reset form
    setAmount(0);
    setPaymentType('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {t('currentInvoice')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {/* Current Invoice & Remaining Balance */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">
              {t('currentInvoice')}: <span className="text-lg font-bold text-purple-600">{currentTotal.toFixed(2)} {t('sar')}</span>
            </div>
            {remainingBalance !== undefined && (
              <div className="text-sm font-medium text-gray-700">
                {t('remainingBalance')}: <span className="text-lg font-bold text-red-600">{remainingBalance.toFixed(2)} {t('sar')}</span>
              </div>
            )}
          </div>
          
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('amount')}
            </label>
            <div className="flex items-center">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder={t('enterAmount')}
                className="flex-1"
              />
              <span className="ml-2 text-gray-600">{t('sar')}</span>
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('paymentType')}
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="">{t('selectPaymentType')}</option>
              <option value="cash">{t('cash')}</option>
              <option value="card">{t('card')}</option>
              <option value="tabby">{t('tabby')}</option>
              <option value="tamara">{t('tamara')}</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('description')}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('enterDescription')}
              rows={3}
              className="w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!amount || !paymentType || !description.trim()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
          >
            {t('submitPayment')}
          </Button>
        </div>
      </div>
    </div>
  );
}