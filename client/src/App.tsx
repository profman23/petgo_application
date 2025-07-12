import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import DoctorInvoiceV2 from "@/pages/doctor-invoice-v2";
import DoctorInvoiceV3 from "@/pages/doctor-invoice-v3";
import DoctorInvoiceSimple from "@/pages/doctor-invoice-simple";
import DoctorInvoiceFresh from "@/pages/doctor-invoice-fresh";
import InvoiceView from "@/pages/invoice-view";
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
import PaymentProcessing from "@/pages/payment-processing";
import { FixedFooter } from "@/components/fixed-footer";
import LoadingScreen from "@/components/LoadingScreen";
import { InstallPrompt } from "@/components/InstallPrompt";
import { PWAInstaller } from "@/components/PWAInstaller";
import { MobileInstallBanner } from "@/components/MobileInstallBanner";
import { LanguageTestingPanel } from "@/components/LanguageTestingPanel";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { SimpleCacheManager } from "@/utils/simpleCacheManager";

// Clear manifest cache on app start to ensure fresh icons
const clearManifestCache = async () => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          const cache = await caches.open(cacheName);
          await cache.delete('/manifest.json');
          await cache.delete('/app-icon.png');
          // Clear all icon variations
          const iconSizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512'];
          await Promise.all(iconSizes.map(size => cache.delete(`/icons/icon-${size}.png`)));
        })
      );
      console.log('✅ Manifest and icon cache cleared');
    } catch (error) {
      console.log('Cache clear failed:', error);
    }
  }
};

// Test icon availability
const testIconAvailability = async () => {
  const iconSizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512'];
  
  for (const size of iconSizes) {
    try {
      const response = await fetch(`/icons/icon-${size}.png`);
      if (!response.ok) {
        console.warn(`❌ Icon not available: icon-${size}.png (${response.status})`);
      } else {
        console.log(`✅ Icon available: icon-${size}.png`);
      }
    } catch (error) {
      console.warn(`❌ Icon test failed: icon-${size}.png`, error);
    }
  }
};

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

// Clear manifest cache and test icons on app start
clearManifestCache();
// Initialize simple cache manager (runs once on PWA launch only)
// SimpleCacheManager.initializeOnLoad(); // Disabled to prevent cache spam
// Test icons in development
if (!import.meta.env.PROD) {
  setTimeout(testIconAvailability, 1000);
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
          <Route path="/doctor-invoice-v2/:bookingId" component={DoctorInvoiceV2} />
          <Route path="/doctor-invoice-v3/:bookingId" component={DoctorInvoiceV3} />
          <Route path="/doctor-invoice-simple/:bookingId" component={DoctorInvoiceSimple} />
          <Route path="/doctor-invoice-fresh/:bookingId" component={DoctorInvoiceFresh} />
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
          <Route path="/admin-dashboard" component={AdminDashboard} />
          <Route path="/vets-van-shifts" component={VetsVanShifts} />
          <Route path="/payment-processing" component={PaymentProcessing} />
          <Route path="/home" component={() => <AuthCheck><Home /></AuthCheck>} />
          <Route path="/" component={Login} />
          <Route component={NotFound} />
        </Switch>
      </div>
      {shouldShowFooter && <FixedFooter />}
      <InstallPrompt />
      <PWAInstaller />
      <MobileInstallBanner />
      <LanguageTestingPanel />
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
          <LoadingScreen onComplete={handleLoadingComplete} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <LanguageTestingPanel />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
