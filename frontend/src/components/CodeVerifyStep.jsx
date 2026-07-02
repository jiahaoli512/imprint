import { useState, useEffect, useCallback, useRef } from 'react';
import { getCodeCooldown, setCodeCooldown } from '../api/client';

const RESEND_COOLDOWN = 60; // seconds; mirrors the server-side resend cooldown

// Shared "enter the 6-character code" step used by both the signup and
// forgot-password flows. Owns the code input, the resend button + countdown, and
// the cooldown persistence (so exiting/re-entering resumes the timer instead of
// requesting a fresh code). On mount it sends a code unless one was sent within
// the cooldown (in which case that code is still valid and we just resume).
//
// Callers inject the two API calls and the success handler, so this component
// stays flow-agnostic:
//   requestCode(email)        -> Promise            (issues/re-issues a code)
//   verifyCode(email, code)   -> Promise<result>    (throws on bad code)
//   onVerified(result)        -> void               (advance the parent flow)
export default function CodeVerifyStep({
  email, title, subtitle, sentNotice, requestCode, verifyCode, onVerified,
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  // Seed the cooldown from storage so a still-valid code resumes its countdown
  // (and shows the "already sent" notice) without a synchronous setState on mount.
  const [resendIn, setResendIn] = useState(() => getCodeCooldown(email));
  const [notice, setNotice] = useState(() =>
    getCodeCooldown(email) > 0 ? 'Enter the code we already sent to your email.' : '');
  const [loading, setLoading] = useState(false);
  const didInit = useRef(false);

  // Tick down the resend cooldown once per second while it's active.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const sendCode = useCallback(async () => {
    try {
      await requestCode(email);
      setCodeCooldown(email, RESEND_COOLDOWN);
      setResendIn(RESEND_COOLDOWN);
      setNotice(sentNotice);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not send a code. Please try again shortly.');
    }
  }, [email, requestCode, sentNotice]);

  // On first mount, send a fresh code unless one is still within its cooldown
  // (seeded into state above, so that code is still valid). The ref guards
  // against a double-send under StrictMode.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    // sendCode is an async request; its setStates run after the await, not
    // synchronously — the lint rule can't see through the function boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (getCodeCooldown(email) <= 0) sendCode();
  }, [email, sendCode]);

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await verifyCode(email, code);
      onVerified(result);
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="auth-title">{title}</h1>
      <p className="auth-sub">{subtitle}</p>
      <form onSubmit={handleVerify} className="auth-form" noValidate>
        <input
          type="text"
          className="auth-input auth-code-input"
          placeholder="------"
          value={code}
          onChange={(e) => {
            // Keep only alphabet chars, uppercase, max 6.
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
            setError('');
          }}
          autoComplete="one-time-code"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          maxLength={6}
          style={{ fontSize: '16px' }}
        />
        {notice && !error && <p className="auth-sub" style={{ margin: 0 }}>{notice}</p>}
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="btn btn-primary auth-submit" disabled={loading || code.length !== 6}>
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>
      <p className="auth-switch">
        Didn't get it?{' '}
        <button type="button" className="auth-link-btn" onClick={sendCode} disabled={resendIn > 0}>
          {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
        </button>
      </p>
    </>
  );
}
