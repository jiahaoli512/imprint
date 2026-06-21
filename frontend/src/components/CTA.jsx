import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { api } from '../api/client';
import { isValidEmail } from '../utils/validateName';

const isNative = Capacitor.isNativePlatform();

export default function CTA({ onJoin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState('');

  async function handleJoin(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setMsg('Please enter a valid email address.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const data = await api.joinWaitlist({ email: trimmed });
      setMsg(`You're #${data.position} on the list!`);
      setStatus('success');
      onJoin((n) => n + 1);
      setEmail('');
    } catch (err) {
      setMsg(err.message);
      setStatus('error');
    }
  }

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
      <p>Join the waitlist and be the first to explore.</p>

      {isNative ? (
        <div className="hero-auth-btns">
          <button className="btn btn-primary" onClick={() => navigate('/signup')}>Sign Up</button>
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>Log In</button>
        </div>
      ) : (
        <>
          <form className="hero-form" onSubmit={handleJoin} style={{ marginBottom: '24px' }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === 'loading' || status === 'success'}
            />
            <button className="btn btn-primary" type="submit" disabled={status === 'loading' || status === 'success'}>
              {status === 'loading' ? 'Joining…' : 'Join the Waitlist'}
            </button>
          </form>
          {msg && <p className={`form-msg ${status}`}>{msg}</p>}
          <div className="cta-actions">
            <span className="store-badge-img apple-badge" title="Coming soon" style={{ cursor: 'default' }}>
              <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store (coming soon)" />
            </span>
            <span className="store-badge-img google-badge" title="Coming soon" style={{ cursor: 'default' }}>
              <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play (coming soon)" />
            </span>
          </div>
        </>
      )}
    </section>
  );
}
