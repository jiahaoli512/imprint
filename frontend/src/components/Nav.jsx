import { useState } from 'react';
import { Fingerprint, Menu, X } from 'lucide-react';

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className={`nav${open ? ' nav-open' : ''}`}>
      <div className="logo">
        <div className="logo-icon">
          <Fingerprint size={18} strokeWidth={2} color="#080c14" />
        </div>
        Imprint
      </div>
      <ul className="nav-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#how">How it works</a></li>
        <li><a href="#stats">Stats</a></li>
      </ul>
      <a href="#cta" className="btn btn-primary nav-cta">Get Early Access</a>
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
