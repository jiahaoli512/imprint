import { registerPlugin, Capacitor } from '@capacitor/core';
import { api } from '../../api/client';
import { createStore } from './createStore';

// Thin wrapper around @capacitor-community/background-geolocation. Only active
// on native (iOS) — on web the plugin doesn't exist and tracking is a no-op.
const isNative = Capacitor.isNativePlatform();
const BackgroundGeolocation = isNative ? registerPlugin('BackgroundGeolocation') : null;

// Upload after this many buffered points. Kept at 1 so each ~50m point (gated
// by distanceFilter below) is persisted promptly — markers appear as you move,
// and nothing is lost if iOS suspends/kills the app before a larger batch.
const FLUSH_THRESHOLD = 1;
const ENABLED_KEY = 'imprint_tracking_enabled'; // remembers the user's choice across restarts
const BUFFER_KEY = 'imprint_tracking_buffer';   // unsent points, persisted so a kill doesn't lose them

let watcherId = null;

// Load any points that failed to upload in a previous session so they aren't
// lost if the app was killed before a successful flush.
function loadBuffer() {
  try { return JSON.parse(localStorage.getItem(BUFFER_KEY)) || []; }
  catch { return []; }
}
function persistBuffer() {
  try {
    if (buffer.length) localStorage.setItem(BUFFER_KEY, JSON.stringify(buffer));
    else localStorage.removeItem(BUFFER_KEY);
  } catch { /* storage full / unavailable — best effort */ }
}

let buffer = loadBuffer();

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
  // Keep points buffered+persisted until the upload is confirmed, so a kill mid-
  // upload re-sends them next session (at-least-once; raw Location overlap is
  // allowed and markers dedupe). Only the confirmed prefix is removed afterward.
  const batch = buffer.slice();
  try {
    await api.logLocations(batch);
    buffer.splice(0, batch.length); // points captured during the await stay queued
    persistBuffer();
    setStatus({ uploaded: statusStore.get().uploaded + batch.length });
  } catch {
    // Leave them in the (persisted) buffer for the next flush.
    persistBuffer();
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
    return false;
  }
  if (watcherId) return true;
  try {
    watcherId = await BackgroundGeolocation.addWatcher(
    {
      backgroundMessage: 'Imprint is mapping the places you visit.',
      backgroundTitle: 'Imprint is tracking your travels',
      requestPermissions: true,
      stale: false,
      distanceFilter: 100, // metres of movement before a new point (matches the 100m marker spacing)
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
      persistBuffer();
      setStatus({ captured: statusStore.get().captured + 1, lastPoint: point, error: null });
      if (buffer.length >= FLUSH_THRESHOLD) flush();
    }
    );
    localStorage.setItem(ENABLED_KEY, '1');
    flush(); // drain any points left over from a previous session
  } catch (e) {
    setStatus({ error: e?.message || 'failed to start tracking' });
  }
  return isTracking();
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
