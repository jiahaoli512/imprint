import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, List, LayoutDashboard, LogOut } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import LogoutModal from '../components/LogoutModal';
import LogoMark from '../components/LogoMark';
import UserSearch from '../features/users/UserSearch';
import MapCard from '../features/map/MapCard';
import DiscoveryPanel from '../features/map/DiscoveryPanel';
import { useDiscovery } from '../features/map/useDiscovery';
import LocationTrackingPanel from '../features/location/LocationTrackingPanel';
import WebTrackingNotice from '../features/location/WebTrackingNotice';
import { useMarkers } from '../features/map/useMarkers';
import { useGeolocation } from '../features/location/useGeolocation';
import { api, markersApiFor } from '../api/client';
import { useAdminView } from '../utils/useAdminView';
import Greeting from '../components/Greeting';

const isNative = Capacitor.isNativePlatform();

export default function Dashboard() {
  const { username } = useParams();
  const navigate = useNavigate();
  const isAdminView = useAdminView();

  const [region, setRegion] = useState('');
  const [firstName, setFirstName] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const {
    displayMarkers, editing,
    enterEdit, enterView, addMarker, removeMarker, clearDraft,
    savePrompt,
  } = useMarkers({
    // In admin view, save to the viewed user's map via the admin endpoint;
    // a regular user saves their own. Loading is identical for both.
    ...markersApiFor(isAdminView, username),
    editable: isAdminView,
    deps: [username],
  });

  const { userLocation, locating, locationError, locate } = useGeolocation();

  // Web-only discovery gauge (to the right of the map). Hidden on native and
  // while the map is enlarged.
  const showDiscovery = !isNative && !expanded;
  const discovery = useDiscovery(displayMarkers);

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
            <LogoMark size={32} />
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

        {!isNative && !isAdminView && <UserSearch isAdminView={isAdminView} variant="header" />}

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
          <button className="btn btn-ghost" onClick={() => setConfirmLogout(true)}>
            <LogOut size={15} /> <span className="btn-label">{isAdminView ? 'Log out of Admin' : 'Log out'}</span>
          </button>
        </div>
      </div>

      <div className="admin-header-spacer" />

      <div className="dashboard-content">
        <div className={`dashboard-col${expanded ? ' expanded' : ''}${showDiscovery ? ' has-discovery' : ''}`}>
          {(isNative || isAdminView) && <UserSearch isAdminView={isAdminView} variant="block" />}

          {locationError && (
            <p style={{ fontSize: '12px', color: '#e2685a', marginTop: '-8px' }}>{locationError}</p>
          )}
          {firstName && (
            <Greeting
              name={firstName}
              suffix={isAdminView && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: '600', color: 'var(--muted)', WebkitTextFillColor: 'var(--muted)', marginLeft: '8px' }}>(Admin View)</span>}
            />
          )}

          {!isAdminView && <LocationTrackingPanel />}

          <div className="dashboard-map-row">
            <div className="dashboard-map-col">
              <MapCard
                displayMarkers={displayMarkers}
                editing={editing}
                editable={isAdminView}
                onEnterView={enterView}
                onEnterEdit={enterEdit}
                onClear={clearDraft}
                onAddMarker={addMarker}
                onRemoveMarker={removeMarker}
                region={region}
                onRegion={setRegion}
                onDiscoveryBusy={showDiscovery ? discovery.onBusy : undefined}
                onDiscoverySettle={showDiscovery ? discovery.onSettle : undefined}
                userLocation={userLocation}
                locating={locating}
                onLocate={locate}
                showLocate={!isAdminView}
                expandable={!isNative}
                expanded={expanded}
                onToggleExpand={() => setExpanded((e) => !e)}
              />
            </div>
            {showDiscovery && (
              <DiscoveryPanel
                region={region}
                status={discovery.status}
                percent={discovery.percent}
                level={discovery.level}
                discoveredCells={discovery.discoveredCells}
              />
            )}
          </div>

          {!isAdminView && !isNative && !expanded && <WebTrackingNotice />}
        </div>
      </div>

      {savePrompt}

      {confirmLogout && <LogoutModal admin={isAdminView} onCancel={() => setConfirmLogout(false)} />}
    </div>
  );
}
