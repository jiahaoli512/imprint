import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, LogOut } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import LogoutModal from '../components/LogoutModal';
import LogoMark from '../components/LogoMark';
import MapCard from '../features/map/MapCard';
import { useMarkers } from '../features/map/useMarkers';
import { api } from '../api/client';

const isNative = Capacitor.isNativePlatform();

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [region, setRegion] = useState('');
  const [expanded, setExpanded] = useState(false);

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
          <LogoMark size={32} />
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
        <div className={`dashboard-col${expanded ? ' expanded' : ''}`}>
          <p className="dashboard-welcome">Welcome, Admin!</p>
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
            expandable={!isNative}
            expanded={expanded}
            onToggleExpand={() => setExpanded((e) => !e)}
          />
        </div>
      </div>

      {confirmLogout && <LogoutModal admin onCancel={() => setConfirmLogout(false)} />}
      {savePrompt}
    </div>
  );
}
