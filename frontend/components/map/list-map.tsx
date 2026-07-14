import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon paths broken by webpack
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TODO_ICON = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z" fill="#c724b1"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

const DONE_ICON = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z" fill="#22c55e"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

export type MapItem = {
  documentId: string;
  name: string;
  lat: number;
  lng: number;
  completed: boolean;
  category: string | null;
};

function FitBounds({ items }: { items: MapItem[] }) {
  const map = useMap();
  useEffect(() => {
    if (items.length === 0) return;
    const bounds = L.latLngBounds(items.map((i) => [i.lat, i.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, items]);
  return null;
}

type Props = {
  items: MapItem[];
};

export default function ListMap({ items }: Props) {
  const LONDON_CENTER: [number, number] = [51.5074, -0.1278];

  return (
    <MapContainer
      center={LONDON_CENTER}
      zoom={12}
      style={{ height: '320px', width: '100%', borderRadius: '8px' }}
      aria-label="Map showing list places"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {items.map((item) => (
        <Marker
          key={item.documentId}
          position={[item.lat, item.lng]}
          icon={item.completed ? DONE_ICON : TODO_ICON}
        >
          <Popup>
            <strong>{item.name}</strong>
            {item.category && <><br /><span>{item.category}</span></>}
            <br />
            <span style={{ color: item.completed ? '#22c55e' : '#c724b1' }}>
              {item.completed ? '✓ Done' : '○ To do'}
            </span>
          </Popup>
        </Marker>
      ))}
      <FitBounds items={items} />
    </MapContainer>
  );
}
