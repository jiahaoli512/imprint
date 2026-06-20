import { MapPin } from 'lucide-react';

// Web-only static counterpart to LocationTrackingPanel. Browsers can't do
// passive background tracking (no native plugin), so this mirrors the mobile
// panel's look but is purely informational: OFF, with a disabled Start button.
export default function WebTrackingNotice() {
  return (
    <div className="dashboard-map-card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapPin size={18} color="var(--error)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--error)' }}>Location Tracking: OFF</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
              Background/Passive Tracking services are only available on the Imprint mobile app.
            </div>
          </div>
        </div>
        <button className="btn btn-primary" disabled style={{ cursor: 'not-allowed' }}>
          Start
        </button>
      </div>
    </div>
  );
}
