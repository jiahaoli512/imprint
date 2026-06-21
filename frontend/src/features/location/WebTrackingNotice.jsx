import { MapPin } from 'lucide-react';

// Web-only static counterpart to LocationTrackingPanel. Browsers can't do
// passive background tracking (no native plugin), so this mirrors the mobile
// panel's look but is purely informational: OFF, with a disabled Start button.
export default function WebTrackingNotice() {
  return (
    <>
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
      <div className="cta-actions" style={{ marginTop: '12px' }}>
        <span className="store-badge-img apple-badge" title="Coming soon" style={{ cursor: 'default' }}>
          <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store (coming soon)" />
        </span>
        <span className="store-badge-img google-badge" title="Coming soon" style={{ cursor: 'default' }}>
          <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play (coming soon)" />
        </span>
      </div>
    </>
  );
}
