import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, User, Pencil, X, Check, List, LayoutDashboard, LogOut } from 'lucide-react';
import LogoutModal from '../components/LogoutModal';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { getUsername, setUsername as saveUsername, profileApiFor } from '../api/client';
import { formatDate } from '../utils/formatDate';
import { fullName } from '../utils/fullName';
import { useAdminView } from '../utils/useAdminView';
import { validateName, USERNAME_RE } from '../utils/validateName';
import { useFitText } from '../utils/useFitText';

const isNative = Capacitor.isNativePlatform();

// Self-service edit cooldowns, in days. Mirrors COOLDOWN_DAYS in
// backend/src/utils/validate.js — the backend is the source of truth; these
// only drive the UI hints. Admins have no cooldown.
const COOLDOWN_DAYS = { username: 30, name: 7 };

// Whole days left before a `days`-long cooldown clears (0 when eligible).
function daysUntil(ts, days) {
  if (!ts) return 0;
  const remMs = days * 86400000 - (Date.now() - new Date(ts).getTime());
  return remMs <= 0 ? 0 : Math.ceil(remMs / 86400000);
}

// Field labels in the edit form — serif display face, slightly larger.
const fieldLabelStyle = {
  fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--muted)',
  display: 'block', marginBottom: '6px',
};

