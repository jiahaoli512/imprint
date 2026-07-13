import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import LogoMark from '../../components/LogoMark';
import UserIdentity from './UserIdentity';
import { friendsApiFor } from '../../api/client';
import { useAsync } from '../../utils/useAsync';

// Lists a user's friends, opened by clicking the friend count. Only reachable
// when the viewer may see the list (the owner, an admin, or one of the
// owner's friends) — the server enforces this too (403 otherwise). Each row
// links to that friend's profile.
export default function FriendsListModal({ username, isMe, isAdminView, onClose }) {
  const navigate = useNavigate();
  const { getFriendsOf } = friendsApiFor(isAdminView);
  const { data, loading, error } = useAsync(() => getFriendsOf(username), [username]);
  const friends = Array.isArray(data) ? data : [];

  function go(u) {
    onClose();
    navigate(isAdminView ? `/admin/${u}/profile` : `/${u}/profile`);
  }

  return (
    <Modal onClose={onClose} icon={false} closable>
      <h2 className="modal-title">{isMe ? 'Your friends' : `@${username}'s friends`}</h2>
      {loading ? (
        <div className="friends-list-loading">
          <LogoMark size={28} icon={16} style={{ opacity: 0.5 }} />
        </div>
      ) : error ? (
        <p className="auth-error" style={{ marginTop: '12px' }}>{error.message || 'Could not load friends.'}</p>
      ) : friends.length === 0 ? (
        <p className="modal-sub" style={{ marginTop: '12px' }}>No friends yet.</p>
      ) : (
        <div className="friends-list">
          {friends.map((f) => (
            <button key={f.username} className="friends-list-row" onClick={() => go(f.username)}>
              <UserIdentity username={f.username} name={f.name} />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
