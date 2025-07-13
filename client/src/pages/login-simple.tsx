import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Eye, EyeOff, Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const translations = {
  en: {
    title: "Customer Login",
    subtitle: "Enter your credentials to access your account",
    emailPhone: "Email or Phone",
    password: "Password",
    login: "Login",
    loginSuccess: "Login Successful",
    welcome: "Welcome back!",
    loginError: "Login Failed",
    loginErrorDesc: "Please check your credentials and try again"
  },
  ar: {
    title: "تسجيل دخول العميل",
    subtitle: "أدخل بياناتك للوصول إلى حسابك",
    emailPhone: "البريد الإلكتروني أو الهاتف",
    password: "كلمة المرور",
    login: "تسجيل الدخول",
    loginSuccess: "تم تسجيل الدخول بنجاح",
    welcome: "مرحباً بعودتك!",
    loginError: "فشل تسجيل الدخول",
    loginErrorDesc: "يرجى التحقق من بياناتك والمحاولة مرة أخرى"
  }
};

export default function LoginSimple() {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('🔐 Attempting login with:', { identifier: identifier.substring(0, 5) + '...' });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password })
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      console.log('✅ Login successful:', data.token.substring(0, 10) + '...');
      
      // Clear and set auth data
      localStorage.clear();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Show success
      toast({
        title: t.loginSuccess,
        description: t.welcome,
        variant: "default",
      });
      
      // Direct redirect - no delays, no complications
      console.log('🚀 Redirecting to home...');
      window.location.replace('/home');
      
    } catch (error) {
      console.error('❌ Login error:', error);
      toast({
        title: t.loginError,
        description: t.loginErrorDesc,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className={cn(
            "text-2xl font-bold text-center",
            language === 'ar' ? 'text-right' : 'text-left'
          )}>
            {t.title}
          </CardTitle>
          <CardDescription className={cn(
            "text-center",
            language === 'ar' ? 'text-right' : 'text-left'
          )}>
            {t.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className={cn(
                language === 'ar' ? 'text-right block' : 'text-left'
              )}>
                {t.emailPhone}
              </Label>
              <div className="relative">
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className={cn(
                    "pl-10",
                    language === 'ar' ? 'text-right pr-10 pl-3' : 'text-left'
                  )}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
                {identifier.includes('@') ? (
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                ) : (
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className={cn(
                language === 'ar' ? 'text-right block' : 'text-left'
              )}>
                {t.password}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={cn(
                    "pl-10 pr-10",
                    language === 'ar' ? 'text-right' : 'text-left'
                  )}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? 'جاري التحميل...' : t.login}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}