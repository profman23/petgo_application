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
import DoctorActivity from "@/pages/doctor-activity";
import DoctorAccount from "@/pages/doctor-account";
import UserTypeSelection from "@/pages/user-type-selection";
import DoctorLogin from "@/pages/doctor-login";
import DoctorRideTracking from "@/pages/doctor-ride-tracking";
import Account from "@/pages/account-fixed";
import Patients from "@/pages/patients";
import Activity from "@/pages/activity";
import CustomerActivity from "@/pages/customer-activity";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import VetsVanShifts from "@/pages/vets-van-shifts";
import VetsVanBooking from "@/pages/vetsvan-booking";
import { FixedFooter } from "@/components/fixed-footer";
import { LoadingScreen } from "@/components/loading-screen";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

// Check for expired tokens on app start (skip for admin routes)
const checkAndClearExpiredTokens = async () => {
  // Don't check tokens for admin routes
  if (window.location.pathname.includes('admin')) {
    return;
  }
  
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

// Run check immediately (but skip for admin routes)
if (!window.location.pathname.includes('admin')) {
  checkAndClearExpiredTokens();
}

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
  const [location] = useLocation();
  
  // Pages that should show the footer
  const pagesWithFooter = ['/', '/home', '/account', '/activity', '/customer-activity', '/patients'];
  const shouldShowFooter = pagesWithFooter.includes(location);

  return (
    <div className="min-h-screen flex flex-col screen-border">
      <div className={shouldShowFooter ? 'flex-1 pb-20' : 'flex-1'}>
        <Switch>
          <Route path="/user-type-selection" component={UserTypeSelection} />
          <Route path="/login" component={UserTypeSelection} />
          <Route path="/login/customer" component={Login} />
          <Route path="/login/doctor" component={DoctorLogin} />
          <Route path="/doctor-dashboard" component={DoctorActivity} />
          <Route path="/doctor-activity" component={DoctorActivity} />
          <Route path="/doctor-account" component={DoctorAccount} />
          <Route path="/doctor-ride-tracking" component={DoctorRideTracking} />
          <Route path="/ride-request" component={RideRequest} />
          <Route path="/vetsvan-booking" component={VetsVanBooking} />
          <Route path="/ride-tracking" component={RideTracking} />
          <Route path="/account" component={Account} />
          <Route path="/patients" component={Patients} />
          <Route path="/activity" component={CustomerActivity} />
          <Route path="/customer-activity" component={CustomerActivity} />
          <Route path="/admin-login" component={AdminLogin} />
          <Route path="/login-admin" component={AdminLogin} />
          <Route path="/admin-dashboard" component={AdminDashboard} />
          <Route path="/vets-van-shifts" component={VetsVanShifts} />
          <Route path="/home" component={Home} />
          <Route path="/" component={() => {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            if (token && user) {
              return <Home />;
            } else {
              return <Login />;
            }
          }} />
          <Route component={NotFound} />
        </Switch>
      </div>
      {shouldShowFooter && <FixedFooter />}
    </div>
  );
}

function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  const handleLoadingComplete = () => {
    setIsAppReady(true);
  };

  if (!isAppReady) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LoadingScreen onLoadingComplete={handleLoadingComplete} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

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
