import { useState, useEffect } from 'react';
import { MapPin, AlertCircle, X } from 'lucide-react';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => void;
}

export function LocationPermissionModal({ isOpen, onClose, onAllow }: LocationPermissionModalProps) {
  const { t, language } = useTranslation();
  
  const translations = {
    ar: {
      title: 'مطلوب إذن الموقع',
      subtitle: 'للعثور على أفضل العيادات البيطرية القريبة منك',
      description: 'نحتاج للوصول إلى موقعك لنقدم لك أفضل الخدمات البيطرية المناسبة لمنطقتك ولضمان وصول الطبيب البيطري إليك بأسرع وقت ممكن.',
      benefits: [
        'العثور على أقرب العيادات البيطرية المتنقلة',
        'تقدير وقت الوصول الدقيق',
        'تحسين جودة الخدمة المقدمة'
      ],
      allowButton: 'السماح بالوصول للموقع',
      skipButton: 'تخطي',
      securityNote: 'نحن نحترم خصوصيتك ولن نشارك معلومات موقعك مع أطراف ثالثة'
    },
    en: {
      title: 'Location Permission Required',
      subtitle: 'To find the best veterinary clinics near you',
      description: 'We need access to your location to provide you with the best veterinary services suitable for your area and ensure the veterinarian reaches you as quickly as possible.',
      benefits: [
        'Find the nearest mobile veterinary clinics',
        'Accurate arrival time estimation',
        'Improve service quality'
      ],
      allowButton: 'Allow Location Access',
      skipButton: 'Skip',
      securityNote: 'We respect your privacy and will not share your location information with third parties'
    }
  };

  const text = translations[language];

  if (!isOpen) return null;

  const handleAllow = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location permission granted:', position);
        onAllow();
      },
      (error) => {
        console.error('Location permission denied:', error);
        // يمكن إضافة رسالة خطأ هنا
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir={getDirection(language)}>
      <Card className="w-full max-w-md mx-auto shadow-2xl border-2" style={{ borderColor: '#1E50C8' }}>
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-lg relative" style={{ background: 'linear-gradient(135deg, #1E50C8 0%, #a855f7 100%)' }}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
              style={{ [language === 'ar' ? 'left' : 'right']: '1rem' }}
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3 rtl:space-x-reverse mb-3">
              <div className="p-3 bg-white/20 rounded-full">
                <MapPin className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ textAlign: getTextAlign(language) }}>
                  {text.title}
                </h3>
                <p className="text-purple-100 text-sm" style={{ textAlign: getTextAlign(language) }}>
                  {text.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 bg-white">
            <div className="mb-6">
              <p className="text-gray-700 text-sm leading-relaxed mb-4" style={{ textAlign: getTextAlign(language) }}>
                {text.description}
              </p>

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                {text.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3 rtl:space-x-reverse">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-gray-600 text-sm" style={{ textAlign: getTextAlign(language) }}>
                      {benefit}
                    </p>
                  </div>
                ))}
              </div>

              {/* Security Note */}
              <div className="flex items-start space-x-2 rtl:space-x-reverse p-3 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-blue-800 text-xs" style={{ textAlign: getTextAlign(language) }}>
                  {text.securityNote}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleAllow}
                className="w-full py-3 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{ 
                  background: 'linear-gradient(135deg, #1E50C8 0%, #a855f7 100%)',
                  boxShadow: '0 8px 25px rgba(133, 32, 133, 0.3)'
                }}
              >
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                  <MapPin className="w-5 h-5" />
                  <span>{text.allowButton}</span>
                </div>
              </Button>

              <Button
                onClick={onClose}
                variant="outline"
                className="w-full py-3 font-semibold rounded-xl border-2 transition-all duration-300 hover:bg-gray-50"
                style={{ borderColor: '#1E50C8', color: '#1E50C8' }}
              >
                {text.skipButton}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}