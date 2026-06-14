import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (modalOpen) {
      setPassword('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [modalOpen]);

  function handleSubmit(e) {
    e.preventDefault();
    if (password === 'imprint') {
      sessionStorage.setItem('admin_auth', '1');
      setModalOpen(false);
      navigate('/admin/waitlist');
    } else {
      setError('Incorrect password.');
      setPassword('');
      inputRef.current?.focus();
    }
  }

  return (
    <>
      <footer>
        <div className="logo" style={{ fontSize: '16px' }}>
          <div className="logo-icon" style={{ width: '26px', height: '26px' }}>
            <Fingerprint size={15} strokeWidth={2} color="#080c14" />
          </div>
          Imprint
        </div>
        <span className="footer-copy">© 2026 Imprint. All rights reserved.</span>
        <ul className="footer-links">
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">Contact</a></li>
          <li><button className="footer-admin-btn" onClick={() => setModalOpen(true)}>Admin</button></li>
        </ul>
      </footer>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <Fingerprint size={28} strokeWidth={1.5} color="#4fffb0" />
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
            <button className="modal-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
