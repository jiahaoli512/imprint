import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

// The waitlist join form lives in Hero now (top of the page, always in
// view) — this bottom section is just a final sign-up/log-in nudge for
// anyone who scrolled the whole page without converting up top.
export default function CTA() {
  const navigate = useNavigate();

  return (
    <section className="cta-section" id="cta">
      <div className="cta-glow" />
      <h2>
        Leave your{' '}
        <span style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Imprint
        </span>
        <br />on the world.
      </h2>
      <p>Ready to start mapping your world?</p>

      <div className="hero-auth-btns">
        <button className="btn btn-primary" onClick={() => navigate('/signup')}>Sign Up</button>
        <button className="btn btn-ghost" onClick={() => navigate('/login')}>Log In</button>
      </div>

      {!isNative && (
        <div className="cta-actions">
          <span className="store-badge-img apple-badge" title="Coming soon" style={{ cursor: 'default' }}>
            <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store (coming soon)" />
          </span>
          <span className="store-badge-img google-badge" title="Coming soon" style={{ cursor: 'default' }}>
            <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play (coming soon)" />
          </span>
        </div>
      )}
    </section>
  );
}
