import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import OtpVerification from "@/pages/otp-verification";
import Home from "@/pages/home";
import RideRequest from "@/pages/ride-request";
import RideTracking from "@/pages/ride-tracking";
import DoctorDashboard from "@/pages/doctor-dashboard";
import DoctorActivity from "@/pages/doctor-activity";
import DoctorAccount from "@/pages/doctor-account";
import DoctorInvoice from "@/pages/doctor-invoice";
import InvoiceView from "@/pages/invoice-view";
import UserTypeSelection from "@/pages/user-type-selection";
import DoctorLogin from "@/pages/doctor-login";
import DoctorRideTracking from "@/pages/doctor-ride-tracking";
import Account from "@/pages/account";
import Patients from "@/pages/patients";
import Activity from "@/pages/activity";
import CustomerActivity from "@/pages/customer-activity";
import AdminLogin from "@/pages/admin-login";
import AdminHome from "@/pages/admin-home";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminServices from "@/pages/admin-services";
import AdminProducts from "@/pages/admin-products";
import AdminImport from "@/pages/admin-import";
import AdminVetsVanRequests from "@/pages/admin-vetsvan-requests";
import AdministrationUsers from "@/pages/administration-users";
import AdministrationAuthorization from "@/pages/administration-authorization";
import SalesReports from "@/pages/sales-reports";
import NewReportsAnalytics from "@/pages/new-reports-analytics";
import VetsVanShifts from "@/pages/vets-van-shifts";
import VetsVanBooking from "@/pages/vetsvan-booking";
import PaymentProcessing from "@/pages/payment-processing";
import { PaymentTest } from "@/pages/payment-test";
import PaymentSuccess from "@/pages/payment-success";
import PaymentError from "@/pages/payment-error";
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
  const pagesWithFooter = ['/home', '/account', '/activity', '/customer-activity', '/patients', '/ride-request'];
  const shouldShowFooter = pagesWithFooter.includes(location);

  return (
    <div className="min-h-screen flex flex-col">
      <div className={shouldShowFooter ? 'flex-1 pb-20' : 'flex-1'}>
        <Switch>
          <Route path="/user-type-selection" component={UserTypeSelection} />
          <Route path="/login" component={Login} />
          <Route path="/login/customer" component={Login} />
          <Route path="/otp-verification" component={OtpVerification} />
          <Route path="/login/doctor" component={DoctorLogin} />
          <Route path="/doctor-login" component={DoctorLogin} />
          <Route path="/doctor-dashboard" component={DoctorActivity} />
          <Route path="/doctor-activity" component={DoctorActivity} />
          <Route path="/doctor-account" component={DoctorAccount} />
          <Route path="/doctor-invoice/:bookingId" component={DoctorInvoice} />
          <Route path="/invoice-view" component={InvoiceView} />
          <Route path="/doctor-ride-tracking" component={DoctorRideTracking} />
          <Route path="/ride-request" component={() => <AuthCheck><RideRequest /></AuthCheck>} />
          <Route path="/vetsvan-booking" component={() => <AuthCheck><VetsVanBooking /></AuthCheck>} />
          <Route path="/ride-tracking" component={() => <AuthCheck><RideTracking /></AuthCheck>} />
          <Route path="/account" component={() => <AuthCheck><Account /></AuthCheck>} />
          <Route path="/patients" component={() => <AuthCheck><Patients /></AuthCheck>} />
          <Route path="/activity" component={() => <AuthCheck><CustomerActivity /></AuthCheck>} />
          <Route path="/customer-activity" component={() => <AuthCheck><CustomerActivity /></AuthCheck>} />
          <Route path="/admin-login" component={AdminLogin} />
          <Route path="/login-admin" component={AdminLogin} />
          <Route path="/admin-home" component={AdminHome} />
          <Route path="/admin-dashboard" component={AdminDashboard} />
          <Route path="/admin-dashboard/services" component={AdminServices} />
          <Route path="/admin-dashboard/products" component={AdminProducts} />
          <Route path="/admin-dashboard/import" component={AdminImport} />
          <Route path="/admin-vetsvan-requests" component={AdminVetsVanRequests} />
          <Route path="/administration/users" component={AdministrationUsers} />
          <Route path="/administration/authorization" component={AdministrationAuthorization} />
          <Route path="/sales-reports" component={SalesReports} />
          <Route path="/new-reports-analytics" component={NewReportsAnalytics} />
          <Route path="/new-reports-analytics/sales-report" component={SalesReports} />
          <Route path="/vets-van-shifts" component={VetsVanShifts} />
          <Route path="/payment-processing" component={PaymentProcessing} />
          <Route path="/payment-test" component={() => <AuthCheck><PaymentTest /></AuthCheck>} />
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route path="/payment-error" component={PaymentError} />
          <Route path="/home" component={() => <AuthCheck><Home /></AuthCheck>} />
          <Route path="/" component={Login} />
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
    setTimeout(() => setIsAppReady(true), 500);
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">Loading...</p>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
