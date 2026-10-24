import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { formatDistance, formatPriceRange } from '../utils/format';

// Bundlers break Leaflet's default icon URLs; point them at the imported assets.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const highlightIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [32, 52],
  iconAnchor: [16, 52],
  popupAnchor: [1, -44],
  shadowSize: [52, 52],
  className: 'hue-rotate-[140deg]',
});

// MapContainer only reads `center` on mount, so recentre when it changes.
function Recenter({ center, radiusKm }) {
  const map = useMap();
  useEffect(() => {
    if (radiusKm) {
      map.fitBounds(L.latLng(center).toBounds(radiusKm * 2000), { padding: [10, 10] });
    } else {
      map.setView(center);
    }
  }, [map, center[0], center[1], radiusKm]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/**
 * workers: [{ _id, name, location: { coordinates: [lng, lat] }, ... }]
 * center:  [lat, lng] of the customer (or of the worker when showUser is false)
 */
export default function WorkerMap({ workers = [], center, radiusKm, highlightedId, showUser = true, className = 'h-80' }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 ${className}`}>
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} radiusKm={radiusKm} />

        {radiusKm && (
          <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: '#2563eb', weight: 1, fillOpacity: 0.04 }} />
        )}
        {showUser && (
          <CircleMarker center={center} radius={8} pathOptions={{ color: '#fff', weight: 2, fillColor: '#2563eb', fillOpacity: 1 }}>
            <Popup>You are here</Popup>
          </CircleMarker>
        )}

        {workers
          .filter((w) => w.location?.coordinates?.length === 2)
          .map((w) => {
            const [lng, lat] = w.location.coordinates;
            return (
              <Marker
                key={w._id}
                position={[lat, lng]}
                icon={w._id === highlightedId ? highlightIcon : new L.Icon.Default()}
                zIndexOffset={w._id === highlightedId ? 1000 : 0}
              >
                <Popup>
                  <div className="space-y-0.5">
                    <p className="font-semibold">{w.name}</p>
                    <p>★ {w.averageRating?.toFixed(1) || 'New'} · {formatDistance(w.distance)}</p>
                    <p>{formatPriceRange(w.minPrice, w.maxPrice)}</p>
                    <Link to={`/workers/${w._id}`} className="text-blue-600">
                      View profile →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
