// Promise wrapper around the browser Geolocation API.
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Your browser does not support location access.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'Location permission denied. Allow location access in your browser settings.'
              : 'Could not get your location. Please try again.'
          )
        ),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
