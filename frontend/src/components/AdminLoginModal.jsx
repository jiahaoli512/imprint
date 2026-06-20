import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getUsername, clearSession, setAdminToken } from '../api/client';
import { refreshGreeting } from '../utils/greeting';
import Modal from './Modal';

// Owns the admin-login workflow: password entry, server-side auth, and the
// "log out of your account to enter admin" confirmation. Self-contained so the
// Footer only opens/closes it and stays a pure layout component.
export default function AdminLoginModal({ onClose }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = await api.adminLogin(password);
      setAdminToken(data.token);
      if (getUsername()) setConfirmLogout(true);
      else enterAdmin();
    } catch {
      setError('Incorrect password.');
      setPassword('');
      inputRef.current?.focus();
    }
  }

  function enterAdmin() {
    clearSession();
    refreshGreeting();
    onClose();
    navigate('/admin/waitlist');
  }

  return (
    <Modal onClose={onClose}>
      {confirmLogout ? (
        <>
          <h2 className="modal-title">Log out & continue?</h2>
          <p className="modal-sub" style={{ marginTop: '16px', color: '#e2685a' }}>
            You're currently logged in. Entering the admin panel will log you out of your account.
          </p>
          <button className="btn btn-primary modal-submit" onClick={enterAdmin}>
            Log out & continue
          </button>
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
        </>
      ) : (
        <>
          <h2 className="modal-title">Admin Access</h2>
          <p className="modal-sub">Enter the admin password to continue.</p>
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="password"
              className="modal-input"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
            />
            {error && <p className="modal-error">{error}</p>}
            <button type="submit" className="btn btn-primary modal-submit">Continue</button>
          </form>
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
        </>
      )}
    </Modal>
  );
}
