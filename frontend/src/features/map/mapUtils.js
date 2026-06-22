import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Map geometry + palette, shared by MapView and MapCard.
export const MARKER_RADIUS_M = 15.24;   // mirrors MARKER_RADIUS_M in backend markerService
export const LOCATION_RADIUS_M = 80;   // accuracy circle around the user's location
export const MARKER_COLOR = '#e2a156';      // saved markers (and accent)
export const MARKER_EDIT_COLOR = '#e2685a'; // markers/errors while editing
export const LOCATE_BLUE = '#5aa9e6';       // the "locate me" dot/highlight

export const CONTINENT = {
  AF:'Asia',AM:'Asia',AZ:'Asia',BH:'Asia',BD:'Asia',BT:'Asia',BN:'Asia',KH:'Asia',CN:'Asia',
  CY:'Asia',GE:'Asia',IN:'Asia',ID:'Asia',IR:'Asia',IQ:'Asia',IL:'Asia',JP:'Asia',JO:'Asia',
  KZ:'Asia',KW:'Asia',KG:'Asia',LA:'Asia',LB:'Asia',MY:'Asia',MV:'Asia',MN:'Asia',MM:'Asia',
  NP:'Asia',KP:'Asia',OM:'Asia',PK:'Asia',PS:'Asia',PH:'Asia',QA:'Asia',SA:'Asia',SG:'Asia',
  KR:'Asia',LK:'Asia',SY:'Asia',TW:'Asia',TJ:'Asia',TH:'Asia',TL:'Asia',TR:'Asia',TM:'Asia',
  AE:'Asia',UZ:'Asia',VN:'Asia',YE:'Asia',
  AL:'Europe',AD:'Europe',AT:'Europe',BY:'Europe',BE:'Europe',BA:'Europe',BG:'Europe',
  HR:'Europe',CZ:'Europe',DK:'Europe',EE:'Europe',FI:'Europe',FR:'Europe',DE:'Europe',
  GR:'Europe',HU:'Europe',IS:'Europe',IE:'Europe',IT:'Europe',XK:'Europe',LV:'Europe',
  LI:'Europe',LT:'Europe',LU:'Europe',MT:'Europe',MD:'Europe',MC:'Europe',ME:'Europe',
  NL:'Europe',MK:'Europe',NO:'Europe',PL:'Europe',PT:'Europe',RO:'Europe',RU:'Europe',
  SM:'Europe',RS:'Europe',SK:'Europe',SI:'Europe',ES:'Europe',SE:'Europe',CH:'Europe',
  UA:'Europe',GB:'Europe',VA:'Europe',AX:'Europe',FO:'Europe',GI:'Europe',IM:'Europe',
  DZ:'Africa',AO:'Africa',BJ:'Africa',BW:'Africa',BF:'Africa',BI:'Africa',CV:'Africa',
  CM:'Africa',CF:'Africa',TD:'Africa',KM:'Africa',CG:'Africa',CD:'Africa',CI:'Africa',
  DJ:'Africa',EG:'Africa',GQ:'Africa',ER:'Africa',SZ:'Africa',ET:'Africa',GA:'Africa',
  GM:'Africa',GH:'Africa',GN:'Africa',GW:'Africa',KE:'Africa',LS:'Africa',LR:'Africa',
  LY:'Africa',MG:'Africa',MW:'Africa',ML:'Africa',MR:'Africa',MU:'Africa',MA:'Africa',
  MZ:'Africa',NA:'Africa',NE:'Africa',NG:'Africa',RW:'Africa',ST:'Africa',SN:'Africa',
  SL:'Africa',SO:'Africa',ZA:'Africa',SS:'Africa',SD:'Africa',TZ:'Africa',TG:'Africa',
  TN:'Africa',UG:'Africa',ZM:'Africa',ZW:'Africa',EH:'Africa',
  AG:'North America',BS:'North America',BB:'North America',BZ:'North America',
  CA:'North America',CR:'North America',CU:'North America',DM:'North America',
  DO:'North America',SV:'North America',GD:'North America',GT:'North America',
  HT:'North America',HN:'North America',JM:'North America',MX:'North America',
  NI:'North America',PA:'North America',KN:'North America',LC:'North America',
  VC:'North America',TT:'North America',US:'North America',PR:'North America',
  GL:'North America',BM:'North America',KY:'North America',
  AR:'South America',BO:'South America',BR:'South America',CL:'South America',
  CO:'South America',EC:'South America',GY:'South America',PY:'South America',
  PE:'South America',SR:'South America',UY:'South America',VE:'South America',
  GF:'South America',FK:'South America',
  AU:'Oceania',FJ:'Oceania',KI:'Oceania',MH:'Oceania',FM:'Oceania',NR:'Oceania',
  NZ:'Oceania',PW:'Oceania',PG:'Oceania',WS:'Oceania',SB:'Oceania',TO:'Oceania',
  TV:'Oceania',VU:'Oceania',CK:'Oceania',PF:'Oceania',NC:'Oceania',GU:'Oceania',
  AS:'Oceania',MP:'Oceania',NF:'Oceania',
  AQ:'Antarctica',
};

