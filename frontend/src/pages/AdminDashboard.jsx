import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Fingerprint, ArrowLeft, List, Eye, Pencil, Save, Trash2 } from 'lucide-react';
import L from 'leaflet';
import ConfirmModal from '../components/ConfirmModal';

const STORAGE_KEY = 'admin_map_markers';

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
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  return null;
}

function MapClickHandler({ editing, onAdd }) {
  useMapEvents({
    click(e) {
      if (!editing) return;
      onAdd([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('view');
  const [confirmClear, setConfirmClear] = useState(false);
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  });
  const [draft, setDraft] = useState([]);

  function enterEdit() {
    setDraft([...saved]);
    setMode('edit');
  }

  function enterView() {
    setDraft([]);
    setMode('view');
  }

  function saveChanges() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setSaved(draft);
    setDraft([]);
    setMode('view');
  }

  function addMarker(pos) {
    setDraft(d => [...d, pos]);
  }

  function removeMarker(i) {
    setDraft(d => d.filter((_, idx) => idx !== i));
  }

  const editing = mode === 'edit';
  const markers = editing ? draft : saved;

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
            <div className="mode-toggle">
              <button className={`mode-btn${!editing ? ' active' : ''}`} onClick={enterView}>
                <Eye size={13} /> View
              </button>
              <button className={`mode-btn${editing ? ' active' : ''}`} onClick={enterEdit}>
                <Pencil size={13} /> Edit
              </button>
            </div>
            {editing && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost dashboard-save-btn" onClick={() => setConfirmClear(true)}>
                  <Trash2 size={13} /> Clear all
                </button>
                <button className="btn btn-primary dashboard-save-btn" onClick={saveChanges}>
                  <Save size={13} /> Save changes
                </button>
              </div>
            )}
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
              <MapClickHandler editing={editing} onAdd={addMarker} />
              {markers.map((pos, i) => (
                <Marker
                  key={i}
                  position={pos}
                  icon={editing ? pinIconEdit : pinIcon}
                  eventHandlers={editing ? {
                    click(e) {
                      L.DomEvent.stopPropagation(e);
                      removeMarker(i);
                    },
                  } : {}}
                />
              ))}
              <InvalidateOnMount />
            </MapContainer>
          </div>

          {editing && (
            <p className="dashboard-hint">Tap to add a pin · Tap a pin to remove it</p>
          )}
        </div>
      </div>

      {confirmClear && (
        <ConfirmModal
          title="Clear all pins?"
          message={`This will remove all ${draft.length} pin${draft.length !== 1 ? 's' : ''} from the map.`}
          confirmLabel="Clear all"
          danger
          onConfirm={() => { setDraft([]); setConfirmClear(false); }}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  );
}
