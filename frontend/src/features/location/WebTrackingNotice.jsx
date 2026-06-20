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
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--error)' }}>Passive tracking: OFF</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Passive tracking is only available on the Imprint mobile app
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
