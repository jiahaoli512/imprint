import { registerPlugin, Capacitor } from '@capacitor/core';
import { api } from '../../api/client';

// Thin wrapper around @capacitor-community/background-geolocation. Only active
// on native (iOS) — on web the plugin doesn't exist and tracking is a no-op.
const isNative = Capacitor.isNativePlatform();
const BackgroundGeolocation = isNative ? registerPlugin('BackgroundGeolocation') : null;

const FLUSH_THRESHOLD = 10; // upload after this many buffered points

let watcherId = null;
let buffer = [];

async function flush() {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  try {
    await api.logLocations(batch);
  } catch {
    // Re-queue on failure so points aren't lost between sessions.
    buffer.unshift(...batch);
  }
}

export function isTrackingSupported() {
  return isNative && !!BackgroundGeolocation;
}

export function isTracking() {
  return watcherId !== null;
}

// Starts background location updates. The plugin prompts for "Always" permission
// (requestPermissions: true) and shows the required iOS background notification.
export async function startTracking() {
  if (!isTrackingSupported() || watcherId) return;
  watcherId = await BackgroundGeolocation.addWatcher(
    {
      backgroundMessage: 'Imprint is mapping the places you visit.',
      backgroundTitle: 'Imprint is tracking your travels',
      requestPermissions: true,
      stale: false,
      distanceFilter: 50, // metres of movement before a new point (low power)
    },
    (location, error) => {
      if (error) {
        // error.code === 'NOT_AUTHORIZED' → user denied/needs Settings
        return;
      }
      buffer.push({
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy,
        visitedAt: new Date().toISOString(),
      });
      if (buffer.length >= FLUSH_THRESHOLD) flush();
    }
  );
}

export async function stopTracking() {
  if (watcherId) {
    await BackgroundGeolocation.removeWatcher({ id: watcherId });
    watcherId = null;
  }
  await flush();
}
