import { Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearAdminSession } from '../api/client';

export default function AdminLogoutModal({ onCancel }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearAdminSession();
    navigate('/home');
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">
          <Fingerprint size={28} strokeWidth={1.5} color="#4fffb0" />
        </div>
        <h2 className="modal-title">Log out of Admin?</h2>
        <p className="modal-sub" style={{ marginTop: '16px', color: '#ff6b6b' }}>
          You will be returned to the home page and your admin session will end.
        </p>
        <button className="btn btn-primary modal-submit" onClick={handleLogout}>
          Log out
        </button>
        <button className="modal-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
