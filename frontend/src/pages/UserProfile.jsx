import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { User, Pencil, X, Check, Award } from 'lucide-react';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { getUsername, profileApiFor } from '../api/client';
import { formatDate } from '../utils/formatDate';
import { fullName } from '../utils/fullName';
import { useAdminView } from '../utils/useAdminView';
import { useFitText } from '../utils/useFitText';
import { useUser } from '../features/users/useUser';
import { useProfileEdit } from '../features/users/useProfileEdit';
import ProfileToolbar from '../features/users/ProfileToolbar';
import BadgesModal from '../features/badges/BadgesModal';

const isNative = Capacitor.isNativePlatform();

// Field labels in the edit form — serif display face, slightly larger.
const fieldLabelStyle = {
  fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--muted)',
  display: 'block', marginBottom: '6px',
};

// Red asterisk marking a required field.
const RequiredMark = () => <span style={{ color: 'var(--error)' }}> *</span>;

const cooldownHint = (wait, cadence) =>
  wait > 0 ? `Available again in ${wait} day${wait === 1 ? '' : 's'}.` : `Can be changed once ${cadence}.`;

export default function UserProfile() {
  const { username } = useParams();
  const isAdminView = useAdminView();
  const isMe = isAdminView || username === getUsername();
  const { getUser, updateUser } = profileApiFor(isAdminView);

  const { user, setUser, loading } = useUser(username, { fetcher: getUser, redirectOnNotFound: true });

  // All edit-flow state/logic lives in the hook; this page just renders it.
  const edit = useProfileEdit({ user, setUser, username, isAdminView, updateUser });

  const [showBadges, setShowBadges] = useState(false);

  // Shrink an over-long name to fit one line — mobile app only.
  const nameRef = useRef(null);
  useFitText(nameRef, [user, edit.editing], { enabled: isNative, min: 14 });

  if (loading) return <Spinner />;
  if (!user) return null;

  const joined = formatDate(user.createdAt, { long: true });
  const displayName = fullName(user);
  const { nameWait, usernameWait } = edit;

  return (
    <div className={`auth-page${isAdminView ? ' profile-page-admin' : ''}`}>
      <ProfileToolbar username={username} isAdminView={isAdminView} isMe={isMe} />

      <div className="auth-card profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={32} color="var(--muted)" />
          </div>

          {edit.editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
              <div>
                <label style={fieldLabelStyle}>First Name<RequiredMark /></label>
                <input
                  className="auth-input"
                  placeholder="First name"
                  value={edit.first}
                  maxLength={50}
                  onChange={e => edit.setFirst(e.target.value)}
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
                  value={edit.last}
                  maxLength={50}
                  onChange={e => edit.setLast(e.target.value)}
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
                  value={edit.username}
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={e => edit.setUsername(e.target.value)}
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
              {edit.error && <p className="auth-error">{edit.error}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={edit.requestSave} disabled={edit.saving}>
                  <Check size={14} /> {edit.saving ? 'Saving…' : 'Save'}
                </button>
                <button className="btn btn-ghost" onClick={edit.cancel} disabled={edit.saving}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {displayName && (
                <h1 ref={nameRef} className="profile-name">{displayName}</h1>
              )}
              <p className="profile-handle">@{user.username}</p>
              {isMe && (
                <button className="btn btn-ghost profile-edit-btn" onClick={edit.start}>
                  <Pencil size={14} /> Edit Profile
                </button>
              )}
            </>
          )}
        </div>

        <div className="profile-divider" />

        <div className="profile-info">
          <div className="profile-info-row">
            <span className="profile-info-label">Member since:</span>
            <span className="profile-info-value">{joined}</span>
          </div>
          <button className="btn btn-ghost profile-badges-btn" onClick={() => setShowBadges(true)}>
            <Award size={15} /> Badges
          </button>
        </div>
      </div>
      {showBadges && <BadgesModal user={user} onClose={() => setShowBadges(false)} />}
      {edit.pendingSave && (
        <Modal onClose={edit.closePending}>
          <h2 className="modal-title">Save these changes?</h2>
          <div className="modal-sub" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {edit.pendingSave.changes.map(({ label, value }) => (
              <div key={label} style={{ textDecoration: 'underline' }}>
                <span style={{ color: 'var(--muted)' }}>{label}: </span>
                <span style={{ fontWeight: 600 }}>{value || '—'}</span>
              </div>
            ))}
          </div>
          {!isAdminView && (
            <div className="modal-sub" style={{ marginTop: '12px', color: 'var(--error)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {edit.pendingSave.changes.some(c => c.label === 'Username') && (
                <p>You can only change your username once a month.</p>
              )}
              {edit.pendingSave.changes.some(c => c.label === 'Name') && (
                <p>You can only change your name once a week.</p>
              )}
            </div>
          )}
          <button className="btn btn-primary modal-submit" onClick={edit.confirmSave} disabled={edit.saving}>
            {edit.saving ? 'Saving…' : 'Confirm'}
          </button>
          <button className="modal-cancel" onClick={edit.closePending}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}
