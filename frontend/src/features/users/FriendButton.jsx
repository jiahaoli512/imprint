import { useState } from 'react';
import { UserPlus, Check, Clock } from 'lucide-react';
import { api } from '../../api/client';

// The friend action shown on another user's profile. Driven by the viewer's
// relationship to the owner (from the profile payload). State is point-in-time:
// a request/accept flips it optimistically; a reject on the other side shows as
// reset on the next profile load (no realtime infra).
//   none     → "Add Friend +"          (sends a request)
//   outgoing → "Friend Request Sent"    (disabled)
//   incoming → "Accept Friend Request"  (accepts the pending request)
//   friends  → "Friends ✓"              (disabled)
export default function FriendButton({ username, relationship }) {
  const [status, setStatus] = useState(relationship?.status || 'none');
  const [requestId] = useState(relationship?.requestId || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function add() {
    setBusy(true);
    setError('');
    try {
      await api.sendFriendRequest(username);
      setStatus('outgoing');
    } catch (e) {
      setError(e.message || 'Could not send request.');
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    if (!requestId) return;
    setBusy(true);
    setError('');
    try {
      await api.respondFriendRequest(requestId, 'accept');
      setStatus('friends');
    } catch (e) {
      setError(e.message || 'Could not accept request.');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'outgoing')
    return <button className="btn friend-btn friend-btn-sent" disabled><Clock size={14} /> Friend Request Sent</button>;

  if (status === 'friends')
    return <button className="btn friend-btn friend-btn-friends" disabled><Check size={14} /> Friends</button>;

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
