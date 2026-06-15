import { useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', gap: '16px', padding: '24px',
    }}>
      <div className="logo-icon" style={{ width: '48px', height: '48px', marginBottom: '8px' }}>
        <Fingerprint size={26} strokeWidth={2} color="#080c14" />
      </div>
      <p style={{ fontSize: '72px', fontWeight: '900', letterSpacing: '-4px', margin: 0, lineHeight: 1,
        background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        404
      </p>
      <p style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>User not found</p>
      <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0, textAlign: 'center', maxWidth: '280px' }}>
        That username doesn't exist on Imprint.
      </p>
      <button className="btn btn-ghost" style={{ marginTop: '8px' }} onClick={() => navigate('/home')}>
        Go home
      </button>
    </div>
  );
}
