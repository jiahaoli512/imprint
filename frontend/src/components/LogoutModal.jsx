import { Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '../api/client';

export default function LogoutModal({ onCancel }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate('/home');
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">
          <Fingerprint size={28} strokeWidth={1.5} color="#4fffb0" />
        </div>
        <h2 className="modal-title">Log out?</h2>
        <p className="modal-sub" style={{ marginTop: '16px', color: '#ff6b6b' }}>
          You will be returned to the home page and signed out of your account.
        </p>
        <button className="btn btn-primary modal-submit" onClick={handleLogout}>
          Log out
        </button>
        <button className="modal-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
