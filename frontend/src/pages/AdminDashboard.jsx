import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import { Fingerprint, ArrowLeft, List, Eye, Pencil, Trash2 } from 'lucide-react';
import L from 'leaflet';
import ConfirmModal from '../components/ConfirmModal';

const apiBase = import.meta.env.VITE_API_URL || window.location.origin;

async function loadMarkers() {
  try {
    const res = await fetch(`${apiBase}/api/markers`);
    return await res.json();
  } catch { return []; }
}

async function saveMarkers(points) {
  await fetch(`${apiBase}/api/markers`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points }),
  });
}

// Country code → continent
const CONTINENT = {
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

function getLevel(zoom) {
  if (zoom <= 2)  return 'earth';
  if (zoom <= 4)  return 'continent';
  if (zoom <= 6)  return 'country';
  if (zoom <= 9)  return 'state';
  if (zoom <= 12) return 'county';
  return 'city';
}

function pickName(addr, level) {
  if (level === 'earth')     return 'Earth';
  if (level === 'continent') return CONTINENT[addr.country_code?.toUpperCase()] || addr.country || '';
  if (level === 'country')   return addr.country || '';
  if (level === 'state')     return addr.state || addr.country || '';
  if (level === 'county')    return addr.county || addr.municipality || addr.state || '';
  return addr.city || addr.town || addr.village || addr.hamlet || addr.county || '';
}

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;background:#4fffb0;border:2px solid #080c14;border-radius:50%;box-shadow:0 0 8px rgba(79,255,176,0.7)"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const pinIconEdit = L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;background:#ff6b6b;border:2px solid #080c14;border-radius:50%;box-shadow:0 0 8px rgba(255,107,107,0.7);cursor:pointer"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 100); }, [map]);
  return null;
}

function MapClickHandler({ editing, onAdd }) {
  useMapEvents({
    click(e) { if (editing) onAdd([e.latlng.lat, e.latlng.lng]); },
  });
  return null;
}

const NOM = (lat, lng, zoom) =>
  fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=${zoom}&accept-language=en`,
    { headers: { 'User-Agent': 'ImprintAdminDashboard/1.0' } }
  ).then(r => r.json());

function RegionDetector({ onRegion }) {
  const map = useMap();

  const detect = useCallback(async () => {
    const zoom = map.getZoom();
    const level = getLevel(zoom);

    if (level === 'earth') { onRegion('Earth'); return; }

    const { lat, lng } = map.getCenter();
    try {
      const data = await NOM(lat, lng, 18);
      const addr = data.address || {};
      let name = pickName(addr, level);

      if (level === 'city' && !name) {
        const fallback = await NOM(lat, lng, 14);
        const fa = fallback.address || {};
        const city = fa.city || fa.town || fa.village || fa.hamlet;
        name = city ? `Near ${city}` : (fa.county || addr.county || '');
      }

      onRegion(name);
    } catch {
      onRegion('');
    }
  }, [map, onRegion]);

  useEffect(() => {
    let timer;
    const debounced = () => { clearTimeout(timer); timer = setTimeout(detect, 700); };
    map.on('moveend', debounced);
    map.on('zoomend', debounced);
    detect();
    return () => { map.off('moveend', debounced); map.off('zoomend', debounced); clearTimeout(timer); };
  }, [map, detect]);

  return null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('view');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [region, setRegion] = useState('');
  const [saved, setSaved] = useState([]);
  const [draft, setDraft] = useState([]);

  useEffect(() => { loadMarkers().then(setSaved); }, []);

  const editing = mode === 'edit';
  const markers = editing ? draft : saved;

  function enterEdit() { setDraft([...saved]); setMode('edit'); }

  function handleViewClick() { if (editing) setShowSavePrompt(true); }

  function saveAndView() {
    saveMarkers(draft);
    setSaved(draft); setDraft([]); setMode('view'); setShowSavePrompt(false);
  }

  function discardAndView() { setDraft([]); setMode('view'); setShowSavePrompt(false); }

  const handleRegion = useCallback((r) => setRegion(r), []);

  return (
    <div className="dashboard-page">
      <div className="admin-header">
        <div className="logo">
          <div className="logo-icon" style={{ width: '32px', height: '32px' }}>
            <Fingerprint size={18} strokeWidth={2} color="#080c14" />
          </div>
          Imprint
        </div>
        <div className="admin-header-right">
          <span className="admin-badge">Admin</span>
          <button className="btn btn-ghost" onClick={() => navigate('/admin/waitlist')}>
            <List size={15} /> <span className="btn-label">Waitlist</span>
          </button>
          <button className="btn btn-ghost" onClick={() => { sessionStorage.removeItem('admin_auth'); navigate('/home'); }}>
            <ArrowLeft size={15} /> <span className="btn-label">Back to site</span>
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-map-card">

          <div className="dashboard-toolbar">
            <div className="dashboard-toolbar-dots">
              <div className="dot dot-r" />
              <div className="dot dot-y" />
              <div className="dot dot-g" />
            </div>
            <div className="mode-toggle">
              <button className={`mode-btn${!editing ? ' active' : ''}`} onClick={handleViewClick}>
                <Eye size={13} /> View
              </button>
              <button className={`mode-btn${editing ? ' active' : ''}`} onClick={enterEdit}>
                <Pencil size={13} /> Edit
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {region && <span className="dashboard-region">{region}</span>}
              {editing && (
                <button className="btn btn-ghost dashboard-save-btn" onClick={() => setDraft([])}>
                  <Trash2 size={13} /> Clear all
                </button>
              )}
            </div>
          </div>

          <div className={`dashboard-map-wrap${editing ? ' editing' : ''}`}>
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
              <MapClickHandler editing={editing} onAdd={(pos) => setDraft(d => [...d, pos])} />
              <RegionDetector onRegion={handleRegion} />
              {markers.map((pos, i) => (
                <React.Fragment key={i}>
                  <Circle
                    center={pos}
                    radius={15.24}
                    pathOptions={{
                      color: editing ? '#ff6b6b' : '#4fffb0',
                      fillColor: editing ? '#ff6b6b' : '#4fffb0',
                      fillOpacity: 0.15,
                      weight: 1.5,
                      opacity: 0.6,
                    }}
                  />
                  <Marker
                    position={pos}
                    icon={editing ? pinIconEdit : pinIcon}
                    eventHandlers={editing ? {
                      click(e) { L.DomEvent.stopPropagation(e); setDraft(d => d.filter((_, idx) => idx !== i)); },
                    } : {}}
                  />
                </React.Fragment>
              ))}
              <InvalidateOnMount />
            </MapContainer>
          </div>

          {editing && (
            <p className="dashboard-hint">Tap to add a pin · Tap a pin to remove it</p>
          )}
        </div>
      </div>

      {showSavePrompt && (
        <ConfirmModal
          title="Save changes?"
          message="Do you want to save your changes to the map?"
          confirmLabel="Save"
          altLabel="Discard"
          onConfirm={saveAndView}
          onAlt={discardAndView}
          onCancel={() => setShowSavePrompt(false)}
        />
      )}
    </div>
  );
}
