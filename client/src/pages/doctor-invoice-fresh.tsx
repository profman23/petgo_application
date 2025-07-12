import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'wouter';
import { useTranslation } from '@/lib/i18n';

// Zero cache, fresh data only approach
export default function DoctorInvoiceFresh() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { language } = useTranslation();
  
  // Force fresh state on every render
  const [freshData, setFreshData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [fetchCount, setFetchCount] = useState(0);

  // Completely bypass all caching mechanisms
  const fetchFreshData = useCallback(async (force = false) => {
    const token = localStorage.getItem('doctorToken');
    if (!token) {
      setError('No doctor token found');
      return;
    }

    try {
      setLoading(true);
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      
      // Multiple cache-busting parameters
      const cacheBuster = `?t=${timestamp}&r=${randomId}&v=${fetchCount}&force=${force ? '1' : '0'}`;
      
      // Create completely fresh fetch request
      const response = await fetch(`/api/invoice-status/${bookingId}${cacheBuster}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Fresh-Request': timestamp.toString(),
        },
        // Disable all caching
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Force state update with fresh timestamp
      setFreshData({ ...data, _fetchTime: timestamp });
      setLastUpdate(timestamp);
      setFetchCount(prev => prev + 1);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [bookingId, fetchCount]);

  // Update discount with immediate refresh
  const updateDiscount = useCallback(async (newDiscount: string) => {
    const token = localStorage.getItem('doctorToken');
    if (!token) return;

    try {
      const timestamp = Date.now();
      
      const response = await fetch(`/api/invoice-status/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Update-Time': timestamp.toString(),
        },
        body: JSON.stringify({
          discountAmount: newDiscount,
          subtotal: "100.00",
          taxAmount: "15.00",
          finalTotal: (100 + 15 - parseFloat(newDiscount)).toFixed(2)
        }),
        cache: 'no-store'
      });

      if (response.ok) {
        // Force immediate fresh fetch after update
        setTimeout(() => fetchFreshData(true), 100);
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  }, [bookingId, fetchFreshData]);

  // Initial load
  useEffect(() => {
    fetchFreshData(true);
  }, []);

  // Auto-refresh every 2 seconds with fresh data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFreshData(false);
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchFreshData]);

  // Force refresh on window focus
  useEffect(() => {
    const handleFocus = () => fetchFreshData(true);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchFreshData]);

  const isRTL = language === 'ar';

  return (
    <div className={`min-h-screen bg-gray-50 p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {isRTL ? 'اختبار الفاتورة الجديد' : 'Fresh Invoice Test'}
          </h1>
          
          {/* Debug Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
            <h3 className="font-bold text-yellow-800 mb-2">
              {isRTL ? 'معلومات التشخيص' : 'Debug Information'}
            </h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <div>Fetch Count: {fetchCount}</div>
              <div>Last Update: {new Date(lastUpdate).toLocaleTimeString()}</div>
              <div>Current Time: {new Date().toLocaleTimeString()}</div>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
              {error && <div className="text-red-600">Error: {error}</div>}
            </div>
          </div>

          {/* Refresh Controls */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => fetchFreshData(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isRTL ? 'تحديث فوري' : 'Force Refresh'}
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              {isRTL ? 'إعادة تحميل الصفحة' : 'Page Reload'}
            </button>
          </div>

          {/* Discount Controls */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => updateDiscount('0.00')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              {isRTL ? 'خصم 0%' : 'Discount 0%'}
            </button>
            
            <button
              onClick={() => updateDiscount('10.00')}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              {isRTL ? 'خصم 10 ريال' : 'Discount 10 SAR'}
            </button>
            
            <button
              onClick={() => updateDiscount('50.00')}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              {isRTL ? 'خصم 50 ريال' : 'Discount 50 SAR'}
            </button>
          </div>
        </div>

        {/* Data Display */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            {isRTL ? 'البيانات الحالية' : 'Current Data'}
          </h2>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">
                {isRTL ? 'جاري التحميل...' : 'Loading...'}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {freshData && (
            <div className="space-y-4">
              {/* Current Values */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    {isRTL ? 'المجموع الفرعي' : 'Subtotal'}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {freshData.subtotal} SAR
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    {isRTL ? 'الضريبة' : 'Tax'}
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    {freshData.taxAmount} SAR
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    {isRTL ? 'الخصم' : 'Discount'}
                  </h3>
                  <p className="text-2xl font-bold text-red-600">
                    {freshData.discountAmount} SAR
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    {isRTL ? 'المجموع النهائي' : 'Final Total'}
                  </h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {freshData.finalTotal} SAR
                  </p>
                </div>
              </div>

              {/* Raw Data */}
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-semibold mb-2">
                  {isRTL ? 'البيانات الخام' : 'Raw Data'}
                </h3>
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(freshData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}