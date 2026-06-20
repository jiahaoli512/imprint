import { Eye, Pencil, Trash2, LocateFixed } from 'lucide-react';
import MapView from './MapView';

// The shared map panel used by both the user dashboard and the admin dashboards:
// a window-chrome toolbar (mode toggle when editable, region label, clear/locate
// actions), the map itself, and an edit hint. All state is passed in — typically
// spread from useMarkers plus a couple of view flags.
export default function MapCard({
  displayMarkers, editing, editable = false,
  onEnterView, onEnterEdit, onClear, onAddMarker, onRemoveMarker,
  region, onRegion,
  userLocation, locating, onLocate, showLocate = false,
}) {
  return (
    <div className="dashboard-map-card">
      <div className="dashboard-toolbar">
        <div className="dashboard-toolbar-dots">
          <div className="dot dot-r" />
          <div className="dot dot-y" />
          <div className="dot dot-g" />
        </div>
        {editable && (
          <div className="mode-toggle">
            <button className={`mode-btn${!editing ? ' active' : ''}`} onClick={onEnterView}>
              <Eye size={13} /> View
            </button>
            <button className={`mode-btn${editing ? ' active' : ''}`} onClick={onEnterEdit}>
              <Pencil size={13} /> Edit
            </button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {region && <span className="dashboard-region">{region}</span>}
          {editing && (
            <button className="btn btn-ghost dashboard-save-btn" onClick={onClear}>
              <Trash2 size={13} /> Clear all
            </button>
          )}
          {showLocate && (
            <button
              className="btn btn-ghost dashboard-save-btn"
              onClick={onLocate}
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
          onAddMarker={onAddMarker}
          onRemoveMarker={onRemoveMarker}
          onRegion={onRegion}
        />
      </div>

      {editing && (
        <p className="dashboard-hint">Tap to add a pin · Tap a pin to remove it</p>
      )}
    </div>
  );
}
