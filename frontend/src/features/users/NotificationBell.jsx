import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { api } from '../../api/client';

// A multipurpose notification bell (own profile + own dashboard, never admin
// view). The count badge sums all notifications; clicking drops down a panel
// anchored to the button with two sections: LEFT = incoming friend requests
// (accept/reject), RIGHT = everything else (badge achievements, etc. — not
// implemented yet, so a placeholder). `align` sets which edge the dropdown pins
// to so it opens toward the screen interior ('right' in the header's right
// cluster, 'left' in the profile toolbar). Point-in-time: fetched once on mount.
export default function NotificationBell({ align = 'left' }) {
  const [requests, setRequests] = useState([]);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    let alive = true;
    api.getFriendRequests()
      .then((d) => { if (alive) setRequests(Array.isArray(d) ? d : []); })
      .catch(() => { /* leave empty on failure */ });
    return () => { alive = false; };
  }, []);

  // Close on outside click / Escape (matches UserSearch's dismissal pattern).
  useEffect(() => {
    if (!open) return;
    function onDown(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  async function respond(id, action) {
    setBusyId(id);
    try {
      await api.respondFriendRequest(id, action);
      setRequests((rs) => rs.filter((r) => r.id !== id));
    } catch {
      /* keep the row so the user can retry */
    } finally {
      setBusyId(null);
    }
  }

  // Other-notification sources will add to this later (e.g. badge unlocks).
  const otherCount = 0;
  const count = requests.length + otherCount;

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        className="btn btn-ghost notif-bell"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${count ? ` (${count})` : ''}`}
        aria-expanded={open}
      >
        <Bell size={16} />
        {count > 0 && <span className="notif-badge">{count > 9 ? '9+' : count}</span>}
      </button>

      {open && (
        <div className={`notif-dropdown notif-dropdown-${align}`} role="menu">
          <div className="notif-sections">
            {/* Left: friend requests */}
            <section className="notif-section">
              <h3 className="notif-section-title">Friend requests</h3>
              {requests.length === 0 ? (
                <p className="notif-empty">No pending requests.</p>
              ) : (
                <div className="notif-list">
                  {requests.map((r) => (
                    <div key={r.id} className="friend-request-row">
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 600 }}>@{r.username}</span>
                        {r.name && <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted)' }}>{r.name}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button className="btn btn-primary" onClick={() => respond(r.id, 'accept')} disabled={busyId === r.id}>
                          Accept
                        </button>
                        <button className="btn btn-ghost" onClick={() => respond(r.id, 'reject')} disabled={busyId === r.id}>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Right: everything else (badge unlocks, etc.) — not implemented yet */}
            <section className="notif-section">
              <h3 className="notif-section-title">Activity</h3>
              <p className="notif-empty">No new activity yet.</p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
