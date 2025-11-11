import { 
  Car, 
  Scissors, 
  Heart, 
  ShieldPlus, 
  Scan, 
  Bell,
  Pill,
  Home
} from "lucide-react";

export interface ServiceTypeOption {
  value: string;
  labelEn: string;
  labelAr: string;
  icon: any;
  iconColor: string;
}

export const SERVICE_TYPE_OPTIONS: ServiceTypeOption[] = [
  {
    value: 'home-consultation',
    labelEn: 'Home Consultation',
    labelAr: 'استشارة منزلية',
    icon: Home,
    iconColor: 'text-purple-600'
  },
  {
    value: 'pickup-drop',
    labelEn: 'Pickup & Drop',
    labelAr: 'نقل وتوصيل',
    icon: Car,
    iconColor: 'text-indigo-600'
  },
  {
    value: 'grooming',
    labelEn: 'Grooming',
    labelAr: 'العناية',
    icon: Scissors,
    iconColor: 'text-pink-600'
  },
  {
    value: 'neutering',
    labelEn: 'Neutering',
    labelAr: 'خصي/تعقيم',
    icon: Heart,
    iconColor: 'text-red-600'
  },
  {
    value: 'surgery',
    labelEn: 'Surgery',
    labelAr: 'جراحة',
    icon: ShieldPlus,
    iconColor: 'text-red-600'
  },
  {
    value: 'ct-scan',
    labelEn: 'CT-Scan',
    labelAr: 'أشعة مقطعية',
    icon: Scan,
    iconColor: 'text-green-600'
  },
  {
    value: 'test-service',
    labelEn: 'Test Service',
    labelAr: 'خدمة اختبار',
    icon: Bell,
    iconColor: 'text-purple-600'
  }
];

export function getServiceTypeLabel(value: string, language: 'ar' | 'en'): string {
  const option = SERVICE_TYPE_OPTIONS.find(opt => opt.value === value);
  if (!option) return value;
  return language === 'ar' ? option.labelAr : option.labelEn;
}
