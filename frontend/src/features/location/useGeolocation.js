import { useState, useEffect } from 'react';
import { createStore } from './createStore';

// Resolves [lat, lng] from the browser, with the given options.
function requestPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      p => resolve([p.coords.latitude, p.coords.longitude]),
      reject,
      options
    );
  });
}

// High accuracy (GPS) often times out on desktop browsers with no GPS chip, so
// first try a high-accuracy fix that accepts a recent cached position, then
// fall back to a low-accuracy lookup (Wi-Fi/IP) before giving up.
async function getCurrentPosition() {
  if (!navigator.geolocation) throw new Error('Geolocation not supported.');
  try {
    return await requestPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  } catch (e) {
    if (e.code === 1) throw new Error('Location permission denied.', { cause: e }); // PERMISSION_DENIED — retry won't help
    try {
      return await requestPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
    } catch (e2) {
      if (e2.code === 1) throw new Error('Location permission denied.', { cause: e2 });
      // POSITION_UNAVAILABLE (code 2) — a *live* fix failed (e.g. OS location
      // services off for the browser, or the network provider couldn't resolve).
      // Last resort: accept ANY previously cached fix regardless of age, which
      // can succeed where a fresh lookup can't (this is the localhost-vs-deployed
      // difference — localhost often has a recent cached position).
      if (e2.code === 2) {
        try {
          return await requestPosition({ enableHighAccuracy: false, timeout: 20000, maximumAge: Infinity });
        } catch (e3) {
          console.warn(`[geolocation] failed: code=${e3.code} (${e3.message})`);
          throw new Error('Could not get location. Check that location services are enabled.', { cause: e3 });
        }
      }
      if (e2.code === 3) throw new Error('Location timed out. Please try again.', { cause: e2 });
      console.warn(`[geolocation] failed: code=${e2.code} (${e2.message})`);
      throw new Error('Could not get location. Check that location services are enabled.', { cause: e2 });
    }
  }
}

// Module-level store so a located position survives navigation (the dashboard
// unmounting/remounting) — once located, it stays shown until the page reloads.
const locationStore = createStore(null);

// Encapsulates the "locate me" concern: requesting the device location and
// exposing the resulting position (persisted), loading flag, and any error.
export function useGeolocation() {
  const [userLocation, setUserLocation] = useState(locationStore.get());
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => locationStore.subscribe(setUserLocation), []);

  async function locate() {
    setLocating(true);
    setLocationError('');
    try {
      locationStore.set(await getCurrentPosition());
    } catch (e) {
      setLocationError(e.message || 'Could not get location.');
    } finally {
      setLocating(false);
    }
  }

  return { userLocation, locating, locationError, locate };
}
