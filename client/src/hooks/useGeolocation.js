import { useCallback, useEffect, useRef, useState } from 'react';

// Everyone starts here. Live location is opt-in because desktop browsers often
// guess the position from the IP address and can be hundreds of km off.
export const DEFAULT_LOCATION = { lat: 13.0827, lng: 80.2707, label: 'Chennai' };

const PREF_KEY = 'liveLocation'; // 'on' | absent
const MIN_MOVE_METRES = 50; // ignore GPS jitter smaller than this

function readPref() {
  try {
    return localStorage.getItem(PREF_KEY) === 'on';
  } catch {
    return false;
  }
}

function writePref(on) {
  try {
    if (on) localStorage.setItem(PREF_KEY, 'on');
    else localStorage.removeItem(PREF_KEY);
  } catch {
    // storage unavailable — preference just won't persist
  }
}

// Haversine distance in metres.
function distance(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Customer location for discovery.
 * Defaults to Chennai. With live location on, follows the device position
 * (watchPosition) and updates whenever it moves more than ~50 m.
 *
 * status: 'default' | 'locating' | 'live' | 'denied' | 'unsupported' | 'error'
 * Returns { coords, status, error, live, setLive }. `coords` is always usable.
 */
export default function useGeolocation() {
  const [live, setLiveState] = useState(readPref);
  const [coords, setCoords] = useState(DEFAULT_LOCATION);
  const [status, setStatus] = useState(live ? 'locating' : 'default');
  const [error, setError] = useState(null);
  const lastRef = useRef(null);

  const setLive = useCallback((on) => {
    writePref(on);
    setLiveState(on);
    setError(null);
  }, []);

  useEffect(() => {
    if (!live) {
      lastRef.current = null;
      setCoords(DEFAULT_LOCATION);
      setStatus('default');
      return undefined;
    }
    if (!('geolocation' in navigator)) {
      writePref(false);
      setLiveState(false);
      setStatus('unsupported');
      setError('Your browser does not support location access. Showing Chennai.');
      return undefined;
    }

    setStatus('locating');
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Live location' };
        // Only publish meaningful moves so the worker list doesn't refetch on every GPS tick.
        if (!lastRef.current || distance(lastRef.current, next) >= MIN_MOVE_METRES) {
          lastRef.current = next;
          setCoords(next);
        }
        setStatus('live');
        setError(null);
      },
      (err) => {
        // Fall back to the default and switch live location off.
        navigator.geolocation.clearWatch(watchId);
        writePref(false);
        setLiveState(false);
        setCoords(DEFAULT_LOCATION);
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission is blocked. Allow it in your browser’s site settings to use live location. Showing Chennai.'
            : 'Could not get your live location. Showing Chennai.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [live]);

  return { coords, status, error, live, setLive };
}
