import { useState, useCallback } from 'react';
import { isTrackingSupported, isTracking, startTracking, stopTracking } from './backgroundTracking';

// UI-facing hook for the background tracking toggle. `supported` is false on web,
// so callers can hide the control entirely off-native.
export function useBackgroundTracking() {
  const supported = isTrackingSupported();
  const [tracking, setTracking] = useState(isTracking());
  const [busy, setBusy] = useState(false);

  const start = useCallback(async () => {
    setBusy(true);
    try { await startTracking(); setTracking(true); }
    finally { setBusy(false); }
  }, []);

  const stop = useCallback(async () => {
    setBusy(true);
    try { await stopTracking(); setTracking(false); }
    finally { setBusy(false); }
  }, []);

  return { supported, tracking, busy, start, stop };
}
