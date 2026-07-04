import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, getActivitySeen, setActivitySeen } from '../../api/client';
import { timeAgo } from '../../utils/timeAgo';

// A multipurpose notification bell (own profile + own dashboard, never admin
// view). The count badge sums pending friend requests + unseen activity;
// clicking drops down a panel with two sections: LEFT = incoming friend requests
// (accept/reject), RIGHT = activity (e.g. "@x accepted your friend request").
// Opening the panel marks activity as seen, clearing that part of the badge.
// `align` sets which edge the dropdown pins to so it opens toward the screen
// interior. Point-in-time: fetched once on mount (no realtime infra).
export default function NotificationBell({ align = 'left' }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [activity, setActivity] = useState([]);
  const [seenAt, setSeenAt] = useState(() => getActivitySeen());
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    let alive = true;
    api.getFriendRequests()
      .then((d) => { if (alive) setRequests(Array.isArray(d) ? d : []); })
      .catch(() => { /* leave empty on failure */ });
    api.getFriendActivity()
      .then((d) => { if (alive) setActivity(Array.isArray(d) ? d : []); })
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

  // Opening the panel marks all current activity as seen.
  function toggle() {
    setOpen((o) => {
      if (!o) {
        const now = new Date().toISOString();
        setActivitySeen(now);
        setSeenAt(now);
      }
      return !o;
    });
  }

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

  const unseenActivity = activity.filter((a) => !seenAt || (a.at && a.at > seenAt)).length;
  const count = requests.length + unseenActivity;

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        className="btn btn-ghost notif-bell"
        onClick={toggle}
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
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{r.username}</span>
                          {r.at && <span className="notif-time">{timeAgo(r.at)}</span>}
                        </div>
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

            {/* Right: activity feed (friend-request accepts today; badge unlocks later) */}
            <section className="notif-section">
              <h3 className="notif-section-title">Activity</h3>
              {activity.length === 0 ? (
                <p className="notif-empty">No new activity yet.</p>
              ) : (
                <div className="notif-list">
                  {activity.map((a) => (
                    <button
                      key={`${a.username}-${a.at}`}
                      className="notif-activity-row"
                      onClick={() => { setOpen(false); navigate(`/${a.username}/profile`); }}
                    >
                      <span>
                        <strong>{a.name || `@${a.username}`}</strong> accepted your friend request.
                      </span>
                      {a.at && <span className="notif-time" style={{ display: 'block', marginTop: '4px' }}>{timeAgo(a.at)}</span>}
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
