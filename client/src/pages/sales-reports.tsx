import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";

export default function SalesReports() {
  const [, setLocation] = useLocation();
  const { language } = useTranslation();

  const handleBack = () => {
    setLocation('/admin-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ direction: getDirection(language) }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4" style={{ 
              flexDirection: language === 'ar' ? 'row-reverse' : 'row',
              gap: language === 'ar' ? '1rem' : '0'
            }}>
              <Button
                variant="ghost" 
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
                style={{ 
                  flexDirection: language === 'ar' ? 'row-reverse' : 'row'
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                {language === 'ar' ? 'العودة' : 'Back'}
              </Button>
              
              <h1 className="text-2xl font-bold text-gray-900" style={{ 
                textAlign: getTextAlign(language)
              }}>
                {language === 'ar' ? 'تقارير المبيعات' : 'Sales Reports'}
              </h1>
            </div>
            
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-4" style={{ 
                textAlign: getTextAlign(language)
              }}>
                {language === 'ar' ? 'صفحة تقارير المبيعات' : 'Sales Reports Page'}
              </h3>
              <p className="text-gray-500" style={{ 
                textAlign: getTextAlign(language)
              }}>
                {language === 'ar' 
                  ? 'سيتم إضافة المحتوى هنا قريباً' 
                  : 'Content will be added here soon'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}