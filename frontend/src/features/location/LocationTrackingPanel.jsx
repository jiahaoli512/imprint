import { MapPin } from 'lucide-react';
import { useBackgroundTracking } from './useBackgroundTracking';

// Start/stop control for passive background tracking, with a live status readout
// for verification. Renders nothing on web (where tracking is unsupported).
export default function LocationTrackingPanel() {
  const { supported, tracking, busy, status, authStatus, start, stop, openSettings } = useBackgroundTracking();
  if (!supported) return null;

  // Only "Always" allows tracking when the app is closed.
  const needsAlways = tracking && (authStatus === 'whenInUse' || authStatus === 'denied' || authStatus === 'restricted');

  return (
    <div className="dashboard-map-card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapPin size={18} color={tracking ? 'var(--success)' : 'var(--muted)'} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Passive tracking</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {tracking ? 'Recording places in the background' : 'Off — your map won’t update on its own'}
            </div>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={tracking ? stop : start}
          disabled={busy}
        >
          {busy ? '…' : tracking ? 'Stop' : 'Start'}
        </button>
      </div>

      {(tracking || status.error) && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--muted)' }}>
          {tracking && <span>captured {status.captured}</span>}
          {tracking && <span>uploaded {status.uploaded}</span>}
          {tracking && status.lastPoint && (
            <span>last {status.lastPoint.lat.toFixed(4)}, {status.lastPoint.lng.toFixed(4)}</span>
          )}
          {status.error && <span style={{ color: 'var(--error)' }}>error: {status.error}</span>}
        </div>
      )}

      {needsAlways && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--muted)' }}>
          Background tracking only works with <strong style={{ color: 'var(--text)' }}>Always Allow</strong>. On “While Using”, your map won’t update when the app is closed.{' '}
          <button
            onClick={openSettings}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}
          >
            Set to Always Allow
          </button>
        </div>
      )}
    </div>
  );
}
