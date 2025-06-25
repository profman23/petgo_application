import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Navigation, MapPin, Phone, Clock, CheckCircle, X } from "lucide-react";
import { Map } from "@/components/map";
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { useLocation } from "wouter";
import { useDoctorLocation } from "@/hooks/useDoctorLocation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DoctorRideTracking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { latitude: doctorLat, longitude: doctorLng, accuracy, error } = useDoctorLocation();
  const t = useTranslation();
  const { language } = useLanguage();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);

  // Check for active ride
  const { data: activeRide, isLoading } = useQuery({
    queryKey: ['/api/doctor/active-ride'],
    refetchInterval: 2000,
    retry: false,
  });

  // Update ride status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ rideId, status }: { rideId: number; status: string }) => {
      return apiRequest(`/api/rides/${rideId}/status`, {
        method: 'PUT',
        body: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctor/active-ride'] });
      queryClient.invalidateQueries({ queryKey: ['/api/doctor/pending-rides'] });
    },
  });

  // Cancel ride mutation
  const cancelRideMutation = useMutation({
    mutationFn: async (rideId: number) => {
      return apiRequest(`/api/rides/${rideId}/cancel`, {
        method: 'PUT',
      });
    },
    onSuccess: () => {
      // Invalidate queries first
      queryClient.invalidateQueries({ queryKey: ['/api/doctor/active-ride'] });
      queryClient.invalidateQueries({ queryKey: ['/api/doctor/pending-rides'] });
      
      toast({
        title: language === 'ar' ? "تم إلغاء الطلب" : "Request Cancelled",
        description: language === 'ar' ? "تم إلغاء الطلب بنجاح. يمكنك الآن استقبال طلبات جديدة" : "Request cancelled successfully. You can now receive new requests",
      });
      
      // Force navigation after short delay
      setTimeout(() => {
        setLocation('/doctor-dashboard');
      }, 500);
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? "خطأ في إلغاء الطلب" : "Cancel Error",
        description: language === 'ar' ? "حدث خطأ أثناء إلغاء الطلب" : "Error occurred while cancelling request",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={direction}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600" style={{ textAlign }}>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Check if we should redirect to dashboard
  React.useEffect(() => {
    if (!isLoading && !activeRide?.ride) {
      setLocation('/doctor-dashboard');
    }
  }, [activeRide, isLoading, setLocation]);

  if (!activeRide?.ride) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={direction}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600" style={{ textAlign }}>{language === 'ar' ? 'جاري التحويل...' : 'Redirecting...'}</p>
        </div>
      </div>
    );
  }

  const ride = activeRide.ride;
  const customer = activeRide.customer;

  const handleGoogleMapsNavigation = () => {
    if (doctorLat && doctorLng && ride.pickupLatitude && ride.pickupLongitude) {
      const googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(doctorLat)},${encodeURIComponent(doctorLng)}/${encodeURIComponent(ride.pickupLatitude)},${encodeURIComponent(ride.pickupLongitude)}`;
      
      toast({
        title: language === 'ar' ? "فتح Google Maps" : "Opening Google Maps",
        description: language === 'ar' ? "جاري فتح التطبيق للتنقل..." : "Opening navigation app...",
      });
      
      try {
        const newWindow = window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
        
        setTimeout(() => {
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            toast({
              title: language === 'ar' ? "تعذر فتح نافذة جديدة" : "Cannot open new window",
              description: language === 'ar' ? "سيتم فتح Google Maps في نفس النافذة" : "Google Maps will open in same window",
              variant: "destructive",
            });
            setTimeout(() => {
              window.location.href = googleMapsUrl;
            }, 1500);
          }
        }, 1000);
        
      } catch (error) {
        console.error('Error opening Google Maps:', error);
        toast({
          title: language === 'ar' ? "خطأ في فتح Google Maps" : "Error opening Google Maps",
          description: language === 'ar' ? "سيتم المحاولة مرة أخرى..." : "Trying again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = googleMapsUrl;
        }, 1000);
      }
    } else {
      toast({
        title: language === 'ar' ? "خطأ في الموقع" : "Location Error",
        description: language === 'ar' ? "لا يمكن تحديد إحداثيات الموقع" : "Cannot determine location coordinates",
        variant: "destructive",
      });
    }
  };

  const handleCallCustomer = () => {
    if (customer?.phone) {
      window.location.href = `tel:${customer.phone}`;
    }
  };

  const handleCancelRequest = () => {
    if (ride?.id) {
      cancelRideMutation.mutate(ride.id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/user-type-selection');
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={direction}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/doctor-dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'ar' ? 'العودة' : 'Back'}
          </Button>
          <div className="flex items-center gap-3">
            <img 
              src={logoImage} 
              alt="Vets Van" 
              className="h-8 object-contain"
            />
            <h1 className="text-lg font-semibold" style={{ textAlign }}>
              {language === 'ar' ? `متابعة الرحلة #${ride?.id || ''}` : `Ride Tracking #${ride?.id || ''}`}
            </h1>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-red-600">
            {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* GPS Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <span className="font-medium" style={{ textAlign }}>
                  {language === 'ar' ? 'حالة GPS' : 'GPS Status'}
                </span>
              </div>
              <Badge variant={doctorLat && doctorLng ? "default" : "destructive"}>
                {language === 'ar' ? (doctorLat && doctorLng ? "متصل" : "غير متصل") : (doctorLat && doctorLng ? "Connected" : "Disconnected")}
              </Badge>
            </div>
            {accuracy && (
              <p className="text-sm text-gray-600 mt-2" style={{ textAlign }}>
                {language === 'ar' ? `دقة الموقع: ${Math.round(accuracy)} متر` : `Location Accuracy: ${Math.round(accuracy)} meters`}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Map with both locations */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2" style={{ textAlign }}>
                <MapPin className="w-5 h-5 text-blue-600" />
                {language === 'ar' ? 'خريطة التنقل' : 'Navigation Map'}
              </h3>
            </div>
            
            {doctorLat && doctorLng && ride.pickupLatitude && ride.pickupLongitude ? (
              <div className="h-64 rounded-lg overflow-hidden">
                <Map
                  customerLocation={[ride.pickupLatitude, ride.pickupLongitude]}
                  assignedDriver={{
                    id: 1,
                    name: "Doctor",
                    latitude: doctorLat,
                    longitude: doctorLng,
                    isAvailable: true,
                    phone: "",
                    vehicleType: "car",
                    rating: 5,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }}
                  showBothLocations={true}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500" style={{ textAlign }}>
                  {language === 'ar' ? 'جاري تحميل الخريطة...' : 'Loading map...'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ textAlign }}>
              <Phone className="w-5 h-5 text-blue-600" />
              {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600" style={{ textAlign }}>
                  {language === 'ar' ? 'الاسم:' : 'Name:'}
                </span>
                <span className="font-medium" style={{ textAlign }}>
                  {customer?.name || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600" style={{ textAlign }}>
                  {language === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium" style={{ textAlign }}>
                    {customer?.phone || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                  </span>
                  {customer?.phone && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCallCustomer}
                      className="h-8 px-3"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600" style={{ textAlign }}>
                  {language === 'ar' ? 'الموقع:' : 'Location:'}
                </span>
                <span className="font-medium" style={{ textAlign }}>{ride.pickupLocation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600" style={{ textAlign }}>
                  {language === 'ar' ? 'وقت الطلب:' : 'Request Time:'}
                </span>
                <span className="font-medium" style={{ textAlign }}>
                  {new Date(ride.createdAt).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Navigation buttons */}
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={handleGoogleMapsNavigation}
                  className="w-full flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  {language === 'ar' ? 'فتح خرائط جوجل' : 'Open Google Maps'}
                </Button>
                
                <Button 
                  onClick={handleCallCustomer}
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  {language === 'ar' ? 'اتصال بالعميل' : 'Call Customer'}
                </Button>
              </div>
              
              {/* Status buttons */}
              <div className="border-t pt-3 space-y-2">
                {ride?.status === 'in_progress' && (
                  <Button 
                    onClick={() => updateStatusMutation.mutate({ rideId: ride.id, status: 'arrived' })}
                    className="w-full flex items-center gap-2"
                    disabled={updateStatusMutation.isPending}
                  >
                    <Clock className="w-4 h-4" />
                    {language === 'ar' ? 'تأكيد الوصول' : 'Mark as Arrived'}
                  </Button>
                )}
                
                {ride?.status === 'arrived' && (
                  <Button 
                    onClick={() => updateStatusMutation.mutate({ rideId: ride.id, status: 'completed' })}
                    className="w-full flex items-center gap-2"
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {language === 'ar' ? 'تأكيد اكتمال الخدمة' : 'Mark as Completed'}
                  </Button>
                )}
                
                {/* Cancel Request Button */}
                {(ride?.status === 'in_progress' || ride?.status === 'arrived') && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="w-full flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        {language === 'ar' ? 'إلغاء الطلب' : 'Cancel Request'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent 
                      dir={direction}
                      className="fixed z-[100000]"
                      style={{ zIndex: 100000, position: 'fixed' }}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle style={{ textAlign }}>
                          {language === 'ar' ? 'إلغاء الطلب' : 'Cancel Request'}
                        </AlertDialogTitle>
                        <AlertDialogDescription style={{ textAlign }}>
                          {language === 'ar' ? 'هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to cancel this request? This action cannot be undone.'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className={direction === 'rtl' ? 'flex-row-reverse' : ''}>
                        <AlertDialogCancel>
                          {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleCancelRequest}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={cancelRideMutation.isPending}
                        >
                          {cancelRideMutation.isPending ? 
                            (language === 'ar' ? 'جاري الإلغاء...' : 'Cancelling...') : 
                            (language === 'ar' ? 'تأكيد الإلغاء' : 'Confirm Cancel')
                          }
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}