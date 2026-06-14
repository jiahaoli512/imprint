import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, ArrowLeft } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_URL || window.location.origin;

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | approved | not_found | pending
  const [error, setError] = useState('');

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    setStatus('loading');
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/waitlist/check?email=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setStatus(data.status);
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('idle');
    }
  }

  return (
    <div className="auth-page">
      <button className="auth-back" onClick={() => navigate('/home')}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="auth-card">
        <div className="logo" style={{ justifyContent: 'center', marginBottom: '24px' }}>
          <div className="logo-icon" style={{ width: '40px', height: '40px' }}>
            <Fingerprint size={22} strokeWidth={2} color="#080c14" />
          </div>
          Imprint
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-sub">Enter your email to get started.</p>

        {status === 'approved' ? (
          <div className="auth-success">
            <span className="auth-success-icon">✓</span>
            <p>Success! Your email is approved.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <input
              type="email"
              className="auth-input"
              placeholder="Enter a valid email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus('idle'); setError(''); }}
              autoComplete="email"
            />

            {(status === 'not_found' || status === 'pending') && (
              <p className="auth-notice">
                Your account is not on the waitlist.{' '}
                <a
                  href="https://imprint-wheat.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="auth-link"
                >
                  Sign up for the waitlist
                </a>{' '}
                to get approved.
              </p>
            )}

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Checking…' : 'Continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
