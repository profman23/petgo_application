import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';

export default function DoctorInvoiceSimple() {
  const [, params] = useRoute('/doctor-invoice-simple/:bookingId');
  const [discountData, setDiscountData] = useState<any>(null);
  const [counter, setCounter] = useState(0);

  // مؤشر الخصم بدون cache
  const loadDiscountData = async () => {
    try {
      // منع أي cache مع random numbers
      const url = `/api/invoice-status/${params?.bookingId}?t=${Date.now()}&r=${Math.random()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('doctorToken')}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setDiscountData(data);
        console.log('✅ Fresh data loaded:', data);
        
        // حفظ في localStorage أيضاً لمقارنة
        localStorage.setItem(`discount_${params?.bookingId}`, JSON.stringify(data));
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
  };

  // تحديث كل ثانية
  useEffect(() => {
    if (params?.bookingId) {
      loadDiscountData();
      
      const interval = setInterval(() => {
        setCounter(prev => prev + 1);
        loadDiscountData();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [params?.bookingId]);

  // تغيير الخصم
  const changeDiscount = async (amount: string) => {
    try {
      const response = await fetch(`/api/invoice-status/${params?.bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('doctorToken')}`,
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          discountAmount: amount,
          subtotal: '100.00',
          taxAmount: '15.00',
          finalTotal: (100 + 15 - parseFloat(amount)).toString()
        })
      });

      if (response.ok) {
        console.log('✅ Discount saved');
        // إعادة تحميل فورية
        setTimeout(() => loadDiscountData(), 100);
      }
    } catch (error) {
      console.error('❌ Error saving discount:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">🧪 إختبار تحديث الخصم</h1>
      
      {/* مؤشر حالة */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6">
        <div className="flex justify-between items-center">
          <span className="font-medium">📊 حالة الخصم الحالية:</span>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">التحديث #{counter}</span>
            <div className={`w-4 h-4 rounded-full ${
              discountData ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="font-bold text-lg">
              {discountData ? `${discountData.discountAmount} SAR` : 'لا توجد بيانات'}
            </span>
          </div>
        </div>
        
        {discountData && (
          <div className="mt-2 text-sm text-gray-600">
            آخر تحديث: {new Date(discountData.updatedAt).toLocaleTimeString('ar-SA')}
          </div>
        )}
      </div>

      {/* أزرار تغيير الخصم */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">🎛️ تغيير الخصم:</h2>
        
        <div className="flex space-x-4">
          <Button 
            onClick={() => changeDiscount('0.00')}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            ❌ بدون خصم (0 SAR)
          </Button>
          
          <Button 
            onClick={() => changeDiscount('10.00')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            🟡 خصم 10% (10 SAR)
          </Button>
          
          <Button 
            onClick={() => changeDiscount('100.00')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            ✅ خصم 100% مجاني (100 SAR)
          </Button>
        </div>
      </div>

      {/* تحديث يدوي */}
      <div className="mt-8">
        <Button 
          onClick={loadDiscountData}
          variant="outline"
          className="border-purple-600 text-purple-600 hover:bg-purple-50"
        >
          🔄 تحديث البيانات الآن
        </Button>
      </div>

      {/* البيانات الخام */}
      {discountData && (
        <div className="mt-8 bg-gray-50 p-4 rounded">
          <h3 className="font-medium mb-2">📄 البيانات الخام:</h3>
          <pre className="text-xs text-gray-600">
            {JSON.stringify(discountData, null, 2)}
          </pre>
        </div>
      )}

      {/* Local Storage */}
      <div className="mt-4 bg-yellow-50 p-4 rounded">
        <h3 className="font-medium mb-2">💾 Local Storage:</h3>
        <pre className="text-xs text-gray-600">
          {localStorage.getItem(`discount_${params?.bookingId}`) || 'لا توجد بيانات محفوظة'}
        </pre>
      </div>
    </div>
  );
}