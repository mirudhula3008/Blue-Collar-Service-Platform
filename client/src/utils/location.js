// Promise wrapper around the browser Geolocation API.
// Rejects with an Error whose `code` is 'denied' | 'error' | 'unsupported' (for translated messages).
export function getCurrentPosition() {
  const fail = (code, message) => Object.assign(new Error(message), { code });
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(fail('unsupported', 'Your browser does not support location access.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          err.code === err.PERMISSION_DENIED
            ? fail('denied', 'Location permission denied.')
            : fail('error', 'Could not get your location.')
        ),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
