import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Driver } from '@shared/schema';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Enhanced icons for real-time tracking using URL encoding instead of btoa for Arabic support
const customerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#1e40af" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const doctorIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#10b981" stroke="#059669" stroke-width="2"/>
      <path d="M8 12h8M12 8v8" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const driverIcon = doctorIcon; // Alias for backward compatibility

const assignedDriverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapProps {
  customerLocation: [number, number];
  drivers?: Driver[];
  assignedDriver?: Driver;
  pendingRides?: any[];
  showBothLocations?: boolean;
  className?: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  
  return null;
}

export function Map({ customerLocation, drivers = [], assignedDriver, pendingRides = [], showBothLocations = false, className }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);

  return (
    <div className={`h-64 w-full ${className} relative z-0`} style={{ zIndex: 0 }}>
      <MapContainer
        center={customerLocation}
        zoom={13}
        className="h-full w-full rounded-lg relative z-0"
        ref={mapRef}
        style={{ zIndex: 0 }}
        zIndexOffset={-1000}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={customerLocation} />
        
        {/* Customer location marker */}
        <Marker position={customerLocation} icon={customerIcon}>
          <Popup>موقعك الحالي</Popup>
        </Marker>
        
        {/* Available drivers markers */}
        {drivers.map((driver) => (
          <Marker
            key={driver.id}
            position={[driver.latitude, driver.longitude]}
            icon={assignedDriver?.id === driver.id ? assignedDriverIcon : driverIcon}
          >
            <Popup>
              <div className="text-right">
                <h3 className="font-semibold">{driver.name}</h3>
                <p className="text-sm">{driver.carModel} {driver.carColor}</p>
                <p className="text-sm">التقييم: {driver.rating} ⭐</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Pending Rides - Customer Locations */}
        {pendingRides.map((ride) => (
          ride.pickupLatitude && ride.pickupLongitude && (
            <Marker 
              key={`customer-${ride.id}`} 
              position={[ride.pickupLatitude, ride.pickupLongitude]} 
              icon={customerIcon}
            >
              <Popup>
                <div className="text-right">
                  <strong>طلب رقم: {ride.id}</strong><br />
                  <strong>العميل:</strong> {ride.customer?.name || 'غير محدد'}<br />
                  <strong>الهاتف:</strong> {ride.customer?.phone || 'غير محدد'}<br />
                  <strong>الموقع:</strong> {ride.pickupLocation}<br />
                  <strong>الوقت:</strong> {new Date(ride.createdAt).toLocaleTimeString('ar-SA')}
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
