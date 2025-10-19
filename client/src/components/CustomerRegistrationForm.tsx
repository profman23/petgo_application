import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { createRegisterSchema } from '@shared/schema';
import { ArrowLeft, RefreshCw, Mail, Phone, Lock, Camera, Cat, Dog, Bird, Calendar } from 'lucide-react';
import { useTranslation, getTextAlign, getDirection } from '@/lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CustomerRegistrationFormProps {
  sendOTP?: boolean; // Whether to send OTP email verification
  onSuccess?: (data: any) => void; // Callback after successful registration
  onCancel?: () => void; // Callback for cancel/back button
  showBackButton?: boolean; // Whether to show back button
  includePetFields?: boolean; // Whether to include pet registration fields
}

const animalIcons = {
  Cat: Cat,
  Dog: Dog,
  Bird: Bird,
};

export function CustomerRegistrationForm({
  sendOTP = true,
  onSuccess,
  onCancel,
  showBackButton = true,
  includePetFields = false,
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
  
  // Pet form state (only used when includePetFields is true)
  const [petData, setPetData] = useState({
    name: '',
    type: '' as 'Cat' | 'Dog' | 'Bird' | '',
    patientWeight: '',
    ageYear: '',
    ageMonth: '',
    ageDay: '',
    photo: '',
    birthdate: '',
  });
  
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
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
      
      // If includePetFields is true, validate pet data
      if (includePetFields) {
        if (!petData.name || !petData.type || !petData.patientWeight) {
          throw new Error(language === 'ar' ? 'يرجى ملء جميع حقول الأليف المطلوبة' : 'Please fill all required pet fields');
        }
      }
      
      // Add language, skipOTP flag, and pet data
      const dataWithLanguage = {
        ...validatedData,
        preferredLanguage: language,
        skipOTP: !sendOTP, // If sendOTP is false, we skip OTP verification
        ...(includePetFields && { petData }), // Include pet data if flag is set
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
        
        // Reset pet data if included
        if (includePetFields) {
          setPetData({
            name: '',
            type: '',
            patientWeight: '',
            ageYear: '',
            ageMonth: '',
            ageDay: '',
            photo: '',
            birthdate: '',
          });
          setSelectedPhoto(null);
        }
        
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
  
  const updatePetData = (field: string, value: string) => {
    setPetData(prev => ({ ...prev, [field]: value }));
  };
  
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedPhoto(result);
        setPetData(prev => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Check if pet fields are valid when includePetFields is true
  const isPetDataValid = !includePetFields || (
    petData.name.trim() !== '' &&
    petData.type !== '' &&
    petData.patientWeight.trim() !== '' &&
    parseFloat(petData.patientWeight) > 0
  );
  
  const isRTL = getDirection(language) === 'rtl';

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

      {/* Pet Information Section - Only shown when includePetFields is true */}
      {includePetFields && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-300 space-y-6">
          <h3 className="text-center text-lg font-semibold text-purple-800 mb-4" style={{ 
            textAlign: getTextAlign(language),
            fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
          }}>
            {language === 'ar' ? 'معلومات الأليف' : 'Pet Information'} *
          </h3>
          
          {/* Pet Name */}
          <div className="space-y-2">
            <Label htmlFor="pet-name" className="text-sm font-medium text-gray-700" style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {language === 'ar' ? 'اسم الأليف' : 'Pet Name'} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pet-name"
              value={petData.name}
              onChange={(e) => updatePetData('name', e.target.value)}
              className={`border-2 border-purple-600 focus:border-purple-600 rounded-lg ${language === 'ar' ? 'text-right' : 'text-left'}`}
              placeholder={language === 'ar' ? 'أدخل اسم الأليف' : 'Enter pet name'}
              data-testid="input-pet-name"
            />
          </div>

          {/* Pet Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700" style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {language === 'ar' ? 'نوع الأليف' : 'Pet Type'} <span className="text-red-500">*</span>
            </Label>
            <Select
              onValueChange={(value) => updatePetData('type', value)}
              value={petData.type}
            >
              <SelectTrigger className="border-2 border-purple-600 focus:border-purple-600 rounded-lg" data-testid="select-pet-type">
                <SelectValue placeholder={language === 'ar' ? 'اختر نوع الأليف' : 'Select pet type'} />
              </SelectTrigger>
              <SelectContent>
                {(['Cat', 'Dog', 'Bird'] as const).map((type) => {
                  const IconComponent = animalIcons[type];
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-purple-600" />
                        <span>{language === 'ar' ? (type === 'Cat' ? 'قطة' : type === 'Dog' ? 'كلب' : 'طير') : type}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Pet Weight */}
          <div className="space-y-2">
            <Label htmlFor="pet-weight" className="text-sm font-medium text-gray-700" style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {language === 'ar' ? 'وزن الأليف' : 'Pet Weight'} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="pet-weight"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={petData.patientWeight}
                onChange={(e) => updatePetData('patientWeight', e.target.value)}
                className={`border-2 border-purple-600 focus:border-purple-600 rounded-lg pr-12 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                placeholder={language === 'ar' ? 'أدخل الوزن (مثل: 5.3)' : 'Enter weight (e.g., 5.3)'}
                data-testid="input-pet-weight"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-sm text-gray-500 font-medium">kg</span>
              </div>
            </div>
          </div>

          {/* Pet Age */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700" style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {language === 'ar' ? 'عمر الأليف' : 'Pet Age'} <span className="text-gray-400 text-xs">(Optional)</span>
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="pet-age-year" className="text-xs text-gray-500">
                  {language === 'ar' ? 'سنة' : 'Year'}
                </Label>
                <Input
                  id="pet-age-year"
                  type="number"
                  min="0"
                  max="50"
                  value={petData.ageYear}
                  onChange={(e) => updatePetData('ageYear', e.target.value)}
                  className="border rounded-lg"
                  placeholder="0"
                  data-testid="input-pet-age-year"
                />
              </div>
              <div>
                <Label htmlFor="pet-age-month" className="text-xs text-gray-500">
                  {language === 'ar' ? 'شهر' : 'Month'}
                </Label>
                <Input
                  id="pet-age-month"
                  type="number"
                  min="0"
                  max="11"
                  value={petData.ageMonth}
                  onChange={(e) => updatePetData('ageMonth', e.target.value)}
                  className="border rounded-lg"
                  placeholder="0"
                  data-testid="input-pet-age-month"
                />
              </div>
              <div>
                <Label htmlFor="pet-age-day" className="text-xs text-gray-500">
                  {language === 'ar' ? 'يوم' : 'Day'}
                </Label>
                <Input
                  id="pet-age-day"
                  type="number"
                  min="0"
                  max="30"
                  value={petData.ageDay}
                  onChange={(e) => updatePetData('ageDay', e.target.value)}
                  className="border rounded-lg"
                  placeholder="0"
                  data-testid="input-pet-age-day"
                />
              </div>
            </div>
          </div>

          {/* Birthdate */}
          <div className="space-y-2">
            <Label htmlFor="pet-birthdate" className="text-sm font-medium text-gray-700" style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {language === 'ar' ? 'تاريخ الميلاد' : 'Birthdate'} <span className="text-gray-400 text-xs">(Optional)</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute top-3 w-4 h-4 text-gray-400" style={{ [isRTL ? 'right' : 'left']: '12px' }} />
              <Input
                id="pet-birthdate"
                type="date"
                value={petData.birthdate}
                onChange={(e) => updatePetData('birthdate', e.target.value)}
                className={`border-2 border-purple-600 focus:border-purple-600 rounded-lg ${isRTL ? 'pr-10 text-right' : 'pl-10'}`}
                data-testid="input-pet-birthdate"
              />
            </div>
          </div>

          {/* Pet Photo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700" style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {language === 'ar' ? 'صورة الأليف' : 'Pet Photo'} <span className="text-gray-400 text-xs">(Optional)</span>
            </Label>
            <div className="flex flex-col items-center gap-4">
              {selectedPhoto ? (
                <div className="relative">
                  <img
                    src={selectedPhoto}
                    alt="Pet"
                    className="w-32 h-32 object-cover rounded-full border-2 border-gray-200"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="absolute -bottom-2 -right-2 bg-purple-600 hover:bg-purple-600 rounded-full p-2"
                    onClick={() => document.getElementById('pet-photo-upload')?.click()}
                    data-testid="button-change-pet-photo"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
                  onClick={() => document.getElementById('pet-photo-upload')?.click()}
                  data-testid="button-upload-pet-photo"
                >
                  <div className="text-center">
                    <Camera className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-purple-600">{language === 'ar' ? 'تحميل صورة' : 'Upload Photo'}</p>
                  </div>
                </div>
              )}
              <input
                id="pet-photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

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
        disabled={registerMutation.isPending || !isPetDataValid}
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
