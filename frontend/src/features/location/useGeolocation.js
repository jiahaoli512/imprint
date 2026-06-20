import { useState, useEffect } from 'react';
import { createStore } from './createStore';

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
