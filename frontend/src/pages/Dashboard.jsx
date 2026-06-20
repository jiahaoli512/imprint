import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Fingerprint, User, List, LayoutDashboard, LogOut, Eye, Pencil, Trash2, LocateFixed } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import AdminLogoutModal from '../components/AdminLogoutModal';
import LogoutModal from '../components/LogoutModal';
import UserSearch from '../features/users/UserSearch';
import MapView from '../features/map/MapView';
import LocationTrackingPanel from '../features/location/LocationTrackingPanel';
import { useMarkers } from '../features/map/useMarkers';
import { useGeolocation } from '../features/location/useGeolocation';
import { api } from '../api/client';

const isNative = Capacitor.isNativePlatform();

export default function Dashboard() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAdminView = pathname.startsWith('/admin/');

  const [region, setRegion] = useState('');
  const [firstName, setFirstName] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  const {
    displayMarkers, editing,
    enterEdit, enterView, addMarker, removeMarker, clearDraft,
    savePrompt,
  } = useMarkers({
    load: () => api.getMarkers(username),
    save: api.saveMarkers,
    editable: isAdminView,
    deps: [username],
  });

  const { userLocation, locating, locationError, locate } = useGeolocation();

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
              <Fingerprint size={18} strokeWidth={2} color="#0b0e13" />
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

      <div className="dashboard-content">
        <div style={{ display: 'flex', flexDirection: 'column', width: 'min(680px, 100%)', gap: '16px' }}>
          {(isNative || isAdminView) && <UserSearch isAdminView={isAdminView} variant="block" />}

          {locationError && (
            <p style={{ fontSize: '12px', color: '#e2685a', marginTop: '-8px' }}>{locationError}</p>
          )}
          {firstName && (
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: '600', letterSpacing: '-0.3px' }}>
              Welcome back, {firstName}!{isAdminView && <span style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: '600', color: 'var(--muted)', marginLeft: '8px' }}>(Admin View)</span>}
            </p>
          )}

          {!isAdminView && <LocationTrackingPanel />}

          <div className="dashboard-map-card">
            <div className="dashboard-toolbar">
              <div className="dashboard-toolbar-dots">
                <div className="dot dot-r" />
                <div className="dot dot-y" />
                <div className="dot dot-g" />
              </div>
              {isAdminView && (
                <div className="mode-toggle">
                  <button className={`mode-btn${!editing ? ' active' : ''}`} onClick={enterView}>
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
                  <button className="btn btn-ghost dashboard-save-btn" onClick={clearDraft}>
                    <Trash2 size={13} /> Clear all
                  </button>
                )}
                {isNative && (
                  <button
                    className="btn btn-ghost dashboard-save-btn"
                    onClick={locate}
                    disabled={locating}
                    title="Show my location"
                    style={userLocation ? { color: '#5aa9e6' } : {}}
                  >
                    <LocateFixed size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className={`dashboard-map-wrap${editing ? ' editing' : ''}`}>
              <MapView
                displayMarkers={displayMarkers}
                editing={editing}
                userLocation={userLocation}
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

      {savePrompt}

      {confirmLogout && (
        isAdminView
          ? <AdminLogoutModal onCancel={() => setConfirmLogout(false)} />
          : <LogoutModal onCancel={() => setConfirmLogout(false)} />
      )}
    </div>
  );
}
