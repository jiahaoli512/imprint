import { useNavigate } from 'react-router-dom';
import { clearSession, clearAdminSession } from '../api/client';
import { pauseTracking } from '../features/location/backgroundTracking';
import Modal from './Modal';

// Confirms logging out. `admin` switches between ending the admin session and a
// regular user session (the only difference between the two former modals).
export default function LogoutModal({ admin = false, onCancel }) {
  const navigate = useNavigate();

  async function handleLogout() {
    if (admin) {
      clearAdminSession();
    } else {
      // Pause passive tracking before clearing the session: pauseTracking removes
      // the native watcher and flushes buffered points while the token is still
      // valid, but KEEPS the saved choice so the user's next login auto-resumes.
      // No-op on web. (Order matters — flush needs the token, so this runs first.)
      await pauseTracking();
      clearSession();
    }
    navigate('/home');
  }

  return (
    <Modal onClose={onCancel}>
      <h2 className="modal-title">{admin ? 'Log out of Admin?' : 'Log out?'}</h2>
      <p className="modal-sub" style={{ marginTop: '16px', color: 'var(--error)' }}>
        {admin
          ? 'You will be returned to the home page and your admin session will end.'
          : 'You will be returned to the home page and signed out of your account.'}
      </p>
      <button className="btn btn-primary modal-submit" onClick={handleLogout}>
        Log out
      </button>
      <button className="modal-cancel" onClick={onCancel}>Cancel</button>
    </Modal>
  );
}
