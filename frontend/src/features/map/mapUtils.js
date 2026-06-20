import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Map geometry + palette, shared by MapView and MapCard.
export const MARKER_RADIUS_M = 15.24;   // mirrors MARKER_RADIUS_M in backend markerService
export const LOCATION_RADIUS_M = 200;   // accuracy circle around the user's location
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

export function getLevel(zoom) {
  if (zoom <= 2)  return 'earth';
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
  html: `<div style="width:10px;height:10px;background:#e2a156;border:2px solid #0b0e13;border-radius:50%;box-shadow:0 0 8px rgba(226,161,86,0.7)"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

export const pinIconEdit = L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;background:#e2685a;border:2px solid #0b0e13;border-radius:50%;box-shadow:0 0 8px rgba(226,104,90,0.7);cursor:pointer"></div>`,
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

export function RegionDetector({ onRegion }) {
  const map = useMap();

  useEffect(() => {
    let timer;

    async function detect() {
      const zoom = map.getZoom();
      const level = getLevel(zoom);

      if (level === 'earth') { onRegion('Earth'); return; }

      const { lat, lng } = map.getCenter();
      const addr = await reverseGeocode(lat, lng);
      if (!addr) { onRegion(''); return; }

      let name = pickName(addr, level);

      if (level === 'city' && !name) {
        const fa = await reverseGeocode(lat, lng);
        const city = fa?.city || fa?.town || fa?.village || fa?.hamlet;
        name = city ? `Near ${city}` : (fa?.county || '');
      }

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
