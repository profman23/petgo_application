import { useState, useRef, useEffect } from 'react';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { ArrowLeft, ArrowRight, Camera, User, Phone, Lock, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { FixedFooter } from '@/components/fixed-footer';
import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';

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
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('/api/user/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Handle photo upload logic here
      console.log('Photo upload:', file);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      firstName,
      lastName,
    });
  };

  const handleResetPassword = () => {
    if (newPassword !== confirmPassword) {
      return;
    }
    
    resetPasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleBack = () => {
    setLocation('/home');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/login');
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
    <div className="min-h-screen bg-gray-50 border-2 border-gray-400 rounded-lg m-2" dir={direction}>
      <div className="max-w-md mx-auto bg-white shadow-sm rounded-lg overflow-hidden">
        {/* Header - Exact same design as home.tsx */}
        <div className="bg-white text-gray-800 px-3 py-2 h-10 border-b shadow-sm">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-2">
              <div className="h-8 bg-white rounded-lg border-2 border-purple-300 px-2 py-1 shadow-sm hover:shadow-md transition-all duration-300">
                <img 
                  src={logoImage} 
                  alt="VETS VAN Logo" 
                  className="h-full w-auto object-contain"
                  style={{ 
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    maxWidth: '120px'
                  }}
                />
              </div>
              <div className="text-lg font-bold text-gray-800">
                {language === 'ar' ? 'حسابي' : 'My Account'}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <LanguageSelector />
              <Bell className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-800" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:bg-purple-700 px-2 py-1 h-8"
              >
                {language === 'ar' ? 'خروج' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-20">
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
                  {userProfile?.name || (language === 'ar' ? 'حسابي' : 'My Account')}
                </h1>
                <p className="text-sm text-gray-600">
                  {language === 'ar' ? 'إدارة ملفك الشخصي' : 'Manage your profile'}
                </p>
              </div>
            </div>
          </div>

          {/* Account Details Toggle Button */}
          <button
            onClick={() => setIsAccountDetailsOpen(!isAccountDetailsOpen)}
            className="w-full bg-white rounded-xl shadow-lg p-4 mb-4 flex items-center justify-between hover:bg-purple-50 transition-colors"
          >
            <span className="text-lg font-semibold text-gray-800" style={{ textAlign }}>
              {language === 'ar' ? 'تفاصيل الحساب' : 'Account Details'}
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
              {language === 'ar' ? 'الحيوانات الأليفة' : 'Pets'}
            </span>
            <ArrowIcon className="text-purple-600" size={20} />
          </button>

          {/* Account Details Form - Only visible when toggled */}
          {isAccountDetailsOpen && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4" style={{ textAlign }}>
                {language === 'ar' ? 'تفاصيل الحساب' : 'Account Details'}
              </h2>
              
              {/* First Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ textAlign }}>
                  {language === 'ar' ? 'الاسم الأول' : 'First Name'}
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder={language === 'ar' ? 'أدخل الاسم الأول' : 'Enter first name'}
                />
              </div>

              {/* Last Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ textAlign }}>
                  {language === 'ar' ? 'الاسم الأخير' : 'Last Name'}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder={language === 'ar' ? 'أدخل الاسم الأخير' : 'Enter last name'}
                />
              </div>

              {/* Phone (Read-only) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ textAlign }}>
                  {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                </label>
                <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg flex items-center gap-2">
                  <Phone size={18} className="text-gray-500" />
                  <span className="text-gray-700">{userProfile?.phone || ''}</span>
                </div>
              </div>

              {/* Save Profile Button */}
              <button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium mb-4 disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ' : 'Save')}
              </button>

              {/* Change Password Button */}
              <button
                onClick={() => setShowPasswordDialog(true)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Lock size={18} />
                {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
              </button>
            </div>
          )}

          {/* Password Reset Dialog */}
          {showPasswordDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4" style={{ textAlign }}>
                  {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                </h3>
                
                {/* Current Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ textAlign }}>
                    {language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder={language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                  />
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ textAlign }}>
                    {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder={language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                  />
                </div>

                {/* Confirm New Password */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ textAlign }}>
                    {language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    placeholder={language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                  />
                </div>

                {/* Dialog Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPasswordDialog(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetPasswordMutation.isPending}
                    className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {resetPasswordMutation.isPending ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...') : (language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Fixed Footer */}
        <FixedFooter />
      </div>
    </div>
  );
}