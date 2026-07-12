import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import PasswordInput from '../../components/PasswordInput';
import PasswordChecklist from '../../components/PasswordChecklist';
import ScrollHint from '../../components/ScrollHint';
import { api, getUsername, setToken, clearSession } from '../../api/client';
import { pauseTracking } from '../location/backgroundTracking';
import { passwordValid } from '../../utils/passwordRules';
import { useForm } from '../../utils/useForm';
import { downloadCsv } from '../../utils/csv';
import Setting from './Setting';

// Inline "change password while signed in" form, gated by re-entering the
// current password (as opposed to the forgot-password flow's email-code
// challenge). Mirrors ForgotPassword.jsx's "set new password" step.
function ChangePasswordForm({ onDone }) {
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
        const data = await api.changePassword(currentPassword, newPassword);
        if (data?.token) setToken(data.token);
        setSuccess(true);
      },
    },
  );

  const allPassed = passwordValid(values.newPassword);
  const passwordsMatch = allPassed && values.confirmPassword.length > 0 && values.confirmPassword === values.newPassword;

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
      <PasswordInput
        placeholder="New password"
        value={values.newPassword}
        onChange={setField('newPassword')}
      />
      <PasswordChecklist password={values.newPassword} />
      <PasswordInput
        placeholder="Confirm new password"
        value={values.confirmPassword}
        onChange={setField('confirmPassword')}
        disabled={!allPassed}
        extraClass={passwordsMatch ? 'auth-input-match' : ''}
      />
      {error && <p className="auth-error">{error}</p>}
      <div className="settings-inline-form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting || !passwordsMatch}>
          {submitting ? 'Saving…' : 'Save password'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone} disabled={submitting}>Cancel</button>
      </div>
    </form>
  );
}

// Confirmation modal for signing out every session (including this one) —
// same shape as LogoutModal.jsx, since this is functionally "log out, but
// everywhere".
function LogoutAllModal({ onCancel }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    // Flush buffered points (needs the still-valid token) BEFORE revoking
    // every session server-side — logoutAllDevices bumps tokenVersion, which
    // invalidates this device's own token too, so calling it first would make
    // the flush 401 (same ordering LogoutModal.jsx uses, for the same reason).
    await pauseTracking();
    try {
      await api.logoutAllDevices();
    } finally {
      clearSession();
      navigate('/home');
    }
  }

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
// and a full session sign-out.
export default function AccountSettings({ onClose }) {
  const navigate = useNavigate();
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmingLogoutAll, setConfirmingLogoutAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  function handleEditProfile() {
    onClose();
    navigate(`/${getUsername()}/profile`, { state: { autoEdit: true } });
  }

  async function handleExport() {
    setExporting(true);
    setExportError('');
    try {
      const data = await api.exportAccountData();
      downloadCsv('imprint-locations.csv', [
        ['Latitude', 'Longitude', 'Accuracy (m)', 'Visited At'],
        ...data.locations.map((l) => [l.lat, l.lng, l.accuracy, l.visitedAt]),
      ]);
      downloadCsv('imprint-markers.csv', [
        ['Latitude', 'Longitude'],
        ...data.markers,
      ]);
    } catch (err) {
      setExportError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <ScrollHint wrapClassName="settings-scroll" className="settings-panel">
      <Setting title="Edit profile" description="Jump to your profile with editing already turned on.">
        <button type="button" className="btn btn-primary" onClick={handleEditProfile}>Edit Profile</button>
      </Setting>

      <Setting title="Change password" description="Update your password using your current one.">
        {changingPassword ? (
          <ChangePasswordForm onDone={() => setChangingPassword(false)} />
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setChangingPassword(true)}>Change Password</button>
        )}
      </Setting>

      <Setting title="Export your data" description="Download a CSV of your location history and map markers.">
        <button type="button" className="btn btn-ghost" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Preparing…' : 'Download CSV'}
        </button>
        {exportError && <p className="auth-error">{exportError}</p>}
      </Setting>

      <Setting title="Log out of all devices" description="Sign out of every session, including this one.">
        <button type="button" className="btn btn-ghost" style={{ color: 'var(--error)' }} onClick={() => setConfirmingLogoutAll(true)}>
          Log Out Everywhere
        </button>
      </Setting>

      {confirmingLogoutAll && <LogoutAllModal onCancel={() => setConfirmingLogoutAll(false)} />}
    </ScrollHint>
  );
}
