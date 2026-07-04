import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import LogoMark from '../../components/LogoMark';
import { api } from '../../api/client';

// Lists a user's friends, opened by clicking the friend count. Only reachable
// when the viewer may see the list (the owner, or one of the owner's friends) —
// the server enforces this too (403 otherwise). Each row links to that friend's
// profile.
export default function FriendsListModal({ username, isMe, onClose }) {
  const navigate = useNavigate();
  const [friends, setFriends] = useState(null); // null = loading
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.getFriendsOf(username)
      .then((d) => { if (alive) setFriends(Array.isArray(d) ? d : []); })
      .catch((e) => { if (alive) { setFriends([]); setError(e.message || 'Could not load friends.'); } });
    return () => { alive = false; };
  }, [username]);

  function go(u) {
    onClose();
    navigate(`/${u}/profile`);
  }

  return (
    <Modal onClose={onClose} icon={false} closable>
      <h2 className="modal-title">{isMe ? 'Your friends' : `@${username}'s friends`}</h2>
      {friends === null ? (
        <div className="friends-list-loading">
          <LogoMark size={28} icon={16} style={{ opacity: 0.5 }} />
        </div>
      ) : error ? (
        <p className="auth-error" style={{ marginTop: '12px' }}>{error}</p>
      ) : friends.length === 0 ? (
        <p className="modal-sub" style={{ marginTop: '12px' }}>No friends yet.</p>
      ) : (
        <div className="friends-list">
          {friends.map((f) => (
            <button key={f.username} className="friends-list-row" onClick={() => go(f.username)}>
              <span style={{ fontWeight: 600 }}>@{f.username}</span>
              {f.name && <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{f.name}</span>}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
