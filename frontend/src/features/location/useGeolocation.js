import { useState } from 'react';

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

// Encapsulates the "locate me" concern: requesting the device location and
// exposing the resulting position, loading flag, and any error.
export function useGeolocation() {
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  async function locate() {
    setLocating(true);
    setLocationError('');
    try {
      setUserLocation(await getCurrentPosition());
    } catch (e) {
      setLocationError(e.message || 'Could not get location.');
    } finally {
      setLocating(false);
    }
  }

  return { userLocation, locating, locationError, locate };
}
