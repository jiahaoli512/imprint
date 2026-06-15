import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_RE = /[~`!@#$%^&*()\-_+=\[\]{}|\\;:"<>,./?]/;

const PW_RULES = [
  { key: 'length',  label: 'At least 12 characters',
    test: p => p.length >= 12 },
  { key: 'upper',   label: 'One uppercase letter (A–Z)',
    test: p => /[A-Z]/.test(p) },
  { key: 'lower',   label: 'One lowercase letter (a–z)',
    test: p => /[a-z]/.test(p) },
  { key: 'number',  label: 'One number (0–9)',
    test: p => /[0-9]/.test(p) },
  { key: 'special', label: 'One special character, not at start or end',
    test: p => p.length >= 3 && SPECIAL_RE.test(p.slice(1, -1)) },
];

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmCreate, setConfirmCreate] = useState(false);

  const checks = PW_RULES.map(r => ({ ...r, passed: r.test(password) }));
  const allPassed = checks.every(c => c.passed);
  const passwordsMatch = allPassed && confirmPassword.length > 0 && confirmPassword === password;

  async function handleRegister() {
    setLoading(true);
    setRegisterError('');
    try {
      const res = await fetch(`${apiBase}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegisterError(data.error || 'Something went wrong.');
        setConfirmPassword('');
      } else {
        setStep('done');
      }
    } catch {
      setRegisterError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError('');
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/waitlist/check?email=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.status === 'approved') {
        setStep('success');
        setTimeout(() => setStep('password'), 2000);
      } else {
        setStep('not_found');
      }
    } catch {
      setEmailError('Something went wrong. Please try again.');
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

        {/* ── Email step ── */}
        {(step === 'email' || step === 'not_found') && (
          <>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-sub">Enter your email to get started.</p>
            <form onSubmit={handleEmailSubmit} className="auth-form" noValidate>
              <input
                type="email"
                className="auth-input"
                placeholder="Enter a valid email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(''); setStep('email'); }}
                autoComplete="email"
              />
              {step === 'not_found' && (
                <div className="auth-notice">
                  <p style={{ marginBottom: '8px' }}>Your account could not be verified. Your email is either:</p>
                  <ol className="auth-notice-list">
                    <li>Not on the waitlist —{' '}
                      <a href="https://imprint-wheat.vercel.app/" target="_blank" rel="noreferrer" className="auth-link">
                        sign up here
                      </a>
                    </li>
                    <li>On the waitlist but has yet to be approved</li>
                    <li>Already registered — please log in</li>
                  </ol>
                </div>
              )}
              {emailError && <p className="auth-error">{emailError}</p>}
              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Checking…' : 'Continue'}
              </button>
            </form>
          </>
        )}

        {/* ── Success / transition step ── */}
        {step === 'success' && (
          <div className="auth-success">
            <div className="auth-spinner" />
            <p>Success! Your email is approved.</p>
          </div>
        )}

        {/* ── Password step ── */}
        {step === 'password' && (
          <>
            <h1 className="auth-title">Create Password</h1>
            <p className="auth-sub">Choose a strong password.</p>
            <div className="auth-form">
              <div className="auth-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setConfirmPassword(''); }}
                  autoComplete="new-password"
                />
                <button type="button" className="auth-eye" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <ul className="auth-checks">
                {checks.map(c => (
                  <li key={c.key} className={c.passed ? 'check-pass' : 'check-fail'}>
                    {c.passed ? <Check size={12} /> : <X size={12} />}
                    {c.label}
                  </li>
                ))}
              </ul>

              <div className="auth-input-wrap">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={`auth-input${passwordsMatch ? ' auth-input-match' : ''}`}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={!allPassed}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowConfirm(s => !s)}
                  disabled={!allPassed}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {registerError && <p className="auth-error">{registerError}</p>}

              {passwordsMatch && (
                <button
                  className="btn btn-primary auth-submit"
                  onClick={() => setConfirmCreate(true)}
                  disabled={loading}
                >
                  {loading ? 'Creating account…' : 'Continue'}
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Done step ── */}
        {step === 'done' && (
          <div className="auth-success">
            <span className="auth-success-icon">✓</span>
            <p>Success!</p>
          </div>
        )}
      </div>

      {step === 'email' && (
        <p className="auth-switch">
          Already have an account?{' '}
          <button className="auth-link-btn" onClick={() => navigate('/login')}>Log in</button>
        </p>
      )}

      {confirmCreate && (
        <ConfirmModal
          title="Create account?"
          message={`You're about to create an account for ${email}.`}
          confirmLabel="Create account"
          onConfirm={() => { setConfirmCreate(false); handleRegister(); }}
          onCancel={() => setConfirmCreate(false)}
        />
      )}
    </div>
  );
}
