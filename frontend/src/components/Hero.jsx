import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { api } from '../api/client';
import MapMockup from './MapMockup';

const isNative = Capacitor.isNativePlatform();

export default function Hero({ waitlistCount, onJoin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState('');

  async function handleJoin(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      const data = await api.joinWaitlist({ email });
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
    <section className="hero">
      <div className="hero-glow" />
      <div className="hero-glow2" />

      <div className="badge">✦ Now in Beta</div>

      <h1>How much of the<br /><span>world have you seen?</span></h1>

      <p>
        Imprint maps every place you've ever been — turning your travels into a living
        portrait of your world. See your coverage, explore what's left, and share the journey.
      </p>

      {isNative ? (
        <div className="hero-auth-btns">
          <button className="btn btn-primary" onClick={() => navigate('/signup')}>Sign Up</button>
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>Log In</button>
        </div>
      ) : (
        <>
          <form className="hero-form" onSubmit={handleJoin}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === 'loading' || status === 'success'}
            />
            <button className="btn btn-primary" type="submit" disabled={status === 'loading' || status === 'success'}>
              {status === 'loading' ? 'Joining…' : 'Get Early Access'}
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
