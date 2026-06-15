import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import { Fingerprint, User, List, LayoutDashboard, LogOut, Eye, Pencil, Trash2 } from 'lucide-react';
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

function MapClickHandler({ editing, onAdd }) {
  useMapEvents({
    click(e) { if (editing) onAdd([e.latlng.lat, e.latlng.lng]); },
  });
  return null;
}

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 100); }, [map]);
  return null;
}

async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en&addressdetails=1`
  );
  const data = await res.json();
  if (data.error) return null;
  return data.address || null;
}

function RegionDetector({ onRegion }) {
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

export default function Dashboard() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAdminView = pathname.startsWith('/admin/');
  const [region, setRegion] = useState('');
  const [markers, setMarkers] = useState([]);
  const [saved, setSaved] = useState([]);
  const [draft, setDraft] = useState([]);
  const [mode, setMode] = useState('view');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const searchRef = useRef(null);
  const timerRef = useRef(null);

  const editing = isAdminView && mode === 'edit';
  const displayMarkers = isAdminView ? (editing ? draft : saved) : markers;

  function enterEdit() { setDraft([...saved]); setMode('edit'); }
  function handleViewClick() { if (editing) setShowSavePrompt(true); }
  function saveAndView() { saveMarkers(draft); setSaved(draft); setDraft([]); setMode('view'); setShowSavePrompt(false); }
  function discardAndView() { setDraft([]); setMode('view'); setShowSavePrompt(false); }

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(timerRef.current);
    const q = val.trim();
    if (!q) { setResults([]); setShowResults(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${apiBase}/api/users/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data);
        setShowResults(true);
      } catch { setResults([]); }
    }, 250);
  }

  function handleSelectUser(u) {
    setSearch('');
    setResults([]);
    setShowResults(false);
    navigate(isAdminView ? `/admin/${u.username}/profile` : `/${u.username}`);
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) { handleSelectUser(results[0]); return; }
      const q = search.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (q) { setSearch(''); setShowResults(false); navigate(`/${q}`); }
    }
    if (e.key === 'Escape') { setShowResults(false); }
  }

  useEffect(() => { loadMarkers().then(data => { setMarkers(data); setSaved(data); }); }, []);
  useEffect(() => {
    fetch(`${apiBase}/api/users/by-username/${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(d => { if (d.firstName) setFirstName(d.firstName); })
      .catch(() => {});
  }, [username]);

  return (
    <div className="dashboard-page">
      <div className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="logo">
            <div className="logo-icon" style={{ width: '32px', height: '32px' }}>
              <Fingerprint size={18} strokeWidth={2} color="#080c14" />
            </div>
            Imprint
          </div>
          {isAdminView && (
            <>
              <button className="btn btn-ghost" onClick={() => navigate('/admin/waitlist')}>
                <List size={15} /> <span className="btn-label">Admin Waitlist</span>
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/admin/dashboard')}>
                <LayoutDashboard size={15} /> <span className="btn-label">Admin Dashboard</span>
              </button>
            </>
          )}
        </div>
        <div ref={searchRef} style={{ position: 'absolute', left: '47.5%', transform: 'translateX(-50%)' }}>
          <input
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Search users…"
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: '7px 14px',
              fontSize: '13px',
              color: 'var(--text)',
              fontFamily: 'inherit',
              outline: 'none',
              width: '180px',
            }}
          />
          {showResults && results.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
              zIndex: 100,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              {results.map(u => (
                <div
                  key={u.username}
                  onClick={() => handleSelectUser(u)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>@{u.username}</span>
                  {(u.firstName || u.lastName) && (
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {[u.firstName, u.lastName].filter(Boolean).join(' ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-header-right">
          {isAdminView ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <span className="admin-badge">Admin</span>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>viewing @{username}</span>
            </div>
          ) : (
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>@{username}</span>
          )}
          <button className="btn btn-ghost" onClick={() => navigate(isAdminView ? `/admin/${username}/profile` : `/${username}/profile`)}>
            <User size={15} /> <span className="btn-label">{isAdminView ? `@${username}'s profile` : 'Profile'}</span>
          </button>
          {isAdminView
            ? <button className="btn btn-ghost" onClick={() => setConfirmLogout(true)}>
                <LogOut size={15} /> <span className="btn-label">Log out of Admin</span>
              </button>
            : <button className="btn btn-ghost" onClick={() => {
                localStorage.removeItem('imprint_username');
                navigate('/home');
              }}>
                Log out
              </button>
          }
        </div>
      </div>

      <div className="dashboard-content">
        <div style={{ display: 'flex', flexDirection: 'column', width: 'min(680px, 100%)', gap: '16px' }}>
        {firstName && (
          <p style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Welcome, {firstName}!{isAdminView && <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--muted)', marginLeft: '8px' }}>(Admin View)</span>}
          </p>
        )}
        <div className="dashboard-map-card">
          <div className="dashboard-toolbar">
            <div className="dashboard-toolbar-dots">
              <div className="dot dot-r" />
              <div className="dot dot-y" />
              <div className="dot dot-g" />
            </div>
            {isAdminView && (
              <div className="mode-toggle">
                <button className={`mode-btn${!editing ? ' active' : ''}`} onClick={handleViewClick}>
                  <Eye size={13} /> View
                </button>
                <button className={`mode-btn${editing ? ' active' : ''}`} onClick={enterEdit}>
                  <Pencil size={13} /> Edit
                </button>
              </div>
            )}
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
              <MapClickHandler editing={editing} onAdd={pos => setDraft(d => [...d, pos])} />
              <RegionDetector onRegion={setRegion} />
              {displayMarkers.map((pos, i) => (
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

      {confirmLogout && (
        <div className="modal-overlay" onClick={() => setConfirmLogout(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <Fingerprint size={28} strokeWidth={1.5} color="#4fffb0" />
            </div>
            <h2 className="modal-title">Log out of Admin?</h2>
            <p className="modal-sub" style={{ marginTop: '16px', color: '#ff6b6b' }}>
              You will be returned to the home page and your admin session will end.
            </p>
            <button className="btn btn-primary modal-submit" onClick={() => { sessionStorage.removeItem('admin_auth'); navigate('/home'); }}>
              Log out
            </button>
            <button className="modal-cancel" onClick={() => setConfirmLogout(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
