import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  makeDotIcon, makePinIcon, pinIconEdit, LOCATION_RADIUS_M, LOCATE_BLUE, MARKER_EDIT_COLOR,
} from './mapStyle';
import { InvalidateOnMount, MapClickHandler, RegionDetector, DiscoverySettleTracker, FlyToLocation, InvalidateOnResize } from './mapComponents';
import { QUALITY, DEFAULT_QUALITY, useMapQuality } from './mapQuality';
import { BASEMAPS, useBasemap } from './basemap';
import { useMarkerColor } from './markerColor';
import { usePointOpacity, opacityFromPercent } from './pointOpacity';
import { usePointShape } from './pointShape';

// Fraction to grow the viewport when culling, so a small pan doesn't reveal an
// edge with no pins before the next recompute.
const VIEWPORT_PAD = 0.25;
// Screen-space dedup cell, in pixels (~ a pin's diameter). Two markers that
// project into the same cell at the current zoom render as one dot.
const SCREEN_CELL_PX = 14;
// CircleMarker dot geometry (the 'low' tier) — mirrors the 10px pin look.
const DOT_RADIUS = 5;
const DOT_WEIGHT = 1;
const DOT_BORDER = '#0b0e13';
// Pins revealed per animation frame during a full rebuild (mount / quality
// switch / a bulk marker-set change — e.g. admin switching users). Matches the
// low/medium/high cap: benchmarked ~11ms to mount 500 DOM pins, comfortably
// under one 60fps frame. Below this chunk size a rebuild never spans a frame
// boundary, so low/medium/high (cap 500) always reveal in one shot; only
// ultra (2000) and max (4000) actually ramp, in ~4/~8 frames instead of one
// ~76ms/~250ms blocking task.
const REVEAL_CHUNK = 500;

