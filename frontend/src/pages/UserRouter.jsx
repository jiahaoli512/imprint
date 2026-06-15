import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_URL || window.location.origin;

export default function UserRouter() {
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const me = localStorage.getItem('imprint_username');

    if (me === username) {
      navigate(`/${username}/dashboard`, { replace: true });
      return;
    }

    fetch(`${apiBase}/api/users/by-username/${encodeURIComponent(username)}`)
      .then(res => {
        if (res.status === 404) {
          navigate('/user-not-found', { replace: true });
        } else {
          navigate(`/${username}/profile`, { replace: true });
        }
      })
      .catch(() => navigate('/user-not-found', { replace: true }));
  }, [username]);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="logo-icon" style={{ width: '48px', height: '48px', opacity: 0.5 }}>
        <Fingerprint size={26} strokeWidth={2} color="#080c14" />
      </div>
    </div>
  );
}
