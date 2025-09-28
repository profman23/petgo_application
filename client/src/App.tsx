import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { PermissionsProvider } from "@/hooks/usePermissionsStore";
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
import NewReportsAnalytics from "@/pages/new-reports-analytics";
import VetsVanShifts from "@/pages/vets-van-shifts";
import FinancialCreditNote from "@/pages/financial-credit-note";
import FinancialCreditNotes from "@/pages/financial-credit-notes";
import FinancialOutgoingPayment from "@/pages/financial-outgoing-payment";
import FinancialIncomePayment from "@/pages/financial-income-payment";
import FinancialARBalance from "@/pages/financial-ar-balance";
import BusinessPartnerManagement from "@/pages/business-partner-management";
import VetsVanBooking from "@/pages/vetsvan-booking";
import PaymentProcessing from "@/pages/payment-processing";
import { PaymentTest } from "@/pages/payment-test";
import PaymentSuccess from "@/pages/payment-success";
import PaymentError from "@/pages/payment-error";
import PrivacyPolicyEn from "@/pages/privacy-policy-en";
import PrivacyPolicyAr from "@/pages/privacy-policy-ar";
import { FixedFooter } from "@/components/fixed-footer";
import { LoadingScreen } from "@/components/loading-screen";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

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

// Credit Note Permission Gate
function CreditNotePermissionGate({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const adminToken = localStorage.getItem("adminToken");

  const { data: currentUserPermissions, isLoading, error } = useQuery({
    queryKey: ["/api/admin/current-user-permissions"], // Fixed: removed Date.now() to prevent infinite loop
    queryFn: async () => {
      const response = await fetch(`/api/admin/current-user-permissions?_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error("Failed to fetch permissions");
      return response.json();
    },
    enabled: !!adminToken,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false, // Reduced to prevent excessive refetching
    refetchOnReconnect: 'always',
  });

  // DEFAULT-DENY LOGIC: Only allow access if user has explicit read or full control permission  
  // Redirect in useEffect to avoid state updates during render - MUST be called before conditional returns
  useEffect(() => {
    if (currentUserPermissions) {
      // Check for explicit "No Permission" flag
      if (currentUserPermissions.creditNoteNoPermission === true) {
        console.log('🚫 [PERMS_GATE] REDIRECTING: User has explicit no permission for Credit Note');
        setLocation('/admin-home');
        return;
      }

      // Check if user has any valid Credit Note permissions
      const hasValidPermission = currentUserPermissions.creditNoteRead === true || 
                                 currentUserPermissions.creditNoteFullControl === true;
      
      if (!hasValidPermission) {
        console.log('🚫 [PERMS_GATE] REDIRECTING: User lacks valid Credit Note permissions');
        setLocation('/admin-home');
        return;
      }

      console.log('✅ [PERMS_GATE] ALLOWING: User has valid Credit Note permissions');
    }
  }, [currentUserPermissions, setLocation]);

  // Show loading while fetching permissions
  if (isLoading || !adminToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading permissions...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.error('[PERMS_GATE] Permission fetch failed:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">Error loading permissions</div>
      </div>
    );
  }

  // Debug: Log received permissions
  console.log('[PERMS_GATE] User permissions received:', {
    username: currentUserPermissions?.username,
    creditNoteNoPermission: currentUserPermissions?.creditNoteNoPermission,
    creditNoteRead: currentUserPermissions?.creditNoteRead,
    creditNoteFullControl: currentUserPermissions?.creditNoteFullControl,
    hasNoPermField: currentUserPermissions?.hasOwnProperty('creditNoteNoPermission')
  });

  // DEFAULT-DENY: Only render children if user has explicit permissions
  const hasValidPermission = currentUserPermissions && (
    currentUserPermissions.creditNoteRead === true || 
    currentUserPermissions.creditNoteFullControl === true
  ) && currentUserPermissions.creditNoteNoPermission !== true;

  if (!hasValidPermission) {
    // Don't render anything while redirect is happening
    return null;
  }

  return <>{children}</>;
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
          <Route path="/financial/credit-note" component={() => <CreditNotePermissionGate><FinancialCreditNote /></CreditNotePermissionGate>} />
          <Route path="/financial/credit-notes" component={() => <CreditNotePermissionGate><FinancialCreditNotes /></CreditNotePermissionGate>} />
          <Route path="/financial/outgoing-payment" component={FinancialOutgoingPayment} />
          <Route path="/financial/income-payment" component={FinancialIncomePayment} />
          <Route path="/financial/ar-balance" component={FinancialARBalance} />
          <Route path="/business-partner/partner-management" component={BusinessPartnerManagement} />
          <Route path="/new-reports-analytics" component={NewReportsAnalytics} />
          <Route path="/vets-van-shifts" component={VetsVanShifts} />
          <Route path="/payment-processing" component={PaymentProcessing} />
          <Route path="/payment-test" component={() => <AuthCheck><PaymentTest /></AuthCheck>} />
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route path="/payment-error" component={PaymentError} />
          <Route path="/en/privacy-policy" component={PrivacyPolicyEn} />
          <Route path="/ar/privacy-policy" component={PrivacyPolicyAr} />
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
      <PermissionsProvider>
        <Toaster />
        <Router />
      </PermissionsProvider>
    </QueryClientProvider>
  );
}

export default App;
