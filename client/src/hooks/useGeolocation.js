import { useCallback, useEffect, useState } from 'react';

// Used when the browser has no geolocation or the user denies permission.
export const DEFAULT_LOCATION = { lat: 13.0827, lng: 80.2707, label: 'Chennai (default)' };

const CACHE_KEY = 'lastLocation';

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(coords) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(coords));
  } catch {
    // ignore
  }
}

/**
 * Captures the user's position with the browser Geolocation API.
 * status: 'loading' | 'success' | 'denied' | 'unsupported' | 'error'
 * `coords` is always usable — falls back to DEFAULT_LOCATION on failure.
 */
export default function useGeolocation() {
  const cached = readCache();
  const [coords, setCoords] = useState(cached || DEFAULT_LOCATION);
  const [status, setStatus] = useState(cached ? 'success' : 'loading');
  const [error, setError] = useState(null);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      setError('Your browser does not support location access.');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Your location' };
        setCoords(next);
        setStatus('success');
        setError(null);
        writeCache(next);
      },
      (err) => {
        setCoords(DEFAULT_LOCATION);
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Showing workers near Chennai.'
            : 'Could not get your location. Showing workers near Chennai.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  useEffect(() => {
    if (!cached) locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { coords, status, error, retry: locate };
}
