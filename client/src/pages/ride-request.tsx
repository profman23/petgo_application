import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRide } from '@/hooks/useRide';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ArrowLeft, MapPin, Navigation, Circle, RefreshCw, Loader2, Truck, Heart, Shield, Clock, Star, User, PawPrint, Check, ChevronDown, Bell, Scissors, Stethoscope, Zap, Scan, Phone, MessageCircle, Car, Home, ShieldPlus, Pill, Cat, Dog, Bird } from 'lucide-react';
import { rideRequestSchema, type Patient } from '@shared/schema';
import logoImage from "@assets/Screenshot 2025-07-21 115341_1753088187495.png";
import petsImage from "@assets/freepik_assistant_1751437357520_1751437467714.png";
import selectPetsLogo from "@/assets/select-pets-logo-new.png";
import serviceTypeIcon from "@assets/freepik_assistant_1751437667818_1751437676533.png";
import locationIcon from "@assets/freepik_assistant_1751438122960_1751438131963.png";
import vetVanImage from "@assets/freepik__background__70346_1751441138494.png";
import drPawsLogo from "@assets/Dr.Paws Logo_1753364291004.png";
import eliteVetLogo from "@assets/Final LogoLogo_1753364291004.png";

import { DEFAULT_COORDINATES } from '@/lib/constants';
import { z } from 'zod';
import { useTranslation, useLanguage, getDirection, getTextAlign } from '@/lib/i18n';
import { LanguageSelector } from '@/components/language-selector';



const formSchema = rideRequestSchema.extend({
  pickupLocation: z.string().min(1, 'الموقع مطلوب'),
  serviceType: z.string().min(1, 'نوع الخدمة مطلوب'),
  selectedPatients: z.array(z.number()).min(1, 'يرجى اختيار حيوان أليف واحد على الأقل'),
});

type FormData = z.infer<typeof formSchema>;

// Helper function to calculate fleas & ticks prevention cost per pet
const getFleaTicksCostPerPet = (petType: string, weight: number): { cost: number; tier: string } => {
  const normalizedType = petType.toLowerCase();
  
  if (normalizedType === 'cat') {
    if (weight >= 0 && weight <= 2.9) {
      return { cost: 230, tier: '0.0-2.9kg' };
    } else if (weight >= 3.0 && weight <= 5.9) {
      return { cost: 250, tier: '3.0-5.9kg' };
    } else if (weight >= 6.0) {
      return { cost: 270, tier: '≥6.0kg' };
    }
  } else if (normalizedType === 'dog') {
    if (weight >= 0 && weight <= 10.0) {
      return { cost: 230, tier: '0.0-10.0kg' };
    } else if (weight > 10.0) {
      return { cost: 287, tier: '>10.0kg' };
    }
  }
  
  // Unknown type or invalid weight
  return { cost: 0, tier: 'Unknown' };
};

// Helper function to check if only Bird pets are selected
const isOnlyBirdsSelected = (selectedPetIds: number[], patients: Patient[]): boolean => {
  if (selectedPetIds.length === 0) return false;
  
  const selectedPets = selectedPetIds
    .map(id => patients.find(p => p.id === id))
    .filter(pet => pet) as Patient[];
  
  return selectedPets.length > 0 && selectedPets.every(pet => pet.type === 'Bird');
};

// Helper function to calculate estimated cost based on pets and service type
const getEstimatedCost = (selectedPetIds: number[], patients: Patient[], serviceType: string): { 
  total: number; 
  breakdown: Array<{ name: string; type: string; weight: number; tier: string; cost: number; }>; 
  warnings: string[];
  consultationFee?: number;
  serviceCost?: number;
} => {
  const selectedPets = selectedPetIds
    .map(id => patients.find(p => p.id === id))
    .filter(pet => pet) as Patient[];

  if (serviceType === 'fleas-ticks-prevention') {
    const breakdown: Array<{ name: string; type: string; weight: number; tier: string; cost: number; }> = [];
    const warnings: string[] = [];
    let total = 0;

    selectedPets.forEach(pet => {
      if (!pet.patientWeight || pet.patientWeight <= 0) {
        warnings.push(`${pet.name}: Missing weight data`);
        breakdown.push({
          name: pet.name,
          type: pet.type,
          weight: pet.patientWeight || 0,
          tier: 'No weight',
          cost: 0
        });
        return;
      }

      const { cost, tier } = getFleaTicksCostPerPet(pet.type, pet.patientWeight);
      
      if (cost === 0) {
        warnings.push(`${pet.name}: Unknown pet type (${pet.type})`);
      }

      breakdown.push({
        name: pet.name,
        type: pet.type,
        weight: pet.patientWeight,
        tier: tier,
        cost: cost
      });

      total += cost;
    });

    // Add flat 575 SAR add-on for fleas-ticks-prevention
    const serviceCost = total;
    total += 575;

    return { total, breakdown, warnings, consultationFee: 575, serviceCost };
  }

  // Original pricing for other services
  const petCount = selectedPets.length;
  let total = 0;

  // Special pricing for First Visit, Home Consultation, and General Check-up
  if (['first-visit', 'home-consultation', 'general-checkup'].includes(serviceType)) {
    if (petCount <= 2) {
      total = 575; // 1-2 pets: 575 SAR
    } else if (petCount <= 4) {
      total = 575 * 2; // 3-4 pets: 1150 SAR
    } else {
      total = 575 * 3; // 5+ pets: 1725 SAR (fixed cap)
    }
  } else if (serviceType === 'test-service') {
    total = petCount;
  } else if (serviceType === 'vaccination') {
    total = petCount * 172.5;
  } else if (serviceType === 'deworming') {
    total = petCount * 80.5;
  } else if (serviceType === 'free-deworming') {
    total = 0; // Free service
  } else if (serviceType === 'pickup-drop') {
    total = 230;
  } else {
    // Original pricing for other services
    if (petCount <= 2) total = 172.5;
    else if (petCount <= 4) total = 345;
    else total = 517.5; // 5+ pets
  }

  // Add flat 575 SAR to specific services
  let consultationFee: number | undefined;
  let serviceCost: number | undefined;
  
  if (['vaccination', 'deworming'].includes(serviceType)) {
    serviceCost = total;
    consultationFee = 575;
    total += 575;
  }

  return { 
    total, 
    breakdown: selectedPets.map(pet => ({
      name: pet.name,
      type: pet.type,
      weight: pet.patientWeight || 0,
      tier: 'Standard',
      cost: total / selectedPets.length
    })), 
    warnings: [],
    consultationFee,
    serviceCost
  };
};

