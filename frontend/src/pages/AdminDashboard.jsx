import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import AppHeader from '../components/AppHeader';
import LogoutButton from '../components/LogoutButton';
import MapCard from '../features/map/MapCard';
import SaveMapPrompt from '../features/map/SaveMapPrompt';
import { useMarkers } from '../features/map/useMarkers';
import { api } from '../api/client';
import Greeting from '../components/Greeting';

const isNative = Capacitor.isNativePlatform();

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [region, setRegion] = useState('');
  const [expanded, setExpanded] = useState(false);

  const {
    displayMarkers, editing,
    enterEdit, enterView, addMarker, removeMarker, clearDraft,
    savePrompt,
  } = useMarkers({
    load: api.getAdminMarkers,
    save: api.saveAdminMarkers,
    editable: true,
  });

  return (
    <div className="dashboard-page">
      <AppHeader
        right={
          <>
            <span className="admin-badge">Admin</span>
            <button className="btn btn-ghost" onClick={() => navigate('/admin/waitlist')}>
              <List size={15} /> <span className="btn-label">Admin Waitlist</span>
            </button>
            <LogoutButton admin />
          </>
        }
      />

      <div className="dashboard-content">
        <div className={`dashboard-col${expanded ? ' expanded' : ''}`}>
          <Greeting name="Admin" />
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

      <SaveMapPrompt {...savePrompt} />
    </div>
  );
}
