import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Fingerprint, ArrowLeft, User, Pencil, X, Check, List, LayoutDashboard, LogOut } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_URL || window.location.origin;

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAdminView = pathname.startsWith('/admin/');
  const isMe = isAdminView || username === localStorage.getItem('imprint_username');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetch(`${apiBase}/api/users/by-username/${encodeURIComponent(username)}`)
      .then(res => {
        if (res.status === 404) { navigate('/user-not-found', { replace: true }); return null; }
        return res.json();
      })
      .then(data => { if (data) setUser(data); })
      .catch(() => navigate('/user-not-found', { replace: true }))
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
    setSaving(true);
    setEditError('');
    try {
      const res = await fetch(`${apiBase}/api/users/by-username/${encodeURIComponent(username)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: editFirst, lastName: editLast }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || 'Something went wrong.'); return; }
      setUser(data);
      setEditing(false);
    } catch {
      setEditError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="logo-icon" style={{ width: '48px', height: '48px', opacity: 0.5 }}>
        <Fingerprint size={26} strokeWidth={2} color="#080c14" />
      </div>
    </div>
  );

  if (!user) return null;

  const joined = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return (
    <div className="auth-page">
      {isAdminView && (
        <div style={{ position: 'fixed', top: 'calc(16px + env(safe-area-inset-top))', right: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <span className="admin-badge">Admin</span>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>viewing @{username}</span>
        </div>
      )}
      <div style={{ position: 'fixed', top: 'calc(16px + env(safe-area-inset-top))', left: '20px', display: 'flex', gap: '8px' }}>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (isAdminView) navigate(`/admin/${username}/dashboard`);
            else if (isMe) navigate(`/${username}/dashboard`);
            else navigate(-1);
          }}
        >
          <ArrowLeft size={16} /> {isAdminView ? `@${username}'s dashboard` : isMe ? 'Dashboard' : 'Back'}
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
                onChange={e => { setEditFirst(e.target.value); setEditError(''); }}
                autoFocus
              />
              <input
                className="auth-input"
                placeholder="Last name (optional)"
                value={editLast}
                onChange={e => { setEditLast(e.target.value); setEditError(''); }}
              />
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
              {fullName && (
                <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>
                  {fullName}
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
      {confirmLogout && (
        <div className="modal-overlay" onClick={() => setConfirmLogout(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <Fingerprint size={28} strokeWidth={1.5} color="#4fffb0" />
            </div>
            <h2 className="modal-title">Log out of Admin?</h2>
            <p className="modal-sub" style={{ marginTop: '16px', color: '#ff6b6b' }}>
              You will be returned to the home page and your admin session will end.
            </p>
            <button className="btn btn-primary modal-submit" onClick={() => { sessionStorage.removeItem('admin_auth'); navigate('/home'); }}>
              Log out
            </button>
            <button className="modal-cancel" onClick={() => setConfirmLogout(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
