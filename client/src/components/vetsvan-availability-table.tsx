import { useQuery } from "@tanstack/react-query";
import { useTranslation, getDirection, getTextAlign } from "@/lib/i18n";
import { Loader2, Clock, CheckCircle } from "lucide-react";

interface Shift {
  id: number;
  vetsVanId: number;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
}

interface VetsVanWithShifts {
  id: number;
  vetsvanCode: string;
  vetsvanName: string;
  isAvailable: boolean;
  shifts: Shift[];
}

interface VetsVanAvailabilityTableProps {
  onSelectTimeSlot?: (vetsvanId: number, date: string, time: string) => void;
}

export function VetsVanAvailabilityTable({ onSelectTimeSlot }: VetsVanAvailabilityTableProps) {
  const { t, language } = useTranslation();
  const isRTL = getDirection(language) === 'rtl';
  const textAlign = getTextAlign(language);

  const { data: vetsvanData, isLoading, error } = useQuery({
    queryKey: ['/api/vetsvan/availability'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 bg-white rounded-lg shadow-md">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600 mr-2" />
        <span className="text-gray-600">{t('loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-center">{t('error')}</p>
      </div>
    );
  }

  if (!vetsvanData || vetsvanData.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 text-center">
          {language === 'ar' ? 'لا توجد VetsVan متاحة حالياً' : 'No VetsVan available currently'}
        </p>
      </div>
    );
  }

  // Generate time slots from 8 AM to 8 PM (every hour)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Check if a time slot is available for a specific VetsVan
  const isTimeSlotAvailable = (vetsvan: VetsVanWithShifts, date: string, time: string) => {
    if (!vetsvan.isAvailable) return false;
    
    // Check if there's a shift that covers this time slot
    return vetsvan.shifts.some(shift => {
      return shift.date === date && 
             shift.startTime <= time && 
             shift.endTime > time &&
             shift.status === 'scheduled';
    });
  };

  // Get today's date and next 7 days
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  return (
    <div 
      className="bg-white rounded-lg shadow-lg p-4 mb-6"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className={`text-lg font-semibold text-gray-800 ${textAlign === 'right' ? 'text-right' : 'text-left'}`}>
          {language === 'ar' ? 'المواعيد المتاحة - VetsVan' : 'Available Appointments - VetsVan'}
        </h3>
        <p className={`text-sm text-gray-600 mt-1 ${textAlign === 'right' ? 'text-right' : 'text-left'}`}>
          {language === 'ar' ? 'اختر الوقت المناسب لك' : 'Select a suitable time for you'}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          {/* VetsVan Header Row */}
          <thead>
            <tr className="bg-purple-100">
              <th className="border border-gray-300 p-2 text-sm font-medium text-gray-700">
                {language === 'ar' ? 'الوقت' : 'Time'}
              </th>
              {(vetsvanData as VetsVanWithShifts[]).map((vetsvan) => (
                <th 
                  key={vetsvan.id} 
                  className="border border-gray-300 p-2 text-sm font-medium text-gray-700 min-w-[120px]"
                >
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">{vetsvan.vetsvanName}</span>
                    <span className="text-xs text-gray-500">({vetsvan.vetsvanCode})</span>
                    {vetsvan.isAvailable ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                    ) : (
                      <Clock className="h-4 w-4 text-red-500 mt-1" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Time Slots Body */}
          <tbody>
            {timeSlots.map((timeSlot) => (
              <tr key={timeSlot} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2 text-sm font-medium text-gray-700 bg-gray-50">
                  {timeSlot}
                </td>
                {(vetsvanData as VetsVanWithShifts[]).map((vetsvan) => (
                  <td key={`${vetsvan.id}-${timeSlot}`} className="border border-gray-300 p-1">
                    <div className="flex justify-center">
                      {availableDates.map((date) => {
                        const isAvailable = isTimeSlotAvailable(vetsvan, date, timeSlot);
                        const dayName = new Date(date).toLocaleDateString(
                          language === 'ar' ? 'ar-SA' : 'en-US', 
                          { weekday: 'short' }
                        );
                        
                        return (
                          <button
                            key={`${date}-${timeSlot}`}
                            className={`
                              text-xs px-2 py-1 rounded m-1 transition-colors
                              ${isAvailable
                                ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }
                            `}
                            disabled={!isAvailable}
                            onClick={() => {
                              if (isAvailable && onSelectTimeSlot) {
                                onSelectTimeSlot(vetsvan.id, date, timeSlot);
                              }
                            }}
                            title={`${dayName} ${date}`}
                          >
                            {dayName}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className={`mt-4 flex flex-wrap gap-4 text-xs ${textAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
          <span className="text-gray-600">
            {language === 'ar' ? 'متاح' : 'Available'}
          </span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
          <span className="text-gray-600">
            {language === 'ar' ? 'غير متاح' : 'Not Available'}
          </span>
        </div>
        <div className="flex items-center">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          <span className="text-gray-600">
            {language === 'ar' ? 'VetsVan متاح' : 'VetsVan Available'}
          </span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-red-500 mr-2" />
          <span className="text-gray-600">
            {language === 'ar' ? 'VetsVan غير متاح' : 'VetsVan Unavailable'}
          </span>
        </div>
      </div>
    </div>
  );
}