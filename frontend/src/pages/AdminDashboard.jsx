import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, List, LogOut } from 'lucide-react';
import LogoutModal from '../components/LogoutModal';
import MapCard from '../features/map/MapCard';
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
          <MapCard
            displayMarkers={displayMarkers}
            editing={editing}
            editable
            onEnterView={enterView}
            onEnterEdit={enterEdit}
            onClear={clearDraft}
            onAddMarker={addMarker}
            onRemoveMarker={removeMarker}
            region={region}
            onRegion={setRegion}
          />
        </div>
      </div>

      {confirmLogout && <LogoutModal admin onCancel={() => setConfirmLogout(false)} />}
      {savePrompt}
    </div>
  );
}
