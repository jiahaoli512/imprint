import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Menu, X } from 'lucide-react';
import { useDismiss } from '../utils/useDismiss';
import { WAITLIST_EMAIL_ID } from './Hero';

const REPO_URL = 'https://github.com/jiahaoli512/imprint';

// GitHub mark — lucide-react no longer ships brand icons, so inline the SVG.
function GithubIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.21.7.82.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  );
}
import LogoMark from './LogoMark';

const isNative = Capacitor.isNativePlatform();

// "Get Early Access" used to jump to the (now-removed) waitlist form at the
// bottom of the page via `#cta`. The form lives in Hero now, so instead of
// scrolling anywhere, this brings the existing field into view, focuses it,
// and — via reportValidity() — triggers the browser's native "Please fill
// out this field" bubble if it's still empty (a no-op if it already has a
// value). A brief `.waitlist-highlight` class supplies the visual glow.
function focusWaitlistField() {
  const input = document.getElementById(WAITLIST_EMAIL_ID);
  if (!input) return;
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  input.focus({ preventScroll: true });
  input.reportValidity();
  input.classList.remove('waitlist-highlight');
  void input.offsetWidth; // force reflow so re-adding the class restarts the animation
  input.classList.add('waitlist-highlight');
  input.addEventListener('animationend', () => input.classList.remove('waitlist-highlight'), { once: true });
}

export default function Nav() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);

  // Close the mobile drawer when tapping outside the nav or pressing Escape.
  useDismiss(navRef, () => setOpen(false), { active: open, escape: true });

  function handleEarlyAccess(e) {
    e.preventDefault();
    setOpen(false);
    focusWaitlistField();
  }

  return (
    <nav ref={navRef} className={`nav${open ? ' nav-open' : ''}`}>
      <div className="logo">
        <LogoMark />
        Imprint
      </div>
      <ul className="nav-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#how">How it works</a></li>
        <li><a href="#stats">Stats</a></li>
      </ul>
      <div className="nav-cta-group">
        {isNative ? (
          <button className="btn btn-primary nav-cta" onClick={() => navigate('/login')}>Log In</button>
        ) : (
          <button className="btn btn-primary nav-cta" onClick={handleEarlyAccess}>Get Early Access</button>
        )}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="nav-github"
          aria-label="View source on GitHub"
        >
          <GithubIcon size={22} />
        </a>
      </div>
      <button className="nav-hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="nav-drawer" onClick={() => setOpen(false)}>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#stats">Stats</a>
          <button className="btn btn-primary nav-drawer-cta" onClick={handleEarlyAccess}>Get Early Access</button>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="nav-drawer-github">
            <GithubIcon size={18} /> GitHub
          </a>
        </div>
      )}
    </nav>
  );
}
