import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, LogOut, Eye, EyeOff, Copy, Check } from 'lucide-react';
import Modal from '../../components/Modal';
import PasswordInput from '../../components/PasswordInput';
import PasswordAndConfirmFields from '../../components/PasswordAndConfirmFields';
import ScrollHint from '../../components/ScrollHint';
import { api, getUsername, setToken } from '../../api/client';
import { passwordValid, passwordsMatch } from '../../utils/passwordRules';
import { useForm } from '../../utils/useForm';
import { useAccountExport } from './useAccountExport';
import { useLogoutAllDevices } from './useLogoutAllDevices';
import Setting from './Setting';

// Masks a local part down to its first character (`jiahaoli@g.ucla.edu` ->
// `j*******@g.ucla.edu`) — the domain stays visible since it's rarely
// sensitive on its own and helps the user recognize the right account at a
// glance while still censored by default.
function censorEmail(email) {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  return `${email[0]}${'*'.repeat(at - 1)}${email.slice(at)}`;
}

// Copies a value to the clipboard and swaps to a checkmark + "Copied!" toast
// for a beat, then reverts. `getValue` may be sync (the plain string) or
// async (ViewEmailSetting passes its fetch-or-cache function, so copying
// still works — and fetches once — even if the row is currently censored).
function CopyButton({ getValue, label }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const value = typeof getValue === 'function' ? await getValue() : getValue;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard permission denied/unavailable — no-op */ }
  }

  return (
    <div className="settings-copy-wrap">
      <button type="button" className="icon-btn" aria-label={`Copy ${label}`} onClick={handleCopy}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
      {copied && <span className="settings-copy-toast" role="status">Copied!</span>}
    </div>
  );
}

