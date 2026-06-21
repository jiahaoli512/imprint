// The "Admin · viewing @username" stack shown when an admin views a user's
// dashboard or profile. Callers position it (inline in a header, or fixed).
export default function AdminViewingBadge({ username }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
      <span className="admin-badge">Admin</span>
      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>viewing @{username}</span>
    </div>
  );
}
