import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet';
import { useLanguage } from '../context/LanguageContext';

// Small static map of the job location. `location` is GeoJSON: { coordinates: [lng, lat] }.
export default function BookingLocationMap({ location, className = 'h-40' }) {
  const { t } = useLanguage();
  if (location?.coordinates?.length !== 2) return null;
  const [lng, lat] = location.coordinates;

  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 ${className}`}>
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={[lat, lng]} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: '#dc2626', fillOpacity: 1 }} />
      </MapContainer>
      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
        target="_blank"
        rel="noreferrer"
        className="block bg-white px-3 py-1.5 text-xs font-medium text-blue-600 hover:underline"
      >
        {t('booking.openInMap')}
      </a>
    </div>
  );
}
