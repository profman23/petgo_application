import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface VetsVan {
  id: number;
  name: string;
  vetsvanCode: string;
  vetsvanName: string;
  isAvailable: boolean;
  username: string;
}

interface Shift {
  id: number;
  vetsVanId: number;
  date: string;
  startTime: string;
  endTime: string;
  duration: 'day' | 'week' | 'month';
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export default function VetsVanBooking() {
  // Selected date for booking (defaults to today)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch all active Vets Vans using customer-accessible endpoint
  const { data: vetsVans = [], isLoading: loadingVetsVans } = useQuery<VetsVan[]>({
    queryKey: ['/api/vetsvan/list'],
    queryFn: async () => {
      const customerToken = localStorage.getItem('token');
      
      if (!customerToken) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/vetsvan/list', {
        headers: {
          'Authorization': `Bearer ${customerToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch Vets Vans');
      return await response.json();
    },
    retry: false,
  });

  // Fetch shifts for the selected date using customer-accessible endpoint
  const { data: shifts = [], isLoading: loadingShifts } = useQuery<Shift[]>({
    queryKey: ['/api/vetsvan/shifts', selectedDate],
    queryFn: async () => {
      const customerToken = localStorage.getItem('token');
      
      if (!customerToken) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/vetsvan/shifts?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${customerToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch shifts');
      return await response.json();
    },
    retry: false,
  });

  // Generate time slots from 9:00 AM to 9:00 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 21; hour++) {
      const time12hour = hour > 12 ? `${hour - 12}:00 PM` : 
                        hour === 12 ? `${hour}:00 PM` : 
                        `${hour}:00 AM`;
      slots.push(time12hour);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Filter only available Vets Vans
  const availableVetsVans = vetsVans.filter(van => van.isAvailable);

  // Function to check if a time slot is available for a specific Vets Van
  const isTimeSlotAvailable = (vetsVanId: number, timeSlot: string): boolean => {
    // Find shift for this Vets Van on the selected date
    const shift = shifts.find(s => s.vetsVanId === vetsVanId && s.date === selectedDate);
    
    if (!shift || shift.status === 'cancelled') {
      return false; // No shift or cancelled shift means unavailable
    }
    
    // Convert time slot to 24-hour format for comparison
    const convertTo24Hour = (time12: string): string => {
      const [time, period] = time12.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };
    
    const slotTime24 = convertTo24Hour(timeSlot);
    const shiftStart = shift.startTime;
    const shiftEnd = shift.endTime;
    
    // Check if the time slot falls within the shift time range
    return slotTime24 >= shiftStart && slotTime24 < shiftEnd;
  };

  // Function to get availability status display
  const getAvailabilityStatus = (vetsVanId: number, timeSlot: string) => {
    const isAvailable = isTimeSlotAvailable(vetsVanId, timeSlot);
    return {
      isAvailable,
      display: isAvailable ? 'Available' : '❌',
      className: isAvailable 
        ? 'text-green-600 font-medium hover:text-green-700 hover:bg-green-50' 
        : 'text-red-500 font-bold cursor-not-allowed bg-red-50'
    };
  };

  if (loadingVetsVans || loadingShifts) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center" dir="ltr">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Vets Vans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="ltr">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vets Van Booking Schedule</h1>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                Available Vets Vans: {availableVetsVans.length} | Total: {vetsVans.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Shifts loaded: {shifts.length} for {selectedDate}
                {loadingShifts && <span className="ml-2 text-blue-600">(Loading shifts...)</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="booking-date" className="text-sm font-medium text-gray-700">
                Select Date:
              </label>
              <input
                id="booking-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>
        
        {/* Table Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full table-auto min-w-max" style={{ direction: 'ltr' }}>
            <colgroup>
              <col style={{ width: '150px' }} />
              {availableVetsVans.map((van) => (
                <col key={van.id} style={{ width: '200px' }} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-r-2 border-gray-400 sticky left-0 bg-gray-50" style={{ textAlign: 'left' }}>
                  Time
                </th>
                {availableVetsVans.map((van, index) => (
                  <th 
                    key={van.id} 
                    className={`px-6 py-4 text-center text-sm font-semibold text-gray-900 ${
                      index < availableVetsVans.length - 1 ? 'border-r border-gray-300' : ''
                    }`}
                    style={{ textAlign: 'center' }}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-purple-600 font-bold">{van.vetsvanCode}</span>
                      <span className="text-xs text-gray-500 mt-1">{van.vetsvanName}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot, index) => (
                <tr key={timeSlot} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4 text-left text-sm text-gray-900 font-medium border-r-2 border-gray-400 sticky left-0 bg-inherit" style={{ textAlign: 'left' }}>
                    {timeSlot}
                  </td>
                  {availableVetsVans.map((van, vanIndex) => {
                    const availability = getAvailabilityStatus(van.id, timeSlot);
                    return (
                      <td 
                        key={van.id} 
                        className={`px-6 py-4 text-center text-sm transition-colors ${
                          vanIndex < availableVetsVans.length - 1 ? 'border-r border-gray-300' : ''
                        } ${availability.isAvailable ? 'hover:bg-purple-50 cursor-pointer' : 'cursor-not-allowed'}`}
                        style={{ textAlign: 'center' }}
                        onClick={() => {
                          if (availability.isAvailable) {
                            // Handle booking slot selection
                            console.log(`Selected: ${timeSlot} for ${van.vetsvanCode}`);
                          }
                        }}
                      >
                        <div className={`w-full h-full min-h-[40px] flex items-center justify-center ${availability.className} px-2 py-1 rounded`}>
                          {availability.display}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* No Vets Vans Message */}
        {availableVetsVans.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🚐</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Available Vets Vans
            </h3>
            <p className="text-gray-600">
              {vetsVans.length === 0 
                ? 'No Vets Vans are configured in the system.'
                : 'All Vets Vans are currently unavailable. Please check back later.'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}