// Renders the trail pins, thinned per the active quality `cfg`:
//   cfg.cull → only markers in the padded viewport
//   cfg.grid → one pin per SCREEN_CELL_PX screen cell (overlapping points → one)
//   cfg.cap  → stride down to at most cfg.cap pins as a backstop
//   cfg.marker 'dom' → constant-size pin icons; 'circle' → canvas CircleMarkers
// Lives inside MapContainer so it can project lat/lng to screen pixels.
function MarkerLayer({ markers, editing, onRemove, cfg }) {
  const map = useMap();
  const [markerColor] = useMarkerColor();
  const [opacityPercent] = usePointOpacity();
  const opacity = opacityFromPercent(opacityPercent);
  const [pointShape] = usePointShape();
  const iconFor = pointShape === 'pin' ? makePinIcon : makeDotIcon;
  const [version, setVersion] = useState(0);
  // The thinned set only changes when the view changes *enough* to alter culling
  // or the screen-cell dedup — but rebuilding the DOM marker layer is the map's
  // costliest per-interaction work (~27ms for 1000 pins vs ~0.1ms to let Leaflet
  // just reposition the ones already mounted). So we don't recompute on every
  // move: bump `version` only when the zoom changes or the center pans past half
  // the padded margin, which is still well within the slack `VIEWPORT_PAD`
  // already renders beyond the viewport (so no blank edge appears). Tiers that
  // neither cull nor dedup (ultra/max) don't depend on the view, so they never
  // re-bump after the first compute.
  const reactsToView = cfg.cull || cfg.grid;
  const lastView = useRef(null);
  const maybeRecompute = () => {
    if (!reactsToView) return;
    const zoom = map.getZoom();
    const c = map.project(map.getCenter(), zoom);
    const size = map.getSize();
    const threshold = Math.min(size.x, size.y) * VIEWPORT_PAD * 0.5;
    const last = lastView.current;
    if (!last || last.zoom !== zoom || Math.hypot(c.x - last.x, c.y - last.y) >= threshold) {
      lastView.current = { zoom, x: c.x, y: c.y };
      setVersion((v) => v + 1);
    }
  };
  useMapEvents({
    moveend() { maybeRecompute(); },
    zoomend() { maybeRecompute(); },
  });

  // Original indices to mount (original index lets edit-mode removal target the
  // right marker). Recomputed on move/zoom (via `version`); O(n), cheap.
  const indices = useMemo(() => {
    const bounds = cfg.cull ? map.getBounds().pad(VIEWPORT_PAD) : null;
    const zoom = map.getZoom();
    const seen = cfg.grid ? new Set() : null;
    const kept = [];
    for (let i = 0; i < markers.length; i++) {
      const p = markers[i];
      if (bounds && !bounds.contains(p)) continue;
      if (seen) {
        const pt = map.project(p, zoom);
        const key = `${Math.floor(pt.x / SCREEN_CELL_PX)}:${Math.floor(pt.y / SCREEN_CELL_PX)}`;
        if (seen.has(key)) continue; // an earlier point already owns this cell
        seen.add(key);
      }
      kept.push(i);
    }
    // Backstop: if a fully-explored area still fills the view, stride to the cap.
    const stride = Math.max(1, Math.ceil(kept.length / cfg.cap));
    if (stride === 1) return kept;
    const thinned = [];
    for (let k = 0; k < kept.length; k += stride) thinned.push(kept[k]);
    return thinned;
    // `version` isn't read in the body — it's the trigger to recompute against
    // the map's live bounds/zoom after a move or zoom.
  }, [markers, version, map, cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reveal large marker sets over a few animation frames instead of mounting
  // them all in one blocking task. Rather than special-casing WHY `indices`
  // changed (mount, tier switch, bulk marker-set swap, or — now that cull is
  // on for every DOM tier — panning into a denser area), key the ramp purely
  // on how much the target grew: a jump of more than one chunk ramps up from
  // wherever we already are (never re-hiding markers already shown); anything
  // else (a shrink, e.g. panning to a sparser area, or an ordinary small
  // append) applies immediately, since removing markers — or diffing in one
  // more via `indices`'s stable original-index keys — is cheap regardless.
  const [revealCount, setRevealCount] = useState(0);
  const [lastTarget, setLastTarget] = useState(-1); // sentinel: first render always "changes"
  // Adjust state during render (React's documented pattern for resetting
  // state in response to a prop change) rather than in an effect — an effect
  // that calls setState synchronously in its body just forces an extra
  // cascading render for no benefit here.
  if (indices.length !== lastTarget) {
    const grew = indices.length - lastTarget > REVEAL_CHUNK;
    setLastTarget(indices.length);
    setRevealCount(grew ? Math.min(indices.length, Math.max(revealCount, REVEAL_CHUNK)) : indices.length);
  }
  // The actual ramp: an effect that subscribes to `revealCount` and advances it
  // one chunk per animation frame — the setState here happens inside the rAF
  // callback (an external-system event), not synchronously in the effect body.
  useEffect(() => {
    if (revealCount >= indices.length) return;
    const raf = requestAnimationFrame(() => {
      setRevealCount((c) => Math.min(indices.length, c + REVEAL_CHUNK));
    });
    return () => cancelAnimationFrame(raf);
  }, [revealCount, indices.length]);
  const visibleIndices = indices.length <= revealCount ? indices : indices.slice(0, revealCount);

  // Stable per-index click handlers so edit-mode markers don't get their
  // native listeners torn down and reattached (react-leaflet's useEventHandlers
  // effect keys off object identity) on every unrelated re-render — e.g.
  // tweaking Point color/opacity while editing, which re-renders this
  // component but doesn't change who should be removable. Built once per
  // `indices`/`onRemove` change (the same trigger as a real marker rebuild),
  // not on every render.
  const handlersByIndex = useMemo(() => {
    const map = new Map();
    for (const i of indices) map.set(i, { click(e) { L.DomEvent.stopPropagation(e); onRemove(i); } });
    return map;
  }, [indices, onRemove]);

  if (cfg.marker === 'circle') {
    return visibleIndices.map((i) => (
      <CircleMarker
        key={i}
        center={markers[i]}
        radius={DOT_RADIUS}
        pathOptions={{
          color: DOT_BORDER, weight: DOT_WEIGHT,
          fillColor: editing ? MARKER_EDIT_COLOR : markerColor,
          fillOpacity: editing ? 1 : opacity, opacity: editing ? 1 : opacity,
        }}
        eventHandlers={editing ? handlersByIndex.get(i) : undefined}
      />
    ));
  }

  return visibleIndices.map((i) => (
    <Marker
      key={i}
      position={markers[i]}
      icon={editing ? pinIconEdit : iconFor(markerColor)}
      opacity={editing ? 1 : opacity}
      eventHandlers={editing ? handlersByIndex.get(i) : undefined}
    />
  ));
}

const locationIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:${LOCATE_BLUE};border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(90,169,230,0.25),0 0 12px rgba(90,169,230,0.6)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// Renders the Leaflet map and all its layers. Stateless: marker data and edit
// state come in as props; user interactions are reported via callbacks.
export default function MapView({ displayMarkers, editing, userLocation, onAddMarker, onRemoveMarker, onRegion, onDiscoveryBusy, onDiscoverySettle, expanded }) {
  const [quality] = useMapQuality();
  const cfg = QUALITY[quality] || QUALITY[DEFAULT_QUALITY];
  const [basemap] = useBasemap();

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={1}
      maxZoom={18}
      style={{ height: '100%', width: '100%' }}
      worldCopyJump={true}
      preferCanvas={true}
      attributionControl={false}
    >
      <TileLayer
        key={basemap}
        url={BASEMAPS[basemap].url}
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
      <MarkerLayer markers={displayMarkers} editing={editing} onRemove={onRemoveMarker} cfg={cfg} />
      <InvalidateOnMount />
    </MapContainer>
  );
}
