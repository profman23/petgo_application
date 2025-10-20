import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SERVICE_TYPE_OPTIONS } from "@/lib/service-types";
import { VetsVanBookingUnified } from "@/components/booking/VetsVanBookingUnified";
import serviceTypeIcon from "@assets/freepik_assistant_1751437667818_1751437676533.png";
import selectPetsLogo from "@/assets/select-pets-logo-new.png";

interface Patient {
  id: number;
  userId: number;
  name: string;
  type: string;
  ageYear?: number;
  ageMonth?: number;
  patientWeight?: number;
}

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
  
  return { cost: 0, tier: 'Unknown' };
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

  // National Day 95 Offer pricing for Home Consultation
  if (serviceType === 'national-day-home-consultation') {
    if (petCount <= 2) {
      total = 195; // 1-2 pets: 195 SAR
    } else if (petCount === 3) {
      total = 290; // 3 pets: 290 SAR (195 + 95)
    } else {
      total = 290 + ((petCount - 3) * 95); // 4+ pets: 290 + 95 per additional pet
    }
  }
  // National Day 95 Offer pricing for Vaccination & Deworming
  else if (serviceType === 'national-day-vaccination') {
    total = petCount * 95; // 95 SAR per pet
  }
  // Special pricing for First Visit and General Check-up (unchanged)
  else if (['first-visit', 'general-checkup'].includes(serviceType)) {
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

interface AddAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerData: {
    userId: number;
    userName: string;
    userPhone: string;
    userEmail: string;
    patientId: number | null;
    patientType: string;
    patientName: string;
  };
}

