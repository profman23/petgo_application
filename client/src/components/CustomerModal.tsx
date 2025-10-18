import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslation, getDirection } from '@/lib/i18n';
import { User, Mail, Phone, Lock } from 'lucide-react';

interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CustomerModal({ open, onClose, onSuccess }: CustomerModalProps) {
  const { toast } = useToast();
  const { language } = useTranslation();
  const direction = getDirection(language);
  const textAlign = direction === 'rtl' ? 'right' : 'left';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'الاسم الأول مطلوب' : 'First name is required',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.lastName.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'اسم العائلة مطلوب' : 'Last name is required',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email address is required',
        variant: 'destructive',
      });
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address',
        variant: 'destructive',
      });
      return false;
    }

    // Phone is optional, no validation needed

    if (!formData.password || formData.password.length < 6) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        throw new Error('Admin authentication required');
      }
      
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create customer');
      }

      toast({
        title: language === 'ar' ? 'تم بنجاح' : 'Success',
        description: language === 'ar' 
          ? 'تم إنشاء العميل بنجاح وإرسال بيانات الدخول عبر البريد الإلكتروني'
          : 'Customer created successfully and credentials sent via email',
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: ''
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating customer:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' 
          ? 'فشل في إنشاء العميل'
          : 'Failed to create customer'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle style={{ textAlign, fontFamily: 'Arimo' }}>
            {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div>
            <label 
              htmlFor="firstName" 
              className="block text-sm font-medium mb-2" 
              style={{ textAlign, fontFamily: 'Arimo' }}
            >
              {language === 'ar' ? 'الاسم الأول' : 'First Name'} *
            </label>
            <div className="relative">
              <Input
                id="firstName"
                type="text"
                placeholder={language === 'ar' ? 'أدخل الاسم الأول' : 'Enter first name'}
                className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
                data-testid="input-first-name"
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label 
              htmlFor="lastName" 
              className="block text-sm font-medium mb-2" 
              style={{ textAlign, fontFamily: 'Arimo' }}
            >
              {language === 'ar' ? 'اسم العائلة' : 'Last Name'} *
            </label>
            <div className="relative">
              <Input
                id="lastName"
                type="text"
                placeholder={language === 'ar' ? 'أدخل اسم العائلة' : 'Enter last name'}
                className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
                data-testid="input-last-name"
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium mb-2" 
              style={{ textAlign, fontFamily: 'Arimo' }}
            >
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
            </label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
                className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                data-testid="input-email"
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label 
              htmlFor="phone" 
              className="block text-sm font-medium mb-2" 
              style={{ textAlign, fontFamily: 'Arimo' }}
            >
              {language === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone Number (Optional)'}
            </label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                data-testid="input-phone"
              />
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium mb-2" 
              style={{ textAlign, fontFamily: 'Arimo' }}
            >
              {language === 'ar' ? 'كلمة المرور' : 'Password'} *
            </label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                placeholder={language === 'ar' ? 'أدخل كلمة المرور (6 أحرف على الأقل)' : 'Enter password (minimum 6 characters)'}
                className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                minLength={6}
                data-testid="input-password"
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
              data-testid="button-cancel"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              data-testid="button-save"
            >
              {isSubmitting 
                ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                : (language === 'ar' ? 'حفظ' : 'Save')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
