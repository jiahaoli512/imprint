import { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  pinIcon, pinIconEdit, InvalidateOnMount, MapClickHandler, RegionDetector, DiscoverySettleTracker,
  LOCATION_RADIUS_M, LOCATE_BLUE,
} from './mapUtils';

// Most DOM pins we'll ever mount at once. Constant-size marker icons zoom
// smoothly (unlike canvas vectors, which scale + snap), but thousands of DOM
// nodes lag — so we only render the pins in view and thin them past this cap.
const MAX_RENDERED_PINS = 1500;
// Fraction to grow the viewport when culling, so a small pan doesn't reveal an
// edge with no pins before the next recompute.
const VIEWPORT_PAD = 0.25;

// Tracks the map's bounds + zoom and lifts them up, so the parent can render
// only the pins currently in view. Fires on settle (moveend covers zoom too).
function ViewportTracker({ onChange }) {
  const map = useMapEvents({
    moveend() { onChange(map.getBounds()); },
    zoomend() { onChange(map.getBounds()); },
  });
  useEffect(() => { onChange(map.getBounds()); }, [map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

const locationIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:${LOCATE_BLUE};border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(90,169,230,0.25),0 0 12px rgba(90,169,230,0.6)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const LOCATE_ZOOM = 16; // street-level zoom when centering on the user

function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), LOCATE_ZOOM), { duration: 1.2 });
  }, [position]);
  return null;
}

// Keep the map sized to its container while it animates (e.g. the enlarge
// toggle): re-measure each frame for the transition's duration so Leaflet fills
// the growing/shrinking area smoothly instead of leaving a grey gap.
function InvalidateOnResize({ dep }) {
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

// Renders the Leaflet map and all its layers. Stateless: marker data and edit
// state come in as props; user interactions are reported via callbacks.
export default function MapView({ displayMarkers, editing, userLocation, onAddMarker, onRemoveMarker, onRegion, onDiscoveryBusy, onDiscoverySettle, expanded }) {
  const [bounds, setBounds] = useState(null);
  const onViewChange = useCallback((b) => setBounds(b), []);

  // Original indices of the pins to actually mount: those inside the (padded)
  // viewport, thinned by a uniform stride if still over the cap. Keeping the
  // original index lets edit-mode removal target the right marker. O(n) per
  // settle, which is cheap even for tens of thousands of points.
  const visibleIndices = useMemo(() => {
    const padded = bounds ? bounds.pad(VIEWPORT_PAD) : null;
    const inView = [];
    for (let i = 0; i < displayMarkers.length; i++) {
      if (!padded || padded.contains(displayMarkers[i])) inView.push(i);
    }
    const stride = Math.max(1, Math.ceil(inView.length / MAX_RENDERED_PINS));
    if (stride === 1) return inView;
    const thinned = [];
    for (let k = 0; k < inView.length; k += stride) thinned.push(inView[k]);
    return thinned;
  }, [bounds, displayMarkers]);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={1}
      maxZoom={18}
      style={{ height: '100%', width: '100%' }}
      worldCopyJump={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <MapClickHandler editing={editing} onAdd={onAddMarker} />
      <ViewportTracker onChange={onViewChange} />
      <RegionDetector onRegion={onRegion} />
      {onDiscoverySettle && <DiscoverySettleTracker onBusy={onDiscoveryBusy} onSettle={onDiscoverySettle} />}
      <InvalidateOnResize dep={expanded} />
      {userLocation && <FlyToLocation position={userLocation} />}
      {userLocation && (
        <>
          <Circle
            center={userLocation}
            radius={LOCATION_RADIUS_M}
            pathOptions={{ color: LOCATE_BLUE, fillColor: LOCATE_BLUE, fillOpacity: 0.12, weight: 1, opacity: 0.4 }}
          />
          <Marker position={userLocation} icon={locationIcon} />
        </>
      )}
      {/* Constant-size DOM pins (no zoom scale/snap), but only the ones in view —
          and thinned past MAX_RENDERED_PINS — so a huge trail stays light. `i` is
          the original index, so edit-mode removal targets the right marker. */}
      {visibleIndices.map((i) => (
        <Marker
          key={i}
          position={displayMarkers[i]}
          icon={editing ? pinIconEdit : pinIcon}
          eventHandlers={editing ? {
            click(e) { L.DomEvent.stopPropagation(e); onRemoveMarker(i); },
          } : undefined}
        />
      ))}
      <InvalidateOnMount />
    </MapContainer>
  );
}
