import { MapPin } from 'lucide-react';
import { useBackgroundTracking } from './useBackgroundTracking';

// Derives the colour-coded readout from the tracking/permission state. Pure, so
// the three states are easy to follow (and test) apart from the JSX.
function deriveTrackingStatus({ tracking, needsAlways }) {
  if (!tracking) {
    return { text: 'Passive tracking: OFF', color: 'var(--error)', subtitle: 'Your map won’t update on its own' };
  }
  if (needsAlways) {
    return { text: 'Set Location to Always Allow', color: 'var(--accent)', subtitle: 'On “While Using”, your map won’t update when the app is closed' };
  }
  return { text: 'Passive tracking: ON', color: 'var(--success)', subtitle: 'Recording in the background — stays on until you turn it off manually' };
}

// Start/stop control for passive background tracking, with a colour-coded status
// readout. Renders nothing on web (where tracking is unsupported).
export default function LocationTrackingPanel() {
  const { supported, tracking, busy, status, authStatus, start, stop, openSettings } = useBackgroundTracking();
  if (!supported) return null;

  // Only "Always" allows tracking when the app is closed.
  const needsAlways = tracking && (authStatus === 'whenInUse' || authStatus === 'denied' || authStatus === 'restricted');
  const { text: statusText, color: statusColor, subtitle } = deriveTrackingStatus({ tracking, needsAlways });

  return (
    <div className="dashboard-map-card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapPin size={18} color={statusColor} />
          <div>
            {needsAlways ? (
              <button
                onClick={openSettings}
                style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: statusColor, textDecoration: 'underline' }}
              >
                {statusText}
              </button>
            ) : (
              <div style={{ fontSize: '14px', fontWeight: 600, color: statusColor }}>{statusText}</div>
            )}
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{subtitle}</div>
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
    </div>
  );
}
