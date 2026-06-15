import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Fingerprint, ArrowLeft, User } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_URL || window.location.origin;

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <button className="auth-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="auth-card" style={{ gap: '0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '8px 0 32px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={32} color="var(--muted)" />
          </div>
          {fullName && (
            <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>
              {fullName}
            </h1>
          )}
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--accent)', fontWeight: '600' }}>
            @{user.username}
          </p>
        </div>

        <div style={{ height: '1px', background: 'var(--border)', margin: '0 -40px' }} />

        <div style={{ paddingTop: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Member since</span>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>{joined}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
