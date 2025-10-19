import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { createRegisterSchema } from '@shared/schema';
import { ArrowLeft, RefreshCw, Mail, Phone, Lock } from 'lucide-react';
import { useTranslation, getTextAlign } from '@/lib/i18n';

interface CustomerRegistrationFormProps {
  sendOTP?: boolean; // Whether to send OTP email verification
  onSuccess?: (data: any) => void; // Callback after successful registration
  onCancel?: () => void; // Callback for cancel/back button
  showBackButton?: boolean; // Whether to show back button
}

export function CustomerRegistrationForm({
  sendOTP = true,
  onSuccess,
  onCancel,
  showBackButton = true,
}: CustomerRegistrationFormProps) {
  const [captcha, setCaptcha] = useState({ question: '', answer: 0 });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    captcha: '',
  });
  
  const { toast } = useToast();
  const { t, language } = useTranslation();

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operation = Math.random() > 0.5 ? '+' : '-';
    
    let question, answer;
    if (operation === '+') {
      question = `${num1} + ${num2} = ؟`;
      answer = num1 + num2;
    } else {
      const larger = Math.max(num1, num2);
      const smaller = Math.min(num1, num2);
      question = `${larger} - ${smaller} = ؟`;
      answer = larger - smaller;
    }
    
    setCaptcha({ question, answer });
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      // Validate with dynamic schema
      const registerSchema = createRegisterSchema(language);
      const validatedData = registerSchema.parse(data);
      
      // Validate captcha first
      if (parseInt(validatedData.captcha) !== captcha.answer) {
        throw new Error(language === 'ar' ? 'رمز التحقق غير صحيح' : 'Invalid verification code');
      }
      
      // Add language and skipOTP flag
      const dataWithLanguage = {
        ...validatedData,
        preferredLanguage: language,
        skipOTP: !sendOTP, // If sendOTP is false, we skip OTP verification
      };
      
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(dataWithLanguage)
      });
      return response;
    },
    onSuccess: (data) => {
      if (sendOTP) {
        // Store email for OTP verification
        localStorage.setItem('otpEmail', formData.email);
        localStorage.setItem('otpUserName', formData.firstName);
        
        toast({
          title: language === 'ar' ? 'تم إرسال رمز التحقق' : 'Verification Code Sent',
          description: language === 'ar' ? 
            `تم إرسال رمز التحقق إلى ${formData.email}. يرجى التحقق من بريدك الإلكتروني.` :
            `Verification code sent to ${formData.email}. Please check your email.`,
          variant: "default",
        });
      } else {
        // Admin created account - no OTP needed
        toast({
          title: language === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account Created Successfully',
          description: language === 'ar' ? 
            `تم إنشاء حساب ${formData.firstName} بنجاح` :
            `Account for ${formData.firstName} created successfully`,
          variant: "default",
        });
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          captcha: '',
        });
        generateCaptcha();
      }
      
      // Call onSuccess callback
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleRegisterSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="first-name-input" className="block text-sm font-medium mb-3" style={{ textAlign: getTextAlign(language) }}>
            {language === 'ar' ? 'الاسم الأول' : 'First Name'} *
          </label>
          <Input
            id="first-name-input"
            type="text"
            placeholder={language === 'ar' ? 'أدخل الاسم الأول' : 'Enter first name'}
            className={`h-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            required
            data-testid="input-firstname"
          />
        </div>

        <div>
          <label htmlFor="last-name-input" className="block text-sm font-medium mb-3" style={{ textAlign: getTextAlign(language) }}>
            {language === 'ar' ? 'الاسم الأخير' : 'Last Name'} *
          </label>
          <Input
            id="last-name-input"
            type="text"
            placeholder={language === 'ar' ? 'أدخل الاسم الأخير' : 'Enter last name'}
            className={`h-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            required
            data-testid="input-lastname"
          />
        </div>
      </div>

      <div>
        <label htmlFor="reg-email-input" className="block text-sm font-medium mb-3" style={{ textAlign: getTextAlign(language) }}>
          {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
        </label>
        <div className="relative">
          <Input
            id="reg-email-input"
            type="email"
            placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter your email address'}
            className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
            value={formData.email || ''}
            onChange={(e) => updateFormData('email', e.target.value)}
            required
            data-testid="input-email"
          />
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>

      <div>
        <label htmlFor="reg-phone-input" className="block text-sm font-medium mb-3" style={{ textAlign: getTextAlign(language) }}>
          {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} {language === 'ar' ? '(اختياري)' : '(optional)'}
        </label>
        <div className="relative">
          <Input
            id="reg-phone-input"
            type="tel"
            placeholder={language === 'ar' ? 'أدخل رقم الهاتف (اختياري)' : 'Enter your phone number (optional)'}
            className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
            data-testid="input-phone"
          />
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>

      <div>
        <label htmlFor="reg-password-input" className="block text-sm font-medium mb-3" style={{ textAlign: getTextAlign(language) }}>
          {language === 'ar' ? 'كلمة المرور' : 'Password'} *
        </label>
        <div className="relative">
          <Input
            id="reg-password-input"
            type="password"
            placeholder={language === 'ar' ? 'أدخل كلمة المرور (6 أحرف على الأقل)' : 'Enter password (minimum 6 characters)'}
            className={`h-12 pr-4 pl-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
            value={formData.password}
            onChange={(e) => updateFormData('password', e.target.value)}
            required
            minLength={6}
            data-testid="input-password"
          />
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
        <h3 className="text-center text-lg font-semibold text-blue-800 mb-4" style={{ textAlign: getTextAlign(language) }}>
          {language === 'ar' ? 'التحقق الأمني' : 'Security Verification'} *
        </h3>
        <div className="flex justify-center mb-4">
          <div 
            id="captcha-question" 
            className="inline-block bg-white border-3 border-blue-300 px-6 py-3 rounded-xl text-2xl font-bold text-blue-900 shadow-lg"
            role="img"
            aria-label={language === 'ar' ? `سؤال الحماية: ${captcha.question}` : `Security question: ${captcha.question}`}
          >
            {captcha.question}
          </div>
        </div>
        <label htmlFor="captcha-input" className="block text-sm font-medium text-gray-700 mb-2 text-center" style={{ textAlign: getTextAlign(language) }}>
          {language === 'ar' ? 'الإجابة' : 'Answer'}
        </label>
        <Input
          id="captcha-input"
          type="number"
          placeholder={language === 'ar' ? 'أدخل الإجابة' : 'Enter your answer'}
          className="text-center text-xl mb-4 h-12 border-2 border-blue-300"
          value={formData.captcha}
          onChange={(e) => updateFormData('captcha', e.target.value)}
          required
          aria-label={language === 'ar' ? 'إجابة السؤال الأمني' : 'Security question answer'}
          aria-describedby="captcha-question"
          data-testid="input-captcha"
        />
        <div className="flex justify-center">
          <Button 
            type="button" 
            variant="outline" 
            size="lg" 
            onClick={generateCaptcha}
            className="flex items-center gap-3 border-2 border-blue-300 hover:bg-blue-100"
            data-testid="button-refresh-captcha"
          >
            <RefreshCw className="w-5 h-5" />
            {language === 'ar' ? 'تجديد السؤال' : 'Refresh Question'}
          </Button>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" 
        disabled={registerMutation.isPending}
        data-testid="button-submit-registration"
      >
        {registerMutation.isPending ? (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {language === 'ar' ? 'جاري إنشاء الحساب...' : 'Creating Account...'}
          </div>
        ) : (
          language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'
        )}
      </Button>

      {showBackButton && onCancel && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="w-full h-12 border-2 border-gray-300 hover:border-purple-600 hover:bg-purple-100 text-gray-700 hover:text-purple-600 font-medium rounded-xl transition-all duration-300"
          data-testid="button-cancel-registration"
        >
          <ArrowLeft className={`w-5 h-5 ${language === 'ar' ? 'ml-3 rotate-180' : 'mr-3'}`} />
          {language === 'ar' ? 'العودة إلى تسجيل الدخول' : 'Back to Login'}
        </Button>
      )}
    </form>
  );
}
