import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PW_RULES = [
  { key: 'length',  label: 'At least 8 characters',  test: p => p.length >= 8 },
  { key: 'upper',   label: 'One uppercase letter',    test: p => /[A-Z]/.test(p) },
  { key: 'lower',   label: 'One lowercase letter',    test: p => /[a-z]/.test(p) },
  { key: 'number',  label: 'One number',              test: p => /[0-9]/.test(p) },
  { key: 'special', label: 'One special character',   test: p => /[^A-Za-z0-9]/.test(p) },
];

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // email | not_found | success | password | done
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [pwError, setPwError] = useState('');
  const [loading, setLoading] = useState(false);

  const checks = PW_RULES.map(r => ({ ...r, passed: r.test(password) }));
  const allPassed = checks.every(c => c.passed);

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

  function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!allPassed) {
      setPwError("Your password doesn't meet the password requirements.");
      return;
    }
    setStep('done');
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
                <p className="auth-notice">
                  Your account is not on the waitlist.{' '}
                  <a href="https://imprint-wheat.vercel.app/" target="_blank" rel="noreferrer" className="auth-link">
                    Sign up for the waitlist
                  </a>{' '}
                  to get approved.
                </p>
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
            <form onSubmit={handlePasswordSubmit} className="auth-form" noValidate>
              <div className="auth-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPwError(''); }}
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

              {pwError && <p className="auth-error">{pwError}</p>}

              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={!allPassed}
              >
                Continue
              </button>
            </form>
          </>
        )}

        {/* ── Done step ── */}
        {step === 'done' && (
          <div className="auth-success">
            <span className="auth-success-icon">✓</span>
            <p>Password successful!</p>
          </div>
        )}
      </div>
    </div>
  );
}
