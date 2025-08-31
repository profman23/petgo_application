import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, PhoneCall, Brain } from "lucide-react";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";

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
      // Clear any existing tokens and cache before setting new ones
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin");
      
      // Clear all React Query cache to prevent stale permissions
      queryClient.clear();
      
      // Set new admin tokens
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));
      
      toast({
        title: t('loginSuccessful'),
        description: t('welcomeToAdmin'),
      });
      setLocation("/my-profile");
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
      className="min-h-screen bg-gray-50"
      dir={getDirection(language)}
    >
      <div className="min-h-screen flex">
        {/* Left side - Animated Statistics */}
        <div className="hidden lg:block lg:w-1/2 bg-gray-50 relative overflow-hidden">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 space-y-8">
            
            {/* Animated Circular Statistics */}
            <div className="grid grid-cols-2 gap-8 w-full max-w-md">
              {/* Active Users Circle */}
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-300"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset="75.36"
                    className="text-purple-600 transition-all duration-1000 ease-in-out"
                    style={{ 
                      color: '#852085',
                      animation: 'dash 3s ease-in-out infinite alternate'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800 animate-pulse">72%</div>
                    <div className="text-xs text-gray-600">Active</div>
                  </div>
                </div>
              </div>

              {/* Bookings Circle */}
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-300"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset="50.24"
                    className="text-purple-600 transition-all duration-1000 ease-in-out"
                    style={{ 
                      color: '#852085',
                      animation: 'dash2 2.5s ease-in-out infinite alternate'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800 animate-pulse">85%</div>
                    <div className="text-xs text-gray-600">Booked</div>
                  </div>
                </div>
              </div>

              {/* Revenue Circle */}
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-300"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset="125.6"
                    className="text-purple-600 transition-all duration-1000 ease-in-out"
                    style={{ 
                      color: '#852085',
                      animation: 'dash3 4s ease-in-out infinite alternate'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800 animate-pulse">58%</div>
                    <div className="text-xs text-gray-600">Revenue</div>
                  </div>
                </div>
              </div>

              {/* Satisfaction Circle */}
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-300"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset="25.12"
                    className="text-purple-600 transition-all duration-1000 ease-in-out"
                    style={{ 
                      color: '#852085',
                      animation: 'dash4 3.5s ease-in-out infinite alternate'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800 animate-pulse">94%</div>
                    <div className="text-xs text-gray-600">Happy</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Animated Icons Row */}
            <div className="flex justify-center items-center space-x-8 my-6">
              {/* PhoneCall Icon - Bounce Animation */}
              <div className="relative">
                <PhoneCall 
                  className="w-7 h-7"
                  style={{ 
                    color: '#852085',
                    animation: 'bounce 1.5s ease-in-out infinite'
                  }}
                />
              </div>

              {/* Mail Icon - Swing Animation */}
              <div className="relative">
                <Mail 
                  className="w-8 h-8"
                  style={{ 
                    color: '#852085',
                    animation: 'swing 2s ease-in-out infinite'
                  }}
                />
              </div>

              {/* Brain Icon - Pulse + Rotate Animation */}
              <div className="relative">
                <Brain 
                  className="w-7 h-7"
                  style={{ 
                    color: '#852085',
                    animation: 'brainPulse 2.5s ease-in-out infinite'
                  }}
                />
              </div>
            </div>

            {/* Animated Bar Charts */}
            <div className="w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 text-center">Live Analytics</h3>
              
              {/* Bar Chart 1 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Appointments</span>
                  <span>78</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-2000 ease-in-out"
                    style={{ 
                      backgroundColor: '#852085',
                      animation: 'bar1 3s ease-in-out infinite alternate',
                      width: '78%'
                    }}
                  ></div>
                </div>
              </div>

              {/* Bar Chart 2 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Vets Available</span>
                  <span>12</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-2000 ease-in-out"
                    style={{ 
                      backgroundColor: '#852085',
                      animation: 'bar2 2.5s ease-in-out infinite alternate',
                      width: '60%'
                    }}
                  ></div>
                </div>
              </div>

              {/* Bar Chart 3 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Active Bookings</span>
                  <span>45</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-2000 ease-in-out"
                    style={{ 
                      backgroundColor: '#852085',
                      animation: 'bar3 4s ease-in-out infinite alternate',
                      width: '90%'
                    }}
                  ></div>
                </div>
              </div>

              {/* Bar Chart 4 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Completed Today</span>
                  <span>23</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-2000 ease-in-out"
                    style={{ 
                      backgroundColor: '#852085',
                      animation: 'bar4 3.5s ease-in-out infinite alternate',
                      width: '45%'
                    }}
                  ></div>
                </div>
              </div>
            </div>

          </div>

          {/* Custom CSS for animations */}
          <style>
            {`
              @keyframes dash {
                0% { stroke-dashoffset: 125.6; }
                100% { stroke-dashoffset: 50.24; }
              }
              @keyframes dash2 {
                0% { stroke-dashoffset: 100.48; }
                100% { stroke-dashoffset: 25.12; }
              }
              @keyframes dash3 {
                0% { stroke-dashoffset: 150.72; }
                100% { stroke-dashoffset: 75.36; }
              }
              @keyframes dash4 {
                0% { stroke-dashoffset: 50.24; }
                100% { stroke-dashoffset: 12.56; }
              }
              @keyframes bar1 {
                0% { width: 60%; }
                100% { width: 85%; }
              }
              @keyframes bar2 {
                0% { width: 45%; }
                100% { width: 75%; }
              }
              @keyframes bar3 {
                0% { width: 70%; }
                100% { width: 95%; }
              }
              @keyframes bar4 {
                0% { width: 30%; }
                100% { width: 60%; }
              }
              @keyframes swing {
                0% { transform: translateX(-10px); }
                50% { transform: translateX(10px); }
                100% { transform: translateX(-10px); }
              }
              @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-8px); }
                60% { transform: translateY(-4px); }
              }
              @keyframes brainPulse {
                0% { transform: scale(1) rotate(0deg); opacity: 1; }
                50% { transform: scale(1.1) rotate(2deg); opacity: 0.8; }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
              }
            `}
          </style>
        </div>
        
        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center mb-4">
              <LanguageSelector />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {t('adminLogin')}
            </h2>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    {t('username')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-#852085 focus:border-purple-600 sm:text-sm"
                      placeholder={t('username')}
                      style={{ textAlign: getTextAlign(language) }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {t('password')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-#852085 focus:border-purple-600 sm:text-sm"
                      placeholder={t('password')}
                      style={{ textAlign: getTextAlign(language) }}
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-#852085 disabled:opacity-50"
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
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
    </div>
  );
}