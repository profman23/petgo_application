import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DoctorFooter } from '@/components/doctor-footer';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, User, Lock, Phone, Mail, Building, Save } from 'lucide-react';
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";

export default function DoctorAccount() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const t = useTranslation();
  const { language } = useLanguage();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);

  // Get current doctor info
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Form states
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    email: user.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string; email: string }) => {
      return await apiRequest('/api/doctor/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      // Update local storage
      const updatedUser = { ...user, ...data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast({
        title: language === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile Updated',
        description: language === 'ar' ? 'تم حفظ بياناتك بنجاح' : 'Your profile has been saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return await apiRequest('/api/doctor/change-password', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم تغيير كلمة المرور' : 'Password Changed',
        description: language === 'ar' ? 'تم تحديث كلمة المرور بنجاح' : 'Your password has been updated successfully',
      });
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast({
      title: language === 'ar' ? 'تم تسجيل الخروج' : 'Logged Out',
      description: language === 'ar' ? 'تم تسجيل خروجك بنجاح' : 'You have been logged out successfully',
    });
    setLocation('/');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { name, phone, email } = formData;
    if (!name.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى إدخال الاسم' : 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    updateProfileMutation.mutate({ name, phone, email });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { currentPassword, newPassword, confirmPassword } = formData;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى ملء جميع حقول كلمة المرور' : 'Please fill all password fields',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'كلمة المرور الجديدة غير متطابقة' : 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  if (!localStorage.getItem('token') || user.membershipType !== 'doctor') {
    setLocation('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir={direction}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/user-type-selection')}
            className="flex items-center gap-2"
            style={{ display: 'none' }}
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="Vets Van" 
              className="h-8 object-contain"
            />
            <h1 className="text-lg font-semibold" style={{ textAlign }}>
              {language === 'ar' ? 'الحساب' : 'Account'}
            </h1>
          </div>
          <div className="w-16" /> {/* Spacer for center alignment */}
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ textAlign }}>
              <User className="w-5 h-5 text-purple-600" />
              {language === 'ar' ? 'الملف الشخصي' : 'Profile Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" style={{ textAlign }}>
                  {language === 'ar' ? 'الاسم' : 'Name'} *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" style={{ textAlign }}>
                  {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" style={{ textAlign }}>
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-600"
                disabled={updateProfileMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending 
                  ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                  : (language === 'ar' ? 'حفظ البيانات' : 'Save Profile')
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ textAlign }}>
              <Lock className="w-5 h-5 text-purple-600" />
              {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" style={{ textAlign }}>
                  {language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'} *
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder={language === 'ar' ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" style={{ textAlign }}>
                  {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'} *
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder={language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" style={{ textAlign }}>
                  {language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'} *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور الجديدة' : 'Re-enter new password'}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-600"
                disabled={changePasswordMutation.isPending}
              >
                <Lock className="w-4 h-4 mr-2" />
                {changePasswordMutation.isPending 
                  ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...') 
                  : (language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password')
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ textAlign }}>
              <Building className="w-5 h-5 text-purple-600" />
              {language === 'ar' ? 'معلومات الحساب' : 'Account Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600" style={{ textAlign }}>
                  {language === 'ar' ? 'نوع الحساب:' : 'Account Type:'}
                </span>
                <p className="text-gray-900" style={{ textAlign }}>
                  {language === 'ar' ? 'طبيب بيطري' : 'Veterinarian'}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600" style={{ textAlign }}>
                  {language === 'ar' ? 'اسم المستخدم:' : 'Username:'}
                </span>
                <p className="text-gray-900" style={{ textAlign }}>
                  {user.username}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Card>
          <CardContent className="p-4">
            <Button 
              onClick={handleLogout}
              variant="destructive" 
              className="w-full"
              style={{ display: 'none' }}
            >
              {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <DoctorFooter />
    </div>
  );
}