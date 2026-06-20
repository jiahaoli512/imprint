import { useNavigate } from 'react-router-dom';
import { clearSession, clearAdminSession } from '../api/client';
import Modal from './Modal';

// Confirms logging out. `admin` switches between ending the admin session and a
// regular user session (the only difference between the two former modals).
export default function LogoutModal({ admin = false, onCancel }) {
  const navigate = useNavigate();

  function handleLogout() {
    if (admin) clearAdminSession();
    else clearSession();
    navigate('/home');
  }

  return (
    <Modal onClose={onCancel}>
      <h2 className="modal-title">{admin ? 'Log out of Admin?' : 'Log out?'}</h2>
      <p className="modal-sub" style={{ marginTop: '16px', color: '#e2685a' }}>
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
