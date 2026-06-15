import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_URL || window.location.origin;

export default function Profile() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!email) {
    navigate('/login', { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both your first and last name.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/users/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong.');
      } else {
        navigate('/home');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo" style={{ justifyContent: 'center', marginBottom: '24px' }}>
          <div className="logo-icon" style={{ width: '40px', height: '40px' }}>
            <Fingerprint size={22} strokeWidth={2} color="#080c14" />
          </div>
          Imprint
        </div>

        <h1 className="auth-title">One last step</h1>
        <p className="auth-sub">Tell us your name.</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <input
            type="text"
            className="auth-input"
            placeholder="First name"
            value={firstName}
            onChange={e => { setFirstName(e.target.value); setError(''); }}
            autoComplete="given-name"
            autoFocus
          />
          <input
            type="text"
            className="auth-input"
            placeholder="Last name"
            value={lastName}
            onChange={e => { setLastName(e.target.value); setError(''); }}
            autoComplete="family-name"
          />
          {error && <p className="auth-error">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </form>

        <p className="auth-switch">
          <button className="auth-link-btn" onClick={() => navigate('/home')}>
            Skip for now
          </button>
        </p>
      </div>
    </div>
  );
}
