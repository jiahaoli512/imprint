import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  pinIcon, pinIconEdit, InvalidateOnMount, MapClickHandler, RegionDetector, DiscoverySettleTracker,
  LOCATION_RADIUS_M, LOCATE_BLUE,
} from './mapUtils';

// Most DOM pins we'll ever mount at once — a safety ceiling on top of the
// screen-grid dedup below. Constant-size marker icons zoom smoothly (unlike
// canvas vectors, which scale + snap), but thousands of DOM nodes lag.
const MAX_RENDERED_PINS = 1000;
// Fraction to grow the viewport when culling, so a small pan doesn't reveal an
// edge with no pins before the next recompute.
const VIEWPORT_PAD = 0.25;
// Screen-space dedup cell, in pixels (~ a pin's diameter). Two markers that
// project into the same cell at the current zoom render as one dot.
const SCREEN_CELL_PX = 14;

// Renders the trail pins, but thinned to the current view: cull to the padded
// viewport, then keep one pin per SCREEN_CELL_PX screen cell so overlapping
// points (a tight trail when zoomed out) collapse to a clean line of distinct
// dots instead of a solid band — bounded by MAX_RENDERED_PINS as a backstop.
// Lives inside MapContainer so it can project lat/lng to screen pixels.
function MarkerLayer({ markers, editing, onRemove }) {
  const map = useMap();
  const [version, setVersion] = useState(0);
  useMapEvents({
    moveend() { setVersion((v) => v + 1); },
    zoomend() { setVersion((v) => v + 1); },
  });

  // Original indices to mount (original index lets edit-mode removal target the
  // right marker). Recomputed on move/zoom (via `version`); O(n), cheap.
  const indices = useMemo(() => {
    const bounds = map.getBounds().pad(VIEWPORT_PAD);
    const zoom = map.getZoom();
    const seen = new Set();
    const kept = [];
    for (let i = 0; i < markers.length; i++) {
      const p = markers[i];
      if (!bounds.contains(p)) continue;
      const pt = map.project(p, zoom);
      const key = `${Math.floor(pt.x / SCREEN_CELL_PX)}:${Math.floor(pt.y / SCREEN_CELL_PX)}`;
      if (seen.has(key)) continue; // a closer/earlier point already owns this cell
      seen.add(key);
      kept.push(i);
    }
    // Backstop: if a fully-explored area still fills the view with distinct
    // cells, stride down to the cap so node count stays bounded.
    const stride = Math.max(1, Math.ceil(kept.length / MAX_RENDERED_PINS));
    if (stride === 1) return kept;
    const thinned = [];
    for (let k = 0; k < kept.length; k += stride) thinned.push(kept[k]);
    return thinned;
    // `version` isn't read in the body — it's the trigger to recompute against
    // the map's live bounds/zoom after a move or zoom.
  }, [markers, version, map]); // eslint-disable-line react-hooks/exhaustive-deps

  return indices.map((i) => (
    <Marker
      key={i}
      position={markers[i]}
      icon={editing ? pinIconEdit : pinIcon}
      eventHandlers={editing ? {
        click(e) { L.DomEvent.stopPropagation(e); onRemove(i); },
      } : undefined}
    />
  ));
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
      <MarkerLayer markers={displayMarkers} editing={editing} onRemove={onRemoveMarker} />
      <InvalidateOnMount />
    </MapContainer>
  );
}
