import { useNavigate } from 'react-router-dom';
import { isAdminAuthed } from '../api/client';
import LogoMark from '../components/LogoMark';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', gap: '16px', padding: '24px',
    }}>
      <LogoMark size={48} icon={26} style={{ marginBottom: '8px' }} />
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
      <button className="btn btn-ghost" style={{ marginTop: '8px' }} onClick={() => {
        const isAdmin = isAdminAuthed();
        navigate(isAdmin ? '/admin/dashboard' : '/home');
      }}>
        Go home
      </button>
    </div>
  );
}
