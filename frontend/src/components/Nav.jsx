import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Menu, X } from 'lucide-react';
import LogoMark from './LogoMark';

const isNative = Capacitor.isNativePlatform();

export default function Nav() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <nav className={`nav${open ? ' nav-open' : ''}`}>
      <div className="logo">
        <LogoMark />
        Imprint
      </div>
      <ul className="nav-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#how">How it works</a></li>
        <li><a href="#stats">Stats</a></li>
      </ul>
      {isNative ? (
        <button className="btn btn-primary nav-cta" onClick={() => navigate('/login')}>Log In</button>
      ) : (
        <a href="#cta" className="btn btn-primary nav-cta">Get Early Access</a>
      )}
      <button className="nav-hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="nav-drawer" onClick={() => setOpen(false)}>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#stats">Stats</a>
          <a href="#cta" className="btn btn-primary nav-drawer-cta">Get Early Access</a>
        </div>
      )}
    </nav>
  );
}
