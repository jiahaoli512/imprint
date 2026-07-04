import { useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDismiss } from '../../utils/useDismiss';
import { useNotifications } from './useNotifications';
import { ACTIVITY_RENDERERS } from './activityRenderers';
import { timeAgo } from '../../utils/timeAgo';

// One incoming friend-request row: name + time, with Accept / Reject.
function FriendRequestItem({ request, busy, onRespond }) {
  return (
    <div className="friend-request-row">
      <div className="friend-request-info">
        <div className="friend-request-head">
          <span className="friend-request-username">@{request.username}</span>
          {request.at && <span className="notif-time">{timeAgo(request.at)}</span>}
        </div>
        {request.name && <span className="friend-request-name">{request.name}</span>}
      </div>
      <div className="friend-request-actions">
        <button className="btn btn-primary" onClick={() => onRespond(request.id, 'accept')} disabled={busy}>Accept</button>
        <button className="btn btn-ghost" onClick={() => onRespond(request.id, 'reject')} disabled={busy}>Reject</button>
      </div>
    </div>
  );
}

// One activity row, its message dispatched by type via ACTIVITY_RENDERERS.
// Unknown types render nothing (forward-compatible with new activity kinds).
function ActivityItem({ item, onOpen }) {
  const render = ACTIVITY_RENDERERS[item.type];
  if (!render) return null;
  return (
    <button className="notif-activity-row" onClick={() => onOpen(item.username)}>
      <span>{render(item)}</span>
      {item.at && <span className="notif-time notif-activity-time">{timeAgo(item.at)}</span>}
    </button>
  );
}

// A multipurpose notification bell (own profile + own dashboard, never admin
// view). The count badge sums pending friend requests + unseen activity;
// clicking drops down a panel with two sections: LEFT = incoming friend requests
// (accept/reject), RIGHT = activity (e.g. "@x accepted your friend request").
// Opening the panel marks activity as seen, clearing that part of the badge.
// `align` sets which edge the dropdown pins to so it opens toward the screen
// interior. Point-in-time: fetched once on mount (no realtime infra).
export default function NotificationBell({ align = 'left' }) {
  const navigate = useNavigate();
  const { requests, activity, busyId, respond, markSeen, count } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useDismiss(wrapRef, () => setOpen(false), { active: open, escape: true });

  // Opening the panel marks all current activity as seen.
  function toggle() {
    setOpen((o) => {
      if (!o) markSeen();
      return !o;
    });
  }

  function openProfile(username) {
    setOpen(false);
    navigate(`/${username}/profile`);
  }

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
            <section className="notif-section">
              <h3 className="notif-section-title">Friend requests</h3>
              {requests.length === 0 ? (
                <p className="notif-empty">No pending requests.</p>
              ) : (
                <div className="notif-list">
                  {requests.map((r) => (
                    <FriendRequestItem key={r.id} request={r} busy={busyId === r.id} onRespond={respond} />
                  ))}
                </div>
              )}
            </section>

            <section className="notif-section">
              <h3 className="notif-section-title">Activity</h3>
              {activity.length === 0 ? (
                <p className="notif-empty">No new activity yet.</p>
              ) : (
                <div className="notif-list">
                  {activity.map((a) => (
                    <ActivityItem key={`${a.username}-${a.at}`} item={a} onOpen={openProfile} />
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