export default function RideRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { requestRide, isRequestingRide } = useRide();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedPatients, setSelectedPatients] = useState<number[]>([]);
  const [serviceType, setServiceType] = useState<string>('');
  const [slidePosition, setSlidePosition] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [isSlideComplete, setIsSlideComplete] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showPartnersDialog, setShowPartnersDialog] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Weight modal state - Multi-pet support
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [patientsForWeight, setPatientsForWeight] = useState<Patient[]>([]);
  const [patientWeights, setPatientWeights] = useState<Record<number, string>>({});
  const [updatingWeights, setUpdatingWeights] = useState<Record<number, boolean>>({});
  const [weightErrors, setWeightErrors] = useState<Record<number, string>>({});
  
  const { t } = useTranslation();
  const { language } = useLanguage();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);

  // Check for payment status in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'failed') {
      toast({
        title: language === 'ar' ? 'فشل الدفع' : 'Payment Failed',
        description: language === 'ar' ? 
          'تم إلغاء الدفع أو فشل. يرجى المحاولة مرة أخرى.' : 
          'Payment was cancelled or failed. Please try again.',
        variant: 'destructive',
        duration: 8000,
      });
      
      // Clear the URL parameter without page reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [toast, language]);

  // خدمات تتطلب شركاء (الكل) و خدمات خاصة بالنخبة فقط
  const specializedServices = ['neutering', 'surgery', 'grooming'];
  const eliteOnlyServices = ['ct-scan'];

  const handleServiceTypeChange = (value: string) => {
    if (specializedServices.includes(value) || eliteOnlyServices.includes(value)) {
      setIsDialogOpen(true);
      setShowPartnersDialog(true);
      // Don't set service type yet - only after OK button confirmation
    } else if (value === 'fleas-ticks-prevention') {
      // Get selected pets with their weight status for debugging
      const selectedPetsWithStatus = selectedPatients
        .map(patientId => patients.find(p => p.id === patientId))
        .filter(patient => patient);
      
      console.log('Selected pets for fleas-ticks-prevention:', selectedPetsWithStatus.map(p => ({
        id: p?.id,
        name: p?.name, 
        weight: p?.patientWeight,
        hasWeight: !(!p?.patientWeight || p?.patientWeight === 0)
      })));

      // Check if any selected pets are missing weight data  
      const petsWithoutWeight = selectedPetsWithStatus
        .filter(patient => patient && (!patient.patientWeight || patient.patientWeight === 0));
      
      if (petsWithoutWeight.length > 0) {
        // Show weight modal for pets without weight
        setPatientsForWeight(petsWithoutWeight as Patient[]);
        
        // Initialize weights object - empty for pets without weight
        const initialWeights: Record<number, string> = {};
        petsWithoutWeight.forEach(pet => {
          if (pet) initialWeights[pet.id] = '';
        });
        setPatientWeights(initialWeights);
        setUpdatingWeights({});
        setWeightErrors({});
        
        setShowWeightModal(true);
        console.log('Opening weight modal for pets without weight:', petsWithoutWeight.map(p => p?.name));
        // Don't set service type yet - only after weights are entered
      } else {
        // All pets have weights, proceed normally
        console.log('All selected pets have weights, proceeding with service');
        setServiceType(value);
      }
    } else {
      setServiceType(value);
    }
  };

  const handleDialogOkClick = () => {
    setIsDialogOpen(false);
    setShowPartnersDialog(false);
    // Reset service selection - don't keep the specialized service
    setServiceType('');
  };

  // Weight update mutation
  const updatePatientWeightMutation = useMutation({
    mutationFn: async ({ patientId, weight }: { patientId: number; weight: number }) => {
      return apiRequest(`/api/patients/${patientId}/weight`, {
        method: 'PATCH',
        body: JSON.stringify({ patientWeight: weight }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: language === 'ar' ? 'تم حفظ الوزن' : 'Weight Saved',
        description: language === 'ar' ? 
          'تم حفظ وزن الحيوان الأليف بنجاح' : 
          'Pet weight has been saved successfully',
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Error updating patient weight:', error);
      toast({
        title: language === 'ar' ? 'خطأ في الحفظ' : 'Save Error',
        description: language === 'ar' ? 
          'فشل في حفظ وزن الحيوان الأليف' : 
          'Failed to save pet weight',
        variant: 'destructive',
        duration: 5000,
      });
    },
  });

  // Handle saving all weights
  const handleWeightSaveAll = async () => {
    console.log('Starting weight save for pets:', patientsForWeight.map(p => p.name));
    console.log('Current weight inputs:', patientWeights);
    
    // Validate all weights
    const errors: Record<number, string> = {};
    const validWeights: { patientId: number; weight: number }[] = [];
    
    for (const pet of patientsForWeight) {
      const weightStr = patientWeights[pet.id] || '';
      const weight = parseFloat(weightStr);
      
      if (!weightStr || weight <= 0 || isNaN(weight)) {
        errors[pet.id] = language === 'ar' ? 'يرجى إدخال وزن صالح' : 'Please enter valid weight';
      } else {
        validWeights.push({ patientId: pet.id, weight });
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setWeightErrors(errors);
      console.log('Validation errors:', errors);
      return;
    }
    
    // Clear any previous errors
    setWeightErrors({});
    
    // Update all weights
    let successCount = 0;
    let failedPets: string[] = [];
    let updatedPets: string[] = [];
    
    for (const { patientId, weight } of validWeights) {
      try {
        setUpdatingWeights(prev => ({ ...prev, [patientId]: true }));
        
        console.log(`Updating pet ${patientId} weight to ${weight}`);
        await updatePatientWeightMutation.mutateAsync({
          patientId,
          weight
        });
        
        const pet = patientsForWeight.find(p => p.id === patientId);
        updatedPets.push(pet?.name || `Pet ${patientId}`);
        successCount++;
      } catch (error) {
        console.error(`Failed to update weight for pet ${patientId}:`, error);
        const pet = patientsForWeight.find(p => p.id === patientId);
        failedPets.push(pet?.name || `Pet ${patientId}`);
      } finally {
        setUpdatingWeights(prev => ({ ...prev, [patientId]: false }));
      }
    }
    
    // Show results
    if (successCount === validWeights.length) {
      toast({
        title: language === 'ar' ? 'تم حفظ جميع الأوزان' : 'All Weights Saved',
        description: language === 'ar' ? 
          `تم حفظ أوزان: ${updatedPets.join(', ')}` : 
          `Successfully updated: ${updatedPets.join(', ')}`,
        duration: 3000,
      });
      
      // Close modal and continue with service selection
      setShowWeightModal(false);
      setPatientsForWeight([]);
      setPatientWeights({});
      setServiceType('fleas-ticks-prevention');
      
      // Trigger a refetch to update the cost calculation
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
    } else if (failedPets.length > 0) {
      toast({
        title: language === 'ar' ? 'فشل في حفظ بعض الأوزان' : 'Some Weights Failed to Save',
        description: language === 'ar' ? 
          `فشل حفظ: ${failedPets.join(', ')}` : 
          `Failed to save: ${failedPets.join(', ')}`,
        variant: 'destructive',
        duration: 8000,
      });
    }
  };

  // Handle weight modal cancel
  const handleWeightCancel = () => {
    setShowWeightModal(false);
    setPatientsForWeight([]);
    setPatientWeights({});
    setUpdatingWeights({});
    setWeightErrors({});
    // Don't set the service type, user needs to try again
  };

  // Update individual pet weight
  const handlePetWeightChange = (petId: number, weight: string) => {
    setPatientWeights(prev => ({ ...prev, [petId]: weight }));
    // Clear error for this pet if they start typing
    if (weightErrors[petId]) {
      setWeightErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[petId];
        return newErrors;
      });
    }
  };
  
  // جلب الحيوانات الأليفة المسجلة بتحسين الأداء
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    staleTime: 5 * 60 * 1000, // 5 دقائق
    gcTime: 10 * 60 * 1000, // 10 دقائق
    refetchOnWindowFocus: false,
  });

  // جلب بيانات المستخدم من localStorage مباشرة
  const [userSession, setUserSession] = useState<{user?: {id?: number, name?: string, phone?: string, email?: string}} | null>(null);
  
  useEffect(() => {
    // Get user data from localStorage like VetsVan booking does
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserSession({ user: userData });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
  }, []);
  
  // استخدام نظام GPS الحقيقي
  const {
    latitude,
    longitude,
    accuracy,
    error: gpsError,
    isLoading: isLoadingGPS,
    getCurrentPosition,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 60000, // تحديث كل دقيقة
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pickupLocation: '',
      destination: 'خدمة بيطرية في الموقع',
      pickupLatitude: DEFAULT_COORDINATES.latitude,
      pickupLongitude: DEFAULT_COORDINATES.longitude,
      destinationLatitude: DEFAULT_COORDINATES.latitude,
      destinationLongitude: DEFAULT_COORDINATES.longitude,
      vehicleType: 'standard',
      serviceType: '',
      selectedPatients: [],
    },
  });

  // Check if only birds are selected and clear fleas-ticks-prevention if needed
  useEffect(() => {
    if (serviceType === 'fleas-ticks-prevention' && isOnlyBirdsSelected(selectedPatients, patients)) {
      console.log('Clearing fleas-ticks-prevention service as only birds are selected');
      setServiceType('');
      form.setValue('serviceType', '');
    }
  }, [selectedPatients, patients, serviceType, form]);

  useEffect(() => {
    // Get user's current location with high accuracy - force new location request
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // Force fresh location request
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('Fresh GPS Location:', latitude, longitude, 'Accuracy:', accuracy);
          
          setCurrentLocation({ latitude, longitude });
          form.setValue('pickupLatitude', latitude);
          form.setValue('pickupLongitude', longitude);
          
          // الحصول على العنوان الدقيق باستخدام reverse geocoding
          let locationName = language === 'ar' ? 'موقعك الحالي' : 'Your Current Location';
          
          // استخدام reverse geocoding للحصول على العنوان الدقيق
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${language === 'ar' ? 'ar' : 'en'}`)
            .then(response => response.json())
            .then(data => {
              if (data && data.display_name) {
                locationName = data.display_name;
                console.log('Address from reverse geocoding:', locationName);
                form.setValue('pickupLocation', locationName);
              } else {
                // Fallback to city detection if reverse geocoding fails
                if (latitude >= 24.0 && latitude <= 25.5 && longitude >= 46.0 && longitude <= 47.5) {
                  locationName = language === 'ar' ? 'الرياض - موقعك الحالي' : 'Riyadh - Your Location';
                } else if (latitude >= 21.0 && latitude <= 22.0 && longitude >= 39.0 && longitude <= 39.8) {
                  locationName = language === 'ar' ? 'جدة - موقعك الحالي' : 'Jeddah - Your Location';
                } else if (latitude >= 26.0 && latitude <= 27.0 && longitude >= 49.5 && longitude <= 50.5) {
                  locationName = language === 'ar' ? 'الدمام - موقعك الحالي' : 'Dammam - Your Location';
                } else if (latitude >= 24.0 && latitude <= 25.0 && longitude >= 39.0 && longitude <= 40.5) {
                  locationName = language === 'ar' ? 'المدينة المنورة - موقعك الحالي' : 'Medina - Your Location';
                }
                form.setValue('pickupLocation', locationName);
              }
            })
            .catch(error => {
              console.log('Reverse geocoding failed:', error);
              // Fallback to city detection
              if (latitude >= 24.0 && latitude <= 25.5 && longitude >= 46.0 && longitude <= 47.5) {
                locationName = language === 'ar' ? 'الرياض - موقعك الحالي' : 'Riyadh - Your Location';
              } else if (latitude >= 21.0 && latitude <= 22.0 && longitude >= 39.0 && longitude <= 39.8) {
                locationName = language === 'ar' ? 'جدة - موقعك الحالي' : 'Jeddah - Your Location';
              } else if (latitude >= 26.0 && latitude <= 27.0 && longitude >= 49.5 && longitude <= 50.5) {
                locationName = language === 'ar' ? 'الدمام - موقعك الحالي' : 'Dammam - Your Location';
              } else if (latitude >= 24.0 && latitude <= 25.0 && longitude >= 39.0 && longitude <= 40.5) {
                locationName = language === 'ar' ? 'المدينة المنورة - موقعك الحالي' : 'Medina - Your Location';
              }
              form.setValue('pickupLocation', locationName);
            });
          
          // Location set successfully without notification
        },
        (error) => {
          console.error('GPS Error:', error);
          let errorMessage = 'خطأ غير معروف';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'تم رفض إذن الوصول للموقع';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'الموقع غير متاح';
              break;
            case error.TIMEOUT:
              errorMessage = 'انتهت مهلة تحديد الموقع';
              break;
          }
          
          toast({
            title: 'فشل في تحديد الموقع الحقيقي',
            description: `${errorMessage}. يرجى السماح بالوصول للموقع وإعادة المحاولة.`,
            variant: 'destructive',
            duration: 8000,
          });
        },
        options
      );
    } else {
      toast({
        title: 'GPS غير مدعوم',
        description: 'متصفحك لا يدعم خدمات الموقع',
        variant: 'destructive',
      });
    }
  }, [form, toast]);

  const onSubmit = (data: FormData) => {
    // التحقق من وجود الموقع الحقيقي
    if (!currentLocation || !currentLocation.latitude || !currentLocation.longitude) {
      toast({
        title: language === 'ar' ? 'خطأ في الموقع' : 'Location Error',
        description: language === 'ar' ? 
          'لم يتم تحديد موقعك الحقيقي بعد. يرجى الانتظار أو الضغط على زر تحديث الموقع.' : 
          'Your real location has not been determined yet. Please wait or press the refresh location button.',
        variant: 'destructive',
      });
      return;
    }

    // التحقق من اختيار الحيوان الأليف
    if (selectedPatients.length === 0) {
      toast({
        title: language === 'ar' ? 'يرجى اختيار الحيوانات الأليفة' : 'Please select pets',
        description: language === 'ar' ? 
          'يرجى اختيار حيوان أليف واحد على الأقل واحد على الأقل للخدمة البيطرية.' : 
          'Please select at least one pet for veterinary service.',
        variant: 'destructive',
      });
      return;
    }

    // التحقق من اختيار نوع الخدمة
    if (!serviceType) {
      toast({
        title: language === 'ar' ? 'يرجى اختيار نوع الخدمة' : 'Please select service type',
        description: language === 'ar' ? 
          'يرجى اختيار نوع الخدمة المطلوبة.' : 
          'Please select the required service type.',
        variant: 'destructive',
      });
      return;
    }

    // حفظ بيانات الطلب في localStorage للانتقال إلى صفحة حجز VetsVan
    const requestData = {
      ...data,
      pickupLatitude: currentLocation.latitude,
      pickupLongitude: currentLocation.longitude,
      destinationLatitude: currentLocation.latitude,
      destinationLongitude: currentLocation.longitude,
      serviceType: serviceType,
      selectedPatients: selectedPatients,
      location: data.pickupLocation || 'موقعك الحالي'
    };

    console.log('Saving request data for VetsVan booking:', requestData);
    localStorage.setItem('pendingRequest', JSON.stringify(requestData));
    
    // التوجه إلى صفحة حجز VetsVan
    setLocation('/vetsvan-booking');
  };

  // تحديث الموقع تلقائياً عند تغيير GPS من useGeolocation hook
  useEffect(() => {
    if (latitude && longitude && accuracy) {
      console.log('useGeolocation hook update:', latitude, longitude, accuracy);
      
      // فحص ما إذا كان الموقع داخل المملكة العربية السعودية
      const isInSaudiArabia = latitude >= 15 && latitude <= 33 && longitude >= 34 && longitude <= 56;
      
      if (isInSaudiArabia) {
        setCurrentLocation({ latitude, longitude });
        form.setValue('pickupLatitude', latitude);
        form.setValue('pickupLongitude', longitude);
        
        // تحديد اسم المنطقة حسب الإحداثيات - عرض مبسط
        let locationName = 'موقعك الحالي';
        
        if (latitude >= 24.0 && latitude <= 25.5 && longitude >= 46.0 && longitude <= 47.5) {
          locationName = 'الرياض - موقعك الحالي';
        } else if (latitude >= 21.0 && latitude <= 22.0 && longitude >= 39.0 && longitude <= 39.8) {
          locationName = 'جدة - موقعك الحالي';
        } else if (latitude >= 26.0 && latitude <= 27.0 && longitude >= 49.5 && longitude <= 50.5) {
          locationName = 'الدمام - موقعك الحالي';
        } else if (latitude >= 24.0 && latitude <= 25.0 && longitude >= 39.0 && longitude <= 40.5) {
          locationName = 'المدينة المنورة - موقعك الحالي';
        }
        
        form.setValue('pickupLocation', locationName);
        
        // Location updated with high accuracy - no notification needed
      } else {
        toast({
          title: 'موقع خارج المملكة',
          description: `تم اكتشاف موقع خارج المملكة العربية السعودية`,
          variant: 'destructive',
        });
      }
    }
  }, [latitude, longitude, accuracy, form, toast]);

  // دوال التحكم في زر السحب
  const handleSlideStart = (e: React.TouchEvent | React.MouseEvent) => {
    console.log('handleSlideStart called');
    console.log('Location:', currentLocation);
    console.log('Patients:', selectedPatients);
    console.log('Service:', serviceType);
    
    // Check if only birds are selected
    const onlyBirdsSelected = isOnlyBirdsSelected(selectedPatients, patients);
    
    if (!currentLocation || selectedPatients.length === 0 || !serviceType || onlyBirdsSelected) {
      if (onlyBirdsSelected) {
        console.log('Cannot slide - only birds selected');
        toast({
          title: language === 'ar' ? 'خدمة غير متاحة للطيور' : 'Service not available for birds',
          description: language === 'ar' ? 
            'يرجى اختيار حيوانات أليفة أخرى غير الطيور لاستكمال الطلب' : 
            'Please select pets other than birds to continue with the request',
          variant: 'destructive',
          duration: 4000,
        });
      } else {
        console.log('Cannot slide - missing data');
      }
      return;
    }
    
    console.log('Starting slide...');
    setIsSliding(true);
    e.preventDefault();
  };

  const handleSlideMove = (e: React.TouchEvent | React.MouseEvent) => {
    console.log('handleSlideMove called, isSliding:', isSliding);
    if (!isSliding) return;
    
    const container = e.currentTarget as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    let clientX: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    const maxPosition = containerRect.width - 64; // 64px = w-16
    const newPosition = Math.max(0, Math.min(maxPosition, clientX - containerRect.left - 32));
    setSlidePosition(newPosition);
    console.log('New position:', newPosition, 'Container width:', containerRect.width);
    
    // تحقق من اكتمال السحب (75% لإعطاء المستخدم فرصة أكبر للتأكيد)
    const threshold = containerRect.width * 0.75;
    console.log('Threshold:', threshold, 'Position:', newPosition);
    if (newPosition > threshold) {
      console.log('Threshold reached! Completing slide...');
      setIsSlideComplete(true);
      setIsSliding(false);
      // استدعاء مباشر بدلاً من setTimeout لتجنب مشكلة state timing
      executeRideRequest();
    }
  };

  const handleSlideEnd = () => {
    setIsSliding(false);
    if (!isSlideComplete) {
      // إعادة السيارة بسلاسة للموقع الأصلي
      setTimeout(() => setSlidePosition(0), 50);
    }
  };

  // دالة لتنفيذ الدفع قبل التوجه لصفحة الحجز
  const executeRideRequest = async () => {
    console.log('executeRideRequest called - Starting payment flow');
    console.log('Current location:', currentLocation);
    console.log('Selected patients:', selectedPatients);
    console.log('Service type:', serviceType);
    
    // التأكد من صحة البيانات قبل الإرسال
    const onlyBirdsSelected = isOnlyBirdsSelected(selectedPatients, patients);
    
    if (!currentLocation || selectedPatients.length === 0 || !serviceType || onlyBirdsSelected) {
      if (onlyBirdsSelected) {
        console.log('Cannot proceed - only birds selected');
        toast({
          title: language === 'ar' ? 'خدمة غير متاحة للطيور' : 'Service not available for birds',
          description: language === 'ar' ? 
            'يرجى اختيار حيوانات أليفة أخرى غير الطيور لاستكمال الطلب' : 
            'Please select pets other than birds to continue with the request',
          variant: 'destructive',
          duration: 4000,
        });
        return;
      }
      console.log('Missing required data for ride request');
      
      if (!currentLocation) {
        toast({
          title: language === 'ar' ? 'خطأ في الموقع' : 'Location Error',
          description: language === 'ar' ? 'لم يتم تحديد موقعك بعد' : 'Location not determined yet',
          variant: 'destructive',
        });
      } else if (selectedPatients.length === 0) {
        toast({
          title: language === 'ar' ? 'يرجى اختيار الحيوانات الأليفة' : 'Please select pets',
          description: language === 'ar' ? 'يرجى اختيار حيوان أليف واحد على الأقل' : 'Please select at least one pet',
          variant: 'destructive',
        });
      } else if (!serviceType) {
        toast({
          title: language === 'ar' ? 'يرجى اختيار نوع الخدمة' : 'Please select service type',
          description: language === 'ar' ? 'يرجى اختيار نوع الخدمة المطلوبة' : 'Please select the required service type',
          variant: 'destructive',
        });
      }
      
      // إعادة تعيين السحب عند الفشل
      setIsSlideComplete(false);
      setSlidePosition(0);
      return;
    }

    // التحقق من وجود التكلفة التقديرية - تجاوز للخدمات المجانية
    const { total: estimatedCost } = getEstimatedCost(selectedPatients, patients, serviceType);
    
    // Special handling for free services
    if (serviceType === 'free-deworming') {
      // Skip payment flow and go directly to booking
      const requestData = {
        pickupLatitude: currentLocation.latitude,
        pickupLongitude: currentLocation.longitude,
        selectedPatients,
        serviceType,
        location: form.getValues('pickupLocation'),
        estimatedCost: 0,
      };
      
      console.log('Free service selected - saving request data and redirecting to booking:', requestData);
      localStorage.setItem('pendingRequest', JSON.stringify(requestData));
      
      toast({
        title: language === 'ar' ? 'خدمة مجانية!' : 'Free Service!',
        description: language === 'ar' ? 
          'يتم توجيهك مباشرة لحجز الموعد' : 
          'Redirecting directly to appointment booking',
      });
      
      // Reset slide state before redirect
      setIsSlideComplete(false);
      setSlidePosition(0);
      
      // Redirect to booking page
      setTimeout(() => {
        setLocation('/vetsvan-booking');
      }, 1000);
      return;
    }
    
    if (!estimatedCost || estimatedCost <= 0) {
      toast({
        title: language === 'ar' ? 'خطأ في التكلفة' : 'Cost Error',
        description: language === 'ar' ? 'لا يمكن تحديد تكلفة الخدمة' : 'Cannot determine service cost',
        variant: 'destructive',
      });
      setIsSlideComplete(false);
      setSlidePosition(0);
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      // حفظ بيانات الطلب في localStorage للاستخدام بعد الدفع
      const requestData = {
        pickupLatitude: currentLocation.latitude,
        pickupLongitude: currentLocation.longitude,
        selectedPatients,
        serviceType,
        location: form.getValues('pickupLocation'),
        estimatedCost,
      };
      
      console.log('Saving request data to localStorage:', requestData);
      localStorage.setItem('pendingRequest', JSON.stringify(requestData));
      
      // إنشاء رابط الدفع مع البيانات الحقيقية للمستخدم
      console.log('Creating authenticated payment link with cost:', estimatedCost);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: language === 'ar' ? 'خطأ في المصادقة' : 'Authentication Error',
          description: language === 'ar' ? 'يرجى تسجيل الدخول مرة أخرى' : 'Please log in again',
          variant: 'destructive',
        });
        setLocation('/login');
        return;
      }

      const response = await fetch('/api/public/payments/test-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          invoiceNumber: `RIDE-${Date.now()}`,
          amount: estimatedCost.toString(),
          description: `VetsVan Service: ${serviceType} for ${selectedPatients.length} pet(s)`,
          successUrl: `${window.location.origin}/payment-success`,
          errorUrl: `${window.location.origin}/ride-request?payment=failed`
        })
      });

      const responseData = await response.json();

      if (responseData.success && responseData.data?.paymentUrl) {
        console.log('Payment link created successfully:', responseData.data.paymentUrl);
        
        toast({
          title: language === 'ar' ? 'جاري التوجه للدفع' : 'Redirecting to Payment',
          description: language === 'ar' ? 
            `تكلفة الخدمة: ${estimatedCost} ريال` : 
            `Service cost: ${estimatedCost} SAR`,
        });
        
        // التوجه مباشرة لصفحة الدفع
        window.location.href = responseData.data.paymentUrl;
      } else {
        throw new Error(responseData.message || 'Payment link creation failed');
      }
    } catch (error: any) {
      console.error('Payment creation error:', error);
      toast({
        title: language === 'ar' ? 'خطأ في الدفع' : 'Payment Error',
        description: language === 'ar' ? 
          `فشل في إنشاء رابط الدفع: ${error.message}` : 
          `Failed to create payment link: ${error.message}`,
        variant: 'destructive'
      });
      
      // إعادة تعيين السحب عند الفشل
      setIsSlideComplete(false);
      setSlidePosition(0);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSlideComplete = async () => {
    console.log('handleSlideComplete called, isSlideComplete:', isSlideComplete);
    if (!isSlideComplete) {
      console.log('Not slide complete, returning');
      return;
    }
    
    console.log('Slide completed - executing ride request');
    console.log('Current location:', currentLocation);
    console.log('Selected patients:', selectedPatients);
    console.log('Service type:', serviceType);
    
    // التأكد من صحة البيانات قبل الإرسال
    if (!currentLocation || selectedPatients.length === 0 || !serviceType) {
      console.log('Missing required data for ride request');
      
      if (!currentLocation) {
        toast({
          title: language === 'ar' ? 'خطأ في الموقع' : 'Location Error',
          description: language === 'ar' ? 'لم يتم تحديد موقعك بعد' : 'Location not determined yet',
          variant: 'destructive',
        });
      } else if (selectedPatients.length === 0) {
        toast({
          title: language === 'ar' ? 'يرجى اختيار الحيوانات الأليفة' : 'Please select pets',
          description: language === 'ar' ? 'يرجى اختيار حيوان أليف واحد على الأقل' : 'Please select at least one pet',
          variant: 'destructive',
        });
      } else if (!serviceType) {
        toast({
          title: language === 'ar' ? 'يرجى اختيار نوع الخدمة' : 'Please select service type',
          description: language === 'ar' ? 'يرجى اختيار نوع الخدمة المطلوبة' : 'Please select the required service type',
          variant: 'destructive',
        });
      }
      
      // إعادة تعيين السحب عند الفشل
      setIsSlideComplete(false);
      setSlidePosition(0);
      return;
    }
    
    // تنفيذ الطلب
    const formData = form.getValues();
    console.log('Form data before submit:', formData);
    onSubmit(formData);
  };

  // إعادة تعيين السحب بعد الإرسال
  useEffect(() => {
    if (!isRequestingRide && isSlideComplete) {
      setTimeout(() => {
        setIsSlideComplete(false);
        setSlidePosition(0);
      }, 1000);
    }
  }, [isRequestingRide, isSlideComplete]);

  // التعامل مع أخطاء GPS من useGeolocation hook
  useEffect(() => {
    if (gpsError) {
      console.log('GPS Error from hook:', gpsError);
      toast({
        title: 'خطأ في GPS Hook',
        description: `${gpsError}`,
        variant: 'destructive',
      });
    }
  }, [gpsError, toast]);

  const refreshLocation = () => {
    // طلب موقع جديد بدقة عالية
    if (navigator.geolocation) {
      toast({
        title: 'يتم تحديث الموقع...',
        description: 'الرجاء الانتظار',
      });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('Refreshed GPS Location:', latitude, longitude, 'Accuracy:', accuracy);
          
          setCurrentLocation({ latitude, longitude });
          form.setValue('pickupLatitude', latitude);
          form.setValue('pickupLongitude', longitude);
          
          // تحديد اسم الموقع الجديد - عرض مبسط
          let locationName = 'موقعك المحدث';
          
          if (latitude >= 24.0 && latitude <= 25.5 && longitude >= 46.0 && longitude <= 47.5) {
            locationName = 'الرياض - موقعك المحدث';
          } else if (latitude >= 21.0 && latitude <= 22.0 && longitude >= 39.0 && longitude <= 39.8) {
            locationName = 'جدة - موقعك المحدث';
          } else if (latitude >= 26.0 && latitude <= 27.0 && longitude >= 49.5 && longitude <= 50.5) {
            locationName = 'الدمام - موقعك المحدث';
          }
          
          form.setValue('pickupLocation', locationName);
          
          // Location refreshed successfully without notification
        },
        (error) => {
          console.error('Refresh GPS Error:', error);
          toast({
            title: 'فشل في تحديث الموقع',
            description: 'يرجى التأكد من تفعيل GPS والسماح للمتصفح بالوصول للموقع',
            variant: 'destructive',
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Force fresh location
        }
      );
    }
  };

  // تحميل بيانات المستخدم
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLocation('/');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setLocation('/');
      }
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={direction}>
      <div className="max-w-md mx-auto bg-white shadow-sm overflow-hidden">
        {/* Header - Exact copy from home.tsx */}
        <div className="bg-white text-gray-800 px-2 py-3 h-12 shadow-sm">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center">
              <img 
                src={logoImage} 
                alt="VETS VAN Logo" 
                className="h-8 w-auto object-contain"
                style={{ 
                  maxWidth: '60px',
                  border: 'none !important',
                  outline: 'none !important',
                  boxShadow: 'none !important',
                  filter: 'none !important',
                  background: 'transparent !important'
                }}
              />
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="text-sm font-semibold text-gray-800" style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}>
                {language === 'ar' ? 'طلب الخدمة' : 'Ride Request'}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <LanguageSelector />
              <Bell className="w-4 h-4 cursor-pointer text-gray-600 hover:text-gray-800" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="bg-purple-600 text-white hover:bg-purple-600 px-2 py-1 h-7 rounded text-xs"
              >
                {language === 'ar' ? 'خروج' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>

        {/* Purple Divider Line */}
        <div className="h-1 bg-purple-600 shadow-sm"></div>

        <div className="p-4 pb-20">
        {/* Pet Selection Section */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3" style={{ 
              textAlign,
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {t('selectPatients')}
            </h2>
            <p className="text-sm text-gray-600 mb-4" style={{ 
              textAlign,
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {t('selectPatientsDesc')}
            </p>
            
            {/* Pets Image */}
            <div className="flex justify-center mb-6">
              <img 
                src={petsImage} 
                alt="Pets" 
                className="w-40 h-40 object-contain rounded-lg shadow-lg"
              />
            </div>
            
            {isLoadingPatients ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2" style={{ textAlign }}>
                  {language === 'ar' ? 'جاري تحميل الحيوانات الأليفة...' : 'Loading pets...'}
                </span>
              </div>
            ) : !patients || patients.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <PawPrint className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-2" style={{ textAlign }}>
                  {t('noRegisteredPatients')}
                </h3>
                <p className="text-gray-600 mb-4" style={{ textAlign }}>
                  {t('registerPetsFirst')}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/account')}
                >
                  {t('goToPatients')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Multi-Select Pets using Clean Design */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2" style={{ flexDirection: language === 'ar' ? 'row-reverse' : 'row', textAlign }}>
                    <img 
                      src={selectPetsLogo} 
                      alt="Select Pets Logo" 
                      className="w-6 h-6 select-pets-logo object-cover"
                    />
                    <label htmlFor="pet-select-trigger" className="text-lg font-semibold text-gray-600" style={{ 
                      textAlign,
                      fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                    }}>
                      {language === 'ar' ? 'اختر الحيوانات الأليفة: ' : 'Select Pets: '}
                    </label>
                  </div>
                  
                  {/* Pet Selection Dropdown */}
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value) {
                        const petId = parseInt(value);
                        if (!selectedPatients.includes(petId)) {
                          setSelectedPatients(prev => [...prev, petId]);
                        }
                      }
                    }}
                  >
                    <SelectTrigger id="pet-select-trigger" className="w-full">
                      <SelectValue placeholder={
                        language === 'ar' ? 'أضف حيوان أليف...' : 'Add pet...'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.filter(patient => !selectedPatients.includes(patient.id)).map((patient: Patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()} className="select-item-custom">
                          <div className="flex items-center gap-2">
                            <span>
                              {patient.type === 'Cat' ? '🐱' : patient.type === 'Dog' ? '🐶' : '🐦'}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-medium">{patient.name}</span>
                              <span className="text-xs text-gray-500">
                                {patient.type === 'Cat' ? (language === 'ar' ? 'قطة' : 'Cat') :
                                 patient.type === 'Dog' ? (language === 'ar' ? 'كلب' : 'Dog') :
                                 (language === 'ar' ? 'طائر' : 'Bird')}
                                {patient.ageYear && (
                                  <span> • {patient.ageYear} {language === 'ar' ? 'سنة' : 'years'}</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Display Selected Pets */}
                  <div className="min-h-[48px] border border-gray-300 rounded-md p-2 bg-white flex flex-wrap gap-2 items-center">
                    {selectedPatients.length === 0 ? (
                      <span className="text-gray-500 text-sm" style={{ 
                        textAlign,
                        fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                      }}>
                        {language === 'ar' ? 'لم يتم اختيار حيوانات بعد...' : 'No pets selected yet...'}
                      </span>
                    ) : (
                      selectedPatients.map(petId => {
                        const pet = patients.find(p => p.id === petId);
                        if (!pet) return null;
                        return (
                          <div
                            key={petId}
                            className="flex items-center gap-2 bg-purple-600 border border-purple-600 rounded-full px-3 py-1 text-sm"
                          >
                            <span>
                              {pet.type === 'Cat' ? '🐱' : pet.type === 'Dog' ? '🐶' : '🐦'}
                            </span>
                            <span className="font-medium">{pet.name}</span>
                            <button
                              onClick={() => setSelectedPatients(prev => prev.filter(id => id !== petId))}
                              className="text-purple-600 hover:text-purple-600 ml-1"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Quick Select All Button */}
                  {patients.length > 1 && selectedPatients.length < patients.length && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPatients(patients.map(p => p.id))}
                      className="text-purple-600 border-purple-600 hover:bg-purple-100"
                    >
                      {language === 'ar' ? 'اختيار الكل' : 'Select All'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Type Selection */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <img 
                src={serviceTypeIcon} 
                alt="Service Type" 
                className="w-6 h-6 object-contain"
              />
              <h2 className="text-lg font-semibold text-gray-600" style={{ 
                textAlign,
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}>
                {t('selectServiceType')}
              </h2>
            </div>
            <Select
              value={serviceType}
              onValueChange={(value) => {
                handleServiceTypeChange(value);
                form.setValue('serviceType', value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={
                  language === 'ar' ? 'اختر نوع الخدمة...' : 'Select service type...'
                } />
              </SelectTrigger>
              <SelectContent className="max-h-[240px] overflow-y-auto">

                <SelectItem value="home-consultation" className="select-item-custom">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-green-700" />
                    <span>{language === 'ar' ? 'استشارة منزلية' : 'Home Consultation'}</span>
                  </div>
                </SelectItem>



                <SelectItem value="pickup-drop" className="select-item-custom">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-indigo-600" />
                    <span>{language === 'ar' ? 'نقل وتوصيل' : 'Pickup & Drop'}</span>
                  </div>
                </SelectItem>
                <SelectItem value="grooming" className="select-item-custom">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-pink-600" />
                    <span>{t('grooming')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="neutering" className="select-item-custom">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-600" />
                    <span>{language === 'ar' ? 'خصي/تعقيم' : 'Neutering'}</span>
                  </div>
                </SelectItem>
                <SelectItem value="surgery" className="select-item-custom">
                  <div className="flex items-center gap-2">
                    <ShieldPlus className="w-4 h-4 text-red-600" />
                    <span>{language === 'ar' ? 'جراحة' : 'Surgery'}</span>
                  </div>
                </SelectItem>
                <SelectItem value="ct-scan" className="select-item-custom">
                  <div className="flex items-center gap-2">
                    <Scan className="w-4 h-4 text-green-600" />
                    <span>{language === 'ar' ? 'أشعة مقطعية' : 'CT-Scan'}</span>
                  </div>
                </SelectItem>
                <SelectItem value="test-service" className="select-item-custom">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-600" />
                    <span>{language === 'ar' ? 'خدمة اختبار' : 'Test Service'}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Estimated Cost Display */}
            {selectedPatients.length > 0 && 
             ['first-visit', 'general-checkup', 'home-consultation', 'vaccination', 'deworming', 'free-deworming', 'test-service', 'fleas-ticks-prevention', 'pickup-drop'].includes(serviceType) && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                {(() => {
                  const costData = getEstimatedCost(selectedPatients, patients, serviceType);
                  return (
                    <>
                      {/* Show breakdown for services with consultation fee */}
                      {costData.consultationFee && costData.serviceCost !== undefined ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-purple-800" style={{ 
                              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                            }}>
                              {language === 'ar' ? 'رسوم الاستشارة:' : 'Consultation Fees:'}
                            </span>
                            <span className="text-sm font-bold text-purple-900" style={{ 
                              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                            }}>
                              {costData.consultationFee.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-purple-800" style={{ 
                              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                            }}>
                              {serviceType === 'vaccination' && (language === 'ar' ? 'التطعيم:' : 'Vaccination:')}
                              {serviceType === 'deworming' && (language === 'ar' ? 'مكافحة الديدان:' : 'Deworming:')}
                              {serviceType === 'fleas-ticks-prevention' && (language === 'ar' ? 'مكافحة البراغيث والقراد:' : 'Fleas & Ticks Prevention:')}
                            </span>
                            <span className="text-sm font-bold text-purple-900" style={{ 
                              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                            }}>
                              {costData.serviceCost.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}
                            </span>
                          </div>
                          <div className="border-t border-purple-200 pt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-purple-800" style={{ 
                                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                              }}>
                                {language === 'ar' ? 'الإجمالي:' : 'Total:'}
                              </span>
                              <span className="text-lg font-bold text-purple-900" style={{ 
                                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                              }}>
                                {costData.total.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-purple-800" style={{ 
                            fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                          }}>
                            {language === 'ar' ? 'التكلفة التقديرية:' : 'Estimated Cost:'}
                          </span>
                          <span className="text-lg font-bold text-purple-900" style={{ 
                            fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                          }}>
                            {costData.total.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}
                          </span>
                        </div>
                      )}
                      
                      {/* Show breakdown for fleas-ticks-prevention */}
                      {serviceType === 'fleas-ticks-prevention' && costData.breakdown.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs font-medium text-purple-700" style={{ 
                            fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                          }}>
                            {language === 'ar' ? 'تفصيل التكاليف:' : 'Cost Breakdown:'}
                          </div>
                          {costData.breakdown.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-xs text-purple-600 bg-white rounded px-2 py-1">
                              <div className="flex items-center gap-1">
                                <span>{item.name}</span>
                                <span className="text-gray-500">
                                  ({item.type.toLowerCase() === 'cat' ? (language === 'ar' ? 'قطة' : 'Cat') :
                                    item.type.toLowerCase() === 'dog' ? (language === 'ar' ? 'كلب' : 'Dog') :
                                    item.type})
                                </span>
                                {item.weight > 0 && (
                                  <span className="text-gray-500">- {item.weight}kg</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">{item.tier}</span>
                                <span className="font-medium">{item.cost.toFixed(2)} SAR</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Show warnings if any */}
                      {costData.warnings.length > 0 && (
                        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                          <div className="text-xs font-medium text-orange-700 mb-1" style={{ 
                            fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                          }}>
                            {language === 'ar' ? 'تحذيرات:' : 'Warnings:'}
                          </div>
                          {costData.warnings.map((warning, index) => (
                            <div key={index} className="text-xs text-orange-600">
                              {warning}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>



        {/* Location Input */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="pickupLocation"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <img 
                          src={locationIcon} 
                          alt="Location" 
                          className="w-5 h-5 object-contain"
                        />
                        <FormLabel className="text-lg font-semibold text-gray-600" style={{ 
                          textAlign,
                          fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                        }}>{t('yourLocation')}</FormLabel>
                      </div>
                      <div className="flex items-center gap-3">
                        <Circle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={language === 'ar' ? 'موقعك الحالي' : 'Your current location'}
                            className={`flex-1 ${textAlign === 'right' ? 'text-right' : 'text-left'}`}
                            style={{ textAlign }}
                            readOnly
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={refreshLocation}
                          disabled={isLoadingGPS}
                          title={isLoadingGPS ? 
                            (language === 'ar' ? "يتم تحديد الموقع..." : "Detecting location...") : 
                            (language === 'ar' ? "تحديث الموقع" : "Update location")
                          }
                        >
                          {isLoadingGPS ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                      <p className="text-xs text-gray-500 mt-1" style={{ textAlign }}>
                        {language === 'ar' ? 'العيادة البيطرية ستأتي إلى موقعك الحالي' : 'The veterinary clinic will come to your current location'}
                      </p>
                    </FormItem>
                  )}
                />

                {/* Slide to Confirm Button */}
                <div className="relative w-full">
                  <div
                    className="relative w-full h-16 bg-gradient-to-r from-purple-600 to-purple-600 rounded-full overflow-hidden shadow-lg cursor-pointer select-none"
                    onMouseDown={handleSlideStart}
                    onMouseMove={handleSlideMove}
                    onMouseUp={handleSlideEnd}
                    onMouseLeave={handleSlideEnd}
                    onTouchStart={handleSlideStart}
                    onTouchMove={handleSlideMove}
                    onTouchEnd={handleSlideEnd}
                    onTouchCancel={handleSlideEnd}
                    style={{ touchAction: 'none' }}
                  >
                    {/* Background Track */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {isProcessingPayment ? 
                          (language === 'ar' ? 'جاري إنشاء الدفعة...' : 'Creating payment...') :
                          isRequestingRide ? 
                          (language === 'ar' ? 'جاري إرسال الطلب...' : 'Sending request...') :
                          !currentLocation ? 
                          (language === 'ar' ? 'في انتظار تحديد الموقع...' : 'Waiting for location...') :
                          isOnlyBirdsSelected(selectedPatients, patients) ?
                          (language === 'ar' ? 'خدمة غير متاحة للطيور' : 'Service not available for birds') :
                          isSlideComplete ?
                          (language === 'ar' ? 'تم التأكيد!' : 'Confirmed!') :
                          (language === 'ar' ? 'اسحب للتأكيد' : 'Slide to Confirm')
                        }
                      </span>
                    </div>

                    {/* Progress Fill */}
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-600 to-purple-600"
                      style={{ 
                        width: `${Math.min(100, (slidePosition / (window.innerWidth - 100)) * 100)}%`,
                        transition: isSliding ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />

                    {/* Sliding Van */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing active:scale-105"
                      style={{ 
                        left: `${slidePosition}px`,
                        opacity: (!currentLocation || selectedPatients.length === 0 || !serviceType || isProcessingPayment || isOnlyBirdsSelected(selectedPatients, patients)) ? 0.5 : 1,
                        pointerEvents: (!currentLocation || selectedPatients.length === 0 || !serviceType || isProcessingPayment || isOnlyBirdsSelected(selectedPatients, patients)) ? 'none' : 'auto',
                        transform: `translateY(-50%) ${isSliding ? 'scale(1.05)' : 'scale(1)'}`,
                        transition: isSliding ? 'transform 0.1s ease-out' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseDown={handleSlideStart}
                      onTouchStart={handleSlideStart}
                    >
                      {isProcessingPayment || isRequestingRide ? (
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                      ) : isSlideComplete ? (
                        <Check className="w-8 h-8 text-green-600" />
                      ) : (
                        <img 
                          src={vetVanImage} 
                          alt="Vet Van" 
                          className="w-12 h-12 object-contain"
                        />
                      )}
                    </div>
                  </div>

                  {/* Subtitle */}
                  {!isRequestingRide && currentLocation && (
                    <div className="text-center mt-2 text-sm text-gray-600">
                      {language === 'ar' ? 'عيادة بيطرية متنقلة' : 'Mobile Veterinary Clinic'}
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>


        </div>
      </div>

      {/* Partners Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={() => {}} // Disable default close behavior
      >
        <DialogContent 
          className="sm:max-w-md [&>button]:hidden" // Hide the close button
          onInteractOutside={(e) => e.preventDefault()} // Block outside clicks
          onEscapeKeyDown={(e) => e.preventDefault()}   // Block Escape key
        >
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gray-800" style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {language === 'ar' ? 'شركاؤونا' : 'Our Partners'}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-600" style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {language === 'ar' 
                ? 'خدمات متخصصة متوفرة لدى شركائنا' 
                : 'Specialized services available at our partner clinics'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 p-4">
            {/* Partners Logos */}
            <div className="flex justify-center items-start gap-8 mb-6">
              {/* Show Dr. Paws only for non-CT-Scan services */}
              {!eliteOnlyServices.includes(serviceType) && (
                <div className="flex flex-col items-center">
                  <img 
                    src={drPawsLogo} 
                    alt="Dr. Paws Logo" 
                    className="w-16 h-16 object-contain mb-2"
                  />
                  <div className="flex gap-2">
                    {/* Phone Icon */}
                    <button
                      onClick={() => window.open('tel:+966920003045', '_self')}
                      className="p-2 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
                      title="Call Dr. Paws"
                    >
                      <Phone className="w-4 h-4 text-green-600" />
                    </button>
                    {/* WhatsApp Icon */}
                    <button
                      onClick={() => window.open('https://wa.me/966920003045', '_blank')}
                      className="p-2 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
                      title="WhatsApp Dr. Paws"
                    >
                      <MessageCircle className="w-4 h-4 text-green-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* Elite Vet - Always show */}
              <div className="flex flex-col items-center">
                <img 
                  src={eliteVetLogo} 
                  alt="Elite Vet Logo" 
                  className="w-16 h-16 object-contain mb-2"
                />
                <div className="flex gap-2">
                  {/* Phone Icon */}
                  <button
                    onClick={() => window.open('tel:+966920011626', '_self')}
                    className="p-2 bg-purple-100 hover:bg-purple-200 rounded-full transition-colors"
                    title="Call Elite Vet"
                  >
                    <Phone className="w-4 h-4 text-purple-600" />
                  </button>
                  {/* WhatsApp Icon */}
                  <button
                    onClick={() => window.open('https://wa.me/966920011626', '_blank')}
                    className="p-2 bg-purple-100 hover:bg-purple-200 rounded-full transition-colors"
                    title="WhatsApp Elite Vet"
                  >
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="text-center">
              <p className="text-gray-700 leading-relaxed" style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive',
                textAlign: language === 'ar' ? 'right' : 'left',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}>
                {language === 'ar' 
                  ? 'اننا لا نقوم بالخدمات هذه في عياداتنا المتنقله ولكن ممكن عند اي من شركائنا الحاليين'
                  : 'We do not provide these services in our mobile clinics, but they are available at any of our current partners'
                }
              </p>
            </div>

            {/* OK Button - Only way to close dialog */}
            <div className="flex justify-center mt-6">
              <Button 
                onClick={handleDialogOkClick}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                style={{
                  fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                }}
              >
                {language === 'ar' ? 'موافق' : 'OK'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Multi-Pet Weight Modal for Fleas & Ticks Prevention */}
      <Dialog open={showWeightModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center" style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive',
              textAlign: 'center',
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}>
              {language === 'ar' ? 'إدخال أوزان الحيوانات الأليفة' : 'Enter Pet Weights'}
            </DialogTitle>
            <DialogDescription className="text-center" style={{
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive',
              textAlign: 'center',
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}>
              {language === 'ar' 
                ? `يرجى إدخال أوزان الحيوانات الأليفة التالية لمتابعة خدمة الوقاية من القراد والبراغيث`
                : `Please enter weights for the following pets to continue with Fleas & Ticks Prevention service`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {patientsForWeight.map((pet) => (
              <div key={pet.id} className="border rounded-lg p-4 space-y-3">
                {/* Pet Info Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    {pet.type === 'Cat' && <Cat className="w-5 h-5 text-purple-600" />}
                    {pet.type === 'Dog' && <Dog className="w-5 h-5 text-purple-600" />}
                    {pet.type === 'Bird' && <Bird className="w-5 h-5 text-purple-600" />}
                    {!['Cat', 'Dog', 'Bird'].includes(pet.type) && <PawPrint className="w-5 h-5 text-purple-600" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900" style={{
                      fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                    }}>
                      {pet.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {language === 'ar' ? 
                        (pet.type === 'Cat' ? 'قطة' : 
                         pet.type === 'Dog' ? 'كلب' : 
                         pet.type === 'Bird' ? 'طائر' : 
                         'حيوان أليف') :
                        pet.type
                      }
                    </p>
                  </div>
                </div>

                {/* Weight Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" style={{
                    fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                  }}>
                    {language === 'ar' ? 'الوزن (كجم)' : 'Weight (kg)'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      value={patientWeights[pet.id] || ''}
                      onChange={(e) => handlePetWeightChange(pet.id, e.target.value)}
                      className={`border-2 focus:border-purple-600 rounded-lg ${
                        weightErrors[pet.id] ? 'border-red-500' : 'border-purple-600'
                      }`}
                      placeholder={language === 'ar' ? 'أدخل الوزن (مثل: 5.3)' : 'Enter weight (e.g., 5.3)'}
                      style={{ 
                        paddingRight: language === 'ar' ? '12px' : '50px', 
                        paddingLeft: language === 'ar' ? '50px' : '12px',
                        direction: 'ltr',
                        textAlign: 'left'
                      }}
                      disabled={updatingWeights[pet.id]}
                    />
                    <span 
                      className="absolute top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none"
                      style={{ [language === 'ar' ? 'left' : 'right']: '12px' }}
                    >
                      kg
                    </span>
                    {updatingWeights[pet.id] && (
                      <div className="absolute top-1/2 transform -translate-y-1/2 left-3">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      </div>
                    )}
                  </div>
                  {weightErrors[pet.id] && (
                    <p className="text-red-500 text-sm">{weightErrors[pet.id]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <Button 
              variant="outline"
              onClick={handleWeightCancel}
              disabled={Object.values(updatingWeights).some(Boolean)}
              className="px-6"
              style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleWeightSaveAll}
              disabled={
                Object.values(updatingWeights).some(Boolean) ||
                patientsForWeight.some(pet => !patientWeights[pet.id] || parseFloat(patientWeights[pet.id] || '0') <= 0)
              }
              className="bg-purple-600 hover:bg-purple-700 text-white px-6"
              style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}
            >
              {Object.values(updatingWeights).some(Boolean) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : (
                language === 'ar' ? 'حفظ جميع الأوزان' : 'Save All Weights'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating RCM Communication Panel */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex flex-col gap-2">
          {/* WhatsApp Button */}
          <button
            onClick={() => window.open('https://wa.me/966920003045', '_blank')}
            className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
            title={language === 'ar' ? 'واتساب' : 'WhatsApp Support'}
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
          
          {/* Phone Call Button */}
          <button
            onClick={() => window.open('tel:+966920003045', '_self')}
            className="w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
            title={language === 'ar' ? 'اتصال هاتفي' : 'Phone Call'}
          >
            <Phone className="w-6 h-6 text-white" />
          </button>
          
          {/* SMS Button */}
          <button
            onClick={() => window.open('sms:+966920003045', '_self')}
            className="w-14 h-14 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
            title={language === 'ar' ? 'رسالة نصية' : 'SMS Message'}
            style={{ backgroundColor: '#852085' }}
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
