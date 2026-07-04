import { useState } from 'react';
import { UserPlus, Check, Clock, UserMinus } from 'lucide-react';
import { api } from '../../api/client';

// The friend action shown on another user's profile. Driven by the viewer's
// relationship to the owner (from the profile payload). State is point-in-time:
// a request/accept/remove flips it optimistically; the other side's action shows
// on the next profile load (no realtime infra). `onChange(newStatus)` lets the
// parent keep the friend count / list-clickability in sync.
//   none     → "Add Friend"            (sends a request)
//   outgoing → "Friend Request Sent"   (disabled)
//   incoming → "Accept Friend Request" (accepts the pending request)
//   friends  → "Remove Friend"         (removes the friendship, both ways)
export default function FriendButton({ username, relationship, onChange }) {
  const [status, setStatus] = useState(relationship?.status || 'none');
  const [requestId] = useState(relationship?.requestId || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Runs an action, flips to `next` on success, and notifies the parent.
  async function run(fn, next, fallback) {
    setBusy(true);
    setError('');
    try {
      await fn();
      setStatus(next);
      onChange?.(next);
    } catch (e) {
      setError(e.message || fallback);
    } finally {
      setBusy(false);
    }
  }

  // One entry per relationship state — adding a state is a new row, not new JSX.
  const view = {
    none:     { className: 'friend-btn', Icon: UserPlus, label: 'Add Friend', busyLabel: 'Sending…',
      onClick: () => run(() => api.sendFriendRequest(username), 'outgoing', 'Could not send request.') },
    outgoing: { className: 'friend-btn friend-btn-sent', Icon: Clock, label: 'Friend Request Sent', disabled: true },
    incoming: { className: 'friend-btn btn-primary', Icon: Check, label: 'Accept Friend Request', busyLabel: 'Accepting…',
      onClick: () => requestId && run(() => api.respondFriendRequest(requestId, 'accept'), 'friends', 'Could not accept request.') },
    friends:  { className: 'friend-btn friend-btn-remove', Icon: UserMinus, label: 'Remove Friend', busyLabel: 'Removing…',
      onClick: () => run(() => api.removeFriend(username), 'none', 'Could not remove friend.') },
  }[status];

  if (!view) return null; // 'self' / unknown — no action to show

  const { className, Icon, label, busyLabel, onClick, disabled } = view;
  return (
    <>
      <button className={`btn ${className}`} onClick={onClick} disabled={disabled || busy}>
        <Icon size={14} /> {busy && busyLabel ? busyLabel : label}
      </button>
      {error && <p className="auth-error" style={{ marginTop: '6px' }}>{error}</p>}
    </>
  );
}
