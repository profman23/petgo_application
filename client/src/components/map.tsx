import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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
  className?: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  
  return null;
}

export function Map({ customerLocation, drivers = [], assignedDriver, className }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);

  return (
    <div className={`h-64 w-full ${className}`}>
      <MapContainer
        center={customerLocation}
        zoom={13}
        className="h-full w-full rounded-lg"
        ref={mapRef}
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
      </MapContainer>
    </div>
  );
}
