import { useState } from "react";
import { useLocation } from "wouter";
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
import { SERVICE_TYPE_OPTIONS } from "@/lib/service-types";
import serviceTypeIcon from "@assets/freepik_assistant_1751437667818_1751437676533.png";

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
  const [, setLocation] = useLocation();
  const { language, t } = useTranslation();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  
  const [serviceType, setServiceType] = useState<string>("");
  const [manualLocation, setManualLocation] = useState<string>("");

  const handleConfirm = () => {
    if (!serviceType) {
      alert(language === 'ar' ? 'الرجاء اختيار نوع الخدمة' : 'Please select a service type');
      return;
    }

    // Store booking request data in localStorage
    const bookingData = {
      userId: customerData.userId,
      userName: customerData.userName,
      userPhone: customerData.userPhone,
      selectedPatients: customerData.patientId ? [customerData.patientId] : [],
      serviceType: serviceType,
      location: manualLocation || null,
      pickupLatitude: null,
      pickupLongitude: null,
      isAdminBooking: true,
    };

    localStorage.setItem('pendingRequest', JSON.stringify(bookingData));
    
    // Navigate to vetsvan-booking
    setLocation('/vetsvan-booking');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={direction}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive' }}>
            {language === 'ar' ? 'إضافة موعد' : 'Add Appointment'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-4">
          {/* Customer & Pet Information */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-md font-semibold text-purple-900 mb-3" style={{ 
              textAlign,
              fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
            }}>
              {language === 'ar' ? 'معلومات العميل والحيوان الأليف' : 'Customer & Pet Information'}
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
              <div>
                <span className="text-purple-700 font-medium">{language === 'ar' ? 'اسم الحيوان الأليف:' : 'Pet Name:'}</span>
                <p className="text-gray-900">{customerData.patientName || (language === 'ar' ? 'لا يوجد' : 'None')}</p>
              </div>
              <div>
                <span className="text-purple-700 font-medium">{language === 'ar' ? 'نوع الحيوان الأليف:' : 'Pet Type:'}</span>
                <p className="text-gray-900">{customerData.patientType || (language === 'ar' ? 'لا يوجد' : 'None')}</p>
              </div>
            </div>
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

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!serviceType}
          >
            <span style={{ fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive' }}>
              {language === 'ar' ? 'تأكيد وفتح جدول الحجز' : 'Confirm & Open Booking Table'}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
