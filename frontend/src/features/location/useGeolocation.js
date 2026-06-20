import { useState, useEffect } from 'react';

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported.')); return; }
    navigator.geolocation.getCurrentPosition(
      p => resolve([p.coords.latitude, p.coords.longitude]),
      e => reject(new Error(e.code === 1 ? 'Location permission denied.' : 'Could not get location.')),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// Module-level cache so a located position survives navigation (the dashboard
// unmounting/remounting) — once located, it stays shown until the page reloads.
let cachedLocation = null;
const listeners = new Set();
function setCachedLocation(loc) {
  cachedLocation = loc;
  for (const l of listeners) l(loc);
}

// Encapsulates the "locate me" concern: requesting the device location and
// exposing the resulting position (persisted), loading flag, and any error.
export function useGeolocation() {
  const [userLocation, setUserLocation] = useState(cachedLocation);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    listeners.add(setUserLocation);
    return () => listeners.delete(setUserLocation);
  }, []);

  async function locate() {
    setLocating(true);
    setLocationError('');
    try {
      setCachedLocation(await getCurrentPosition());
    } catch (e) {
      setLocationError(e.message || 'Could not get location.');
    } finally {
      setLocating(false);
    }
  }

  return { userLocation, locating, locationError, locate };
}
