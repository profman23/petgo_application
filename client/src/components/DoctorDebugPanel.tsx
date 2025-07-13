import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, TestTube } from 'lucide-react';

export function DoctorDebugPanel() {
  const [debugInfo, setDebugInfo] = useState({
    token: false,
    serviceWorker: false,
    notifications: false,
    lastCheck: '',
    apiCalls: 0
  });

  useEffect(() => {
    const checkSystemStatus = () => {
      const token = localStorage.getItem('doctorToken');
      const swRegistered = 'serviceWorker' in navigator;
      const notificationsEnabled = 'Notification' in window;
      
      setDebugInfo({
        token: !!token,
        serviceWorker: swRegistered,
        notifications: notificationsEnabled,
        lastCheck: new Date().toLocaleTimeString('ar'),
        apiCalls: debugInfo.apiCalls + 1
      });
    };

    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 5000);
    
    return () => clearInterval(interval);
  }, [debugInfo.apiCalls]);

  const forceRefresh = () => {
    // Clear caches only, preserve tokens
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    // Clear cache-related localStorage only
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('notification')) 
          && !key.includes('token') && !key.includes('user')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    window.location.reload();
  };

  const testNotification = async () => {
    try {
      // Test audio
      const audio = new Audio('/رسائل-الايفون.mp3');
      await audio.play();
      
      // Test browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('اختبار الإشعارات', {
          body: 'النظام يعمل بشكل صحيح',
          icon: '/app-icon.png'
        });
      }
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 bg-gray-900 text-white p-3 rounded-lg text-xs max-w-xs z-50">
      <div className="flex items-center gap-2 mb-2">
        <TestTube className="w-4 h-4" />
        <span className="font-bold">نظام التشخيص</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {debugInfo.token ? 
            <CheckCircle className="w-3 h-3 text-green-500" /> : 
            <AlertCircle className="w-3 h-3 text-red-500" />
          }
          <span>Token: {debugInfo.token ? 'موجود' : 'مفقود'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {debugInfo.serviceWorker ? 
            <CheckCircle className="w-3 h-3 text-green-500" /> : 
            <AlertCircle className="w-3 h-3 text-red-500" />
          }
          <span>SW: {debugInfo.serviceWorker ? 'نشط' : 'معطل'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {debugInfo.notifications ? 
            <CheckCircle className="w-3 h-3 text-green-500" /> : 
            <AlertCircle className="w-3 h-3 text-red-500" />
          }
          <span>إشعارات: {debugInfo.notifications ? 'مفعلة' : 'معطلة'}</span>
        </div>
        
        <div className="text-gray-400">
          آخر فحص: {debugInfo.lastCheck}
        </div>
        
        <div className="text-gray-400">
          API Calls: {debugInfo.apiCalls}
        </div>
      </div>
      
      <div className="flex gap-2 mt-2">
        <button 
          onClick={testNotification}
          className="bg-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-700"
        >
          اختبار
        </button>
        <button 
          onClick={forceRefresh}
          className="bg-red-600 px-2 py-1 rounded text-xs hover:bg-red-700"
        >
          إعادة تشغيل
        </button>
      </div>
    </div>
  );
}