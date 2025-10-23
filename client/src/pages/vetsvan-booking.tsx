import { VetsVanBookingUnified } from "@/components/booking/VetsVanBookingUnified";
import { useEffect } from "react";

export default function VetsVanBooking() {
  useEffect(() => {
    console.log('🚗 VetsVan Booking Page Loaded');
    console.log('📦 URL:', window.location.href);
    console.log('📦 URL Params:', window.location.search);
    console.log('📦 sessionStorage payment data:', {
      paymentSuccess: sessionStorage.getItem('paymentSuccess'),
      paymentId: sessionStorage.getItem('paymentId'),
      paymentReference: sessionStorage.getItem('paymentReference')
    });
    console.log('📦 localStorage payment data:', {
      paymentSuccess: localStorage.getItem('paymentSuccess'),
      paymentId: localStorage.getItem('paymentId'),
      paymentReference: localStorage.getItem('paymentReference'),
      pendingBookingDetails: !!localStorage.getItem('pendingBookingDetails')
    });
  }, []);
  
  return <VetsVanBookingUnified isModal={false} />;
}
