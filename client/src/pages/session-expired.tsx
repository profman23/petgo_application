import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function SessionExpired() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Clear any remaining data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-red-200">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-xl font-bold text-gray-900 mb-2">انتهت جلسة العمل</h1>
          <p className="text-gray-600 mb-6">
            تم إعادة تشغيل النظام، يرجى تسجيل الدخول مرة أخرى
          </p>
          
          <Button
            onClick={() => setLocation('/login')}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            تسجيل الدخول مرة أخرى
          </Button>
          
          <p className="text-xs text-gray-500 mt-4">
            هذا أمر طبيعي بعد إعادة تشغيل الخادم
          </p>
        </CardContent>
      </Card>
    </div>
  );
}