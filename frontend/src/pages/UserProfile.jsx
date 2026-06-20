import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Pencil, X, Check, List, LayoutDashboard, LogOut } from 'lucide-react';
import LogoutModal from '../components/LogoutModal';
import Spinner from '../components/Spinner';
import { getUsername, profileApiFor } from '../api/client';
import { formatDate } from '../utils/formatDate';
import { fullName } from '../utils/fullName';
import { useAdminView } from '../utils/useAdminView';
import { validateName } from '../utils/validateName';

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
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

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
    setEditError('');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditError('');
  }

  async function saveEdit() {
    if (!editFirst.trim()) {
      setEditError('First name is required.');
      return;
    }
    const nameError = validateName(editFirst, editLast);
    if (nameError) {
      setEditError(nameError);
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      const data = await updateUser(username, { firstName: editFirst, lastName: editLast });
      setUser(data);
      setEditing(false);
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '8px 0 32px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={32} color="var(--muted)" />
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <input
                className="auth-input"
                placeholder="First name"
                value={editFirst}
                maxLength={50}
                onChange={e => { setEditFirst(e.target.value); setEditError(''); }}
                autoFocus
              />
              <input
                className="auth-input"
                placeholder="Last name (optional)"
                value={editLast}
                maxLength={50}
                onChange={e => { setEditLast(e.target.value); setEditError(''); }}
              />
              {user.dateOfBirth && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
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
                    Date of birth can't be changed.
                  </p>
                </div>
              )}
              {editError && <p className="auth-error">{editError}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveEdit} disabled={saving}>
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
                <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>
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
    </div>
  );
}
