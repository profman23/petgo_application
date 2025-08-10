import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentTest() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/vetsvan-logo.png" 
                alt="VetsVan" 
                className="h-8 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.style.display = 'block';
                }}
              />
              <div className="text-xl font-bold text-purple-600 hidden">
                VetsVan Admin
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-sm text-gray-600">
                لوحة إدارة اختبار الدفع
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                اختبار الدفع
              </h1>
            </div>
            <p className="text-gray-600">
              وحدة اختبار نظام المدفوعات - قيد التطوير
            </p>
          </div>

          {/* Placeholder Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  حالة الوحدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">الحالة:</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      قيد التطوير
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">النوع:</span>
                    <span className="font-medium">وحدة اختبار</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">المرحلة:</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planned Features Card */}
            <Card>
              <CardHeader>
                <CardTitle>المميزات المخططة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>اختبار طرق الدفع</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>محاكاة المعاملات</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>اختبار الـ Webhooks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>تتبع حالة المدفوعات</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Development Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات التطوير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">المطور:</span>
                    <span className="block font-medium">فريق VetsVan التقني</span>
                  </div>
                  <div>
                    <span className="text-gray-600">آخر تحديث:</span>
                    <span className="block font-medium">10 أغسطس 2025</span>
                  </div>
                  <div>
                    <span className="text-gray-600">البيئة:</span>
                    <span className="block font-medium">تطوير / اختبار</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder Message */}
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Payment Test Module Placeholder
              </h3>
              <p className="text-gray-600 mb-4">
                هذه الوحدة قيد التطوير وستحتوي على أدوات اختبار نظام المدفوعات.
                سيتم إضافة الوظائف تدريجياً في التحديثات القادمة.
              </p>
              <div className="text-sm text-gray-500">
                <p>المميزات المتوقعة:</p>
                <p>• اختبار تكامل MyFatoorah</p>
                <p>• محاكاة عمليات الدفع</p>
                <p>• مراقبة حالة المعاملات</p>
                <p>• اختبار الـ Webhooks والإشعارات</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}