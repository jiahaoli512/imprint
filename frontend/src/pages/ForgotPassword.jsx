import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import {
  api, getCodeCooldown, setCodeCooldown, clearCodeCooldown,
  setToken, setUsername, clearAdminSession,
} from '../api/client';
import { isValidEmail } from '../utils/validateName';
import { refreshGreeting } from '../utils/greeting';
import { PW_RULES } from '../utils/passwordRules';

const RESEND_COOLDOWN = 60; // seconds; mirrors the server-side resend cooldown

// Forgot-password flow: email → code → choice (change password / skip & log in)
// → optional new password → dashboard. Reuses the same 6-char email-code
// challenge as signup; verifying the code logs the user in (returns a token), so
// both end options land on the dashboard already authenticated.
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // email | verify | choice | password
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeNotice, setCodeNotice] = useState('');
  const [resendIn, setResendIn] = useState(0);

  // Logged-in identity resolved by a successful verify
  const [username, setUsernameState] = useState(null);

  // New password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetError, setResetError] = useState('');

  // Tick down the resend cooldown once per second while it's active.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const checks = PW_RULES.map((r) => ({ ...r, passed: r.test(password) }));
  const allPassed = checks.every((c) => c.passed);
  const passwordsMatch = allPassed && confirmPassword.length > 0 && confirmPassword === password;

  // Navigate to the right place once authenticated (dashboard, or profile setup
  // if this account never picked a username).
  function goAuthed() {
    if (username) navigate(`/${username}/dashboard`);
    else navigate('/login/profile', { state: { email } });
  }

  // Sends (or re-sends) a reset code and persists the cooldown so it survives
  // exiting the flow. Generic result — never reveals whether the account exists.
  async function sendCode(targetEmail = email) {
    setCodeError('');
    try {
      await api.requestPasswordReset(targetEmail);
      setCodeCooldown(targetEmail, RESEND_COOLDOWN);
      setResendIn(RESEND_COOLDOWN);
      setCodeNotice('If an account exists for that email, a 6-character code is on its way.');
    } catch (err) {
      setCodeError(err.message || 'Could not send a code. Please try again shortly.');
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) { setEmailError('Enter a valid email address.'); return; }
    setEmailError('');
    setEmail(trimmed);
    setCode('');
    setCodeError('');
    setCodeNotice('');
    // Resume an active cooldown (the earlier code is still valid) instead of
    // requesting a fresh one; otherwise send.
    const remaining = getCodeCooldown(trimmed);
    if (remaining > 0) {
      setResendIn(remaining);
      setCodeNotice('Enter the code we already sent to your email.');
    } else {
      sendCode(trimmed);
    }
    setStep('verify');
  }

  async function handleVerify(e) {
    e.preventDefault();
    setCodeError('');
    setLoading(true);
    try {
      const data = await api.verifyPasswordReset(email, code);
      // Verifying the code logs the user in.
      if (data.token) setToken(data.token);
      if (data.username) setUsername(data.username);
      setUsernameState(data.username || null);
      clearAdminSession();
      refreshGreeting();
      clearCodeCooldown();
      setStep('choice');
    } catch (err) {
      setCodeError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    setLoading(true);
    try { await api.finishReset(); } catch { /* record just TTL-expires otherwise */ }
    goAuthed();
  }

  async function handleReset() {
    setLoading(true);
    setResetError('');
    try {
      await api.resetPassword(password);
      goAuthed();
    } catch (err) {
      setResetError(err.message || 'Something went wrong. Please try again.');
      setConfirmPassword('');
      setLoading(false);
    }
  }

  return (
    <AuthShell onBack={() => navigate('/login')}>
      {/* ── Email step ── */}
      {step === 'email' && (
        <>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-sub">Enter your email and we'll send you a verification code.</p>
          <form onSubmit={handleEmailSubmit} className="auth-form" noValidate>
            <input
              type="email"
              className="auth-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
              autoComplete="email"
            />
            {emailError && <p className="auth-error">{emailError}</p>}
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading || !email}>
              Send Code
            </button>
          </form>
          <p className="auth-switch">
            Remembered it?{' '}
            <button type="button" className="auth-link-btn" onClick={() => navigate('/login')}>Log in</button>
          </p>
        </>
      )}

      {/* ── Verification step ── */}
      {step === 'verify' && (
        <>
          <h1 className="auth-title">Enter Code</h1>
          <p className="auth-sub">
            Enter the 6-character code sent to <strong>{email}</strong>. It expires in 30 minutes.
          </p>
          <form onSubmit={handleVerify} className="auth-form" noValidate>
            <input
              type="text"
              className="auth-input auth-code-input"
              placeholder="------"
              value={code}
              onChange={(e) => {
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
            <button type="button" className="auth-link-btn" onClick={() => sendCode()} disabled={resendIn > 0}>
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
            </button>
          </p>
        </>
      )}

      {/* ── Choice step ── */}
      {step === 'choice' && (
        <>
          <h1 className="auth-title">You're verified</h1>
          <p className="auth-sub">Set a new password now, or skip and log in with your current one.</p>
          <div className="auth-form">
            <button className="btn btn-primary auth-submit" onClick={() => setStep('password')} disabled={loading}>
              Change password
            </button>
            <button className="btn btn-ghost auth-submit" onClick={handleSkip} disabled={loading}>
              {loading ? 'Logging in…' : 'Skip & log in'}
            </button>
          </div>
        </>
      )}

      {/* ── New password step ── */}
      {step === 'password' && (
        <>
          <h1 className="auth-title">New Password</h1>
          <p className="auth-sub">Choose a strong password.</p>
          <div className="auth-form">
            <div className="auth-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="New password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setConfirmPassword(''); }}
                autoComplete="new-password"
              />
              <button type="button" className="auth-eye" onClick={() => setShowPassword((s) => !s)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <ul className="auth-checks">
              {checks.map((c) => (
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
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!allPassed}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowConfirm((s) => !s)}
                disabled={!allPassed}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {resetError && <p className="auth-error">{resetError}</p>}

            {passwordsMatch && (
              <button className="btn btn-primary auth-submit" onClick={handleReset} disabled={loading}>
                {loading ? 'Saving…' : 'Save & Continue'}
              </button>
            )}
          </div>
        </>
      )}
    </AuthShell>
  );
}
