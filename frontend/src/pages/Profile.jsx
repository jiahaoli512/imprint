import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Fingerprint, Check, X, Loader } from 'lucide-react';
import { api, setUsername as saveUsername } from '../api/client';
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

const maxDob = new Date();
maxDob.setFullYear(maxDob.getFullYear() - 18);
const MAX_DOB = maxDob.toISOString().split('T')[0];

export default function Profile() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email;

  const [firstName, setFirstName]           = useState('');
  const [lastName, setLastName]             = useState('');
  const [username, setUsername]             = useState('');
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle | checking | available | taken | invalid
  const [dob, setDob]                       = useState('');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const timerRef = useRef(null);

  if (!email) {
    navigate('/login', { replace: true });
    return null;
  }

  function handleUsernameChange(val) {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    setError('');
    clearTimeout(timerRef.current);

    if (!clean) { setUsernameStatus('idle'); return; }
    if (!USERNAME_RE.test(clean)) { setUsernameStatus('invalid'); return; }

    setUsernameStatus('checking');
    timerRef.current = setTimeout(async () => {
      try {
        const data = await api.checkUsername(clean);
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);
  }

  // mirrors ageFromDob() in userService.js — keep in sync if the threshold changes
  function ageOk(dobStr) {
    if (!dobStr) return false;
    const today = new Date();
    const birth = new Date(dobStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 18;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!firstName.trim()) { setError('Please enter your first name.'); return; }
    if (!USERNAME_RE.test(username)) { setError('Username must be 3–20 characters: letters, numbers, underscores.'); return; }
    if (usernameStatus === 'taken') { setError('That username is already taken.'); return; }
    if (usernameStatus === 'checking') { setError('Still checking username — please wait a moment.'); return; }
    if (!dob) { setError('Please enter your date of birth.'); return; }
    const dobYear = new Date(dob).getFullYear();
    if (dobYear < 1000 || dobYear > 9999) { setError('Please enter a valid 4-digit birth year.'); return; }
    if (!ageOk(dob)) { setError('You must be at least 18 years old to use Imprint.'); return; }

    setLoading(true);
    setError('');
    try {
      const data = await api.setupProfile({ email, firstName, lastName, username, dateOfBirth: dob });
      saveUsername(data.username);
      navigate(`/${data.username}/dashboard`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    firstName.trim() &&
    usernameStatus === 'available' &&
    dob && ageOk(dob);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo" style={{ justifyContent: 'center', marginBottom: '24px' }}>
          <div className="logo-icon" style={{ width: '40px', height: '40px' }}>
            <Fingerprint size={22} strokeWidth={2} color="#080c14" />
          </div>
          Imprint
        </div>

        <h1 className="auth-title">Set up your profile</h1>
        <p className="auth-sub">Just a few details to get started.</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <input
            type="text"
            className="auth-input"
            placeholder="First name"
            value={firstName}
            onChange={e => { setFirstName(e.target.value); setError(''); }}
            autoComplete="given-name"
          />
          <input
            type="text"
            className="auth-input"
            placeholder="Last name (optional)"
            value={lastName}
            onChange={e => { setLastName(e.target.value); setError(''); }}
            autoComplete="family-name"
          />

          <div className="auth-input-wrap">
            <input
              type="text"
              className="auth-input"
              placeholder="Username"
              value={username}
              onChange={e => handleUsernameChange(e.target.value)}
              autoComplete="username"
              style={{ paddingRight: '40px' }}
            />
            <span className="auth-eye" style={{ pointerEvents: 'none' }}>
              {usernameStatus === 'checking'  && <Loader size={15} className="spin" />}
              {usernameStatus === 'available' && <Check size={15} color="var(--accent)" />}
              {usernameStatus === 'taken'     && <X size={15} color="#ff6b6b" />}
              {usernameStatus === 'invalid'   && <X size={15} color="#ff6b6b" />}
            </span>
          </div>
          {usernameStatus === 'taken'   && <p className="auth-error" style={{ marginTop: '-4px' }}>Username already taken.</p>}
          {usernameStatus === 'invalid' && <p className="auth-error" style={{ marginTop: '-4px' }}>3–20 characters, letters, numbers and _ only.</p>}
          {usernameStatus === 'available' && <p style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '-4px' }}>Username available!</p>}

          <div>
            <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
              Date of birth (must be 18+)
            </label>
            <input
              type="date"
              className="auth-input"
              value={dob}
              max={MAX_DOB}
              onChange={e => { setDob(e.target.value); setError(''); }}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading || !canSubmit}
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
