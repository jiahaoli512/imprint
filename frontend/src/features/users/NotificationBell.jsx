import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import Modal from '../../components/Modal';
import { api } from '../../api/client';

// A multipurpose notification bell (own profile + own dashboard, never admin
// view). The count badge sums all notifications; opening it shows a two-section
// panel: LEFT = incoming friend requests (accept/reject), RIGHT = everything
// else (badge achievements, etc. — not implemented yet, so a placeholder).
// Point-in-time: fetched once on mount, no realtime infra.
export default function NotificationBell() {
  const [requests, setRequests] = useState([]);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let alive = true;
    api.getFriendRequests()
      .then((d) => { if (alive) setRequests(Array.isArray(d) ? d : []); })
      .catch(() => { /* leave empty on failure */ });
    return () => { alive = false; };
  }, []);

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
    <>
      <button
        className="btn btn-ghost notif-bell"
        onClick={() => setOpen(true)}
        aria-label={`Notifications${count ? ` (${count})` : ''}`}
      >
        <Bell size={16} />
        {count > 0 && <span className="notif-badge">{count > 9 ? '9+' : count}</span>}
      </button>

      {open && (
        <Modal onClose={() => setOpen(false)} icon={false} closable className="notif-modal">
          <h2 className="modal-title">Notifications</h2>
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
        </Modal>
      )}
    </>
  );
}
