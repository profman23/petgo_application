import { useEffect } from "react";

export default function PrivacyPolicyAr() {
  useEffect(() => {
    document.title = "سياسة الخصوصية - VetsVan";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <style>{`
        * {
          color: inherit !important;
        }
        .arabic-text, .arabic-text * {
          color: inherit !important;
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: 'Cairo Play, sans-serif' }}>
            سياسة الخصوصية – VetsVan
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed arabic-text" style={{ fontFamily: 'Cairo Play, sans-serif' }}>
            <p className="mb-6">
              نحن في VetsVan نولي أهمية كبيرة لخصوصيتك. توضح هذه السياسة كيفية جمع واستخدام وحماية بياناتك عند استخدامك للتطبيق.
            </p>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">جمع البيانات:</h2>
              <p>نقوم بجمع البيانات الأساسية مثل الاسم، رقم الهاتف، البريد الإلكتروني، ومعلومات الحيوان الأليف لتقديم خدماتنا.</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">استخدام البيانات:</h2>
              <p>تُستخدم البيانات فقط لإدارة الحجوزات، تقديم الخدمة، وتحسين تجربة العملاء.</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">حماية البيانات:</h2>
              <p>يتم تخزين جميع البيانات بشكل آمن ولا تتم مشاركتها مع أي طرف ثالث دون موافقتك.</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">حقوق المستخدم:</h2>
              <p>يمكنك طلب تحديث أو حذف بياناتك الشخصية في أي وقت.</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">التواصل:</h2>
              <p>للاستفسارات يمكنكم التواصل عبر <a href="mailto:support@vetsvan.com" className="text-purple-600 hover:text-purple-800 underline">support@vetsvan.com</a>.</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                باستخدامك للتطبيق، فأنت توافق على هذه السياسة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}