import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { api } from '../api/client';
import { isValidEmail } from '../utils/validateName';
import MapMockup from './MapMockup';

const isNative = Capacitor.isNativePlatform();

// The waitlist join form lives here (top of the page, always in view on
// load) rather than at the bottom of the page — it's the primary
// conversion action for a first-time visitor, so it shouldn't require
// scrolling past the rest of the marketing content to find. Native is
// unaffected (App Store review doesn't want an email-collection form
// competing with Sign Up/Log In), matching the same isNative gate the
// waitlist form used at the bottom.
export default function Hero({ waitlistCount, onJoin }) {
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
      await api.joinWaitlist({ email: trimmed });
      // Deliberate pause (with the button still reading "Joining Waitlist…")
      // so a near-instant response doesn't just flash past the loading state
      // before landing on success.
      await new Promise((resolve) => setTimeout(resolve, 900));
      // Deliberately doesn't surface the waitlist position — see joinWaitlist.
      setMsg("You're on the list! We'll email you when it's your turn.");
      setStatus('success');
      onJoin((n) => n + 1);
      setEmail('');
    } catch (err) {
      setMsg(err.message);
      setStatus('error');
    }
  }

  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="hero-glow2" />

      <h1>How much of the<br /><span>world have you seen?</span></h1>

      <p>
        Imprint maps every place you've ever been — turning your travels into a living
        portrait of your world. See your coverage, explore what's left, and share the journey.
      </p>

      <div className="hero-auth-btns">
        <button className="btn btn-primary" onClick={() => navigate('/signup')}>Sign Up</button>
        <button className="btn btn-ghost" onClick={() => navigate('/login')}>Log In</button>
      </div>

      {!isNative && (
        <>
          <form id="waitlist-form" className="hero-form" onSubmit={handleJoin}>
            <input
              id="waitlist-email"
              type="email"
              placeholder="Not approved yet? Join the waitlist"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === 'loading' || status === 'success'}
            />
            <button className="btn btn-ghost" type="submit" disabled={status === 'loading' || status === 'success'}>
              {status === 'loading' ? 'Joining Waitlist…' : 'Join the Waitlist'}
            </button>
          </form>
          {msg && <p className={`form-msg ${status}`}>{msg}</p>}
        </>
      )}

      <MapMockup />

      <div className="social-proof">
        <div className="avatars">
          <div className="avatar av1">A</div>
          <div className="avatar av2">K</div>
          <div className="avatar av3">M</div>
          <div className="avatar av4">J</div>
        </div>
        <span className="social-text">
          <strong>{waitlistCount.toLocaleString()}+ explorers</strong> already mapping their world
        </span>
      </div>
    </section>
  );
}