// --- coordinate → continent / ocean naming (no network) ----------------------
// Approximate continent bounding boxes [minLng, minLat, maxLng, maxLat]. Boxes
// are generous (coast-inclusive) and overlap at the Eurasia seam; a box whose
// minLng > maxLng wraps the antimeridian (matches lng >= minLng OR lng <= maxLng).
// Shared by RegionDetector (toolbar label) and discovery.js (marker membership +
// region resolution), so both name water/coast the same way.
export const CONTINENT_BBOX = {
  'North America': [-170, 7, -50, 84],
  'South America': [-82, -56, -34, 13],
  Europe: [-25, 34, 45, 72],
  Africa: [-18, -35, 52, 38],
  Asia: [25, 0, 180, 81],
  Oceania: [110, -50, -150, 10], // wraps the antimeridian (Australia → Pacific)
  Antarctica: [-180, -90, 180, -60],
};

// Point-in-box test that supports antimeridian wrap (minLng > maxLng).
export function inBBox(lat, lng, [minLng, minLat, maxLng, maxLat]) {
  if (lat < minLat || lat > maxLat) return false;
  return minLng <= maxLng ? (lng >= minLng && lng <= maxLng) : (lng >= minLng || lng <= maxLng);
}

// The continent whose (coast-inclusive) box contains the point, or null if the
// point is outside every continent — i.e. over open ocean. First box wins;
// insertion order breaks the Eurasia overlap toward Europe.
export function continentContaining(lat, lng) {
  for (const name of Object.keys(CONTINENT_BBOX)) {
    if (inBBox(lat, lng, CONTINENT_BBOX[name])) return name;
  }
  return null;
}

// Ocean anchor points — oceans have no clean boxes (the Pacific wraps the
// antimeridian and they interlock), so we name open water by the nearest anchor.
// The poles are decided by latitude first.
const OCEAN_ANCHORS = [
  ['Pacific Ocean', 0, -140], ['Pacific Ocean', 25, -150], ['Pacific Ocean', -25, -120],
  ['Pacific Ocean', 0, 180], ['Pacific Ocean', 30, 165], ['Pacific Ocean', -30, -150],
  ['Atlantic Ocean', 0, -25], ['Atlantic Ocean', 40, -40], ['Atlantic Ocean', -30, -15],
  ['Indian Ocean', -20, 80], ['Indian Ocean', 0, 70], ['Indian Ocean', -30, 95],
];

// Shortest angular distance between two longitudes, accounting for the ±180 wrap.
function lngDelta(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// Name the ocean at a coordinate (only called for points over open water).
export function oceanAt(lat, lng) {
  if (lat <= -60) return 'Southern Ocean';
  if (lat >= 66) return 'Arctic Ocean';
  let best = OCEAN_ANCHORS[0][0];
  let bestDist = Infinity;
  for (const [name, aLat, aLng] of OCEAN_ANCHORS) {
    const dLat = lat - aLat;
    const dLng = lngDelta(lng, aLng);
    const d = dLat * dLat + dLng * dLng;
    if (d < bestDist) { bestDist = d; best = name; }
  }
  return best;
}

export function getLevel(zoom) {
  // <=3 covers the hemispheric, multi-continent view → treat as Earth.
  // 'continent' kicks in only once you're zoomed to roughly a single continent.
  if (zoom <= 3)  return 'earth';
  if (zoom <= 4)  return 'continent';
  if (zoom <= 6)  return 'country';
  if (zoom <= 9)  return 'state';
  if (zoom <= 12) return 'county';
  return 'city';
}

export function pickName(addr, level) {
  if (level === 'earth')     return 'Earth';
  if (level === 'continent') return CONTINENT[addr.country_code?.toUpperCase()] || addr.country || '';
  if (level === 'country')   return addr.country || '';
  if (level === 'state')     return addr.state || addr.country || '';
  if (level === 'county')    return addr.county || addr.municipality || addr.state || '';
  return addr.city || addr.town || addr.village || addr.hamlet || addr.county || '';
}

export async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en&addressdetails=1`
  );
  const data = await res.json();
  if (data.error) return null;
  return data.address || null;
}

export const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;background:#e2a156;border:2px solid #0b0e13;border-radius:50%;box-shadow:0 0 4px rgba(226,161,86,0.25)"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

export const pinIconEdit = L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;background:#e2685a;border:2px solid #0b0e13;border-radius:50%;box-shadow:0 0 4px rgba(226,104,90,0.25);cursor:pointer"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

export function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 100); }, [map]);
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
