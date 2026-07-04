import { useState } from 'react';
import { UserPlus, Check, Clock, UserMinus } from 'lucide-react';
import { api } from '../../api/client';

// The friend action shown on another user's profile. Driven by the viewer's
// relationship to the owner (from the profile payload). State is point-in-time:
// a request/accept/remove flips it optimistically; the other side's action shows
// on the next profile load (no realtime infra). `onChange(newStatus)` lets the
// parent keep the friend count / list-clickability in sync.
//   none     → "Add Friend +"          (sends a request)
//   outgoing → "Friend Request Sent"    (disabled)
//   incoming → "Accept Friend Request"  (accepts the pending request)
//   friends  → "Remove Friend"          (removes the friendship, both ways)
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

  const add = () => run(() => api.sendFriendRequest(username), 'outgoing', 'Could not send request.');
  const accept = () => requestId && run(() => api.respondFriendRequest(requestId, 'accept'), 'friends', 'Could not accept request.');
  const remove = () => run(() => api.removeFriend(username), 'none', 'Could not remove friend.');

  if (status === 'outgoing')
    return <button className="btn friend-btn friend-btn-sent" disabled><Clock size={14} /> Friend Request Sent</button>;

  if (status === 'friends')
    return (
      <>
        <button className="btn friend-btn friend-btn-remove" onClick={remove} disabled={busy}>
          <UserMinus size={14} /> {busy ? 'Removing…' : 'Remove Friend'}
        </button>
        {error && <p className="auth-error" style={{ marginTop: '6px' }}>{error}</p>}
      </>
    );

  if (status === 'incoming')
    return (
      <>
        <button className="btn btn-primary friend-btn" onClick={accept} disabled={busy}>
          <Check size={14} /> {busy ? 'Accepting…' : 'Accept Friend Request'}
        </button>
        {error && <p className="auth-error" style={{ marginTop: '6px' }}>{error}</p>}
      </>
    );

  return (
    <>
      <button className="btn friend-btn" onClick={add} disabled={busy}>
        <UserPlus size={14} /> {busy ? 'Sending…' : 'Add Friend'}
      </button>
      {error && <p className="auth-error" style={{ marginTop: '6px' }}>{error}</p>}
    </>
  );
}
