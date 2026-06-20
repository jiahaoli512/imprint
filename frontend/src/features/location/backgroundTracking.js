import { registerPlugin, Capacitor } from '@capacitor/core';
import { api } from '../../api/client';

// Thin wrapper around @capacitor-community/background-geolocation. Only active
// on native (iOS) — on web the plugin doesn't exist and tracking is a no-op.
const isNative = Capacitor.isNativePlatform();
const BackgroundGeolocation = isNative ? registerPlugin('BackgroundGeolocation') : null;

const FLUSH_THRESHOLD = 10; // upload after this many buffered points

let watcherId = null;
let buffer = [];

// Observable status so the UI can show live verification (counts, last point).
let status = { captured: 0, uploaded: 0, lastPoint: null, error: null };
const listeners = new Set();

function emit() {
  for (const listener of listeners) listener(status);
}

export function subscribe(listener) {
  listeners.add(listener);
  listener(status);
  return () => listeners.delete(listener);
}

export function getStatus() {
  return status;
}

async function flush() {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  try {
    await api.logLocations(batch);
    status = { ...status, uploaded: status.uploaded + batch.length };
    emit();
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
  if (!isTrackingSupported()) {
    status = { ...status, error: 'not supported on this platform' };
    emit();
    return;
  }
  if (watcherId) return;
  try {
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
        status = { ...status, error: error.code || error.message || 'location error' };
        emit();
        return;
      }
      const point = {
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy,
        visitedAt: new Date().toISOString(),
      };
      buffer.push(point);
      status = { ...status, captured: status.captured + 1, lastPoint: point, error: null };
      emit();
      if (buffer.length >= FLUSH_THRESHOLD) flush();
    }
    );
  } catch (e) {
    status = { ...status, error: e?.message || 'failed to start tracking' };
    emit();
  }
}

export async function stopTracking() {
  if (watcherId) {
    await BackgroundGeolocation.removeWatcher({ id: watcherId });
    watcherId = null;
  }
  await flush();
}
