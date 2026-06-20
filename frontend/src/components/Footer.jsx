import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { getUsername, clearSession, setAdminToken } from '../api/client';
import { api } from '../api/client';

const isNative = Capacitor.isNativePlatform();

export default function Footer() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (modalOpen) {
      setPassword('');
      setError('');
      setConfirmLogout(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [modalOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = await api.adminLogin(password);
      setAdminToken(data.token);
      sessionStorage.setItem('admin_auth', '1');
      if (getUsername()) {
        setConfirmLogout(true);
      } else {
        enterAdmin();
      }
    } catch {
      setError('Incorrect password.');
      setPassword('');
      inputRef.current?.focus();
    }
  }

  function enterAdmin() {
    clearSession();
    setModalOpen(false);
    navigate('/admin/waitlist');
  }

  function handleClose() {
    setModalOpen(false);
    setConfirmLogout(false);
  }

  return (
    <>
      <footer>
        <div className="logo" style={{ fontSize: '16px' }}>
          <div className="logo-icon" style={{ width: '26px', height: '26px' }}>
            <Fingerprint size={15} strokeWidth={2} color="#0b0e13" />
          </div>
          Imprint
        </div>
        <span className="footer-copy">© 2026 Imprint. All rights reserved.</span>
        <ul className="footer-links">
          <li><button className="footer-admin-btn" onClick={() => navigate('/privacy')}>Privacy</button></li>
          <li><a href="#">Terms</a></li>
          <li><button className="footer-admin-btn" onClick={() => navigate('/contact')}>Contact</button></li>
          {!isNative && <li><button className="footer-admin-btn" onClick={() => setModalOpen(true)}>Admin</button></li>}
        </ul>
      </footer>

      {modalOpen && !confirmLogout && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <Fingerprint size={28} strokeWidth={1.5} color="#e2a156" />
            </div>
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
            <button className="modal-cancel" onClick={handleClose}>Cancel</button>
          </div>
        </div>
      )}

      {modalOpen && confirmLogout && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <Fingerprint size={28} strokeWidth={1.5} color="#e2a156" />
            </div>
            <h2 className="modal-title">Log out & continue?</h2>
            <p className="modal-sub" style={{ marginTop: '16px', color: '#e2685a' }}>You're currently logged in. Entering the admin panel will log you out of your account.</p>
            <button className="btn btn-primary modal-submit" onClick={enterAdmin}>
              Log out & continue
            </button>
            <button className="modal-cancel" onClick={handleClose}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
