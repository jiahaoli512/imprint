import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import Modal from '../../components/Modal';
import { api } from '../../api/client';

// The profile toolbar's incoming-friend-request bell, shown only on your own
// profile (never in admin view). Fetches pending requests once on mount and
// shows a count badge; opening it lists each requester with Accept / Reject.
// Acting on a request removes its row (and decrements the badge) — accept emails
// the sender server-side; reject is silent. Point-in-time: new requests appear
// on the next load, not live (no realtime infra).
export default function FriendRequestsBell() {
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

  const count = requests.length;

  return (
    <>
      <button
        className="btn btn-ghost notif-bell"
        onClick={() => setOpen(true)}
        aria-label={`Friend requests${count ? ` (${count})` : ''}`}
      >
        <Bell size={16} />
        {count > 0 && <span className="notif-badge">{count > 9 ? '9+' : count}</span>}
      </button>

      {open && (
        <Modal onClose={() => setOpen(false)} icon={false} closable>
          <h2 className="modal-title">Friend requests</h2>
          {count === 0 ? (
            <p className="modal-sub" style={{ marginTop: '12px' }}>No pending requests.</p>
          ) : (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
        </Modal>
      )}
    </>
  );
}
