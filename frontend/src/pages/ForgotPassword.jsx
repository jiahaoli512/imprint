import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import CodeVerifyStep from '../components/CodeVerifyStep';
import PasswordChecklist from '../components/PasswordChecklist';
import PasswordInput from '../components/PasswordInput';
import {
  api, clearCodeCooldown,
  setToken, setUsername, clearAdminSession,
} from '../api/client';
import { isValidEmail, normalizeEmail } from '../utils/validateName';
import { refreshGreeting } from '../utils/greeting';
import { passwordValid, passwordsMatch as isPasswordsMatch } from '../utils/passwordRules';

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

  // Logged-in identity resolved by a successful verify
  const [username, setUsernameState] = useState(null);

  // New password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');

  const allPassed = passwordValid(password);
  const passwordsMatch = isPasswordsMatch(password, confirmPassword);

  // Navigate to the right place once authenticated (dashboard, or profile setup
  // if this account never picked a username).
  function goAuthed() {
    if (username) navigate(`/${username}/dashboard`);
    else navigate('/login/profile', { state: { email } });
  }

  function handleEmailSubmit(e) {
    e.preventDefault();
    const trimmed = normalizeEmail(email);
    if (!isValidEmail(trimmed)) { setEmailError('Enter a valid email address.'); return; }
    setEmailError('');
    setEmail(trimmed);
    // CodeVerifyStep issues the reset code when it mounts (respecting the cooldown).
    setStep('verify');
  }

  // A successful code verification logs the user in (the response carries a token).
  function handleVerified(data) {
    if (data.token) setToken(data.token);
    if (data.username) setUsername(data.username);
    setUsernameState(data.username || null);
    clearAdminSession();
    refreshGreeting();
    clearCodeCooldown();
    setStep('choice');
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
      // The reset revokes the token minted at verify, so swap in the fresh one it
      // returns before navigating (otherwise the dashboard load would 401).
      const data = await api.resetPassword(password);
      if (data?.token) setToken(data.token);
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
        <CodeVerifyStep
          email={email}
          title="Enter Code"
          subtitle={<>Enter the 6-character code sent to <strong>{email}</strong>. It expires in 30 minutes.</>}
          sentNotice="If an account exists for that email, a 6-character code is on its way."
          requestCode={api.requestPasswordReset}
          verifyCode={api.verifyPasswordReset}
          onVerified={handleVerified}
        />
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
            <PasswordInput
              placeholder="New password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setConfirmPassword(''); }}
            />

            <PasswordChecklist password={password} />

            <PasswordInput
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={!allPassed}
              extraClass={passwordsMatch ? 'auth-input-match' : ''}
            />

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
