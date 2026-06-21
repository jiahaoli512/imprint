import LogoMark from './LogoMark';

// Shared top bar for the dashboard/admin pages: the fixed ".admin-header" with
// the Imprint logo, plus optional slots, followed by the spacer that offsets the
// fixed bar. Pages supply only their variant bits:
//   leftExtra — controls next to the logo (e.g. admin nav buttons)
//   center    — middle content (e.g. the user search)
//   right     — the ".admin-header-right" cluster (badge, profile, logout)
export default function AppHeader({ leftExtra = null, center = null, right = null }) {
  return (
    <>
      <div className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="logo">
            <LogoMark size={32} />
            Imprint
          </div>
          {leftExtra}
        </div>
        {center}
        <div className="admin-header-right">{right}</div>
      </div>
      <div className="admin-header-spacer" />
    </>
  );
}
