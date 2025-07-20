import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";

export default function NewReportsAnalytics() {
  const [, setLocation] = useLocation();
  const { language } = useTranslation();

  const handleBack = () => {
    setLocation('/admin-dashboard');
  };

  return (
    <div 
      className="min-h-screen bg-gray-50" 
      dir={getDirection(language)}
    >
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'العودة' : 'Back'}
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900" style={{ 
                  textAlign: getTextAlign(language)
                }}>
                  {language === 'ar' ? 'تقارير وتحليلات جديدة' : 'New Reports & Analytics'}
                </h1>
                <p className="text-sm text-gray-500" style={{ 
                  textAlign: getTextAlign(language)
                }}>
                  {language === 'ar' 
                    ? 'نظام التقارير والتحليلات المتقدم'
                    : 'Advanced reports and analytics system'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-12">
              <TrendingUp className="mx-auto h-16 w-16 text-purple-400" />
              <h3 className="mt-4 text-xl font-medium text-gray-900" style={{ 
                textAlign: getTextAlign(language)
              }}>
                {language === 'ar' ? 'مرحباً بك في قسم التقارير والتحليلات الجديد' : 'Welcome to New Reports & Analytics'}
              </h3>
              <p className="mt-2 text-gray-500" style={{ 
                textAlign: getTextAlign(language)
              }}>
                {language === 'ar' 
                  ? 'سيتم إضافة المحتوى والميزات المطلوبة هنا قريباً'
                  : 'Required content and features will be added here soon'
                }
              </p>
              
              {/* Placeholder Cards */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                  <h4 className="text-lg font-medium text-purple-900 mb-2" style={{ 
                    textAlign: getTextAlign(language)
                  }}>
                    {language === 'ar' ? 'تحليلات متقدمة' : 'Advanced Analytics'}
                  </h4>
                  <p className="text-purple-700 text-sm" style={{ 
                    textAlign: getTextAlign(language)
                  }}>
                    {language === 'ar' 
                      ? 'تحليلات شاملة وتفصيلية للأداء'
                      : 'Comprehensive performance analytics'
                    }
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                  <h4 className="text-lg font-medium text-blue-900 mb-2" style={{ 
                    textAlign: getTextAlign(language)
                  }}>
                    {language === 'ar' ? 'تقارير مخصصة' : 'Custom Reports'}
                  </h4>
                  <p className="text-blue-700 text-sm" style={{ 
                    textAlign: getTextAlign(language)
                  }}>
                    {language === 'ar' 
                      ? 'إنشاء تقارير مخصصة حسب المتطلبات'
                      : 'Create custom reports as needed'
                    }
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                  <h4 className="text-lg font-medium text-green-900 mb-2" style={{ 
                    textAlign: getTextAlign(language)
                  }}>
                    {language === 'ar' ? 'رؤى ذكية' : 'Smart Insights'}
                  </h4>
                  <p className="text-green-700 text-sm" style={{ 
                    textAlign: getTextAlign(language)
                  }}>
                    {language === 'ar' 
                      ? 'رؤى ذكية وتوصيات تلقائية'
                      : 'Intelligent insights and recommendations'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}