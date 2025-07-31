export default function VetsVanBooking() {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="ltr">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Table Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full table-fixed" style={{ direction: 'ltr' }}>
            <colgroup>
              <col style={{ width: '150px' }} />
              <col style={{ width: 'auto' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-r-2 border-gray-400" style={{ textAlign: 'left' }}>
                  Time
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ textAlign: 'left' }}>
                  Column 2
                </th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot, index) => (
                <tr key={timeSlot} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4 text-left text-sm text-gray-900 font-medium border-r-2 border-gray-400" style={{ textAlign: 'left' }}>
                    {timeSlot}
                  </td>
                  <td className="px-6 py-4 text-left text-sm text-gray-600" style={{ textAlign: 'left' }}>
                    Available
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}