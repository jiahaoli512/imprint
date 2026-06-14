import { Fingerprint } from 'lucide-react';

export default function Nav() {
  return (
    <nav className="nav">
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
      <a href="#cta" className="btn btn-primary">Get Early Access</a>
    </nav>
  );
}
