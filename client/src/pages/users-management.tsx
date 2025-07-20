import { useState } from 'react';
import { useLocation } from 'wouter';
import { User, UserPlus, Upload, Mail, Phone, Lock, Shield, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import { AdministrationSidebar } from '@/components/administration-sidebar';

interface NewUserData {
  firstName: string;
  lastName: string;
  tel: string;
  email: string;
  password: string;
  rePassword: string;
  profilePicture: File | null;
  authorization: string;
}

export default function UsersManagement() {
  const [, setLocation] = useLocation();
  const { t, language } = useTranslation();
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState<NewUserData>({
    firstName: '',
    lastName: '',
    tel: '',
    email: '',
    password: '',
    rePassword: '',
    profilePicture: null,
    authorization: ''
  });

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    setLocation('/admin-login');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewUser(prev => ({ ...prev, profilePicture: file }));
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('New user data:', newUser);
    setShowAddUserModal(false);
    setNewUser({
      firstName: '',
      lastName: '',
      tel: '',
      email: '',
      password: '',
      rePassword: '',
      profilePicture: null,
      authorization: ''
    });
  };

  const getTextAlign = (lang: string) => {
    return lang === 'ar' ? 'right' : 'left';
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <AdministrationSidebar currentPath="/Administration/Users-Management" />

      {/* Main Content Area */}
      <div className="ml-64" style={{ marginLeft: language === 'ar' ? '0' : '16rem', marginRight: language === 'ar' ? '16rem' : '0' }}>
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  {language === 'ar' ? 'إدارة المستخدمين' : 'Users Management'}
                </h1>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                {language === 'ar' ? 'تسجيل خروج' : 'Logout'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="h-6 w-6 text-purple-600 ml-2" />
                  <h2 className="text-lg font-medium text-gray-900">
                    {language === 'ar' ? 'قائمة المستخدمين' : 'Users List'}
                  </h2>
                </div>
                
                <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
                  <DialogTrigger asChild>
                    <Button className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md">
                      <UserPlus className="h-4 w-4 ml-2" />
                      {language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle style={{ textAlign: getTextAlign(language) }}>
                        {language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleSaveUser} className="space-y-4">
                      {/* First Name */}
                      <div>
                        <Label htmlFor="firstName" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' ? 'الاسم الأول' : 'First Name'}
                        </Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={newUser.firstName}
                          onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                          className="mt-1"
                          style={{ textAlign: getTextAlign(language) }}
                          required
                        />
                      </div>

                      {/* Last Name */}
                      <div>
                        <Label htmlFor="lastName" style={{ textAlign: getTextAlign(language) }}>
                          {language === 'ar' ? 'الاسم الأخير' : 'Last Name'}
                        </Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={newUser.lastName}
                          onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                          className="mt-1"
                          style={{ textAlign: getTextAlign(language) }}
                          required
                        />
                      </div>

                      {/* TEL */}
                      <div>
                        <Label htmlFor="tel" style={{ textAlign: getTextAlign(language) }}>
                          <Phone className="h-4 w-4 inline ml-1" />
                          {language === 'ar' ? 'رقم الهاتف' : 'TEL'}
                        </Label>
                        <Input
                          id="tel"
                          type="tel"
                          value={newUser.tel}
                          onChange={(e) => setNewUser(prev => ({ ...prev, tel: e.target.value }))}
                          className="mt-1"
                          style={{ textAlign: getTextAlign(language) }}
                          placeholder="05xxxxxxxx"
                          required
                        />
                      </div>

                      {/* Profile Picture */}
                      <div>
                        <Label htmlFor="profilePic" style={{ textAlign: getTextAlign(language) }}>
                          <Camera className="h-4 w-4 inline ml-1" />
                          {language === 'ar' ? 'الصورة الشخصية' : 'Profile Picture'}
                        </Label>
                        <div className="mt-1 flex items-center space-x-4">
                          <Input
                            id="profilePic"
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Label
                            htmlFor="profilePic"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                          >
                            <Upload className="h-4 w-4 ml-2" />
                            {language === 'ar' ? 'اختر صورة' : 'Choose Image'}
                          </Label>
                          {newUser.profilePicture && (
                            <span className="text-sm text-green-600">
                              {newUser.profilePicture.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <Label htmlFor="email" style={{ textAlign: getTextAlign(language) }}>
                          <Mail className="h-4 w-4 inline ml-1" />
                          {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                          className="mt-1"
                          style={{ textAlign: getTextAlign(language) }}
                          required
                        />
                      </div>

                      {/* Password */}
                      <div>
                        <Label htmlFor="password" style={{ textAlign: getTextAlign(language) }}>
                          <Lock className="h-4 w-4 inline ml-1" />
                          {language === 'ar' ? 'كلمة المرور' : 'Password'}
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                          className="mt-1"
                          style={{ textAlign: getTextAlign(language) }}
                          required
                        />
                      </div>

                      {/* Re-Password */}
                      <div>
                        <Label htmlFor="rePassword" style={{ textAlign: getTextAlign(language) }}>
                          <Lock className="h-4 w-4 inline ml-1" />
                          {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                        </Label>
                        <Input
                          id="rePassword"
                          type="password"
                          value={newUser.rePassword}
                          onChange={(e) => setNewUser(prev => ({ ...prev, rePassword: e.target.value }))}
                          className="mt-1"
                          style={{ textAlign: getTextAlign(language) }}
                          required
                        />
                      </div>

                      {/* Authorization */}
                      <div>
                        <Label htmlFor="authorization" style={{ textAlign: getTextAlign(language) }}>
                          <Shield className="h-4 w-4 inline ml-1" />
                          {language === 'ar' ? 'التفويض' : 'Authorization'}
                        </Label>
                        <Input
                          id="authorization"
                          type="text"
                          value={newUser.authorization}
                          onChange={(e) => setNewUser(prev => ({ ...prev, authorization: e.target.value }))}
                          className="mt-1"
                          style={{ textAlign: getTextAlign(language) }}
                          placeholder={language === 'ar' ? 'سيتم تطويره لاحقاً' : 'To be developed later'}
                          disabled
                        />
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4">
                        <Button
                          type="submit"
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                        >
                          {language === 'ar' ? 'حفظ' : 'Save'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Users List */}
            <div className="px-6 py-8">
              <div className="text-center">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {language === 'ar' ? 'لا توجد مستخدمين حالياً' : 'No users found'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {language === 'ar' ? 'استخدم زر "إضافة مستخدم جديد" لإضافة المستخدمين' : 'Use "Add New User" button to add users'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}