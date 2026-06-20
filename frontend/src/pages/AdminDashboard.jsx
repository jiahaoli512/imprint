import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, List, Eye, Pencil, Trash2, LogOut } from 'lucide-react';
import AdminLogoutModal from '../components/AdminLogoutModal';
import MapView from '../features/map/MapView';
import { useMarkers } from '../features/map/useMarkers';
import { api } from '../api/client';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [region, setRegion] = useState('');

  const {
    displayMarkers, editing,
    enterEdit, enterView, addMarker, removeMarker, clearDraft,
    savePrompt,
  } = useMarkers({
    load: api.getAdminMarkers,
    save: api.saveMarkers,
    editable: true,
  });

  return (
    <div className="dashboard-page">
      <div className="admin-header">
        <div className="logo">
          <div className="logo-icon" style={{ width: '32px', height: '32px' }}>
            <Fingerprint size={18} strokeWidth={2} color="#0b0e13" />
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

      <div className="admin-header-spacer" />

      <div className="dashboard-content">
        <div style={{ display: 'flex', flexDirection: 'column', width: 'min(680px, 100%)', gap: '16px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: '600', letterSpacing: '-0.3px' }}>
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
                <button className={`mode-btn${!editing ? ' active' : ''}`} onClick={enterView}>
                  <Eye size={13} /> View
                </button>
                <button className={`mode-btn${editing ? ' active' : ''}`} onClick={enterEdit}>
                  <Pencil size={13} /> Edit
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {region && <span className="dashboard-region">{region}</span>}
                {editing && (
                  <button className="btn btn-ghost dashboard-save-btn" onClick={clearDraft}>
                    <Trash2 size={13} /> Clear all
                  </button>
                )}
              </div>
            </div>

            <div className={`dashboard-map-wrap${editing ? ' editing' : ''}`}>
              <MapView
                displayMarkers={displayMarkers}
                editing={editing}
                onAddMarker={addMarker}
                onRemoveMarker={removeMarker}
                onRegion={setRegion}
              />
            </div>

            {editing && (
              <p className="dashboard-hint">Tap to add a pin · Tap a pin to remove it</p>
            )}
          </div>
        </div>
      </div>

      {confirmLogout && <AdminLogoutModal onCancel={() => setConfirmLogout(false)} />}
      {savePrompt}
    </div>
  );
}
