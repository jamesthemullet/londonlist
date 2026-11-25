import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
    btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" width="26" height="26">
      <rect x="1" y="1" width="24" height="24" fill="#e2532d" stroke="#1a1a1a" stroke-width="2"/>
    </svg>`),
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -14],
});

const DONE_ICON = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" width="26" height="26">
      <rect x="1" y="1" width="24" height="24" fill="#1a1a1a" stroke="#eceae5" stroke-width="2"/>
      <path d="M7 13.5l4 4 8-9" fill="none" stroke="#e2532d" stroke-width="3"/>
    </svg>`),
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -14],
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
    <section aria-label="Map showing list places" data-testid="map-container">
      <MapContainer
        center={LONDON_CENTER}
        zoom={12}
        style={{ height: '360px', width: '100%' }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {items.map((item) => (
          <Marker
            key={item.documentId}
            position={[item.lat, item.lng]}
            icon={item.completed ? DONE_ICON : TODO_ICON}
            title={item.name}
          >
            <Popup>
              <strong>{item.name}</strong>
              {item.category && <><br /><span>{item.category}</span></>}
              <br />
              <span style={{ color: item.completed ? '#1a1a1a' : '#b3321a' }}>
                {item.completed ? '✓ Done' : '○ To do'}
              </span>
            </Popup>
          </Marker>
        ))}
        <FitBounds items={items} />
      </MapContainer>
    </section>
  );
}
