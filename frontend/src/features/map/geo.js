// Pure coordinate → continent / ocean geography (no network, no Leaflet). Shared
// by RegionDetector (toolbar label), discovery.js (marker membership + region
// resolution), and region.js (place naming), so they all name water/coast the
// same way. Split out of the old mapUtils grab-bag.

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

// Approximate continent bounding boxes [minLng, minLat, maxLng, maxLat]. Boxes
// are generous (coast-inclusive) and overlap at the Eurasia seam; a box whose
// minLng > maxLng wraps the antimeridian (matches lng >= minLng OR lng <= maxLng).
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
