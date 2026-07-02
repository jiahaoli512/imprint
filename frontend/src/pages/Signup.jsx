import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import ConfirmModal from '../components/ConfirmModal';
import { api, getCodeCooldown, setCodeCooldown, clearCodeCooldown } from '../api/client';
import { isValidEmail } from '../utils/validateName';
import { PW_RULES } from '../utils/passwordRules';

const RESEND_COOLDOWN = 60; // seconds; mirrors the server-side resend cooldown

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
  // Verification step
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeNotice, setCodeNotice] = useState('');
  const [resendIn, setResendIn] = useState(0); // seconds left on the resend cooldown

  useEffect(() => {
    if (step === 'done') {
      const t = setTimeout(() => navigate('/home'), 3000);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Tick down the resend cooldown once per second while it's active.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // Issues (or re-issues) a code. Used by both the initial email approval and the
  // Resend button. Persists the resend cooldown so it survives exiting the flow.
  async function sendCode(targetEmail = email) {
    setCodeError('');
    try {
      await api.requestCode(targetEmail);
      setCodeCooldown(targetEmail, RESEND_COOLDOWN);
      setResendIn(RESEND_COOLDOWN);
      setCodeNotice('We sent a 6-character code to your email.');
    } catch (err) {
      // A 429 (cooldown / cap) is the one case worth surfacing; keep it generic.
      setCodeError(err.message || 'Could not send a code. Please try again shortly.');
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setCodeError('');
    setLoading(true);
    try {
      await api.verifyCode(email, code);
      setStep('password');
    } catch (err) {
      setCodeError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const checks = PW_RULES.map(r => ({ ...r, passed: r.test(password) }));
  const allPassed = checks.every(c => c.passed);
  const passwordsMatch = allPassed && confirmPassword.length > 0 && confirmPassword === password;

  async function handleRegister() {
    setLoading(true);
    setRegisterError('');
    try {
      await api.register({ email, password });
      clearCodeCooldown();
      setStep('done');
    } catch (err) {
      setRegisterError(err.message || 'Something went wrong. Please try again.');
      setConfirmPassword('');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError('');
    setLoading(true);
    try {
      const data = await api.checkWaitlist(trimmed);
      if (data.status === 'approved') {
        setEmail(trimmed);
        setStep('success');
        setCode('');
        setCodeError('');
        setCodeNotice('');
        // If a code was sent to this email within the cooldown, that code is
        // still valid — resume the countdown instead of requesting (and being
        // rate-limited for) a fresh one. Otherwise send a new code.
        const remaining = getCodeCooldown(trimmed);
        if (remaining > 0) {
          setResendIn(remaining);
          setCodeNotice('Enter the code we already sent to your email.');
        } else {
          sendCode(trimmed);
        }
        setTimeout(() => setStep('verify'), 2000);
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
    <AuthShell onBack={() => navigate('/home')}>
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
                      <a href="https://imprint-wheat.vercel.app/home" target="_blank" rel="noreferrer" className="auth-link">
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
            <p className="auth-switch">
              Already have an account?{' '}
              <button type="button" className="auth-link-btn" onClick={() => navigate('/login')}>Log in</button>
            </p>
          </>
        )}

        {/* ── Success / transition step ── */}
        {step === 'success' && (
          <div className="auth-success">
            <div className="auth-spinner" />
            <p>Success! Your email is approved.</p>
          </div>
        )}

        {/* ── Verification step ── */}
        {step === 'verify' && (
          <>
            <h1 className="auth-title">Verify Your Email</h1>
            <p className="auth-sub">
              Enter the 6-character code we sent to <strong>{email}</strong>. It expires in 30 minutes.
            </p>
            <form onSubmit={handleVerify} className="auth-form" noValidate>
              <input
                type="text"
                className="auth-input auth-code-input"
                placeholder="------"
                value={code}
                onChange={(e) => {
                  // Keep only alphabet chars, uppercase, max 6.
                  const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                  setCode(v);
                  setCodeError('');
                }}
                autoComplete="one-time-code"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
                maxLength={6}
                style={{ fontSize: '16px' }}
              />
              {codeNotice && !codeError && <p className="auth-sub" style={{ margin: 0 }}>{codeNotice}</p>}
              {codeError && <p className="auth-error">{codeError}</p>}
              <button type="submit" className="btn btn-primary auth-submit" disabled={loading || code.length !== 6}>
                {loading ? 'Verifying…' : 'Verify'}
              </button>
            </form>
            <p className="auth-switch">
              Didn't get it?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={sendCode}
                disabled={resendIn > 0}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </button>
            </p>
          </>
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
                <>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', margin: '4px 0 0' }}>
                    By signing up, you agree to our{' '}
                    <a href="/privacy" target="_blank" rel="noreferrer" className="auth-link">Privacy Policy</a>
                    {' '}and Terms.
                  </p>
                  <button
                    className="btn btn-primary auth-submit"
                    onClick={() => setConfirmCreate(true)}
                    disabled={loading}
                  >
                    {loading ? 'Creating account…' : 'Continue'}
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* ── Done step ── */}
        {step === 'done' && (
          <div className="auth-success">
            <span className="auth-success-icon">✓</span>
            <p>Account created!</p>
            <p className="auth-sub" style={{ marginTop: '8px', textAlign: 'center' }}>
              You can now log in with your email and password.
            </p>
            <button
              className="btn btn-primary auth-submit"
              style={{ marginTop: '20px' }}
              onClick={() => navigate('/login')}
            >
              Log In
            </button>
          </div>
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
    </AuthShell>
  );
}
