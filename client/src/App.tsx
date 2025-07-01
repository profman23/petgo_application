import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Home from "@/pages/home";
import RideRequest from "@/pages/ride-request";
import RideTracking from "@/pages/ride-tracking";
import DoctorDashboard from "@/pages/doctor-dashboard";
import UserTypeSelection from "@/pages/user-type-selection";
import DoctorLogin from "@/pages/doctor-login";
import DoctorRideTracking from "@/pages/doctor-ride-tracking";
import Account from "@/pages/account";
import Patients from "@/pages/patients";
import Activity from "@/pages/activity";
import { useEffect, useState } from "react";

// Check for expired tokens on app start
const checkAndClearExpiredTokens = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const response = await fetch('/api/rides/active', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  } catch (error) {
    // Network error, ignore
  }
};

// Run check immediately
checkAndClearExpiredTokens();

// Configure default authorization header for API requests
const token = localStorage.getItem('token');
if (token) {
  queryClient.setDefaultOptions({
    queries: {
      ...queryClient.getDefaultOptions().queries,
      queryFn: async ({ queryKey }) => {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        
        return await res.json();
      }
    }
  });
}

function AuthCheck({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!(token && user));
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">جاري التحميل...</div>
    </div>;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/user-type-selection" component={UserTypeSelection} />
      <Route path="/login" component={UserTypeSelection} />
      <Route path="/login/customer" component={Login} />
      <Route path="/login/doctor" component={DoctorLogin} />
      <Route path="/doctor-dashboard" component={DoctorDashboard} />
      <Route path="/doctor-ride-tracking" component={DoctorRideTracking} />
      <Route path="/ride-request" component={RideRequest} />
      <Route path="/ride-tracking" component={RideTracking} />
      <Route path="/account" component={Account} />
      <Route path="/patients" component={Patients} />
      <Route path="/activity" component={Activity} />
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthCheck>
          <Toaster />
          <Router />
        </AuthCheck>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