// Red asterisk marking a required field.
const RequiredMark = () => <span style={{ color: 'var(--danger, #e2685a)' }}> *</span>;

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const isAdminView = useAdminView();
  const isMe = isAdminView || username === getUsername();
  const { getUser, updateUser } = profileApiFor(isAdminView);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [pendingSave, setPendingSave] = useState(null); // validated change awaiting confirmation

  // Shrink an over-long name to fit one line — mobile app only.
  const nameRef = useRef(null);
  useFitText(nameRef, [user, editing], { enabled: isNative, min: 14 });

  useEffect(() => {
    getUser(username)
      .then(data => setUser(data))
      .catch(err => {
        if (err.status === 404) navigate('/user-not-found', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [username]);

  function startEdit() {
    setEditFirst(user.firstName || '');
    setEditLast(user.lastName || '');
    setEditUsername(user.username || '');
    setEditError('');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditError('');
    setPendingSave(null);
  }

  // Validate the edit, then stage it for confirmation rather than saving outright.
  function requestSave() {
    setEditError('');
    const nextUsername = editUsername.trim().toLowerCase();
    const nameChanged = editFirst.trim() !== (user.firstName || '') || editLast.trim() !== (user.lastName || '');
    const usernameChanged = nextUsername !== user.username;

    if (!nameChanged && !usernameChanged) {
      setEditError('Make a change before saving.');
      return;
    }
    // Validate only the groups the user actually changed.
    if (nameChanged) {
      if (!editFirst.trim()) { setEditError('First name is required.'); return; }
      const nameError = validateName(editFirst, editLast);
      if (nameError) { setEditError(nameError); return; }
    }
    if (usernameChanged && !USERNAME_RE.test(nextUsername)) {
      setEditError('Username must be 3–20 characters: letters, numbers, underscores.');
      return;
    }

    const body = {};
    const changes = [];
    if (nameChanged) {
      body.firstName = editFirst;
      body.lastName = editLast;
      changes.push({ label: 'Name', value: [editFirst.trim(), editLast.trim()].filter(Boolean).join(' ') });
    }
    if (usernameChanged) {
      body.username = nextUsername;
      changes.push({ label: 'Username', value: `@${nextUsername}` });
    }

    setPendingSave({ body, usernameChanged, changes });
  }

  // Commit the staged change after the user confirms.
  async function confirmSave() {
    if (!pendingSave) return;
    const { body, usernameChanged } = pendingSave;
    setPendingSave(null);
    setSaving(true);
    try {
      const data = await updateUser(username, body);
      setUser(data);
      setEditing(false);
      // A username change moves the profile's URL (and the stored username for a
      // self-edit). Markers are keyed by user _id, so they're unaffected.
      if (usernameChanged && data.username && data.username !== username) {
        if (isAdminView) {
          navigate(`/admin/${data.username}/profile`, { replace: true });
        } else {
          saveUsername(data.username);
          navigate(`/${data.username}/profile`, { replace: true });
        }
      }
    } catch (err) {
      setEditError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  if (!user) return null;

  const joined = formatDate(user.createdAt, { long: true });
  const displayName = fullName(user);

  // Self-service cooldowns (admins have none). 0 = editable now.
  const nameWait = isAdminView ? 0 : daysUntil(user.nameChangedAt, COOLDOWN_DAYS.name);
  const usernameWait = isAdminView ? 0 : daysUntil(user.usernameChangedAt, COOLDOWN_DAYS.username);
  const cooldownHint = (wait, cadence) =>
    wait > 0 ? `Available again in ${wait} day${wait === 1 ? '' : 's'}.` : `Can be changed once ${cadence}.`;

  return (
    <div className="auth-page" style={isAdminView ? { paddingTop: 'calc(80px + env(safe-area-inset-top))' } : {}}>
      {isAdminView && (
        <div style={{ position: 'fixed', top: 'calc(16px + env(safe-area-inset-top))', right: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <span className="admin-badge">Admin</span>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>viewing @{username}</span>
        </div>
      )}
      <div style={{ position: 'fixed', top: 'calc(16px + env(safe-area-inset-top))', left: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: 'calc(100vw - 100px)' }}>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (isAdminView) navigate(`/admin/${username}/dashboard`);
            else if (isMe) navigate(`/${username}/dashboard`);
            else navigate(-1);
          }}
        >
          <ArrowLeft size={16} /> <span className="btn-label">{isAdminView ? `@${username}'s dashboard` : isMe ? 'Dashboard' : 'Back'}</span>
        </button>
        {isAdminView && (
          <>
            <button className="btn btn-ghost" onClick={() => navigate('/admin/waitlist')}>
              <List size={15} /> <span className="btn-label">Admin Waitlist</span>
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/admin/dashboard')}>
              <LayoutDashboard size={15} /> <span className="btn-label">Admin Dashboard</span>
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirmLogout(true)}>
              <LogOut size={15} /> <span className="btn-label">Log out of Admin</span>
            </button>
          </>
        )}
      </div>

      <div className="auth-card" style={{ gap: '0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '8px 0 32px', width: '100%' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={32} color="var(--muted)" />
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
              <div>
                <label style={fieldLabelStyle}>First Name<RequiredMark /></label>
                <input
                  className="auth-input"
                  placeholder="First name"
                  value={editFirst}
                  maxLength={50}
                  onChange={e => { setEditFirst(e.target.value); setEditError(''); }}
                  disabled={nameWait > 0}
                  style={nameWait > 0 ? { opacity: 0.55, cursor: 'not-allowed' } : {}}
                  autoFocus
                />
              </div>
              <div>
                <label style={fieldLabelStyle}>Last Name</label>
                <input
                  className="auth-input"
                  placeholder="Last name (optional)"
                  value={editLast}
                  maxLength={50}
                  onChange={e => { setEditLast(e.target.value); setEditError(''); }}
                  disabled={nameWait > 0}
                  style={nameWait > 0 ? { opacity: 0.55, cursor: 'not-allowed' } : {}}
                />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '-4px' }}>
                {cooldownHint(nameWait, 'a week')}
              </p>
              <div>
                <label style={fieldLabelStyle}>
                  Username<RequiredMark />
                </label>
                <input
                  className="auth-input"
                  placeholder="Username"
                  value={editUsername}
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={e => { setEditUsername(e.target.value); setEditError(''); }}
                  disabled={usernameWait > 0}
                  style={usernameWait > 0 ? { opacity: 0.55, cursor: 'not-allowed' } : {}}
                />
                <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  {cooldownHint(usernameWait, 'a month')}
                </p>
              </div>
              {user.dateOfBirth && (
                <div>
                  <label style={fieldLabelStyle}>
                    Date of birth
                  </label>
                  <input
                    className="auth-input"
                    value={formatDate(user.dateOfBirth, { long: true })}
                    disabled
                    readOnly
                    style={{ opacity: 0.55, cursor: 'not-allowed' }}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                    Date of birth can't be changed.{' '}
                    <Link to="/contact" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                      Request a change
                    </Link>.
                  </p>
                </div>
              )}
              {editError && <p className="auth-error">{editError}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={requestSave} disabled={saving}>
                  <Check size={14} /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button className="btn btn-ghost" onClick={cancelEdit} disabled={saving}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {displayName && (
                <h1 ref={nameRef} style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>
                  {displayName}
                </h1>
              )}
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--accent)', fontWeight: '600' }}>
                @{user.username}
              </p>
              {isMe && (
                <button className="btn btn-ghost" style={{ marginTop: '4px' }} onClick={startEdit}>
                  <Pencil size={14} /> Edit Profile
                </button>
              )}
            </>
          )}
        </div>

        <div style={{ height: '1px', background: 'var(--border)', margin: '0 -40px' }} />

        <div style={{ paddingTop: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Member since:</span>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>{joined}</span>
          </div>
        </div>
      </div>
      {confirmLogout && <LogoutModal admin onCancel={() => setConfirmLogout(false)} />}
      {pendingSave && (
        <Modal onClose={() => setPendingSave(null)}>
          <h2 className="modal-title">Save these changes?</h2>
          <div className="modal-sub" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingSave.changes.map(({ label, value }) => (
              <div key={label} style={{ textDecoration: 'underline' }}>
                <span style={{ color: 'var(--muted)' }}>{label}: </span>
                <span style={{ fontWeight: 600 }}>{value || '—'}</span>
              </div>
            ))}
          </div>
          {!isAdminView && (
            <div className="modal-sub" style={{ marginTop: '12px', color: '#e2685a', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendingSave.changes.some(c => c.label === 'Username') && (
                <p>You can only change your username once a month.</p>
              )}
              {pendingSave.changes.some(c => c.label === 'Name') && (
                <p>You can only change your name once a week.</p>
              )}
            </div>
          )}
          <button className="btn btn-primary modal-submit" onClick={confirmSave} disabled={saving}>
            {saving ? 'Saving…' : 'Confirm'}
          </button>
          <button className="modal-cancel" onClick={() => setPendingSave(null)}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}
