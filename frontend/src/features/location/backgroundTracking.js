import { registerPlugin, Capacitor } from '@capacitor/core';
import { api } from '../../api/client';
import { createStore } from './createStore';

// Thin wrapper around @capacitor-community/background-geolocation. Only active
// on native (iOS) — on web the plugin doesn't exist and tracking is a no-op.
const isNative = Capacitor.isNativePlatform();
const BackgroundGeolocation = isNative ? registerPlugin('BackgroundGeolocation') : null;

const FLUSH_THRESHOLD = 10; // upload after this many buffered points
const ENABLED_KEY = 'imprint_tracking_enabled'; // remembers the user's choice across restarts

let watcherId = null;
let buffer = [];

export function wasTrackingEnabled() {
  return localStorage.getItem(ENABLED_KEY) === '1';
}

// Observable status so the UI can show live verification (counts, last point).
const statusStore = createStore({ captured: 0, uploaded: 0, lastPoint: null, error: null });

// Merge a partial update into the status and notify subscribers.
function setStatus(patch) {
  statusStore.set((s) => ({ ...s, ...patch }));
}

export function subscribe(listener) {
  listener(statusStore.get());
  return statusStore.subscribe(listener);
}

export function getStatus() {
  return statusStore.get();
}

async function flush() {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  try {
    await api.logLocations(batch);
    setStatus({ uploaded: statusStore.get().uploaded + batch.length });
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
    setStatus({ error: 'not supported on this platform' });
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
        setStatus({ error: error.code || error.message || 'location error' });
        return;
      }
      const point = {
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy,
        visitedAt: new Date().toISOString(),
      };
      buffer.push(point);
      setStatus({ captured: statusStore.get().captured + 1, lastPoint: point, error: null });
      if (buffer.length >= FLUSH_THRESHOLD) flush();
    }
    );
    localStorage.setItem(ENABLED_KEY, '1');
  } catch (e) {
    setStatus({ error: e?.message || 'failed to start tracking' });
  }
}

// Re-arms the watcher if the user had tracking enabled (e.g. after an app
// restart). No-op if already running or never enabled.
export async function resumeTrackingIfEnabled() {
  if (isTrackingSupported() && !watcherId && wasTrackingEnabled()) {
    await startTracking();
  }
}

// Deep-links to the app's location settings. Used when iOS won't re-show the
// "Always Allow" upgrade prompt (it only offers it once) and the user is stuck
// on "While Using" — the only remaining way to switch is in Settings.
export async function openLocationSettings() {
  if (!isTrackingSupported()) return;
  try { await BackgroundGeolocation.openSettings(); } catch { /* ignore */ }
}

// Returns the iOS location authorization level: 'always' | 'whenInUse' |
// 'denied' | 'restricted' | 'notDetermined' (or 'unknown'/'unsupported').
export async function getAuthorizationStatus() {
  if (!isTrackingSupported()) return 'unsupported';
  try {
    const res = await BackgroundGeolocation.getAuthorizationStatus();
    return res?.status || 'unknown';
  } catch {
    return 'unknown';
  }
}

// Only a deliberate user action stops tracking — this clears the saved choice
// so it won't auto-resume.
export async function stopTracking() {
  localStorage.removeItem(ENABLED_KEY);
  if (watcherId) {
    await BackgroundGeolocation.removeWatcher({ id: watcherId });
    watcherId = null;
  }
  await flush();
}
