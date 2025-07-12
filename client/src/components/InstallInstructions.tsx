import React from 'react';
import { X, Smartphone, Monitor, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InstallInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallInstructions({ isOpen, onClose }: InstallInstructionsProps) {
  if (!isOpen) return null;

  const userAgent = navigator.userAgent.toLowerCase();
  const isChrome = userAgent.includes('chrome');
  const isEdge = userAgent.includes('edge');
  const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
  const isFirefox = userAgent.includes('firefox');
  const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <Download className="w-5 h-5 mr-2 text-purple-600" />
            تثبيت تطبيق VetsVan
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 h-auto"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              {isMobile ? <Smartphone className="w-8 h-8 text-purple-600" /> : <Monitor className="w-8 h-8 text-purple-600" />}
            </div>
            <p className="text-gray-700">
              ثبت تطبيق VetsVan على جهازك للحصول على تجربة أفضل وأسرع
            </p>
          </div>

          {/* Browser-specific instructions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">خطوات التثبيت:</h3>
            
            {(isChrome || isEdge) && (
              <div className="space-y-2">
                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div className="text-sm text-gray-700">
                    اضغط على النقاط الثلاث <span className="font-mono bg-gray-200 px-1 rounded">⋮</span> في أعلى المتصفح
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div className="text-sm text-gray-700">
                    اختر <span className="font-semibold">"تثبيت التطبيق"</span> أو <span className="font-semibold">"Install app"</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div className="text-sm text-gray-700">
                    اضغط <span className="font-semibold">"تثبيت"</span> لإضافة التطبيق لشاشتك الرئيسية
                  </div>
                </div>
              </div>
            )}

            {isSafari && (
              <div className="space-y-2">
                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div className="text-sm text-gray-700">
                    اضغط على زر المشاركة <span className="font-mono bg-gray-200 px-1 rounded">📤</span> في أسفل المتصفح
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div className="text-sm text-gray-700">
                    اختر <span className="font-semibold">"إضافة إلى الشاشة الرئيسية"</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div className="text-sm text-gray-700">
                    اضغط <span className="font-semibold">"إضافة"</span> لتثبيت التطبيق
                  </div>
                </div>
              </div>
            )}

            {isFirefox && (
              <div className="space-y-2">
                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div className="text-sm text-gray-700">
                    اضغط على القائمة <span className="font-mono bg-gray-200 px-1 rounded">☰</span> في أعلى المتصفح
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div className="text-sm text-gray-700">
                    اختر <span className="font-semibold">"تثبيت"</span> أو <span className="font-semibold">"Install"</span>
                  </div>
                </div>
              </div>
            )}

            {(!isChrome && !isEdge && !isSafari && !isFirefox) && (
              <div className="text-sm text-gray-700">
                ابحث عن خيار <span className="font-semibold">"تثبيت التطبيق"</span> أو <span className="font-semibold">"Add to Home Screen"</span> في قائمة المتصفح
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-2">مميزات التطبيق المثبت:</h3>
            <ul className="space-y-1 text-sm text-purple-700">
              <li>• يعمل بدون إنترنت</li>
              <li>• تشغيل أسرع</li>
              <li>• إشعارات فورية</li>
              <li>• أيقونة على الشاشة الرئيسية</li>
              <li>• يعمل كتطبيق منفصل</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2 space-x-reverse">
            <Button 
              onClick={onClose}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              فهمت، سأجرب الآن
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              ربما لاحقاً
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}