import { useEffect } from "react";

export default function PrivacyPolicyEn() {
  useEffect(() => {
    document.title = "Privacy Policy - VetsVan";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8" dir="ltr">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Privacy Policy – VetsVan
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            <p className="mb-6">
              VetsVan values your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our mobile application.
            </p>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Information Collection:</h2>
              <p>We collect basic personal information (name, phone number, email) and pet details to provide veterinary services.</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Use of Information:</h2>
              <p>Information is used only to manage appointments, deliver services, and improve customer experience.</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Protection:</h2>
              <p>All data is securely stored and never shared with third parties without your consent.</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">User Rights:</h2>
              <p>You can request to update or delete your personal data at any time.</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact:</h2>
              <p>For any inquiries, contact us at <a href="mailto:support@vetsvan.com" className="text-purple-600 hover:text-purple-800 underline">support@vetsvan.com</a>.</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                By using our app, you agree to this Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}