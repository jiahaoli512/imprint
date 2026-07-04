import { useCallback, useEffect, useRef, useState } from 'react';
import { getLevel } from './region';
import { fetchRegionGeometry, computeDiscovery } from './discovery';

// Drives the dashboard discovery gauge. Exposes a status/percent plus the
// `onBusy`/`onSettle` callbacks the map's DiscoverySettleTracker calls: any map
// movement flips to 'loading', and ~2s after the map stops we resolve the
// region boundary and compute the discovered-cell percentage for `markers`.
// Recomputes when the markers change (e.g. admin switches users / late load).
export function useDiscovery(markers) {
  const [state, setState] = useState({ status: 'idle', percent: 0, level: '', name: '', discoveredCells: 0 });
  const lastSettle = useRef(null); // { lat, lng, zoom }
  const reqId = useRef(0);         // guards against out-of-order async results
  const markersRef = useRef(markers);

  // Keep the latest markers available to event-driven onSettle (fires later).
  useEffect(() => { markersRef.current = markers; }, [markers]);

  const run = useCallback(async (settle) => {
    const id = ++reqId.current;
    const level = getLevel(settle.zoom);
    setState((s) => ({ ...s, status: 'loading', level }));
    try {
      const region = await fetchRegionGeometry(settle.lat, settle.lng, level);
      const { percent, discoveredCells, regionAreaKm2 } =
        computeDiscovery(markersRef.current, region, level, region.name);
      if (id !== reqId.current) return; // a newer settle superseded this one
      // The region may override the zoom-derived level (e.g. open water → 'ocean').
      const resolvedLevel = region.level || level;
      // Carry the resolved region name so the panel's label and % update together
      // (and always describe the same region) rather than the label leading it.
      setState({ status: 'ready', percent, level: resolvedLevel, name: region.name, discoveredCells, regionAreaKm2 });
    } catch {
      if (id !== reqId.current) return;
      setState((s) => ({ ...s, status: 'error' }));
    }
  }, []);

  const onBusy = useCallback(() => setState((s) => ({ ...s, status: 'loading' })), []);
  const onSettle = useCallback((settle) => { lastSettle.current = settle; run(settle); }, [run]);

  // Re-run when the marker set changes, reusing the last settled position.
  useEffect(() => { if (lastSettle.current) run(lastSettle.current); }, [markers, run]);

  return { ...state, onBusy, onSettle };
}
