import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import { Fingerprint, List, Eye, Pencil, Trash2, LogOut } from 'lucide-react';
import L from 'leaflet';
import ConfirmModal from '../components/ConfirmModal';
import AdminLogoutModal from '../components/AdminLogoutModal';
import { pinIcon, pinIconEdit, InvalidateOnMount, MapClickHandler, RegionDetector } from '../features/map/mapUtils';
import { api } from '../api/client';

async function loadMarkers() {
  try { return await api.getAdminMarkers(); }
  catch { return []; }
}

async function saveMarkers(points) {
  try { await api.saveMarkers(points); }
  catch { /* admin save requires user auth — pending admin JWT support */ }
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('view');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
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
            <List size={15} /> <span className="btn-label">Admin Waitlist</span>
          </button>
          <button className="btn btn-ghost" onClick={() => setConfirmLogout(true)}>
            <LogOut size={15} /> <span className="btn-label">Log out of Admin</span>
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div style={{ display: 'flex', flexDirection: 'column', width: 'min(680px, 100%)', gap: '16px' }}>
        <p style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          Welcome, Admin!
        </p>
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
              <RegionDetector onRegion={setRegion} />
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
      </div>

      {confirmLogout && <AdminLogoutModal onCancel={() => setConfirmLogout(false)} />}

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
