import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import AdminLoginModal from './AdminLoginModal';

const isNative = Capacitor.isNativePlatform();

export default function Footer() {
  const navigate = useNavigate();
  const [adminOpen, setAdminOpen] = useState(false);

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
          {!isNative && <li><button className="footer-admin-btn" onClick={() => setAdminOpen(true)}>Admin</button></li>}
        </ul>
      </footer>

      {adminOpen && <AdminLoginModal onClose={() => setAdminOpen(false)} />}
    </>
  );
}
