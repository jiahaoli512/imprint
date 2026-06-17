import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';
import { api, getUsername } from '../api/client';

export default function UserRouter() {
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const me = getUsername();

    if (me === username) {
      navigate(`/${username}/dashboard`, { replace: true });
      return;
    }

    api.getUser(username)
      .then(() => navigate(`/${username}/profile`, { replace: true }))
      .catch(err => {
        if (err.status === 404) navigate('/user-not-found', { replace: true });
        else navigate('/user-not-found', { replace: true });
      });
  }, [username]);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="logo-icon" style={{ width: '48px', height: '48px', opacity: 0.5 }}>
        <Fingerprint size={26} strokeWidth={2} color="#080c14" />
      </div>
    </div>
  );
}
