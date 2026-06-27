import { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, User, Pencil, X, Check, List, LayoutDashboard, Award } from 'lucide-react';
import LogoutButton from '../components/LogoutButton';
import AdminViewingBadge from '../components/AdminViewingBadge';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { getUsername, profileApiFor } from '../api/client';
import { formatDate } from '../utils/formatDate';
import { fullName } from '../utils/fullName';
import { useAdminView } from '../utils/useAdminView';
import { useFitText } from '../utils/useFitText';
import { useUser } from '../features/users/useUser';
import { useProfileEdit } from '../features/users/useProfileEdit';
import BadgesModal from '../features/users/BadgesModal';

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
  const navigate = useNavigate();
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
    <div className="auth-page" style={isAdminView ? { paddingTop: 'calc(80px + env(safe-area-inset-top))' } : {}}>
      {isAdminView && (
        <div style={{ position: 'fixed', top: 'calc(16px + env(safe-area-inset-top))', right: '20px' }}>
          <AdminViewingBadge username={username} />
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
            <LogoutButton admin />
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
                <h1 ref={nameRef} style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>
                  {displayName}
                </h1>
              )}
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--accent)', fontWeight: '600' }}>
                @{user.username}
              </p>
              {isMe && (
                <button className="btn btn-ghost" style={{ marginTop: '4px' }} onClick={edit.start}>
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
          <button className="btn btn-ghost" style={{ alignSelf: 'center' }} onClick={() => setShowBadges(true)}>
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
