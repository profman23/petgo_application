import { useState, useRef } from 'react';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { ArrowLeft, ArrowRight, Camera, User, Phone, Lock } from 'lucide-react';
import { useLocation } from 'wouter';
import logoPath from '@assets/10773561_1751295833176.png';

export default function Account() {
  const { t, language } = useTranslation();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation('/');
  };

  const ArrowIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white" dir={direction}>
      {/* Header with Logo and Back Button */}
      <div className="bg-white shadow-sm border-b border-purple-100 p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowIcon size={16} />
            <span className="text-sm font-medium">{t('back')}</span>
          </button>
          
          <img 
            src={logoPath} 
            alt="VETS VAN Logo" 
            className="h-8 w-auto"
          />
        </div>
      </div>

      <div className="max-w-md mx-auto p-6">
        {/* User Header Section */}
        <div className="bg-white rounded-xl border-2 border-purple-200 shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4" style={{ flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }}>
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center border-4 border-purple-200">
                <User size={32} className="text-purple-600" />
              </div>
              
              {/* Camera Button */}
              <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-white flex items-center justify-center transition-colors">
                <Camera size={14} />
              </button>
            </div>

            {/* User Name */}
            <div className="flex-1" style={{ textAlign }}>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                {t('accountTitle')}
              </h1>
              <p className="text-sm text-gray-600">{t('accountSubtitle')}</p>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className="border-t border-purple-200 mb-6"></div>

        {/* Account Details Form */}
        <div className="bg-white rounded-xl border-2 border-purple-200 shadow-lg p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800" style={{ textAlign }}>
            {t('accountDetails')}
          </h2>

          {/* First Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" style={{ textAlign }}>
              {t('firstName')}
            </label>
            <div className="relative">
              <User className="absolute top-3 w-4 h-4 text-gray-400" style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
              <input
                type="text"
                className={`w-full h-10 rounded-md border border-purple-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10'}`}
                placeholder={t('firstNamePlaceholder')}
              />
            </div>
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" style={{ textAlign }}>
              {t('lastName')}
            </label>
            <div className="relative">
              <User className="absolute top-3 w-4 h-4 text-gray-400" style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
              <input
                type="text"
                className={`w-full h-10 rounded-md border border-purple-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10'}`}
                placeholder={t('lastNamePlaceholder')}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" style={{ textAlign }}>
              {t('phone')}
            </label>
            <div className="relative">
              <Phone className="absolute top-3 w-4 h-4 text-gray-400" style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
              <input
                type="tel"
                className={`w-full h-10 rounded-md border border-purple-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10'}`}
                placeholder={t('phonePlaceholder')}
              />
            </div>
          </div>

          {/* Reset Password Button */}
          <button className="w-full border border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 flex items-center justify-center gap-2 py-3 rounded-md transition-colors">
            <Lock size={16} />
            {t('resetPassword')}
          </button>

          {/* Save Button */}
          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-md transition-colors">
            {t('saveProfile')}
          </button>
        </div>
      </div>
    </div>
  );
}