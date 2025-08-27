import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { LoginIllustration } from "@/components/login/LoginIllustration";

interface AdminLoginData {
  username: string;
  password: string;
}

interface AdminAuthResponse {
  token: string;
  admin: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
}

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useTranslation();

  // Clear any existing tokens when accessing admin login
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (data: AdminLoginData) => {
      const response = await apiRequest("/api/admin/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response as AdminAuthResponse;
    },
    onSuccess: (data) => {
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));
      toast({
        title: t('loginSuccessful'),
        description: t('welcomeToAdmin'),
      });
      setLocation("/admin-dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: t('loginError'),
        description: t('invalidCredentials'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: t('error'),
        description: t('enterUsernamePassword'),
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ username, password });
  };

  return (
    <div 
      className="min-h-screen grid md:grid-cols-2 items-center gap-8 p-6 md:p-10 bg-gray-50"
      dir={getDirection(language)}
    >
      {/* Left Side - Illustration */}
      <div className="hidden md:flex items-center justify-center">
        <LoginIllustration />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-col justify-center">
        <div className="mx-auto w-full max-w-md">
          <div className="flex justify-center mb-6">
            <LanguageSelector />
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-center text-3xl font-extrabold text-gray-900">
                {t('adminLogin')}
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                {language === 'ar' ? 'مرحباً بك في لوحة التحكم' : 'Welcome to the admin dashboard'}
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('username')}
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm transition-colors"
                  placeholder={t('username')}
                  style={{ textAlign: getTextAlign(language) }}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm transition-colors"
                  placeholder={t('password')}
                  style={{ textAlign: getTextAlign(language) }}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 disabled:opacity-50 transition-colors"
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    t('login')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}