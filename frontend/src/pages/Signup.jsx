import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import ConfirmModal from '../components/ConfirmModal';
import CodeVerifyStep from '../components/CodeVerifyStep';
import PasswordChecklist from '../components/PasswordChecklist';
import { api, clearCodeCooldown } from '../api/client';
import { isValidEmail, normalizeEmail } from '../utils/validateName';
import { passwordValid } from '../utils/passwordRules';

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

  useEffect(() => {
    if (step === 'done') {
      const t = setTimeout(() => navigate('/home'), 3000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const allPassed = passwordValid(password);
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
    const trimmed = normalizeEmail(email);
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
        // CodeVerifyStep issues the code when it mounts (respecting the cooldown).
        setStep('success');
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
          <CodeVerifyStep
            email={email}
            title="Verify Your Email"
            subtitle={<>Enter the 6-character code we sent to <strong>{email}</strong>. It expires in 30 minutes.</>}
            sentNotice="We sent a 6-character code to your email."
            requestCode={api.requestCode}
            verifyCode={api.verifyCode}
            onVerified={() => setStep('password')}
          />
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

              <PasswordChecklist password={password} />

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
