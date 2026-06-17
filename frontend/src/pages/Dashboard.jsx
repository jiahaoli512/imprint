import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import { Fingerprint, User, List, LayoutDashboard, LogOut, Eye, Pencil, Trash2, LocateFixed } from 'lucide-react';
import L from 'leaflet';
import { Capacitor } from '@capacitor/core';
import ConfirmModal from '../components/ConfirmModal';
import AdminLogoutModal from '../components/AdminLogoutModal';
import Spinner from '../components/Spinner';
import { pinIcon, pinIconEdit, InvalidateOnMount, MapClickHandler, RegionDetector } from '../features/map/mapUtils';
import { api, clearSession } from '../api/client';

const isNative = Capacitor.isNativePlatform();

async function loadMarkers(username) {
  try { return await api.getMarkers(username); }
  catch { return []; }
}

async function saveMarkers(points) {
  try { await api.saveMarkers(points); }
  catch { /* silently fail — user will see stale state */ }
}

const locationIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#4a9eff;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(74,158,255,0.25),0 0 12px rgba(74,158,255,0.6)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 10), { duration: 1.2 });
  }, [position]);
  return null;
}

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported.')); return; }
    navigator.geolocation.getCurrentPosition(
      p => resolve([p.coords.latitude, p.coords.longitude]),
      e => reject(new Error(e.code === 1 ? 'Location permission denied.' : 'Could not get location.')),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
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
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const searchRef = useRef(null);
  const timerRef = useRef(null);

  async function handleLocate() {
    setLocating(true);
    setLocationError('');
    try {
      const pos = await getLocation();
      setUserLocation(pos);
    } catch (e) {
      setLocationError(e.message || 'Could not get location.');
    } finally {
      setLocating(false);
    }
  }

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
        const data = await api.searchUsers(q);
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

  useEffect(() => { loadMarkers(username).then(data => { setMarkers(data); setSaved(data); }); }, [username]);
  useEffect(() => {
    api.getUser(username)
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
                clearSession();
                navigate('/home');
              }}>
                Log out
              </button>
          }
        </div>
      </div>

      <div className="dashboard-content">
        <div style={{ display: 'flex', flexDirection: 'column', width: 'min(680px, 100%)', gap: '16px' }}>
        <div ref={searchRef} style={{ position: 'relative' }}>
          <input
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Search users…"
            style={{
              width: '100%',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '14px',
              color: 'var(--text)',
              fontFamily: 'inherit',
              outline: 'none',
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
        {locationError && (
          <p style={{ fontSize: '12px', color: '#ff6b6b', marginTop: '-8px' }}>{locationError}</p>
        )}
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
              {isNative && (
                <button
                  className="btn btn-ghost dashboard-save-btn"
                  onClick={handleLocate}
                  disabled={locating}
                  title="Show my location"
                  style={userLocation ? { color: '#4a9eff' } : {}}
                >
                  <LocateFixed size={13} />
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
              {userLocation && <FlyToLocation position={userLocation} />}
              {userLocation && (
                <>
                  <Circle
                    center={userLocation}
                    radius={200}
                    pathOptions={{ color: '#4a9eff', fillColor: '#4a9eff', fillOpacity: 0.12, weight: 1, opacity: 0.4 }}
                  />
                  <Marker position={userLocation} icon={locationIcon} />
                </>
              )}
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

      {confirmLogout && <AdminLogoutModal onCancel={() => setConfirmLogout(false)} />}
    </div>
  );
}
