import React, { useState } from 'react';
import { Settings, Globe } from 'lucide-react';

// Testing panel for language detection (only in development)
export function LanguageTestingPanel() {
  const [showPanel, setShowPanel] = useState(false);
  const [testLanguage, setTestLanguage] = useState<string | null>(null);

  // Only show in development
  if (import.meta.env.PROD) return null;

  const testLanguages = [
    { code: 'ar', name: 'Arabic (العربية)', flag: '🇸🇦' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'de', name: 'German', flag: '🇩🇪' }
  ];

  const setTestMode = (langCode: string | null) => {
    setTestLanguage(langCode);
    
    if (langCode) {
      // Override navigator.language for testing
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: langCode
      });
      Object.defineProperty(navigator, 'languages', {
        writable: true,
        value: [langCode]
      });
    } else {
      // Reset to actual browser language
      location.reload();
    }
    
    // Trigger a custom event to notify components
    window.dispatchEvent(new CustomEvent('language-test-changed', { 
      detail: { language: langCode } 
    }));
  };

  const getCurrentLanguage = () => {
    return testLanguage || navigator.language;
  };

  const getDetectedUILanguage = () => {
    const lang = getCurrentLanguage();
    return lang.startsWith('ar') ? 'Arabic' : 'English';
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed top-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Test Language Detection"
      >
        <Settings className="h-5 w-5" />
      </button>

      {/* Testing Panel */}
      {showPanel && (
        <div className="fixed top-16 right-4 z-50 bg-white rounded-lg shadow-xl border p-4 w-80">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Language Testing Panel</h3>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Current Language: <span className="font-medium">{getCurrentLanguage()}</span>
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Detected UI: <span className="font-medium">{getDetectedUILanguage()}</span>
            </p>
            {testLanguage && (
              <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                Test mode active - refresh to reset
              </p>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setTestMode(null)}
              className={`w-full text-left p-2 rounded transition-colors ${
                !testLanguage 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              🔄 Use Actual Browser Language
            </button>
            
            {testLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setTestMode(lang.code)}
                className={`w-full text-left p-2 rounded transition-colors flex items-center gap-2 ${
                  testLanguage === lang.code 
                    ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                {lang.code === 'ar' && <span className="text-xs text-gray-500">(RTL)</span>}
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <p className="font-medium mb-1">Test Instructions:</p>
            <p>• Select a language to test PWA install messages</p>
            <p>• Arabic shows RTL layout with Arabic text</p>
            <p>• Other languages show LTR layout with English text</p>
            <p>• Clear browser cache to see install prompts again</p>
          </div>
        </div>
      )}
    </>
  );
}