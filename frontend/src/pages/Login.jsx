import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
      } else {
        setDone(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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

        {!done ? (
          <>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-sub">Log in to your Imprint account.</p>
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <input
                type="email"
                className="auth-input"
                placeholder="Email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                autoComplete="email"
              />
              <div className="auth-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                />
                <button type="button" className="auth-eye" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && <p className="auth-error">{error}</p>}
              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={loading || !email || !password}
              >
                {loading ? 'Logging in…' : 'Log In'}
              </button>
            </form>
            <p className="auth-switch">
              Don't have an account?{' '}
              <button className="auth-link-btn" onClick={() => navigate('/signup')}>Sign up</button>
            </p>
          </>
        ) : (
          <div className="auth-success">
            <span className="auth-success-icon">✓</span>
            <p>Welcome back!</p>
          </div>
        )}
      </div>
    </div>
  );
}
