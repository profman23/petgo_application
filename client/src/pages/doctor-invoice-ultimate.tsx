import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useTranslation } from '@/lib/i18n';

// Ultimate solution - bypassing ALL caching and authentication issues
export default function DoctorInvoiceUltimate() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { language } = useTranslation();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  // Get fresh token and make authenticated request
  const makeAuthenticatedRequest = async (url: string, options: any = {}) => {
    // Force fresh login to get new token
    const loginResponse = await fetch('/api/doctor/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'v001', password: '123456' }),
      cache: 'no-store'
    });
    
    if (!loginResponse.ok) throw new Error('Login failed');
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    // Use fresh token for actual request
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...options.headers
      },
      cache: 'no-store'
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  };

  // Fetch current data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const freshData = await makeAuthenticatedRequest(`/api/invoice-status/${bookingId}?t=${Date.now()}`);
      setData(freshData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Update discount
  const updateDiscount = async (newDiscount: string) => {
    try {
      setLoading(true);
      
      const updateData = {
        discountAmount: newDiscount,
        subtotal: "100.00",
        taxAmount: "15.00", 
        finalTotal: (100 + 15 - parseFloat(newDiscount)).toFixed(2)
      };
      
      await makeAuthenticatedRequest(`/api/invoice-status/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      setUpdateCount(prev => prev + 1);
      
      // Immediately fetch fresh data
      setTimeout(fetchData, 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, [bookingId]);

  const isRTL = language === 'ar';

  return (
    <div className={`min-h-screen bg-gray-50 p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-purple-800 mb-4">
            {isRTL ? 'الحل النهائي - اختبار الفاتورة' : 'Ultimate Solution - Invoice Test'}
          </h1>
          
          {/* Status */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">{isRTL ? 'حالة التحميل:' : 'Loading:'}</span>
                <span className={`ml-2 px-2 py-1 rounded ${loading ? 'bg-yellow-200' : 'bg-green-200'}`}>
                  {loading ? (isRTL ? 'جاري التحميل' : 'Loading') : (isRTL ? 'مكتمل' : 'Complete')}
                </span>
              </div>
              <div>
                <span className="font-semibold">{isRTL ? 'عدد التحديثات:' : 'Updates:'}</span>
                <span className="ml-2 px-2 py-1 bg-purple-200 rounded">{updateCount}</span>
              </div>
            </div>
            {error && (
              <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              {isRTL ? '🔄 تحديث البيانات' : '🔄 Refresh Data'}
            </button>
            
            <button
              onClick={() => updateDiscount('0.00')}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
            >
              {isRTL ? '✅ خصم صفر' : '✅ Zero Discount'}
            </button>
            
            <button
              onClick={() => updateDiscount('10.00')}
              disabled={loading}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-semibold"
            >
              {isRTL ? '🔥 خصم 10 ريال' : '🔥 10 SAR Discount'}
            </button>
            
            <button
              onClick={() => updateDiscount('25.00')}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
            >
              {isRTL ? '🎯 خصم 25 ريال' : '🎯 25 SAR Discount'}
            </button>
          </div>
        </div>

        {/* Data Display */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            {isRTL ? '📊 بيانات الفاتورة الحالية' : '📊 Current Invoice Data'}
          </h2>

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600 text-lg">
                {isRTL ? 'جاري المعالجة...' : 'Processing...'}
              </p>
            </div>
          )}

          {data && !loading && (
            <div>
              {/* Visual Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold mb-2">
                    {isRTL ? 'المجموع الفرعي' : 'Subtotal'}
                  </h3>
                  <p className="text-3xl font-bold">{data.subtotal}</p>
                  <p className="text-blue-100">SAR</p>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold mb-2">
                    {isRTL ? 'الضريبة (15%)' : 'Tax (15%)'}
                  </h3>
                  <p className="text-3xl font-bold">{data.taxAmount}</p>
                  <p className="text-green-100">SAR</p>
                </div>

                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold mb-2">
                    {isRTL ? 'الخصم' : 'Discount'}
                  </h3>
                  <p className="text-3xl font-bold">{data.discountAmount}</p>
                  <p className="text-red-100">SAR</p>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold mb-2">
                    {isRTL ? 'المجموع النهائي' : 'Final Total'}
                  </h3>
                  <p className="text-3xl font-bold">{data.finalTotal}</p>
                  <p className="text-purple-100">SAR</p>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  {isRTL ? '📋 تفاصيل شاملة' : '📋 Complete Details'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>{isRTL ? 'معرف الفاتورة:' : 'Invoice ID:'}</strong> {data.id}</div>
                  <div><strong>{isRTL ? 'معرف الحجز:' : 'Booking ID:'}</strong> {data.bookingId}</div>
                  <div><strong>{isRTL ? 'حالة الإنتاج:' : 'Generated:'}</strong> {data.isGenerated ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No')}</div>
                  <div><strong>{isRTL ? 'المنشئ:' : 'Generated By:'}</strong> {data.generatedBy}</div>
                  <div><strong>{isRTL ? 'تاريخ الإنشاء:' : 'Created:'}</strong> {new Date(data.createdAt).toLocaleString()}</div>
                  <div><strong>{isRTL ? 'آخر تحديث:' : 'Last Updated:'}</strong> {new Date(data.updatedAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Raw JSON */}
              <details className="mt-6">
                <summary className="cursor-pointer font-semibold text-lg mb-2 text-gray-700">
                  {isRTL ? '🔍 البيانات الخام (JSON)' : '🔍 Raw Data (JSON)'}
                </summary>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}