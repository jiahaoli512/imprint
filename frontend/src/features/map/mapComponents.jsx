import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { continentContaining, oceanAt } from './geo';
import { getLevel, pickName, reverseGeocode } from './region';

// The Leaflet behavior components (headless — they render null and just wire map
// events). Split out of the old mapUtils grab-bag so the map's React glue is
// separate from the pure geo/region/style concerns.

export function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 100); }, [map]);
  return null;
}

const LOCATE_ZOOM = 16; // street-level zoom when centering on the user

// Flies the map to `position` at street level (keeping a closer zoom if already in).
export function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), LOCATE_ZOOM), { duration: 1.2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);
  return null;
}

// Keep the map sized to its container while it animates (e.g. the enlarge
// toggle): re-measure each frame for the transition's duration so Leaflet fills
// the growing/shrinking area smoothly instead of leaving a grey gap.
export function InvalidateOnResize({ dep }) {
  const map = useMap();
  useEffect(() => {
    let raf, start;
    const DURATION = 400; // ≥ the CSS transition (0.35s)
    const tick = (t) => {
      if (start === undefined) start = t;
      map.invalidateSize({ animate: false });
      if (t - start < DURATION) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dep, map]);
  return null;
}

export function MapClickHandler({ editing, onAdd }) {
  useMapEvents({
    click(e) { if (editing) onAdd([e.latlng.lat, e.latlng.lng]); },
  });
  return null;
}

// Reports map activity for the discovery gauge: `onBusy` fires the moment the
// map starts moving/zooming, and `onSettle({lat,lng,zoom})` fires once the map
// has been completely still for SETTLE_MS. Separate from RegionDetector (which
// stays snappy at 700ms) so the gauge can deliberately wait ~2s before
// recomputing the expensive percentage.
const SETTLE_MS = 2000;

export function DiscoverySettleTracker({ onBusy, onSettle }) {
  const map = useMap();

  useEffect(() => {
    let timer;

    const settle = () => {
      const { lat, lng } = map.getCenter();
      onSettle({ lat, lng, zoom: map.getZoom() });
    };
    const queueSettle = () => { clearTimeout(timer); timer = setTimeout(settle, SETTLE_MS); };
    const markBusy = () => { clearTimeout(timer); onBusy(); };

    map.on('movestart', markBusy);
    map.on('zoomstart', markBusy);
    map.on('moveend', queueSettle);
    map.on('zoomend', queueSettle);
    queueSettle(); // initial compute after the map mounts

    return () => {
      map.off('movestart', markBusy);
      map.off('zoomstart', markBusy);
      map.off('moveend', queueSettle);
      map.off('zoomend', queueSettle);
      clearTimeout(timer);
    };
  }, [map, onBusy, onSettle]);

  return null;
}

export function RegionDetector({ onRegion }) {
  const map = useMap();

  useEffect(() => {
    let timer;

    async function detect() {
      const zoom = map.getZoom();
      const level = getLevel(zoom);

      if (level === 'earth') { onRegion('Earth'); return; }

      const { lat, lng } = map.getCenter();
      // Open ocean (outside every continent box) → name the sea; no network.
      if (!continentContaining(lat, lng)) { onRegion(oceanAt(lat, lng)); return; }

      const addr = await reverseGeocode(lat, lng);
      let name = addr ? pickName(addr, level) : '';

      if (level === 'city' && !name) {
        const city = addr?.city || addr?.town || addr?.village || addr?.hamlet;
        name = city ? `Near ${city}` : (addr?.county || '');
      }

      // Coastal water (inside a continent box but no land under the centre) →
      // the nearest continent, matching the discovery panel rather than "—".
      if (!name) name = continentContaining(lat, lng);

      onRegion(name);
    }

    const debounced = () => { clearTimeout(timer); timer = setTimeout(detect, 700); };

    map.on('moveend', debounced);
    map.on('zoomend', debounced);
    detect();

    return () => {
      map.off('moveend', debounced);
      map.off('zoomend', debounced);
      clearTimeout(timer);
    };
  }, [map, onRegion]);

  return null;
}