export function AddAppointmentDialog({ 
  open, 
  onOpenChange, 
  customerData 
}: AddAppointmentDialogProps) {
  const { language, t } = useTranslation();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  
  const [serviceType, setServiceType] = useState<string>("");
  const [manualLocation, setManualLocation] = useState<string>("");
  const [selectedPets, setSelectedPets] = useState<number[]>([]);
  const [showBookingTable, setShowBookingTable] = useState(false);

  // Fetch all pets for this customer
  const { data: petsData, isLoading: petsLoading } = useQuery({
    queryKey: ['/api/admin/customers', customerData.userId, 'pets'],
    queryFn: async () => {
      const response = await apiRequest(`/api/admin/customers/${customerData.userId}/pets`);
      return response;
    },
    enabled: open && customerData.userId > 0,
  });

  const pets: Patient[] = petsData?.pets || [];

  // Auto-select the first pet if available when dialog opens
  useEffect(() => {
    if (open && pets.length > 0 && selectedPets.length === 0) {
      setSelectedPets([pets[0].id]);
    }
  }, [open, pets, selectedPets.length]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setServiceType("");
      setManualLocation("");
      setSelectedPets([]);
      setShowBookingTable(false);
    }
  }, [open]);

  const handlePetToggle = (petId: number) => {
    setSelectedPets(prev => 
      prev.includes(petId) 
        ? prev.filter(id => id !== petId)
        : [...prev, petId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPets.length === pets.length) {
      setSelectedPets([]);
    } else {
      setSelectedPets(pets.map(p => p.id));
    }
  };

  const handleConfirm = () => {
    if (!serviceType) {
      alert(language === 'ar' ? 'الرجاء اختيار نوع الخدمة' : 'Please select a service type');
      return;
    }

    if (selectedPets.length === 0) {
      alert(language === 'ar' ? 'الرجاء اختيار حيوان أليف واحد على الأقل' : 'Please select at least one pet');
      return;
    }

    // Open the booking table modal
    setShowBookingTable(true);
  };

  const handleBookingComplete = () => {
    // Close both modals after successful booking
    setShowBookingTable(false);
    onOpenChange(false);
  };

  // Prepare booking data for the modal
  const bookingData = {
    userId: customerData.userId,
    userName: customerData.userName,
    userPhone: customerData.userPhone,
    selectedPatients: selectedPets,
    serviceType: serviceType,
    location: manualLocation || '',
    pickupLatitude: null,
    pickupLongitude: null,
    isAdminBooking: true,
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={direction}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive' }}>
              {language === 'ar' ? 'إضافة موعد' : 'Add Appointment'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 p-4">
            {/* Customer Information */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-md font-semibold text-purple-900 mb-3" style={{ 
                textAlign,
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}>
                {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
              </h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-purple-700 font-medium">{language === 'ar' ? 'اسم العميل:' : 'Customer Name:'}</span>
                  <p className="text-gray-900">{customerData.userName}</p>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">{language === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}</span>
                  <p className="text-gray-900" dir="ltr">{customerData.userPhone}</p>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">{language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</span>
                  <p className="text-gray-900">{customerData.userEmail || (language === 'ar' ? 'غير متوفر' : 'N/A')}</p>
                </div>
              </div>
            </div>

            {/* Pet Selection */}
            <div className="bg-white border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <img 
                  src={selectPetsLogo} 
                  alt="Select Pets" 
                  className="w-6 h-6 object-contain"
                />
                <h3 className="text-md font-semibold text-purple-900" style={{ 
                  textAlign,
                  fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                }}>
                  {language === 'ar' ? 'اختر الحيوانات الأليفة' : 'Select Pets'}
                </h3>
              </div>

              {petsLoading ? (
                <p className="text-gray-500 text-sm">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
              ) : pets.length === 0 ? (
                <p className="text-gray-500 text-sm">{language === 'ar' ? 'لا توجد حيوانات أليفة لهذا العميل' : 'No pets found for this customer'}</p>
              ) : (
                <>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {pets.map((pet) => (
                      <div
                        key={pet.id}
                        className="flex items-center gap-3 p-2 hover:bg-purple-50 rounded cursor-pointer"
                        onClick={() => handlePetToggle(pet.id)}
                      >
                        <Checkbox
                          checked={selectedPets.includes(pet.id)}
                          onCheckedChange={() => handlePetToggle(pet.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span>
                              {pet.type === 'Cat' ? '🐱' : pet.type === 'Dog' ? '🐶' : '🐦'}
                            </span>
                            <span className="font-medium text-gray-900">{pet.name}</span>
                            <span className="text-gray-500 text-sm">
                              ({pet.type === 'Cat' ? (language === 'ar' ? 'قطة' : 'Cat') :
                                pet.type === 'Dog' ? (language === 'ar' ? 'كلب' : 'Dog') :
                                (language === 'ar' ? 'طائر' : 'Bird')})
                            </span>
                            {pet.ageYear && (
                              <span className="text-gray-500 text-sm">
                                • {pet.ageYear} {language === 'ar' ? 'سنة' : 'years'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {pets.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="mt-3 text-purple-600 border-purple-600 hover:bg-purple-100"
                    >
                      {selectedPets.length === pets.length 
                        ? (language === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All')
                        : (language === 'ar' ? 'اختيار الكل' : 'Select All')
                      }
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Service Type Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img 
                  src={serviceTypeIcon} 
                  alt="Service Type" 
                  className="w-6 h-6 object-contain"
                />
                <Label className="text-lg font-semibold text-gray-600" style={{ 
                  textAlign,
                  fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                }}>
                  {t('selectServiceType')}
                </Label>
              </div>
              
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    language === 'ar' ? 'اختر نوع الخدمة...' : 'Select service type...'
                  } />
                </SelectTrigger>
                <SelectContent className="max-h-[240px] overflow-y-auto">
                  {SERVICE_TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value} className="select-item-custom">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${option.iconColor}`} />
                          <span>{language === 'ar' ? option.labelAr : option.labelEn}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Location (Manual Entry) */}
            <div>
              <Label className="text-md font-semibold text-gray-600 mb-2 block" style={{ 
                textAlign,
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}>
                {language === 'ar' ? 'موقع العميل' : 'Customer Location'}
              </Label>
              <Input
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل العنوان أو الموقع...' : 'Enter address or location...'}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive' }}>
                {language === 'ar' ? 'اختياري: أدخل موقع العميل يدويًا' : 'Optional: Enter customer location manually'}
              </p>
            </div>

            {/* Estimated Cost Display */}
            {selectedPets.length > 0 && serviceType && 
             ['first-visit', 'general-checkup', 'national-day-home-consultation', 'national-day-vaccination', 'vaccination', 'deworming', 'free-deworming', 'test-service', 'fleas-ticks-prevention', 'pickup-drop'].includes(serviceType) && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                {(() => {
                  const costData = getEstimatedCost(selectedPets, pets, serviceType);
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
                          
                          {costData.serviceCost > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-purple-800" style={{ 
                                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                              }}>
                                {language === 'ar' ? 'تكلفة الخدمة:' : 'Service Cost:'}
                              </span>
                              <span className="text-sm font-bold text-purple-900" style={{ 
                                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                              }}>
                                {costData.serviceCost.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}
                              </span>
                            </div>
                          )}
                          
                          <div className="pt-2 border-t border-purple-300">
                            <div className="flex items-center justify-between">
                              <span className="text-md font-semibold text-purple-800" style={{ 
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
                      
                      {/* Show warnings if any */}
                      {costData.warnings && costData.warnings.length > 0 && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-xs text-yellow-800 font-medium">
                            {language === 'ar' ? 'تنبيهات:' : 'Warnings:'}
                          </p>
                          <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                            {costData.warnings.map((warning, idx) => (
                              <li key={idx}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleConfirm}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!serviceType || selectedPets.length === 0 || petsLoading}
            >
              <span style={{ fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive' }}>
                {language === 'ar' ? 'تأكيد وفتح جدول الحجز' : 'Confirm & Open Booking Table'}
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Table Modal */}
      <VetsVanBookingUnified
        isModal={true}
        open={showBookingTable}
        onOpenChange={setShowBookingTable}
        bookingData={bookingData}
        onBookingComplete={handleBookingComplete}
      />
    </>
  );
}
