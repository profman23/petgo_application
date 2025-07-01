import { useState, useRef, useEffect } from 'react';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { ArrowLeft, ArrowRight, Camera, User, Phone, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import logoPath from '@assets/10773561_1751295833176.png';
import { FixedFooter } from '@/components/fixed-footer';
import { LanguageSelector } from '@/components/language-selector';

export default function Account() {
  const { t, language } = useTranslation();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Password reset modal state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    retry: false,
  });

  // Initialize form with user data
  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
    }
  }, [userProfile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      showToast(t('profileUpdated'), 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'حدث خطأ', 'error');
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('/api/user/reset-password', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(t('passwordChanged'), 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'حدث خطأ', 'error');
    },
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  };

  const handleBack = () => {
    setLocation('/');
  };

  const handleSaveProfile = () => {
    if (!firstName || !lastName) {
      showToast('الاسم الأول والأخير مطلوبان', 'error');
      return;
    }

    const fullName = `${firstName} ${lastName}`;
    updateProfileMutation.mutate({
      firstName,
      lastName,
      name: fullName,
    });
  };

  const handleResetPassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('جميع الحقول مطلوبة', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast(t('newPasswordTooShort'), 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(t('passwordsDontMatch'), 'error');
      return;
    }

    resetPasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, just show a success message
      // In a real app, you would upload to a file storage service
      showToast(t('uploadPhoto') + ' - قريباً', 'success');
    }
  };

  const handlePatientsClick = () => {
    setLocation('/patients');
  };

  const ArrowIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-purple-600">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white" dir={direction}>
      {/* Header with Enhanced Logo and Back Button */}
      <div className="bg-white shadow-lg border-b border-purple-100 p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowIcon size={16} />
            <span className="text-sm font-medium">{t('back')}</span>
          </button>
          
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <div className="w-12 h-12 flex items-center justify-center bg-purple-50 rounded-xl border-2 border-purple-100 shadow-sm">
              <img 
                src={logoPath} 
                alt="VETS VAN Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-6">
        {/* User Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4" style={{ flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }}>
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                <User size={32} className="text-purple-600" />
              </div>
              
              {/* Camera Button */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white border-2 border-white flex items-center justify-center transition-colors"
              >
                <Camera size={14} />
              </button>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* User Name */}
            <div className="flex-1" style={{ textAlign }}>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                {userProfile?.name || t('accountTitle')}
              </h1>
              <p className="text-sm text-gray-600">{t('accountSubtitle')}</p>
            </div>
          </div>
        </div>

        {/* Account Details Toggle Button */}
        <button
          onClick={() => setIsAccountDetailsOpen(!isAccountDetailsOpen)}
          className="w-full bg-white rounded-xl shadow-lg p-4 mb-4 flex items-center justify-between hover:bg-purple-50 transition-colors"
        >
          <span className="text-lg font-semibold text-gray-800" style={{ textAlign }}>
            {t('accountDetails')}
          </span>
          {isAccountDetailsOpen ? (
            <ChevronUp className="text-purple-600" size={20} />
          ) : (
            <ChevronDown className="text-purple-600" size={20} />
          )}
        </button>

        {/* Patients Button */}
        <button
          onClick={handlePatientsClick}
          className="w-full bg-white rounded-xl shadow-lg p-4 mb-6 flex items-center justify-between hover:bg-purple-50 transition-colors"
        >
          <span className="text-lg font-semibold text-gray-800" style={{ textAlign }}>
            {t('patients')}
          </span>
          <ArrowIcon className="text-purple-600" size={20} />
        </button>

        {/* Collapsible Account Details Form */}
        {isAccountDetailsOpen && (
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 mb-6">
            {/* First Name */}
            <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" style={{ textAlign }}>
              {t('firstName')}
            </label>
            <div className="relative">
              <User className="absolute top-3 w-4 h-4 text-gray-400" style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
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
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full h-10 rounded-md border border-purple-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10'}`}
                placeholder={t('lastNamePlaceholder')}
              />
            </div>
          </div>



          {/* Phone Number (Read Only) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" style={{ textAlign }}>
              {t('phone')}
            </label>
            <div className="relative">
              <Phone className="absolute top-3 w-4 h-4 text-gray-400" style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
              <input
                type="tel"
                value={userProfile?.phone || ''}
                readOnly
                className={`w-full h-10 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10'}`}
                placeholder={t('phonePlaceholder')}
              />
            </div>
          </div>

          {/* Reset Password Button */}
          <button 
            onClick={() => setShowPasswordDialog(true)}
            className="w-full border border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 flex items-center justify-center gap-2 py-3 rounded-md transition-colors"
          >
            <Lock size={16} />
            {t('resetPassword')}
          </button>

          {/* Save Button */}
          <button 
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-3 rounded-md transition-colors"
          >
            {updateProfileMutation.isPending ? t('loading') : t('saveProfile')}
          </button>
          </div>
        )}

      </div>

      {/* Password Reset Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir={direction}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800" style={{ textAlign }}>
              {t('changePassword')}
            </h3>

            {/* Current Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" style={{ textAlign }}>
                {t('currentPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute top-3 w-4 h-4 text-gray-400" style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full h-10 rounded-md border border-purple-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10'}`}
                  placeholder={t('currentPassword')}
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" style={{ textAlign }}>
                {t('newPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute top-3 w-4 h-4 text-gray-400" style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full h-10 rounded-md border border-purple-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10'}`}
                  placeholder={t('newPassword')}
                />
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" style={{ textAlign }}>
                {t('confirmNewPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute top-3 w-4 h-4 text-gray-400" style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full h-10 rounded-md border border-purple-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10'}`}
                  placeholder={t('confirmNewPassword')}
                />
              </div>
            </div>

            {/* Dialog Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowPasswordDialog(false)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 rounded-md transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetPasswordMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2 rounded-md transition-colors"
              >
                {resetPasswordMutation.isPending ? t('loading') : t('changePassword')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add padding for fixed footer */}
      <div className="pb-20"></div>
      
      {/* Fixed Footer */}
      <FixedFooter />
    </div>
  );
}