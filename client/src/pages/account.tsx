import { useState, useRef } from 'react';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, ArrowRight, Camera, User, Phone, Lock } from 'lucide-react';
import { useLocation } from 'wouter';
import logoPath from '@assets/10773561_1751295833176.png';

export default function Account() {
  const { t, language } = useTranslation();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  const [, setLocation] = useLocation();
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleBack = () => {
    setLocation('/');
  };

  const handleResetPassword = () => {
    // TODO: Implement password reset functionality
    console.log('Reset password clicked');
  };

  const handleSaveProfile = () => {
    // TODO: Implement save profile functionality
    console.log('Save profile:', { firstName, lastName, phoneNumber, profileImage });
  };

  const ArrowIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white" dir={direction}>
      {/* Header with Logo and Back Button */}
      <div className="bg-white shadow-sm border-b border-purple-100 p-2">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            <ArrowIcon size={16} />
            <span className="text-sm font-medium">{t('back')}</span>
          </Button>
          
          <img 
            src={logoPath} 
            alt="VETS VAN Logo" 
            className="h-6 w-auto"
          />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* User Header Section */}
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4" style={{ flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }}>
              {/* Profile Picture */}
              <div className="relative">
                <Avatar className="w-20 h-20 border-4 border-purple-200">
                  <AvatarImage src={profileImage || undefined} alt="Profile" />
                  <AvatarFallback className="bg-purple-100 text-purple-600 text-xl font-bold">
                    <User size={32} />
                  </AvatarFallback>
                </Avatar>
                
                {/* Camera Button */}
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 bg-purple-600 hover:bg-purple-700 text-white border-2 border-white"
                  onClick={triggerFileInput}
                >
                  <Camera size={14} />
                </Button>
                
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* User Name */}
              <div className="flex-1" style={{ textAlign }}>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                  {firstName && lastName ? `${firstName} ${lastName}` : t('accountTitle')}
                </h1>
                <p className="text-sm text-gray-600">{t('accountSubtitle')}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Divider Line */}
        <div className="border-t border-purple-200"></div>

        {/* Account Details Form */}
        <Card className="border-purple-200 shadow-lg">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4" style={{ textAlign }}>
              {t('accountDetails')}
            </h2>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700" style={{ textAlign }}>
                {t('firstName')}
              </Label>
              <div className="relative">
                <User className="absolute top-3 w-4 h-4 text-gray-400" style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`border-purple-200 focus:border-purple-400 focus:ring-purple-400 ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10'}`}
                  placeholder={t('firstNamePlaceholder')}
                />
              </div>
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700" style={{ textAlign }}>
                {t('lastName')}
              </Label>
              <div className="relative">
                <User className="absolute top-3 w-4 h-4 text-gray-400" style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`border-purple-200 focus:border-purple-400 focus:ring-purple-400 ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10'}`}
                  placeholder={t('lastNamePlaceholder')}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700" style={{ textAlign }}>
                {t('phone')}
              </Label>
              <div className="relative">
                <Phone className="absolute top-3 w-4 h-4 text-gray-400" style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`border-purple-200 focus:border-purple-400 focus:ring-purple-400 ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10'}`}
                  placeholder={t('phonePlaceholder')}
                />
              </div>
            </div>

            {/* Reset Password Button */}
            <Button
              onClick={handleResetPassword}
              variant="outline"
              className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              {t('resetPassword')}
            </Button>

            {/* Save Button */}
            <Button
              onClick={handleSaveProfile}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3"
            >
              {t('saveProfile')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}