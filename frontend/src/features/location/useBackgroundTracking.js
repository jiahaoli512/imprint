import { useState, useEffect, useCallback } from 'react';
import {
  isTrackingSupported, isTracking, startTracking, stopTracking, subscribe, getStatus,
  openLocationSettings, getAuthorizationStatus, wasTrackingEnabled, resumeTrackingIfEnabled,
} from './backgroundTracking';

// UI-facing hook for the background tracking toggle. `supported` is false on web,
// so callers can hide the control entirely off-native. `status` updates live as
// points are captured/uploaded; `authStatus` reflects the current iOS permission
// level and is re-checked whenever the app returns to the foreground (e.g. after
// the user changes it in Settings).
export function useBackgroundTracking() {
  const supported = isTrackingSupported();
  // Initialise from the live watcher OR the saved choice so it shows ON without
  // an OFF flicker after navigation / app restart.
  const [tracking, setTracking] = useState(isTracking() || wasTrackingEnabled());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(getStatus());
  const [authStatus, setAuthStatus] = useState('unknown');

  const refreshAuth = useCallback(async () => {
    setAuthStatus(await getAuthorizationStatus());
  }, []);

  useEffect(() => subscribe(setStatus), []);

  // Auto-resume tracking if the user had enabled it (re-arms the watcher after a
  // restart; no-op if already running). It never turns off on its own.
  useEffect(() => {
    resumeTrackingIfEnabled().then(() => setTracking(isTracking() || wasTrackingEnabled()));
  }, []);

  useEffect(() => {
    refreshAuth();
    const onVisible = () => { if (document.visibilityState === 'visible') refreshAuth(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshAuth]);

  const start = useCallback(async () => {
    setBusy(true);
    try { await startTracking(); setTracking(true); await refreshAuth(); }
    finally { setBusy(false); }
  }, [refreshAuth]);

  const stop = useCallback(async () => {
    setBusy(true);
    try { await stopTracking(); setTracking(false); }
    finally { setBusy(false); }
  }, []);

  return { supported, tracking, busy, status, authStatus, start, stop, openSettings: openLocationSettings };
}