// Fetches the account email lazily — only on first reveal (or copy), not on
// mount — so a user who never asks for it never puts their email in
// memory/DOM at all beyond the censored form. Toggling back to hidden
// re-masks the already-fetched value rather than re-fetching. `ensureEmail`
// is shared by both the eye toggle and the copy button so there's one fetch
// path, not two.
function ViewEmailSetting({ getEmail = api.getEmail }) {
  const [email, setEmail] = useState(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function ensureEmail() {
    if (email) return email;
    setLoading(true);
    setError('');
    try {
      const data = await getEmail();
      setEmail(data.email);
      return data.email;
    } catch {
      setError('Could not load your email.');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function reveal() {
    if (await ensureEmail()) setVisible(true);
  }

  return (
    <div className="settings-inline-form">
      <div className="settings-view-row">
        <span className="settings-view-value">
          {visible && email ? email : (email ? censorEmail(email) : '••••••••••••')}
        </span>
        <div className="settings-view-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label={visible ? 'Hide email' : 'Show email'}
            onClick={() => (visible ? setVisible(false) : reveal())}
            disabled={loading}
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <CopyButton getValue={ensureEmail} label="email" />
        </div>
      </div>
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}

// Not censored — the username is already public (every profile URL/search
// result shows it), so there's nothing to gate behind a reveal. Reads it
// straight from client.js's cached copy rather than fetching, same as
// handleEditProfile below.
function ViewUsernameSetting() {
  const username = getUsername();
  return (
    <div className="settings-inline-form">
      <div className="settings-view-row">
        <span className="settings-view-value">@{username}</span>
        <div className="settings-view-actions">
          <CopyButton getValue={username} label="username" />
        </div>
      </div>
    </div>
  );
}

// Inline "change password while signed in" form, gated by re-entering the
// current password (as opposed to the forgot-password flow's email-code
// challenge). Mirrors ForgotPassword.jsx's "set new password" step.
// `changePassword` is injected (default: the real API call) for the same
// testability reason useUser/useProfileEdit inject their data functions.
function ChangePasswordForm({ onDone, changePassword = api.changePassword }) {
  const [success, setSuccess] = useState(false);
  const { values, setField, error, submitting, handleSubmit } = useForm(
    { currentPassword: '', newPassword: '', confirmPassword: '' },
    {
      validate: ({ newPassword, confirmPassword }) => {
        if (!passwordValid(newPassword)) return 'New password does not meet the requirements.';
        if (newPassword !== confirmPassword) return 'New passwords do not match.';
        return '';
      },
      onSubmit: async ({ currentPassword, newPassword }) => {
        // Changing the password bumps tokenVersion (revokes every existing
        // session), so the fresh token returned here must replace the stored
        // one or this client's own next request would 401.
        const data = await changePassword(currentPassword, newPassword);
        if (data?.token) setToken(data.token);
        setSuccess(true);
      },
    },
  );

  const matches = passwordsMatch(values.newPassword, values.confirmPassword);

  if (success) {
    return (
      <div className="settings-inline-form">
        <p className="auth-sub">Password changed.</p>
        <button type="button" className="btn btn-ghost" onClick={onDone}>Done</button>
      </div>
    );
  }

  return (
    <form className="settings-inline-form auth-form" onSubmit={handleSubmit}>
      <PasswordInput
        placeholder="Current password"
        autoComplete="current-password"
        value={values.currentPassword}
        onChange={setField('currentPassword')}
      />
      <PasswordAndConfirmFields
        password={values.newPassword}
        onPasswordChange={setField('newPassword')}
        confirmPassword={values.confirmPassword}
        onConfirmPasswordChange={setField('confirmPassword')}
        passwordPlaceholder="New password"
        confirmPlaceholder="Confirm new password"
      />
      {error && <p className="auth-error">{error}</p>}
      <div className="settings-inline-form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting || !matches}>
          {submitting ? 'Saving…' : 'Save password'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone} disabled={submitting}>Cancel</button>
      </div>
    </form>
  );
}

// Confirmation modal for signing out every session (including this one) —
// same shape as LogoutModal.jsx, since this is functionally "log out, but
// everywhere". Orchestration (flush/revoke/clear/redirect) lives in
// useLogoutAllDevices; this is just the confirm UI.
function LogoutAllModal({ onCancel }) {
  const { loading, handleConfirm } = useLogoutAllDevices();

  return (
    <Modal onClose={onCancel}>
      <h2 className="modal-title">Log out of all devices?</h2>
      <p className="modal-sub" style={{ marginTop: '16px', color: 'var(--error)' }}>
        Every signed-in session, including this one, will be signed out. You'll need to log in again.
      </p>
      <button className="btn btn-primary modal-submit" onClick={handleConfirm} disabled={loading}>
        {loading ? 'Logging out…' : 'Log out everywhere'}
      </button>
      <button className="modal-cancel" onClick={onCancel} disabled={loading}>Cancel</button>
    </Modal>
  );
}

// The Account Settings tab: profile shortcut, password change, data export,
// and a full session sign-out. Receives `ctx` (not individual props) from
// SettingsModal — see that file's comment on why.
export default function AccountSettings({ ctx }) {
  const { onClose } = ctx;
  const navigate = useNavigate();
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmingLogoutAll, setConfirmingLogoutAll] = useState(false);
  const { exporting, exportError, exportSent, handleExport } = useAccountExport();

  function handleEditProfile() {
    onClose();
    navigate(`/${getUsername()}/profile`, { state: { autoEdit: true } });
  }

  return (
    <ScrollHint wrapClassName="settings-scroll" className="settings-panel">
      <Setting title="Edit profile" description="Edit your name and username.">
        <button type="button" className="btn btn-primary" onClick={handleEditProfile}>Edit Profile</button>
      </Setting>

      <Setting title="View username" description="Your account's username.">
        <ViewUsernameSetting />
      </Setting>

      <Setting title="View email" description="Your account's email address is censored by default. Click the eye icon to reveal it.">
        <ViewEmailSetting />
      </Setting>

      <Setting title="Change password" description="Update your password using your current one.">
        {changingPassword ? (
          <ChangePasswordForm onDone={() => setChangingPassword(false)} />
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setChangingPassword(true)}>Change Password</button>
        )}
      </Setting>

      <Setting
        title="Export your data"
        description="Email a CSV of your location history and map markers to your account's email address. Location history is every raw GPS point your device has logged; map markers are the thinned-out points actually shown on your map (one per ~100m, so nearby points aren't duplicated)."
      >
        {exportSent ? (
          <p className="auth-sub">Check your inbox — your export is on its way.</p>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={handleExport} disabled={exporting}>
            <Mail size={14} /> {exporting ? 'Sending…' : 'Email My Data'}
          </button>
        )}
        {exportError && <p className="auth-error">{exportError}</p>}
      </Setting>

      <Setting title="Log out of all devices" description="Sign out of every session and device on your account, including this one.">
        <button type="button" className="btn btn-ghost" style={{ color: 'var(--error)' }} onClick={() => setConfirmingLogoutAll(true)}>
          <LogOut size={15} /> Log Out Everywhere
        </button>
      </Setting>

      {confirmingLogoutAll && <LogoutAllModal onCancel={() => setConfirmingLogoutAll(false)} />}
    </ScrollHint>
  );
}
