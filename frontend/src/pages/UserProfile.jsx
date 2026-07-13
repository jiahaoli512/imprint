import { useRef, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { User, Pencil, X, Check, Award } from 'lucide-react';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import FieldLabel from '../components/FieldLabel';
import { getUsername, profileApiFor, markersApiFor } from '../api/client';
import { retry } from '../utils/retry';
import { formatDate } from '../utils/formatDate';
import { fullName } from '../utils/fullName';
import { useAdminView } from '../utils/useAdminView';
import { useFitText } from '../utils/useFitText';
import { useUser } from '../features/users/useUser';
import { useProfileEdit } from '../features/users/useProfileEdit';
import { useProfileFriends } from '../features/users/useProfileFriends';
import ScrollHint from '../components/ScrollHint';
import ProfileToolbar from '../features/users/ProfileToolbar';
import FriendButton from '../features/users/FriendButton';
import FriendsListModal from '../features/users/FriendsListModal';
import BadgesModal from '../features/badges/BadgesModal';

const isNative = Capacitor.isNativePlatform();

const cooldownHint = (wait, cadence) =>
  wait > 0 ? `Available again in ${wait} day${wait === 1 ? '' : 's'}.` : `Can be changed once ${cadence}.`;

export default function UserProfile() {
  const { username } = useParams();
  const isAdminView = useAdminView();
  const isMe = isAdminView || username === getUsername();
  const { getUser, updateUser } = profileApiFor(isAdminView);

  const { user, setUser, loading } = useUser(username, { fetcher: getUser, redirectOnNotFound: true });

  // All edit-flow state/logic lives in the hook — including arriving already
  // in edit mode via Settings > Account > Edit Profile — so this page just
  // renders it.
  const edit = useProfileEdit({ user, setUser, username, isAdminView, updateUser, isMe });

  const [showBadges, setShowBadges] = useState(false);
  const friends = useProfileFriends(user, setUser, { isMe });

  // Lazily load this profile's markers the first time the badges modal opens —
  // they drive the visited-state (US passports) unlocks.
  const [badgeMarkers, setBadgeMarkers] = useState(null);
  useEffect(() => {
    if (!showBadges || badgeMarkers) return;
    let alive = true;
    const { load } = markersApiFor(isAdminView, username);
    retry(() => Promise.resolve(load()))
      .then((d) => { if (alive) setBadgeMarkers(Array.isArray(d) ? d : []); })
      .catch(() => { if (alive) setBadgeMarkers([]); });
    return () => { alive = false; };
  }, [showBadges, badgeMarkers, isAdminView, username]);

  // Shrink an over-long name to fit one line — mobile app only.
  const nameRef = useRef(null);
  useFitText(nameRef, [user, edit.editing], { enabled: isNative, min: 14 });

  if (loading) return <Spinner />;
  if (!user) return null;

  const joined = formatDate(user.createdAt, { long: true });
  const displayName = fullName(user);
  const { nameWait, usernameWait } = edit;
  const { friendsLabel, canSeeFriends } = friends;

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
              <ScrollHint className="profile-edit-fields">
              <div>
                <FieldLabel variant="display" required>First Name</FieldLabel>
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
                <FieldLabel variant="display">Last Name</FieldLabel>
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
                <FieldLabel variant="display" required>Username</FieldLabel>
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
                  <FieldLabel variant="display">Date of birth</FieldLabel>
                  <input
                    className="auth-input"
                    value={formatDate(user.dateOfBirth, { long: true, utc: true })}
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
              </ScrollHint>
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
              {canSeeFriends ? (
                <button className="profile-friends profile-friends-link" onClick={friends.openFriends}>
                  {friendsLabel}
                </button>
              ) : (
                <p className="profile-friends">{friendsLabel}</p>
              )}
              {!isMe && !isAdminView && (
                <FriendButton
                  key={user.username}
                  username={user.username}
                  relationship={user.viewerRelationship}
                  onChange={friends.onFriendChange}
                />
              )}
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
      {showBadges && <BadgesModal user={user} markers={badgeMarkers} onClose={() => setShowBadges(false)} />}
      {friends.showFriends && <FriendsListModal username={user.username} isMe={isMe} onClose={friends.closeFriends} />}
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
